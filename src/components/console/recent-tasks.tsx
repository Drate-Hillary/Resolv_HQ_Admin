import { cn } from "cn"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { apiClient } from "@/backend/api/client"
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

type ServerMessage = { id: string; senderType: string; content: string }

/** Match an old task to its backend conversation by its first question, preferring the closest start time. */
async function findConversationFor(t: RecentTask): Promise<string | null> {
  try {
    const { data: list } = await apiClient.get<{ id: string; startedAt: string }[]>("/chat/conversations")
    const nearest = [...list]
      .sort((a, b) => Math.abs(Date.parse(a.startedAt) - t.startedAt) - Math.abs(Date.parse(b.startedAt) - t.startedAt))
      .slice(0, 15)
    for (const c of nearest) {
      const { data } = await apiClient.get<ServerMessage[]>(`/chat/conversations/${c.id}`)
      const first = data.find((m) => m.senderType === "customer")
      if (first && first.content.trim() === t.request.trim()) return c.id
    }
  } catch {
    // Offline or signed out: the caller reports that nothing could be reopened.
  }
  return null
}

/** Compact history list for the sidebar: the request, plus status and time on a second line. */
export function RecentTasks() {
  const tasks = useConsoleStore((s) => s.recentTasks)
  const currentTaskId = useConsoleStore((s) => s.currentTaskId)
  const navigate = useNavigate()

  const open = async (t: RecentTask) => {
    if (t.id !== currentTaskId) {
      let messages = t.messages
      let conversationId = t.conversationId ?? null
      // Tasks from before conversations were recorded: find the one whose first question is this task's request.
      if (!messages?.length && !conversationId) conversationId = await findConversationFor(t)
      // No saved copy: rebuild the transcript from the backend conversation (the step trace is not kept there).
      if (!messages?.length && conversationId) {
        try {
          const { data } = await apiClient.get<{ id: string; senderType: string; content: string }[]>(
            `/chat/conversations/${conversationId}`
          )
          messages = data
            .filter((m) => m.senderType !== "system")
            .map((m) => ({ id: m.id, role: m.senderType === "customer" ? ("user" as const) : ("agent" as const), content: m.content }))
        } catch {
          toast.error("Couldn't load that conversation from the server.")
          return
        }
      }
      if (!messages?.length) {
        toast.info("This task was created before chats were saved and has no conversation to reopen. New tasks reopen normally.")
        return
      }
      const opened = useConsoleStore.getState().loadConversation({
        taskId: t.id,
        conversationId,
        messages,
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
            onClick={() => void open(t)}
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
