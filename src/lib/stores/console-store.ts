import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/backend/api/client"
import { toast } from "sonner"
import { toastError } from "@/lib/errors"
import { isProviderFailureMessage, summarizeProviderFailures } from "@/lib/provider-errors"
import { onRealtimeEvent, retainRealtime } from "@/lib/realtime"
import { timelineToSteps, type TimelineRow } from "@/lib/run-timeline"
import type { AgentStatus, RecentTask, RunStep, WorkspaceMessage } from "@/types/console"

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
  timeline?: TimelineRow[]
  handoffs?: string[]
  tokens?: { input: number; output: number }
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
  /** The request filed from the approved escalation, so the console can open it. */
  requestId: string | null
  error: string | null
  /** When the current run started (ms epoch), for the live elapsed timer. */
  runStartedAt: number | null
  /** Real tokens reported by the provider across this conversation so far. */
  sessionTokens: number
  /** Tokens the run in flight has used so far, pushed by the backend after each model call. */
  liveTokens: number
  /** Tokens the most recent run used, null until a run has finished. */
  lastRunTokens: { input: number; output: number } | null
  runAgent: (request: string) => Promise<void>
  selectStep: (key: string | null) => void
  approve: () => Promise<void>
  reject: () => Promise<void>
  newTask: () => void
  /** Remove a task from Recent tasks; clears the workspace too if it is the open one. */
  deleteTask: (id: string) => void
  /** Put an earlier conversation back in the workspace so it can be continued. False if the agent is busy. */
  loadConversation: (c: { taskId: string | null; conversationId: string | null; messages: WorkspaceMessage[]; run: RunStep[] }) => boolean
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
  requestId: null,
  error: null,
  runStartedAt: null,
  sessionTokens: 0,
  liveTokens: 0,
  lastRunTokens: null,

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
      runStartedAt: Date.now(),
      liveTokens: 0,
      lastRunTokens: null,
      selectedStepKey: null,
      approvalId: null,
      requestId: null,
      error: null,
      messages: [...get().messages, { id: `local-${uid()}`, role: "user", content: request }],
    })

    // The chat call is not streamed, so the backend pushes each model call's
    // usage over the realtime channel; add it up here as it arrives.
    const releaseRealtime = retainRealtime()
    const stopUsage = onRealtimeEvent((event) => {
      if (event.type === "usage" && event.conversationId === get().conversationId) {
        set((s) => ({ liveTokens: s.liveTokens + event.inputTokens + event.outputTokens }))
      }
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

      // Prefer the backend trace (real order, latency, tokens); a turn that never
      // reached the model (e.g. the clarification gate) has none, so fall back to
      // the plain step list.
      const steps: RunStep[] =
        data.timeline && data.timeline.length > 0
          ? timelineToSteps(data.timeline, data.handoffs)
          : data.steps.map((text) => ({ key: `step-${uid()}`, label: text, status: "done" as const }))
      const turnTokens = (data.tokens?.input ?? 0) + (data.tokens?.output ?? 0)

      // The reply is a fallback when every model provider failed; say why instead of letting it pass silently.
      const providerFailure = data.timeline?.map((row) => row.error).find(isProviderFailureMessage)
      if (providerFailure) toast.error(summarizeProviderFailures(providerFailure), { id: "provider-failure", duration: 10_000 })

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
          runStartedAt: null,
          sessionTokens: s.sessionTokens + turnTokens,
          liveTokens: 0,
          lastRunTokens: { input: data.tokens?.input ?? 0, output: data.tokens?.output ?? 0 },
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
        set((s) => ({ run: steps, status: "completed", runStartedAt: null, sessionTokens: s.sessionTokens + turnTokens, liveTokens: 0, lastRunTokens: { input: data.tokens?.input ?? 0, output: data.tokens?.output ?? 0 }, recentTasks: setTaskStatus(s.recentTasks, taskId, "completed") }))
      }

      set((s) => ({
        messages: [...s.messages, { id: `local-${uid()}`, role: "agent", content: data.assistantMessage.content }],
      }))
    } catch (err) {
      set((s) => ({
        status: "failed",
        runStartedAt: null,
        sessionTokens: s.sessionTokens + s.liveTokens,
        liveTokens: 0,
        recentTasks: setTaskStatus(s.recentTasks, taskId, "failed"),
        error: toastError(err, "The agent failed to respond"),
        messages: [
          ...s.messages,
          {
            id: `local-${uid()}`,
            role: "agent",
            content: "I couldn't reach the agent. Check that the backend is running and that at least one AI model is active on the AI Models page, then try again.",
          },
        ],
      }))
    } finally {
      stopUsage()
      releaseRealtime()
    }
  },

  approve: async () => {
    const { approvalId, status } = get()
    if (status !== "awaiting_approval" || !approvalId) return
    try {
      const { data } = await apiClient.patch<{ requestId?: string | null }>(`/admin/approvals/${approvalId}/approve`)
      set((s) => ({
        status: "completed",
        requestId: data.requestId ?? null,
        recentTasks: setTaskStatus(s.recentTasks, s.currentTaskId, "completed"),
        run: s.run.map((step) =>
          step.detail?.type === "approval" ? { ...step, status: "done", detail: { ...step.detail, status: "approved" } } : step
        ),
        messages: [
          ...s.messages,
          { id: `local-${uid()}`, role: "agent", content: data.requestId ? "Approved. The escalation request has been filed for a human to handle; open it to view or act on it." : "Approved. The escalation has been recorded for a human to handle." },
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
      requestId: null,
      currentTaskId: null,
      error: null,
      runStartedAt: null,
      sessionTokens: 0,
      liveTokens: 0,
      lastRunTokens: null,
    })
  },

  deleteTask: (id) => {
    const s = get()
    if (s.currentTaskId === id && s.status === "thinking") return
    set({ recentTasks: s.recentTasks.filter((t) => t.id !== id) })
    if (s.currentTaskId === id) get().newTask()
  },

  loadConversation: ({ taskId, conversationId, messages, run }) => {
    const { status } = get()
    if (status === "thinking" || status === "awaiting_approval") return false
    set({
      status: "completed",
      run,
      messages,
      conversationId,
      currentTaskId: taskId,
      approvalId: null,
      requestId: null,
      selectedStepKey: null,
      error: null,
      runStartedAt: null,
    })
    return true
  },
}),
    {
      name: "resolv-console-workspace",
      partialize: (s) => ({
        recentTasks: s.recentTasks.slice(0, 50),
        messages: s.messages,
        run: s.run,
        conversationId: s.conversationId,
        currentTaskId: s.currentTaskId,
        approvalId: s.approvalId,
        requestId: s.requestId,
        sessionTokens: s.sessionTokens,
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

// Keep the open task's transcript on its Recent tasks entry so clicking it later restores the chat.
useConsoleStore.subscribe((s) => {
  if (!s.currentTaskId || s.status === "thinking") return
  const task = s.recentTasks.find((t) => t.id === s.currentTaskId)
  if (!task || (task.messages === s.messages && task.run === s.run && task.conversationId === s.conversationId)) return
  useConsoleStore.setState({
    recentTasks: s.recentTasks.map((t) =>
      t.id === task.id ? { ...t, messages: s.messages, run: s.run, conversationId: s.conversationId } : t
    ),
  })
})
