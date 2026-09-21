# Week 3 Progress Report — Opis

**Workstream:** RAG Engine & LLM Service Connectivity + Human-in-the-Loop Dashboard Integration | **Period covered:** Week 3 | **Date:** 18 Sep 2026

Source: `docs/week-3-report.docx` (Week 3 Task Breakdown — RESOLV-HQ), Tasks 13–17.

> **Critical path note (from the report overview):** "The critical path for Week 3 is the same one flagged at the end of Week 2 — live model + retrieval wiring (Tasks 13-15, 17) — plus everything downstream of it that currently has nothing to test against (Tasks 18-20)." Four of this workstream's five tasks are on that critical path.

## Tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 13 | **Vector Store API Connectivity** — Integrate the backend service with the vector database instance (e.g., ChromaDB, Qdrant, or Pinecone) to accept policy embedding queries. | ❌ Not started | No vector store client or dependency exists in `resolv-hq-backend`. This is the prerequisite for Task 14 and needs a decision (ChromaDB vs. Qdrant vs. Pinecone) plus a Docker Compose service (feeding back into Task 1). |
| 14 | **RAG Context Payload Assembler** — Write pipeline logic that extracts top-k retrieved text passages from the vector store and dynamically formats them into the LLM prompt payload. | ❌ Not started | `lib/ai.ts`'s `answerQuestion` currently does plain keyword substring-matching over `help_articles` rows (`scoreArticle`), not embedding-based top-k retrieval — and there is no LLM prompt call at all yet, so there's no payload to assemble into. This is the direct successor to Week 2's flagged "model integration is the critical path" risk. |
| 15 | **Multi-Provider LLM Gateway Wrapper** — Implement API client wrappers with automated fallbacks to handle model switching between primary and secondary AI providers. | 🟡 Partial | `routes/admin/agent-providers.ts` already gives staff full CRUD over registered providers (name, provider, model, masked API key, status) — the configuration/registry half of this task is done. There is no runtime wrapper yet that actually calls a provider's completion API or falls back from a primary to a secondary provider on failure; agent-providers rows aren't consumed by any live call path today. |
| 16 | **Approval Queue REST/gRPC Endpoints** — Create dedicated backend routes for the Human Admin Approval Dashboard to retrieve pending escalation tickets, inspect evidence, and log decisions. | ✅ Done | `routes/admin/approvals.ts` covers the full flow: `GET /` (ticket queue, joined against requests + profiles), `GET /:id` (full escalation detail — transcript, policy evidence, proposed action, CSAT), and `PATCH /:id/approve\|reject` (routed through the shared `decideApproval()`). Two endpoints (`available-admins`, request reassignment) are mounted under `/admin/approvals/*` rather than the spec's originally-named top-level paths, since `app.ts` only mounts this router there — flagged in-code as a decision for whoever owns `app.ts` next. |
| 17 | **Post-Approval Action Dispatch Engine** — Build the trigger execution service that fires downstream account/billing mutations only after a human approval flag is confirmed. | ❌ Not started | `decideApproval()` currently only updates the `agent_approvals` row and writes an `admin_activity_logs` entry — there is no separate dispatch service that actually executes the approved account/billing mutation afterward. This is the natural next step once an approval is confirmed, and should consume the same `agent_approvals.status = 'approved'` transition `decideApproval()` already produces. |

## Summary

The human-in-the-loop side of this workstream (Task 16) is solid — the approval queue is fully wired end-to-end. Everything upstream and downstream of it is the project's main risk: no vector store, no real retrieval, no live LLM call path, and no dispatch engine to act on an approval once granted. The provider registry (Task 15) is ready to be consumed but isn't wired to anything yet.

## Plan for next week

1. Pick a vector store (ChromaDB, Qdrant, or Pinecone) and stand up a Docker Compose service for it (Task 13), unblocking Task 14.
2. Replace `answerQuestion`'s keyword matching with embedding-based top-k retrieval, and make an actual LLM completion call using the assembled context (Task 14).
3. Wire a runtime call path that actually invokes a registered `agent_providers` row's completion API, with fallback to a secondary provider (Task 15).
4. Build the post-approval dispatch engine so an `approved` transition on `agent_approvals` actually triggers the downstream mutation, not just a status flip (Task 17).
