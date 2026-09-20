// Shared domain types for the customer-facing chat demo (src/app/chat) and
// the admin escalation queue (src/app/admin). These used to be bespoke mock
// shapes; they're now thin view-models over real Supabase rows so the two
// vocabularies stay unified with the schema:
//   - ai_message_role is "user" | "assistant" (not "user" | "agent")
//   - request_priority is "low" | "medium" | "high"
// See src/lib/stores/chat-store.ts and src/lib/stores/admin-store.ts for the
// queries that populate these.

export type ApprovalRisk = "low" | "medium" | "high"
export type ApprovalStatus = "pending" | "approved" | "rejected"
export type RequestPriority = "low" | "medium" | "high"

export type ChatRole = "user" | "assistant"

export interface Citation {
  /** ai_message_sources.id (uuid) — stable key, not the display number. */
  id: string
  /** 1-based position among a message's citations, what's rendered in the tag. */
  number: number
  policyLabel: string
  excerpt: string
}

export interface ChatMessage {
  type: "message"
  id: string
  role: ChatRole
  content: string
  timestamp: string
  citations?: Citation[]
}

/** A transient, non-message event: the agent invoking a read-only tool. */
export interface ToolEvent {
  type: "tool"
  id: string
  label: string
  status: "running" | "done"
}

export type ChatStreamItem = ChatMessage | ToolEvent

// ---------------------------------------------------------------------
// Admin escalation queue — one row per pending/decided agent_approvals
// entry, joined against its requests + profiles rows.
// ---------------------------------------------------------------------

export interface AdminTicket {
  approvalId: string
  requestId: string | null
  code: string | null
  customerName: string
  subject: string
  priority: RequestPriority
  waitingSince: string
  status: ApprovalStatus
  assignedAdminId: string | null
}

export interface TranscriptEntry {
  id: string
  role: "user" | "agent"
  content: string
  timestamp: string
}

export interface PolicyEvidence {
  id: string
  source: string
  excerpt: string
}

export interface ProposedAction {
  type: string
  description: string
  amount?: number
  currency?: string
  risk: ApprovalRisk
}

export interface RequestCsat {
  rating: number
  comment: string | null
}

export interface Escalation {
  approvalId: string
  requestId: string | null
  aiSummary: string
  evidence: PolicyEvidence[]
  action: ProposedAction
  decisionNote: string | null
  status: ApprovalStatus
  feedback: RequestCsat | null
}

export type EscalationDecision = "approved" | "rejected" | "editing"
