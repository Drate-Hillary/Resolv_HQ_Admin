// Domain types for the Agent Workspace. Backed by the real backend agent
// pipeline (resolv-hq-backend's generateAssistantReply/runReActLoop, the
// same one the customer app's chat uses) — a run's steps are whatever the
// real ReAct trace produced, not a fixed, scripted sequence.

export type AgentStatus = "ready" | "thinking" | "awaiting_approval" | "completed" | "failed"

export interface WorkspaceMessage {
  id: string
  role: "user" | "agent"
  content: string
}

export interface RecentTask {
  id: string
  request: string
  status: AgentStatus
  startedAt: number
  /** Kept up to date while the task is open, so clicking it can put the chat back. */
  conversationId?: string | null
  messages?: WorkspaceMessage[]
  run?: RunStep[]
}

export type RunStepStatus = "pending" | "active" | "done" | "blocked" | "failed"

export type RunStepDetail =
  | { type: "text"; text: string }
  | {
      type: "approval"
      approvalId: string
      title: string
      description: string
      category: string
      priority: "low" | "normal" | "high"
      keyFacts: string | null
      suggestedAction: string | null
      status: "pending" | "approved" | "rejected"
    }

export interface RunStep {
  key: string
  label: string
  status: RunStepStatus
  detail?: RunStepDetail
  /** Real measurements for the step, shown under its label. */
  meta?: { latencyMs?: number; tokens?: string }
}
