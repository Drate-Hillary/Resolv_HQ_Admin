import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/backend/api/client"
import { toastError } from "@/lib/errors"
import type { AgentStatus, RecentTask, RunStep } from "@/types/console"

interface WorkspaceMessage {
  id: string
  role: "user" | "agent"
  content: string
}

interface EscalationPayload {
  approvalId: string
  title: string
  description: string
  category: string
  priority: "low" | "normal" | "high"
  keyFacts: string | null
  suggestedAction: string | null
}

interface ChatMessageResponse {
  assistantMessage: { content: string }
  steps: string[]
  escalation: EscalationPayload | null
}

interface ConsoleState {
  status: AgentStatus
  run: RunStep[]
  messages: WorkspaceMessage[]
  recentTasks: RecentTask[]
  currentTaskId: string | null
  selectedStepKey: string | null
  conversationId: string | null
  approvalId: string | null
  error: string | null
  runAgent: (request: string) => Promise<void>
  selectStep: (key: string | null) => void
  approve: () => Promise<void>
  reject: () => Promise<void>
  newTask: () => void
}

// Ids must stay unique across reloads now that history is persisted.
const uid = () => crypto.randomUUID()

const setTaskStatus = (tasks: RecentTask[], id: string | null, status: AgentStatus) =>
  tasks.map((t) => (t.id === id ? { ...t, status } : t))

/**
 * Drives the Agent Workspace against the real backend agent pipeline —
 * resolv-hq-backend's generateAssistantReply()/runReActLoop(), the exact
 * same code path the customer app's chat uses, calling whichever
 * agent_providers row is registered and active. There is no scripted
 * content here: `run` is built from the real ReAct trace the backend
 * returns, and an approval gate only appears when the model actually
 * called draft_escalation_ticket for this request.
 */
export const useConsoleStore = create<ConsoleState>()(
  persist(
    (set, get) => ({
  status: "ready",
  run: [],
  messages: [],
  recentTasks: [],
  currentTaskId: null,
  selectedStepKey: null,
  conversationId: null,
  approvalId: null,
  error: null,

  selectStep: (key) => set({ selectedStepKey: key }),

  runAgent: async (request) => {
    if (get().status === "thinking") return

    const taskId = `task-${uid()}`
    set({
      currentTaskId: taskId,
      recentTasks: [{ id: taskId, request, status: "thinking", startedAt: Date.now() }, ...get().recentTasks],
    })

    set({
      run: [],
      status: "thinking",
      selectedStepKey: null,
      approvalId: null,
      error: null,
      messages: [...get().messages, { id: `local-${uid()}`, role: "user", content: request }],
    })

    try {
      let conversationId = get().conversationId
      if (!conversationId) {
        const { data: conversation } = await apiClient.post<{ id: string }>("/chat/conversations", {})
        conversationId = conversation.id
        set({ conversationId })
      }

      const { data } = await apiClient.post<ChatMessageResponse>(`/chat/conversations/${conversationId}/messages`, {
        content: request,
      })

      const steps: RunStep[] = data.steps.map((text) => ({
        key: `step-${uid()}`,
        label: text,
        status: "done",
      }))

      if (data.escalation) {
        steps.push({
          key: "approval",
          label: "Approval required",
          status: "blocked",
          detail: { type: "approval", status: "pending", ...data.escalation },
        })
        set((s) => ({
          run: steps,
          status: "awaiting_approval",
          approvalId: data.escalation!.approvalId,
          recentTasks: setTaskStatus(s.recentTasks, taskId, "awaiting_approval"),
        }))
      } else {
        steps.push({
          key: "result",
          label: "Final result",
          status: "done",
          detail: { type: "text", text: data.assistantMessage.content },
        })
        set((s) => ({ run: steps, status: "completed", recentTasks: setTaskStatus(s.recentTasks, taskId, "completed") }))
      }

      set((s) => ({
        messages: [...s.messages, { id: `local-${uid()}`, role: "agent", content: data.assistantMessage.content }],
      }))
    } catch (err) {
      set((s) => ({
        status: "failed",
        recentTasks: setTaskStatus(s.recentTasks, taskId, "failed"),
        error: toastError(err, "The agent failed to respond"),
        messages: [
          ...s.messages,
          {
            id: `local-${uid()}`,
            role: "agent",
            content: "Something went wrong reaching the agent — check that a provider is registered and active, and that the backend is reachable.",
          },
        ],
      }))
    }
  },

  approve: async () => {
    const { approvalId, status } = get()
    if (status !== "awaiting_approval" || !approvalId) return
    try {
      await apiClient.patch(`/admin/approvals/${approvalId}/approve`)
      set((s) => ({
        status: "completed",
        recentTasks: setTaskStatus(s.recentTasks, s.currentTaskId, "completed"),
        run: s.run.map((step) =>
          step.detail?.type === "approval" ? { ...step, status: "done", detail: { ...step.detail, status: "approved" } } : step
        ),
        messages: [
          ...s.messages,
          { id: `local-${uid()}`, role: "agent", content: "Approved — the escalation ticket has been filed for a human to handle." },
        ],
      }))
    } catch (err) {
      set({ error: toastError(err, "Failed to approve") })
    }
  },

  reject: async () => {
    const { approvalId, status } = get()
    if (status !== "awaiting_approval" || !approvalId) return
    try {
      await apiClient.patch(`/admin/approvals/${approvalId}/reject`)
      set((s) => ({
        status: "failed",
        recentTasks: setTaskStatus(s.recentTasks, s.currentTaskId, "failed"),
        run: s.run.map((step) =>
          step.detail?.type === "approval" ? { ...step, status: "failed", detail: { ...step.detail, status: "rejected" } } : step
        ),
        messages: [
          ...s.messages,
          { id: `local-${uid()}`, role: "agent", content: "Rejected — no escalation ticket was filed." },
        ],
      }))
    } catch (err) {
      set({ error: toastError(err, "Failed to reject") })
    }
  },

  newTask: () => {
    if (get().status === "thinking") return
    set({
      status: "ready",
      run: [],
      messages: [],
      selectedStepKey: null,
      conversationId: null,
      approvalId: null,
      currentTaskId: null,
      error: null,
    })
  },
}),
    {
      name: "resolv-console-workspace",
      skipHydration: true,
      partialize: (s) => ({
        recentTasks: s.recentTasks.slice(0, 50),
        messages: s.messages,
        run: s.run,
        conversationId: s.conversationId,
        currentTaskId: s.currentTaskId,
        approvalId: s.approvalId,
        status: s.status === "thinking" ? "failed" : s.status,
      }),
      // A task that was mid-flight when the page closed can never finish.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ConsoleState>
        return {
          ...current,
          ...p,
          recentTasks: (p.recentTasks ?? []).map((t) => (t.status === "thinking" ? { ...t, status: "failed" as const } : t)),
        }
      },
    }
  )
)
