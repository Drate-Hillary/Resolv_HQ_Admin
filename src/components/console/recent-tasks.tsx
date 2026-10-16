import { cn } from "cn"
import { useConsoleStore } from "@/lib/stores/console-store"
import type { AgentStatus } from "@/types/console"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"

const statusLabel: Record<AgentStatus, string> = {
  ready: "Ready",
  thinking: "Running",
  awaiting_approval: "Needs approval",
  completed: "Completed",
  failed: "Failed",
}

const statusDot: Record<AgentStatus, string> = {
  ready: "bg-muted-foreground",
  thinking: "bg-primary motion-safe:animate-pulse",
  awaiting_approval: "bg-amber-500",
  completed: "bg-emerald-500",
  failed: "bg-destructive",
}

/** Compact history list for the sidebar: the request, plus status and time on a second line. */
export function RecentTasks() {
  const tasks = useConsoleStore((s) => s.recentTasks)

  if (tasks.length === 0) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">No tasks yet. Ask the agent something to get started.</p>
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {tasks.map((t) => (
        <li key={t.id} className="rounded-lg px-2 py-1.5 hover:bg-sidebar-accent">
          <p className="line-clamp-1 text-sm text-sidebar-foreground">{t.request}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {t.status === "thinking" ? (
              <AgentThinkingOrb />
            ) : (
              <span className={cn("size-1.5 rounded-full", statusDot[t.status])} />
            )}
            {statusLabel[t.status]}
            <span aria-hidden>·</span>
            {new Date(t.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </li>
      ))}
    </ul>
  )
}
