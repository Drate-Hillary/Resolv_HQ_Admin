// Shared domain types for the customer-facing chat demo (src/app/chat) and
// the admin escalation queue (src/app/admin). These are thin view-models
// over real Supabase rows, kept in sync with the simplified schema:
//   - agent_approvals no longer carries request_id, risk, amount, currency,
//     or a free-text description/decision_note — just requested_action,
//     reason, and review_comment.
//   - request_attachments, request_feedback and ai_message_sources no
//     longer exist as tables, so there is no evidence/csat/attachments here.
// See src/lib/stores/admin-store.ts for the queries that populate these.

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired"
export type RequestPriority = "low" | "medium" | "high" | "urgent"

export type ChatRole = "user" | "assistant"

export interface CustomerMemoryFact {
  id: string
  key: string
  label: string
  value: string
  enabled: boolean
}

export interface ChatMessage {
  type: "message"
  id: string
  role: ChatRole
  content: string
  timestamp: string
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
// entry, joined (through its agent_run) against requests + profiles.
// ---------------------------------------------------------------------

export interface AdminTicket {
  approvalId: string
  requestId: string | null
  customerName: string
  subject: string
  priority: RequestPriority
  waitingSince: string
  status: ApprovalStatus
  assignedAgentId: string | null
}

export interface TranscriptEntry {
  id: string
  role: "user" | "agent"
  content: string
  timestamp: string
}

export interface Escalation {
  approvalId: string
  requestId: string | null
  requestedAction: string
  reason: string | null
  status: ApprovalStatus
  reviewComment: string | null
}

export type EscalationDecision = "approved" | "rejected" | "editing"

// ---------------------------------------------------------------------
// General ticket queue — the requests table, staff-side. Distinct from
// AdminTicket/Escalation above, which are specifically AI-drafted
// agent_approvals rows awaiting an approve/reject decision.
// ---------------------------------------------------------------------

export interface TicketMessage {
  id: string
  sender: "customer" | "admin" | "agent" | "assistant" | "system"
  text: string
  timestamp: string
}

export interface TicketTimelineStep {
  key: string
  label: string
  timestamp?: string
}

export interface Ticket {
  id: string
  ticketNumber: number
  title: string
  category: string
  categoryId: string | null
  description: string
  status: string
  priority: RequestPriority
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  aiHandled: boolean
  customerId?: string
  customerName: string | null
  assignedAgentId: string | null
  assignedAgentName: string | null
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[]
  timeline: TicketTimelineStep[]
}
