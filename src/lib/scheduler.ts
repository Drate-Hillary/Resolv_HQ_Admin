// Scheduler board model. Columns are the agent pipeline's stages (see agent-flow.ts,
// which mirrors resolv-hq-backend) plus a "Scheduled" queue in front and "Done" behind.
// A card moves left to right as the agent works on it.
import { FLOW_NODES, type FlowNodeId } from "@/lib/agent-flow"
import type { RunStep } from "@/types/console"

export type ColumnId = "scheduled" | "intake" | "planner" | "tools" | "guard" | "approval" | "done"

export const COLUMNS: { id: ColumnId; title: string; role: string }[] = [
  { id: "scheduled", title: "Scheduled", role: "Waiting for its start time. The scheduler picks it up automatically." },
  { id: "intake", title: FLOW_NODES.intake.title, role: FLOW_NODES.intake.role },
  { id: "planner", title: FLOW_NODES.planner.title, role: FLOW_NODES.planner.role },
  { id: "tools", title: FLOW_NODES.tools.title, role: FLOW_NODES.tools.role },
  { id: "guard", title: FLOW_NODES.guard.title, role: FLOW_NODES.guard.role },
  { id: "approval", title: FLOW_NODES.approval.title, role: FLOW_NODES.approval.role },
  { id: "done", title: "Done", role: "The answer was delivered, or the run ended." },
]

export const columnTitle = (id: ColumnId) => COLUMNS.find((c) => c.id === id)?.title ?? id
export const columnRole = (id: ColumnId) => COLUMNS.find((c) => c.id === id)?.role ?? ""

export function toColumn(node: FlowNodeId): ColumnId {
  return node === "response" ? "done" : node
}

/** live: scheduled here by staff. customer: an agent task from the customer app. history: a task run in Chat. */
export type CardSource = "live" | "customer" | "history"
export type CardState = "scheduled" | "running" | "needs_approval" | "done" | "failed"

export interface RouteStep {
  column: ColumnId
  reason: string
  /** How long the card stays here before the next move. */
  dwellMs?: number
}

export interface LogEntry {
  at: number
  column: ColumnId
  text: string
}

export interface SchedulerCard {
  id: string
  request: string
  source: CardSource
  column: ColumnId
  state: CardState
  /** Epoch ms when the scheduler should start it. */
  runAt: number
  /** Moves still to make. A live card's route is filled in once the real run returns. */
  route: RouteStep[]
  /** Epoch ms of the next move (or, for a live card in flight, the hop from intake to planner). */
  nextAt: number
  /** Applied when the route runs out. */
  finalState?: CardState
  log: LogEntry[]
  /** The latest console task this card created, for live cards (history cards: the task they show). */
  taskId?: string
  /** Every console task this card created: the first run plus each follow-up. */
  taskIds?: string[]
  /** The agent conversation behind this card, so a follow-up continues it. */
  conversationId?: string
  /** Transcript of the conversation, kept on the card because the console only holds one task at a time. */
  messages?: CardMessage[]
  /** The backend record behind a customer-app card. */
  remote?: RemoteTask
  /** Activity steps of the latest run, restored when the card is opened in Chat. */
  run?: RunStep[]
  createdAt: number
}

/** A ticket a customer filed (GET /admin/scheduler). */
export interface RemoteTicket {
  id: string
  ticketNumber: string
  title: string
  description: string
  category: string | null
  priority: string | null
  status: string
  isFinal: boolean
  source: string | null
  aiHandled: boolean
  customerName: string | null
  createdAt: string | null
}

/** An agent task a customer started in the app (GET /admin/scheduler). */
export interface RemoteTask {
  id: string
  request: string
  conversationId: string | null
  requestId: string | null
  customerName: string | null
  status: string
  column: ColumnId
  moves: { column: ColumnId; text: string }[]
  model: string | null
  error: string | null
  approval: { id: string; status: string; action: string } | null
  startedAt: string | null
  completedAt: string | null
}

export interface SchedulerFeed {
  queue: { status: "connected" | "offline" | "disabled"; broker: string }
  tickets: RemoteTicket[]
  tasks: RemoteTask[]
}

export interface CardMessage {
  id: string
  role: "user" | "agent"
  content: string
}

export const STEP_MS = 1600

/** A customer-app agent task as a board card: its column and path are what the backend recorded. */
export function taskToCard(t: RemoteTask): SchedulerCard {
  const started = t.startedAt ? Date.parse(t.startedAt) : Date.now()
  const ended = t.completedAt ? Date.parse(t.completedAt) : started
  const state: CardState =
    t.column === "approval" ? "needs_approval" : t.status === "failed" ? "failed" : t.status === "running" ? "running" : "done"
  return {
    id: `customer-${t.id}`,
    request: t.request,
    source: "customer",
    column: t.column,
    state,
    runAt: started,
    route: [],
    nextAt: started,
    log: t.moves.map((m, i) => ({ at: i === t.moves.length - 1 ? ended : started, column: m.column, text: m.text })),
    createdAt: started,
    remote: t,
  }
}
