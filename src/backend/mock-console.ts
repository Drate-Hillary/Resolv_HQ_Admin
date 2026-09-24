import type { RunStep } from "@/types/console"

// NOTE: this file used to also export static mock fixtures
// (knowledgeDocuments, tools, memoryRecords, evalDimensions, evalScenarios,
// guardrails, traceRuns, dashboardStats) for every console page. Those are
// gone now that every page reads real data through the backend API — only
// `buildDemoRun` remains, since it drives the agent-workspace's scripted
// step-by-step reveal, which stays client-side (see console-store.ts).

/** The canonical demo run: a fresh agent-workspace pipeline for the
 * support-request triage scenario — the same tools and boundary the real
 * backend implements (see resolv-hq-backend/src/lib/agent-tools.ts and
 * docs/ai-boundary-matrix.md) — all steps pending. `runAgent` in the
 * console store advances each step in order and fills in its detail —
 * swap that simulation for a real streaming run (SSE/websocket) once the
 * backend exposes one; this fixture defines the exact shape each event
 * should produce. */
export function buildDemoRun(request: string): RunStep[] {
  return [
    { key: "request", label: "Request received", status: "pending", detail: { type: "request", text: request } },
    {
      key: "context",
      label: "Context assembled",
      status: "pending",
      detail: { type: "context", note: "Loaded the caller's own account and open requests — no other customer's data is visible to this run." },
    },
    {
      key: "retrieval",
      label: "Knowledge retrieved",
      status: "pending",
      detail: {
        type: "retrieval",
        query: "steps for resolving a login failure after a password reset",
        relevance: 91,
        sources: [
          { doc: "Account Access Troubleshooting Guide", location: "§2.1 Password reset issues", grounded: true },
          { doc: "Service Status FAQ", location: "§1.0 Checking your account status", grounded: true },
          { doc: "Support Escalation Policy", location: "§3.0 When to escalate to a technician", grounded: true },
        ],
      },
    },
    {
      key: "plan",
      label: "Plan created",
      status: "pending",
      detail: {
        type: "plan",
        steps: [
          "Search the knowledge base for password-reset troubleshooting steps",
          "Check the caller's own account status",
          "Draft an escalation ticket if the issue isn't resolved by self-service steps",
        ],
      },
    },
    {
      key: "tool",
      label: "Tool executed",
      status: "pending",
      detail: {
        type: "tool",
        name: "account_status_lookup",
        input: {},
        output: { status: "active", openRequests: 1 },
        status: "success",
        durationMs: 340,
      },
    },
    {
      key: "observation",
      label: "Result observed",
      status: "pending",
      detail: {
        type: "observation",
        note: "Account is active and in good standing — the login failure isn't caused by a suspended account, so the password-reset walkthrough alone may not resolve it.",
      },
    },
    {
      key: "decision",
      label: "Re-planned",
      status: "pending",
      detail: {
        type: "decision",
        note: "Self-service troubleshooting didn't resolve a persistent login failure — drafting an escalation ticket for a support technician to review the account directly.",
      },
    },
    {
      key: "approval",
      label: "Approval required",
      status: "pending",
      detail: {
        type: "approval",
        action: "Create escalation ticket: \"Persistent login failure after password reset\"",
        risk: "low",
        status: "pending",
      },
    },
    {
      key: "result",
      label: "Final result",
      status: "pending",
      detail: { type: "result", summary: "Escalation ticket drafted and sent for approval. Awaiting staff decision." },
    },
  ]
}
