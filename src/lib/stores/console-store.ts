import { create } from "zustand"
import { apiClient } from "@/backend/api/client"
import { buildDemoRun } from "@/backend/mock-console"
import type { AgentStatus, RunStep, RunStepKey } from "@/types/console"

interface WorkspaceMessage {
  id: string
  role: "user" | "agent"
  content: string
}

interface ConsoleState {
  status: AgentStatus
  run: RunStep[]
  messages: WorkspaceMessage[]
  selectedStepKey: RunStepKey | null
  runId: string | null
  stepIdByKey: Record<string, string>
  approvalId: string | null
  runAgent: (request: string) => Promise<void>
  selectStep: (key: RunStepKey | null) => void
  approve: () => Promise<void>
  reject: () => Promise<void>
}

let nextId = 1

const statusForStep: Partial<Record<RunStepKey, AgentStatus>> = {
  request: "thinking",
  context: "thinking",
  retrieval: "retrieving",
  plan: "thinking",
  tool: "using_tool",
  observation: "thinking",
  decision: "thinking",
  approval: "awaiting_approval",
}

/**
 * Drives the same scripted step-by-step reveal the demo always had (there's
 * no real LLM behind this yet), but every step of it now writes a real row
 * through the backend API: agent_runs, agent_steps, tool_executions and —
 * at the approval gate — agent_approvals. approve()/reject() decide that
 * same row through the backend instead of only flipping local state; the
 * backend logs the decision to admin_activity_logs itself.
 *
 * Every persistence call below is best-effort: if the backend request
 * fails (or a run couldn't be started at all), the scripted reveal keeps
 * advancing locally rather than blocking the UI on it.
 */
export const useConsoleStore = create<ConsoleState>((set, get) => ({
  status: "ready",
  run: [],
  messages: [],
  selectedStepKey: null,
  runId: null,
  stepIdByKey: {},
  approvalId: null,

  selectStep: (key) => set({ selectedStepKey: key }),

  runAgent: async (request) => {
    const busy: AgentStatus[] = ["thinking", "retrieving", "using_tool"]
    if (busy.includes(get().status)) return

    const steps = buildDemoRun(request)
    set({
      run: steps,
      status: "thinking",
      selectedStepKey: null,
      runId: null,
      stepIdByKey: {},
      approvalId: null,
      messages: [...get().messages, { id: `local-${nextId++}`, role: "user", content: request }],
    })

    try {
      const { data } = await apiClient.post<{ run: { id: string }; stepIdByKey: Record<string, string> }>(
        "/admin/agent-runs",
        { title: request }
      )
      set({ runId: data.run.id, stepIdByKey: data.stepIdByKey })
    } catch {
      // No run persisted — the reveal below still plays out locally.
    }

    for (const step of steps) {
      await wait(650)
      setStepStatus(set, step.key, "active")
      set({ status: statusForStep[step.key] ?? "thinking" })
      await wait(550)

      const { runId, stepIdByKey } = get()
      const stepId = stepIdByKey[step.key]

      if (step.key === "approval") {
        setStepStatus(set, step.key, "blocked")
        set({ status: "awaiting_approval" })

        if (runId && stepId) {
          await apiClient.patch(`/admin/agent-runs/${runId}/steps/${stepId}`, { status: "blocked" }).catch(() => {})
        }

        if (runId && step.detail?.type === "approval") {
          try {
            const { data: approval } = await apiClient.post<{ id: string }>(`/admin/agent-runs/${runId}/approvals`, {
              stepId: stepId ?? null,
              action: step.detail.action,
              description: step.detail.action,
              risk: step.detail.risk,
              amount: step.detail.amount ?? null,
              currency: step.detail.currency ?? null,
            })
            set({ approvalId: approval.id })
          } catch {
            set({ approvalId: null })
          }
        }
        return
      }

      setStepStatus(set, step.key, "done")
      if (runId && stepId) {
        await apiClient
          .patch(`/admin/agent-runs/${runId}/steps/${stepId}`, { status: "done", detail: step.detail ?? null })
          .catch(() => {})
      }

      if (step.key === "tool" && step.detail?.type === "tool" && runId) {
        await apiClient
          .post(`/admin/agent-runs/${runId}/tool-executions`, {
            stepId: stepId ?? null,
            toolName: step.detail.name,
            input: step.detail.input,
            output: step.detail.output,
            status: step.detail.status,
            durationMs: step.detail.durationMs,
          })
          .catch(() => {})
      }
    }
  },

  approve: async () => {
    if (get().status !== "awaiting_approval") return
    updateApproval(set, "approved")
    set({ status: "using_tool" })

    const { approvalId, runId, stepIdByKey } = get()

    if (approvalId) {
      await apiClient.patch(`/admin/approvals/${approvalId}/approve`).catch(() => {})
    }

    await wait(700)
    setStepStatus(set, "approval", "done")
    if (runId && stepIdByKey.approval) {
      await apiClient.patch(`/admin/agent-runs/${runId}/steps/${stepIdByKey.approval}`, { status: "done" }).catch(() => {})
    }

    setStepStatus(set, "result", "active")
    await wait(500)
    const summary = "Requisition approved and sent to the supplier. Manager sign-off recorded."
    updateResultSummary(set, summary)
    setStepStatus(set, "result", "done")
    if (runId && stepIdByKey.result) {
      await apiClient
        .patch(`/admin/agent-runs/${runId}/steps/${stepIdByKey.result}`, { status: "done", detail: { type: "result", summary } })
        .catch(() => {})
    }
    if (runId) {
      await apiClient
        .patch(`/admin/agent-runs/${runId}`, { status: "completed", completedAt: new Date().toISOString() })
        .catch(() => {})
    }

    set((s) => ({
      status: "completed",
      messages: [
        ...s.messages,
        {
          id: `local-${nextId++}`,
          role: "agent",
          content: "Approved — the requisition has been sent to Kampala Tech Supplies. I'll update the case memory.",
        },
      ],
    }))
  },

  reject: async () => {
    if (get().status !== "awaiting_approval") return
    updateApproval(set, "rejected")

    const { approvalId, runId, stepIdByKey } = get()

    if (approvalId) {
      await apiClient.patch(`/admin/approvals/${approvalId}/reject`).catch(() => {})
    }

    setStepStatus(set, "approval", "failed")
    if (runId && stepIdByKey.approval) {
      await apiClient.patch(`/admin/agent-runs/${runId}/steps/${stepIdByKey.approval}`, { status: "failed" }).catch(() => {})
    }

    setStepStatus(set, "result", "active")
    await wait(500)
    const summary = "Requisition rejected by manager. Draft discarded, no purchase was made."
    updateResultSummary(set, summary)
    setStepStatus(set, "result", "done")
    if (runId && stepIdByKey.result) {
      await apiClient
        .patch(`/admin/agent-runs/${runId}/steps/${stepIdByKey.result}`, { status: "done", detail: { type: "result", summary } })
        .catch(() => {})
    }
    if (runId) {
      await apiClient
        .patch(`/admin/agent-runs/${runId}`, { status: "failed", completedAt: new Date().toISOString() })
        .catch(() => {})
    }

    set((s) => ({
      status: "failed",
      messages: [
        ...s.messages,
        {
          id: `local-${nextId++}`,
          role: "agent",
          content: "Understood — I've discarded the draft requisition and logged the rejection for next time.",
        },
      ],
    }))
  },
}))

function setStepStatus(set: (fn: (s: ConsoleState) => Partial<ConsoleState>) => void, key: RunStepKey, status: RunStep["status"]) {
  set((s) => ({ run: s.run.map((step) => (step.key === key ? { ...step, status } : step)) }))
}

function updateApproval(set: (fn: (s: ConsoleState) => Partial<ConsoleState>) => void, status: "approved" | "rejected") {
  set((s) => ({
    run: s.run.map((step) =>
      step.key === "approval" && step.detail?.type === "approval"
        ? { ...step, detail: { ...step.detail, status } }
        : step
    ),
  }))
}

function updateResultSummary(set: (fn: (s: ConsoleState) => Partial<ConsoleState>) => void, summary: string) {
  set((s) => ({
    run: s.run.map((step) =>
      step.key === "result" && step.detail?.type === "result" ? { ...step, detail: { type: "result", summary } } : step
    ),
  }))
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
