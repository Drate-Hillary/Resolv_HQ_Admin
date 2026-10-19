import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { SchedulerBoard, SchedulerNow } from "@/components/console/scheduler-board"
import { taskToCard, type RemoteTicket, type SchedulerCard } from "@/lib/scheduler"
import { useConsoleStore } from "@/lib/stores/console-store"
import { useSchedulerStore } from "@/lib/stores/scheduler-store"
import { cn } from "cn"
import { Calendar03Icon } from "@hugeicons/core-free-icons"

const queueLabel = {
  connected: "Message queue connected",
  offline: "Message queue unreachable, using direct updates",
  disabled: "Message queue not configured, using direct updates",
} as const

const age = (iso: string | null) => {
  if (!iso) return ""
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`
  return `${Math.round(mins / 1440)} d ago`
}

/** `datetime-local` wants local time without a zone; "" means run now. */
const toEpoch = (value: string) => (value ? new Date(value).getTime() : Date.now())

function TicketsTable({ tickets }: { tickets: RemoteTicket[] }) {
  if (tickets.length === 0) return <p className="text-xs text-muted-foreground">No tickets have been filed yet.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1.5 pr-3 font-medium">Ticket</th>
            <th className="py-1.5 pr-3 font-medium">Subject</th>
            <th className="py-1.5 pr-3 font-medium">Customer</th>
            <th className="py-1.5 pr-3 font-medium">Status</th>
            <th className="py-1.5 pr-3 font-medium">Priority</th>
            <th className="py-1.5 pr-3 font-medium">Source</th>
            <th className="py-1.5 font-medium">Filed</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="py-1.5 pr-3 tabular-nums">
                <Link to={`/tickets/${t.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                  #{t.ticketNumber}
                </Link>
              </td>
              <td className="max-w-64 truncate py-1.5 pr-3 text-foreground" title={t.description}>
                {t.title}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">{t.customerName ?? "Unknown"}</td>
              <td className="py-1.5 pr-3">
                <span className={cn("rounded-full px-1.5 py-px", t.isFinal ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-foreground")}>
                  {t.status}
                </span>
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">{t.priority ?? ""}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{t.aiHandled ? `${t.source ?? "app"} · AI` : (t.source ?? "")}</td>
              <td className="py-1.5 text-muted-foreground">{age(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SchedulerPage() {
  const cards = useSchedulerStore((s) => s.cards)
  const feed = useSchedulerStore((s) => s.feed)
  const feedError = useSchedulerStore((s) => s.feedError)
  const dismissed = useSchedulerStore((s) => s.dismissed)
  const schedule = useSchedulerStore((s) => s.schedule)
  const clearFinished = useSchedulerStore((s) => s.clearFinished)
  const recentTasks = useConsoleStore((s) => s.recentTasks)
  const consoleStatus = useConsoleStore((s) => s.status)
  const conversationId = useConsoleStore((s) => s.conversationId)

  const [request, setRequest] = useState("")
  const [when, setWhen] = useState("")
  const [now, setNow] = useState(() => Date.now())

  // Only drives the "Starts in" countdown; the engine itself runs in the console layout.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // The board is assembled from real records only: tasks customers ran in the app,
  // tasks run in Chat, and what staff scheduled here.
  const board = useMemo<SchedulerCard[]>(() => {
    const ours = new Set(cards.flatMap((c) => c.taskIds ?? (c.taskId ? [c.taskId] : [])))
    const history = recentTasks
      .filter((t) => !ours.has(t.id) && t.status !== "thinking")
      .slice(0, 8)
      .map<SchedulerCard>((t) => ({
        id: `history-${t.id}`,
        taskId: t.id,
        request: t.request,
        source: "history",
        column: t.status === "awaiting_approval" ? "approval" : "done",
        state: t.status === "awaiting_approval" ? "needs_approval" : t.status === "failed" ? "failed" : "done",
        runAt: t.startedAt,
        route: [],
        nextAt: t.startedAt,
        log: [],
        createdAt: t.startedAt,
      }))
    // A run staff started here is also a backend agent run, so the feed reports it too.
    // Its own card already shows it; only conversations started elsewhere are customer tasks.
    const ownConversations = new Set<string>(cards.flatMap((c) => (c.conversationId ? [c.conversationId] : [])))
    if (conversationId) ownConversations.add(conversationId)
    const customer = (feed?.tasks ?? [])
      .filter((t) => !t.conversationId || !ownConversations.has(t.conversationId))
      .map(taskToCard)
      .filter((c) => !dismissed.includes(c.id))
    return [...customer, ...history, ...cards]
  }, [cards, recentTasks, conversationId, feed, dismissed])

  const hasFinished = cards.some((c) => c.state === "done" || c.state === "failed")
  const waitingOnApproval = consoleStatus === "awaiting_approval"
  const whenMs = toEpoch(when)
  const inPast = when !== "" && whenMs < now - 60_000

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!request.trim() || inPast) return
    schedule(request, Math.max(0, whenMs - Date.now()))
    setRequest("")
    setWhen("")
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Scheduler</h2>
          <p className="mt-1 max-w-3xl text-xs/relaxed text-muted-foreground">
            Every task the agent is working on, including the ones customers start in the app, moving through the
            stages from the backend&apos;s own records. Click a card for its details.
          </p>
        </div>
        {feed && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", feed.queue.status === "connected" ? "bg-emerald-500" : "bg-amber-500")} />
            {queueLabel[feed.queue.status]}
          </span>
        )}
      </div>

      {feedError && <p className="text-xs text-destructive">{feedError}</p>}

      <section className="glass-panel flex flex-col gap-3 p-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Describe a task for the agent…"
            aria-label="Task for the agent"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            aria-label="When to run (leave empty to run now)"
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <Button type="submit" size="lg" disabled={!request.trim() || inPast} className="h-9 px-3">
            <Icon icon={Calendar03Icon} size={14} />
            {when ? "Schedule" : "Run now"}
          </Button>
        </form>
        {inPast && <p className="text-xs text-destructive">That time has already passed.</p>}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <p className="min-w-0 flex-1 text-xs/relaxed text-muted-foreground">
            Tasks you schedule call the real agent, one at a time, each as a new task in Chat. They wait while a task is
            awaiting approval{waitingOnApproval ? " (one is waiting now: decide it in Chat)" : ""}. Tasks scheduled here
            are saved in this browser and survive a reload (one that was running when you reloaded is marked interrupted); customer tasks and tickets are read from the
            backend.
          </p>
          <Button variant="ghost" size="sm" onClick={clearFinished} disabled={!hasFinished}>
            Clear finished
          </Button>
        </div>
      </section>

      <SchedulerBoard cards={board} now={now} />

      <section className="glass-panel p-4">
        <SchedulerNow cards={board} />
      </section>

      <section className="glass-panel p-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Tickets</h3>
          <Link to="/tickets" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            All tickets
          </Link>
        </div>
        {feed ? <TicketsTable tickets={feed.tickets} /> : <p className="text-xs text-muted-foreground">Loading tickets…</p>}
      </section>
    </div>
  )
}
