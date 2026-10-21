import { cn } from "cn"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useConsoleStore } from "@/lib/stores/console-store"
import type { AgentStatus, RecentTask } from "@/types/console"
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
  const currentTaskId = useConsoleStore((s) => s.currentTaskId)
  const navigate = useNavigate()

  const open = (t: RecentTask) => {
    if (t.id !== currentTaskId) {
      if (!t.messages?.length) {
        toast.info("This task was saved before chats were kept, so it can't be reopened.")
        return
      }
      const opened = useConsoleStore.getState().loadConversation({
        taskId: t.id,
        conversationId: t.conversationId ?? null,
        messages: t.messages,
        run: t.run ?? [],
      })
      if (!opened) {
        toast.info("The agent is busy. Finish or decide the current task first.")
        return
      }
    }
    navigate("/agent")
  }

  if (tasks.length === 0) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">No tasks yet. Ask the agent something to get started.</p>
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {tasks.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => open(t)}
            aria-current={t.id === currentTaskId ? "true" : undefined}
            className={cn(
              "w-full rounded-lg px-2 py-1.5 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/30",
              t.id === currentTaskId && "bg-sidebar-accent"
            )}
          >
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
          </button>
        </li>
      ))}
    </ul>
  )
}
