import type { RunStep } from "@/types/console"

// NOTE: this file used to also export static mock fixtures
// (knowledgeDocuments, tools, memoryRecords, evalDimensions, evalScenarios,
// guardrails, traceRuns, dashboardStats) for every console page. Those are
// gone now that every page reads real data through the backend API — only
// `buildDemoRun` remains, since it drives the agent-workspace's scripted
// step-by-step reveal, which stays client-side (see console-store.ts).

/** The canonical demo run: a fresh agent-workspace pipeline for the
 * procurement scenario, all steps pending. `runAgent` in the console
 * store advances each step in order and fills in its detail — swap that
 * simulation for a real streaming run (SSE/websocket) once the backend
 * exists; this fixture defines the exact shape each event should produce. */
export function buildDemoRun(request: string): RunStep[] {
  return [
    { key: "request", label: "Request received", status: "pending", detail: { type: "request", text: request } },
    {
      key: "context",
      label: "Context assembled",
      status: "pending",
      detail: { type: "context", note: "Loaded department memory: preferred suppliers, standing budget code CS-OPEX-2026." },
    },
    {
      key: "retrieval",
      label: "Knowledge retrieved",
      status: "pending",
      detail: {
        type: "retrieval",
        query: "laptop purchase requirements and approval thresholds",
        relevance: 92,
        sources: [
          { doc: "Procurement Policy", location: "§2.3 Purchase thresholds", grounded: true },
          { doc: "Inventory Handbook", location: "§1.1 Reorder rules", grounded: true },
          { doc: "Supplier Guidelines", location: "§3.0 Approved vendors", grounded: true },
          { doc: "Finance Approval Matrix", location: "Table 2", grounded: true },
        ],
      },
    },
    {
      key: "plan",
      label: "Plan created",
      status: "pending",
      detail: {
        type: "plan",
        steps: ["Check current inventory", "Compare supplier quotations", "Prepare a draft requisition"],
      },
    },
    {
      key: "tool",
      label: "Tool executed",
      status: "pending",
      detail: {
        type: "tool",
        name: "Inventory Lookup",
        input: { product_id: "LAPTOP-001" },
        output: { quantity: 12, reorder_required: false },
        status: "success",
        durationMs: 423,
      },
    },
    {
      key: "observation",
      label: "Result observed",
      status: "pending",
      detail: {
        type: "observation",
        note: "12 units on hand, below the 20-unit department target — proceeding to compare quotations.",
      },
    },
    {
      key: "decision",
      label: "Re-planned",
      status: "pending",
      detail: {
        type: "decision",
        note: "Quotation Comparison ranked Kampala Tech Supplies lowest at 2,450,000 UGX for 12 units. Drafting a requisition for manager review.",
      },
    },
    {
      key: "approval",
      label: "Approval required",
      status: "pending",
      detail: {
        type: "approval",
        action: "Submit purchase requisition to Kampala Tech Supplies",
        risk: "medium",
        amount: 2450000,
        currency: "UGX",
        status: "pending",
      },
    },
    {
      key: "result",
      label: "Final result",
      status: "pending",
      detail: { type: "result", summary: "Requisition drafted and sent for approval. Awaiting manager decision." },
    },
  ]
}
