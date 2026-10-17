import { useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { apiClient } from "@/backend/api/client"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { columnRole, columnTitle, type CardMessage, type SchedulerCard } from "@/lib/scheduler"
import { useConsoleStore } from "@/lib/stores/console-store"
import { useSchedulerStore } from "@/lib/stores/scheduler-store"
import { cn } from "cn"
import { ArrowUp02Icon, Cancel01Icon, Delete02Icon, Message01Icon, PlayIcon, RepeatIcon } from "@hugeicons/core-free-icons"

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })

function Transcript({ messages, running }: { messages: CardMessage[]; running: boolean }) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, running])

  if (messages.length === 0) {
    return <p className="text-muted-foreground">No conversation is stored for this card.</p>
  }
  return (
    <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "max-w-[90%] rounded-2xl px-3 py-1.5 text-xs/relaxed whitespace-pre-wrap",
            m.role === "user" ? "self-end bg-muted text-foreground" : "self-start text-foreground"
          )}
        >
          {m.content}
        </div>
      ))}
      {running && <p className="self-start text-muted-foreground motion-safe:animate-pulse">Agent is working…</p>}
      <div ref={endRef} />
    </div>
  )
}

/** Details for one card in a dialog: its path, conversation, and actions. */
export function SchedulerCardDialog({ card, onClose }: { card: SchedulerCard; onClose: () => void }) {
  const navigate = useNavigate()
  const removeCard = useSchedulerStore((s) => s.removeCard)
  const runNow = useSchedulerStore((s) => s.runNow)
  const rerun = useSchedulerStore((s) => s.rerun)
  const continueCard = useSchedulerStore((s) => s.continueCard)
  const openInChat = useSchedulerStore((s) => s.openInChat)
  const deleteTask = useConsoleStore((s) => s.deleteTask)
  const dismiss = useSchedulerStore((s) => s.dismiss)
  const refresh = useSchedulerStore((s) => s.refresh)
  const approve = useConsoleStore((s) => s.approve)
  const reject = useConsoleStore((s) => s.reject)
  const consoleTaskId = useConsoleStore((s) => s.currentTaskId)
  const consoleStatus = useConsoleStore((s) => s.status)
  const consoleMessages = useConsoleStore((s) => s.messages)

  const [draft, setDraft] = useState("")
  const [problem, setProblem] = useState<string | null>(null)

  const live = card.source === "live"
  const customer = card.source === "customer"
  const remote = card.remote
  const history = card.source === "history"
  const running = live && card.state === "running"
  const canChat = live && !!card.conversationId
  // A history card is only readable while its task is the one open in Chat.
  const messages = card.messages ?? (history && card.taskId === consoleTaskId ? consoleMessages : [])
  const pendingHere = card.state === "needs_approval" && card.taskId === consoleTaskId && consoleStatus === "awaiting_approval"

  const send = (e: FormEvent) => {
    e.preventDefault()
    const reason = continueCard(card.id, draft)
    setProblem(reason)
    if (!reason) setDraft("")
  }

  const remove = () => {
    if (customer) {
      dismiss(card.id)
    } else if (history) {
      if (card.taskId) deleteTask(card.taskId)
    } else if (!removeCard(card.id)) {
      toast.error("This task is still running. Delete it once the agent has finished.")
      return
    }
    onClose()
  }

  const decide = async (decision: "approve" | "reject") => {
    if (!remote?.approval) return
    try {
      await apiClient.patch(`/admin/approvals/${remote.approval.id}/${decision}`)
      await refresh()
    } catch {
      toast.error(`Could not ${decision} this request.`)
    }
  }

  const toChat = () => {
    if (history || openInChat(card.id)) navigate("/agent")
    else toast.error("The agent is busy with another task, so this conversation cannot be opened in Chat yet.")
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[min(40rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto p-6 text-xs/relaxed">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogDescription>{history ? "Earlier task" : live ? "Scheduled task" : "Customer app task"}</DialogDescription>
            <DialogTitle className="mt-1 text-base leading-snug">{card.request}</DialogTitle>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close details">
            <Icon icon={Cancel01Icon} size={14} />
          </Button>
        </header>

        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1">
          <dt className="text-muted-foreground">Stage</dt>
          <dd className="text-foreground">
            {columnTitle(card.column)}
            <span className="block text-[11px] text-muted-foreground">{columnRole(card.column)}</span>
          </dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-foreground">{card.state.replace("_", " ")}</dd>
          <dt className="text-muted-foreground">{card.state === "scheduled" ? "Starts at" : "Started"}</dt>
          <dd className="text-foreground tabular-nums">{time(card.runAt)}</dd>
        </dl>

        {card.log.length > 0 && (
          <section>
            <h4 className="mb-1 font-medium text-foreground">How it moved</h4>
            <ol className="flex flex-col gap-1">
              {card.log.map((entry, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{time(entry.at).slice(0, 5)}</span>
                  <span className="text-foreground">
                    <span className="font-medium">{columnTitle(entry.column)}</span>
                    <span className="text-muted-foreground"> · {entry.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {customer && remote && (
          <section className="flex flex-col gap-2">
            <dl className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="text-foreground">{remote.customerName ?? "Unknown"}</dd>
              {remote.model && (
                <>
                  <dt className="text-muted-foreground">Model</dt>
                  <dd className="text-foreground">{remote.model}</dd>
                </>
              )}
              {remote.error && (
                <>
                  <dt className="text-muted-foreground">Error</dt>
                  <dd className="text-destructive">{remote.error}</dd>
                </>
              )}
            </dl>
            {remote.approval && (
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="font-medium text-foreground">Approval: {remote.approval.status}</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{remote.approval.action}</p>
                {remote.approval.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => void decide("approve")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void decide("reject")}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
            {remote.requestId && (
              <Button size="sm" variant="outline" className="self-start" onClick={() => navigate(`/tickets/${remote.requestId}`)}>
                Open ticket
              </Button>
            )}
          </section>
        )}

        {!customer && (
          <section className="flex flex-col gap-2">
            <h4 className="font-medium text-foreground">Conversation</h4>
            <Transcript messages={messages} running={running} />
            {pendingHere && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void approve()}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => void reject()}>
                  Reject
                </Button>
              </div>
            )}
            {canChat ? (
              <form onSubmit={send} className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setProblem(null)
                  }}
                  placeholder="Continue with the agent…"
                  aria-label="Message the agent about this task"
                  className="h-8 min-w-0 flex-1 rounded-full border border-border bg-background px-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                />
                <Button type="submit" size="icon-sm" disabled={!draft.trim() || running} aria-label="Send">
                  <Icon icon={ArrowUp02Icon} size={14} />
                </Button>
              </form>
            ) : (
              <p className="text-muted-foreground">
                {history
                  ? "Only tasks started from the scheduler can be continued here. Use New task in Chat to ask again."
                  : "Chat opens once the agent has answered."}
              </p>
            )}
            {problem && <p className="text-destructive">{problem}</p>}
          </section>
        )}

        <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {live && card.state === "scheduled" && (
            <Button size="sm" variant="outline" onClick={() => runNow(card.id)}>
              <Icon icon={PlayIcon} size={12} />
              Run now
            </Button>
          )}
          {live && (card.state === "done" || card.state === "failed") && (
            <Button size="sm" variant="outline" onClick={() => rerun(card.id)}>
              <Icon icon={RepeatIcon} size={12} />
              Run again
            </Button>
          )}
          {(canChat || history) && (
            <Button size="sm" variant="outline" onClick={toChat}>
              <Icon icon={Message01Icon} size={12} />
              Open in Chat
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={remove} disabled={running} className="ml-auto text-destructive">
            <Icon icon={Delete02Icon} size={12} />
            {customer ? "Dismiss" : "Delete"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
