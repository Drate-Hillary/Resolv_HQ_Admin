// The system as a workflow graph: who talks to whom when a customer message
// becomes an answer. Source paths are in the backend repo unless noted.
import {
  AiBrain01Icon,
  Activity03Icon,
  BubbleChatAddIcon,
  CpuIcon,
  DashboardBrowsingIcon,
  DatabaseIcon,
  Knowledge01Icon,
  LockIcon,
  Notification01Icon,
  Robot02Icon,
  ShieldUserIcon,
  SparklesIcon,
  Wrench01Icon,
  Layers01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

export type ArchKind = "client" | "service" | "ai" | "data" | "human"

export interface ArchNode {
  id: string
  title: string
  subtitle: string
  kind: ArchKind
  icon: typeof Robot02Icon
  /** Grid position: column, row (halves allowed). */
  col: number
  row: number
  description: string
  source: string
}

export interface ArchEdge {
  from: string
  to: string
  label?: string
}

export const NODE_W = 208
export const NODE_H = 72
export const COL_GAP = 276
export const ROW_GAP = 116
export const PAD = 32

export const kindLabel: Record<ArchKind, string> = {
  client: "Client",
  service: "Service",
  ai: "AI",
  data: "Data",
  human: "Human in the loop",
}

export const nodes: ArchNode[] = [
  {
    id: "customer",
    title: "Customer app",
    subtitle: "resolv-hq-customer",
    kind: "client",
    icon: BubbleChatAddIcon,
    col: 0,
    row: 1,
    description: "Expo web and mobile app where customers chat with the assistant and raise support requests.",
    source: "resolv-hq-customer",
  },
  {
    id: "admin",
    title: "Admin console",
    subtitle: "resolv-hq (this app)",
    kind: "client",
    icon: DashboardBrowsingIcon,
    col: 0,
    row: 3,
    description:
      "Vite + React console for staff: chat workspace, tickets, knowledge base, traces, scheduler and approvals. Receives live updates, including token usage while a run is in flight.",
    source: "resolv-hq/src",
  },
  {
    id: "auth",
    title: "Supabase Auth",
    subtitle: "Sign-in and sessions",
    kind: "service",
    icon: LockIcon,
    col: 1,
    row: 0,
    description:
      "Both apps sign in directly with Supabase. It is the only thing they call directly; everything else goes through the backend with the session's access token as a bearer token.",
    source: "src/backend/supabase/client.ts",
  },
  {
    id: "api",
    title: "Backend API",
    subtitle: "Express, port 4000",
    kind: "service",
    icon: Layers01Icon,
    col: 1,
    row: 2,
    description:
      "Verifies the bearer token with Supabase, applies CORS and per-user rate limiting (Redis), checks conversation access, then hands the message to the agent.",
    source: "src/app.ts, src/routes/chat.ts, src/middleware/rate-limit.ts",
  },
  {
    id: "clarify",
    title: "Clarification gate",
    subtitle: "Runs before any model",
    kind: "service",
    icon: ShieldUserIcon,
    col: 2,
    row: 2,
    description:
      "A deterministic check, not a prompt instruction. A vague message gets exactly one targeted clarifying question; a clear one continues to the agent.",
    source: "src/lib/clarification.ts",
  },
  {
    id: "knowledge",
    title: "Knowledge and memory",
    subtitle: "Postgres via Prisma, Storage",
    kind: "data",
    icon: Knowledge01Icon,
    col: 2,
    row: 4,
    description:
      "Relevant knowledge-base articles, the customer's open requests and their saved memory are scored and packed into a context budget for the prompt.",
    source: "src/lib/context-budget.ts, src/lib/knowledge-storage.ts, prisma/",
  },
  {
    id: "agent",
    title: "ReAct agent loop",
    subtitle: "Plan, act, observe, respond",
    kind: "ai",
    icon: Robot02Icon,
    col: 3,
    row: 2,
    description:
      "Calls the model, runs any tool it asks for, feeds the result back, and repeats until it answers. Reports token usage after every model call and enforces the AI boundary matrix on the final text.",
    source: "src/lib/react-agent.ts, src/lib/ai.ts, src/lib/ai-boundary.ts",
  },
  {
    id: "subagents",
    title: "Sub-agents",
    subtitle: "Researcher, case checker",
    kind: "ai",
    icon: Robot02Icon,
    col: 3,
    row: 0,
    description:
      "Small single-purpose workers the main agent hands a narrow job to. When the retrieved knowledge is large, the researcher reads it once in a short prompt and returns a cited digest, so the main agent's prompt and tool list stay small. They are read-only, cannot delegate further, run side by side, and each call is tagged with its name in the trace.",
    source: "src/lib/sub-agents.ts",
  },
  {
    id: "realtime",
    title: "Realtime push",
    subtitle: "WebSocket, SSE fallback",
    kind: "service",
    icon: Notification01Icon,
    col: 3,
    row: 4,
    description:
      "Pushes events to signed-in users the moment they happen: messages, notifications, typing and live token usage. Fans out across instances through Redis pub/sub and degrades to single-instance without it.",
    source: "src/lib/realtime.ts, src/lib/ws.ts, src/routes/events.ts",
  },
  {
    id: "gateway",
    title: "Model gateway",
    subtitle: "Cache and fallback",
    kind: "ai",
    icon: CpuIcon,
    col: 4,
    row: 0,
    description:
      "One interface over every provider. A cache hit skips the model entirely; otherwise it tries providers in order, retrying with backoff and handing off when one hits a usage limit or fails.",
    source: "src/lib/llm/gateway.ts",
  },
  {
    id: "tools",
    title: "Tools and MCP",
    subtitle: "Read-only toolset",
    kind: "ai",
    icon: Wrench01Icon,
    col: 4,
    row: 1,
    description:
      "The active tool registry the model can call. Tools never write anything; the toolset stays read-only so the model can only look things up or draft.",
    source: "src/lib/agent-tools.ts, src/mcp-stdio.ts",
  },
  {
    id: "escalate",
    title: "Escalation draft",
    subtitle: "Awaiting approval",
    kind: "human",
    icon: SparklesIcon,
    col: 4,
    row: 3,
    description:
      "When the assistant decides a human is needed it drafts a support request. Nothing is filed yet: the draft is stored as an approval in the awaiting_approval state.",
    source: "src/routes/chat.ts",
  },
  {
    id: "trace",
    title: "Trace log",
    subtitle: "agent_runs and trace rows",
    kind: "data",
    icon: Activity03Icon,
    col: 4,
    row: 4,
    description:
      "Every run is recorded: retrieval, each model and tool call with latency, tokens and errors, and the outcome. This is what Traces and Logs replays.",
    source: "src/lib/trace-log.ts",
  },
  {
    id: "providers",
    title: "LLM providers",
    subtitle: "Anthropic, OpenAI, Google",
    kind: "ai",
    icon: AiBrain01Icon,
    col: 5,
    row: 0,
    description: "The registered, active model providers. Which ones are on and in what order is managed under AI Models.",
    source: "src/lib/llm/providers/",
  },
  {
    id: "bus",
    title: "Event bus",
    subtitle: "RabbitMQ to Scheduler",
    kind: "service",
    icon: DatabaseIcon,
    col: 5,
    row: 2,
    description:
      "Run, approval and ticket events are published to RabbitMQ and relayed to the console's Scheduler. If the broker is unset or unreachable, events go straight to the console instead.",
    source: "src/lib/bus.ts, src/routes/admin/scheduler.ts",
  },
  {
    id: "approval",
    title: "Staff approval",
    subtitle: "Human decision",
    kind: "human",
    icon: UserGroupIcon,
    col: 5,
    row: 3,
    description:
      "Staff review the drafted escalation in the console and approve or reject it. Only an approval actually files the request.",
    source: "src/routes/admin/approvals.ts",
  },
]

export const edges: ArchEdge[] = [
  { from: "customer", to: "auth", label: "sign in" },
  { from: "admin", to: "auth", label: "sign in" },
  { from: "customer", to: "api", label: "chat, requests" },
  { from: "admin", to: "api", label: "console API" },
  { from: "auth", to: "api", label: "verify token" },
  { from: "api", to: "clarify", label: "message" },
  { from: "clarify", to: "agent", label: "clear question" },
  { from: "knowledge", to: "agent", label: "context" },
  { from: "agent", to: "gateway", label: "model call" },
  { from: "gateway", to: "providers", label: "fallback chain" },
  { from: "agent", to: "tools", label: "tool call" },
  { from: "agent", to: "subagents", label: "delegate" },
  { from: "subagents", to: "gateway", label: "model calls" },
  { from: "agent", to: "escalate", label: "needs human" },
  { from: "escalate", to: "approval", label: "approval" },
  { from: "agent", to: "trace", label: "log run" },
  { from: "agent", to: "bus", label: "run events" },
  { from: "agent", to: "realtime", label: "token usage" },
  { from: "realtime", to: "admin", label: "live updates" },
]

/** One chat message end to end, for the "Trace a message" walkthrough. */
export const walkthrough: readonly string[] = [
  "customer",
  "auth",
  "api",
  "clarify",
  "knowledge",
  "agent",
  "gateway",
  "providers",
  "subagents",
  "tools",
  "trace",
  "realtime",
  "admin",
]

export const nodeById = new Map(nodes.map((n) => [n.id, n]))
