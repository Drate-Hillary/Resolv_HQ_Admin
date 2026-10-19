import { useState, type KeyboardEvent } from "react"
import { LayoutGroup, motion } from "framer-motion"
import { cn } from "cn"
import { toast } from "sonner"
import { Icon } from "@/components/ui/icon"
import { SchedulerCardDialog } from "@/components/console/scheduler-card-dialog"
import { useConsoleStore } from "@/lib/stores/console-store"
import { useSchedulerStore } from "@/lib/stores/scheduler-store"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"
import { COLUMNS, columnRole, columnTitle, type CardState, type SchedulerCard } from "@/lib/scheduler"

const stateLabel: Record<CardState, string> = {
  scheduled: "Scheduled",
  running: "Running",
  needs_approval: "Needs approval",
  done: "Done",
  failed: "Failed",
}

const stateDot: Record<CardState, string> = {
  scheduled: "bg-muted-foreground",
  running: "bg-primary motion-safe:animate-pulse",
  needs_approval: "bg-amber-500",
  done: "bg-emerald-500",
  failed: "bg-destructive",
}

const sourceLabel = { live: "Scheduled", customer: "Customer app", history: "Earlier" } as const

function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function Card({ card, now, selected, onOpen }: { card: SchedulerCard; now: number; selected: boolean; onOpen: () => void }) {
  const last = card.log.at(-1)
  const removeCard = useSchedulerStore((s) => s.removeCard)
  const deleteTask = useConsoleStore((s) => s.deleteTask)
  const dismiss = useSchedulerStore((s) => s.dismiss)
  const running = card.source === "live" && card.state === "running"

  const remove = () => {
    if (card.source === "customer") {
      dismiss(card.id)
    } else if (card.source === "history") {
      if (card.taskId) deleteTask(card.taskId)
    } else if (!removeCard(card.id)) {
      toast.error("This task is still running. Delete it once the agent has finished.")
    }
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <motion.div
      layout
      layoutId={card.id}
      role="button"
      tabIndex={0}
      data-card-id={card.id}
      aria-label={`Details: ${card.request}`}
      aria-expanded={selected}
      onClick={onOpen}
      onKeyDown={onKey}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={cn(
        "group/card relative cursor-pointer rounded-lg bg-background p-2.5 text-left text-card-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selected && "ring-1 ring-foreground/30",
        card.state === "running" && "ring-1 ring-primary/50",
        card.state === "failed" && "ring-1 ring-destructive/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-xs font-medium",
            card.source === "customer" ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {sourceLabel[card.source]}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {card.state === "running" ? <AgentThinkingOrb /> : <span className={cn("size-1.5 rounded-full", stateDot[card.state])} />}
          {stateLabel[card.state]}
        </span>
      </div>
      {!running && (
        <button
          type="button"
          aria-label={card.source === "customer" ? "Dismiss from board" : "Delete task"}
          onClick={(e) => {
            e.stopPropagation()
            remove()
          }}
          className="absolute -top-2 -right-2 hidden size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs group-hover/card:flex group-focus-within/card:flex hover:text-destructive"
        >
          <Icon icon={Delete02Icon} size={11} />
        </button>
      )}
      <p className="mt-1.5 line-clamp-3 text-xs/relaxed text-foreground">{card.request}</p>
      <p className="mt-1.5 line-clamp-2 text-xs/snug text-muted-foreground tabular-nums">
        {card.state === "scheduled" && card.source === "live" && card.runAt > now
          ? `Starts in ${countdown(card.runAt - now)}`
          : (last?.text ?? "")}
      </p>
    </motion.div>
  )
}

export function SchedulerBoard({ cards, now }: { cards: SchedulerCard[]; now: number }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = cards.find((c) => c.id === openId)
  return (
    <LayoutGroup>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const inColumn = cards.filter((c) => c.column === col.id).sort((a, b) => a.createdAt - b.createdAt)
          return (
            <section key={col.id} aria-label={col.title} className="flex min-w-40 flex-1 flex-col rounded-xl bg-muted/50 p-2">
              <header className="flex items-center justify-between gap-2 px-1 pb-2" title={col.role}>
                <h3 className="truncate text-xs font-medium text-foreground">{col.title}</h3>
                <span className="tabular-nums rounded-full bg-background px-1.5 text-xs text-muted-foreground">
                  {inColumn.length}
                </span>
              </header>
              <div className="flex min-h-24 flex-col gap-2">
                {inColumn.map((card) => (
                  <Card key={card.id} card={card} now={now} selected={card.id === openId} onOpen={() => setOpenId(card.id)} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
      {open && <SchedulerCardDialog key={open.id} card={open} onClose={() => setOpenId(null)} />}
    </LayoutGroup>
  )
}

/** "Now" strip: what the most recently moved active card is doing, and why it moved. */
export function SchedulerNow({ cards }: { cards: SchedulerCard[] }) {
  const active = [...cards]
    .filter((c) => c.source !== "history" && c.log.length > 1)
    .sort((a, b) => (b.log.at(-1)?.at ?? 0) - (a.log.at(-1)?.at ?? 0))[0]

  if (!active) {
    return (
      <p className="text-xs text-muted-foreground">
        Nothing to show yet. Schedule a task, or wait for a customer to start one in the app.
      </p>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <div>
        <p className="text-xs text-muted-foreground">Stage now</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{columnTitle(active.column)}</p>
        <p className="mt-1 text-xs/relaxed text-muted-foreground">{columnRole(active.column)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          How “{active.request.length > 48 ? `${active.request.slice(0, 48)}…` : active.request}” moved
        </p>
        <ol className="mt-1 flex flex-col gap-1">
          {active.log.map((entry, i) => (
            <li key={i} className="flex gap-2 text-xs/relaxed">
              <span className="w-28 shrink-0 font-medium text-foreground">{columnTitle(entry.column)}</span>
              <span className="text-muted-foreground">{entry.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
