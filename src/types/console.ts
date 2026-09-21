// Domain types for the Agent Workspace's scripted demo run — the only
// console feature that still drives itself from client-side local state
// rather than reading real data through the backend API.

export type AgentStatus =
  | "ready"
  | "thinking"
  | "retrieving"
  | "using_tool"
  | "awaiting_approval"
  | "completed"
  | "failed"

export const runStepKeys = [
  "request",
  "context",
  "retrieval",
  "plan",
  "tool",
  "observation",
  "decision",
  "approval",
  "result",
] as const
export type RunStepKey = (typeof runStepKeys)[number]
export type RunStepStatus = "pending" | "active" | "done" | "blocked" | "failed"

export interface RetrievedSource {
  doc: string
  location: string
  grounded: boolean
}

export type RunStepDetail =
  | { type: "request"; text: string }
  | { type: "context"; note: string }
  | { type: "retrieval"; query: string; sources: RetrievedSource[]; relevance: number }
  | { type: "plan"; steps: string[] }
  | {
      type: "tool"
      name: string
      input: Record<string, string | number>
      output: Record<string, string | number | boolean>
      status: "success" | "error"
      durationMs: number
    }
  | { type: "observation"; note: string }
  | { type: "decision"; note: string }
  | {
      type: "approval"
      action: string
      risk: "low" | "medium" | "high"
      amount?: number
      currency?: string
      status: "pending" | "approved" | "rejected"
    }
  | { type: "result"; summary: string }

export interface RunStep {
  key: RunStepKey
  label: string
  status: RunStepStatus
  detail?: RunStepDetail
}
