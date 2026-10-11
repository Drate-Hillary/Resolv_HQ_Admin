# Week 6 Progress Report — RESOLV-HQ

**Author:** Hillary (Project Lead) | **Period covered:** Week 6 — Memory, State and Interoperability (5 – 9 Oct 2026) | **Date:** 9 Oct 2026

## Summary

Week 6 delivered a working server-side memory path (customers create and manage their own facts through the API, facts are loaded into authenticated chat, and a staff console has audited access), a written Memory Design and Data Handling Note, a state model, and an MCP server exposing the four agent tools over authenticated Streamable HTTP and stdio. A live memory-off versus memory-on trace is captured (one pair of runs). Still open: an authenticated MCP call on each transport, and filling in links and contributions.

## Objectives vs. achievements

| Objective (Week 6 brief) | Status | Evidence |
|---|---|---|
| Model workflow/session state explicitly | ✅ | [`state-model.md`](./state-model.md): layers, ownership, invariants, gaps. Built on existing tables (`ai_conversations`, `agent_runs`/`agent_steps`, `agent_approvals`, `requests`) |
| One justified persistent-memory use case | ✅ (API) | Customer facts (e.g. preferred contact channel) are created by the customer via `POST /memory-facts` (added 9 Oct; validated, max 50, owner from token), loaded only for the owning customer when the master switch and per-fact flag are on (`lib/customer-memory.ts`, `routes/chat.ts`), and shown in the prompt as untrusted context. 7 route and loader tests pass. The customer app now has an Add information form (Topic and Details) on the Saved Information screen, and its retention text no longer claims a 24-month limit the backend does not enforce |
| Document what is stored, why, access, retention, deletion | ✅ | [`memory-design-and-data-handling-note.md`](./memory-design-and-data-handling-note.md). Retention, export and backup propagation are stated as undefined |
| Show memory improves a task without silently controlling decisions | ✅ (one pair of runs) | [`../evidence/traces/week-6-memory-traces.md`](../evidence/traces/week-6-memory-traces.md): live Gemini runs with memory off and on. The remembered contact preference appears in the draft and reply; both ends are a not-submitted draft. Limits: single pair, direct call (no approval row written), priority difference is model variance |
| MCP-style interface (capability, inputs, outputs, permissions, security boundary) | ✅ | [`mcp-style-interface-spec.md`](./mcp-style-interface-spec.md); implementation in `src/lib/mcp-server.ts`, `routes/mcp.ts`, `mcp-stdio.ts` |

## Deliverables

| # | Deliverable | File | Status |
|---|---|---|---|
| 1 | State model | `docs/state-model.md` | Complete |
| 2 | Memory Design and Data Handling Note | `docs/memory-design-and-data-handling-note.md` | Complete (policy items open) |
| 3 | Working memory/state demonstration | `evidence/traces/week-6-memory-traces.md` | Complete (see limits in the file) |
| 4 | MCP-style interface specification | `docs/mcp-style-interface-spec.md` | Complete; updated 9 Oct |
| 5 | Week 6 progress report | `docs/week-6-progress-report.md` | This document |

## Work completed

- **Memory in chat:** customer facts are loaded server-side by the verified caller ID, filtered by the master preference and per-fact flag, bounded by `CUSTOMER_MEMORY_CONTEXT_BUDGET_CHARS` (1200), and ignored if the client sends memory fields.
- **Customer controls:** the customer app lists, toggles and deletes facts, and sets the master switch, through `/memory-facts` and `/me`.
- **Staff console:** separate staff-owned memory (`agent_memory_records`); customer search; per-customer view and edit only after explicit selection; every view or change writes `customer_memory_access_logs` without values. Console and customer app typecheck cleanly.
- **MCP:** four tools, strict zod input and output schemas, read-only annotations, per-call activation check, caller-scoped data. Both transports share the handlers.
- **MCP hardening (9 Oct):** an inactive tool, or any handler failure, now returns an explicit MCP tool error instead of throwing an HTTP error inside the handler; no fabricated `structuredContent`.
- **Automated tests:** `npm test` runs 15 tests, all passing. 8 cover MCP (in-memory client and server, stubbed loaders): discovery, inactive tools, structured output, empty results, loader failure, invalid arguments, never-submitted draft. 7 cover memory (in-memory stand-in for Prisma): customer create and validation, duplicates and the 50-fact cap, cross-customer isolation, the chat loader's master-switch and per-fact filtering, delete-all, staff audit logging without values, and refusal of the wrong role. `tsc`, ESLint and the build pass.

## Key decisions

- **Server-side memory, never client-supplied.** Ownership comes from the token, so a request body cannot select or inject memory.
- **Memory is context, not authority.** Facts are labelled untrusted in the prompt; the boundary check and approval queue are unchanged.
- **Staff access is audited, values excluded**, so the audit trail cannot itself leak customer data.
- **Separate staff memory store**, so staff notes can never reach customer chat.
- **MCP exposes only the four existing read-only tools**, sharing handlers with the chat path, with no new capabilities (no resources, prompts or sampling).
- **Tool failures are tool errors**, not success-shaped fallbacks.

## Failures, challenges and current response

| Risk | Detail | Response / next step |
|---|---|---|
| ~~Memory cannot be created by customers~~ **Fixed 9 Oct** | `POST /memory-facts` added. Mobile app still has no add-fact screen | Add the screen in `resolv-hq-customer` |
| **No memory demonstration** | Required deliverable not produced; the live model has been unreliable since Week 5 (provider credit and quota) | Seed one fact (preferred contact channel), run one escalation-drafting turn with memory on and off, capture both traces and the pending approval, and label them honestly |
| ~~Test coverage is narrow~~ **Reduced** | 22 in-memory tests (`npm test`) plus an opt-in real-database test (`npm run test:db`, 9 Oct) that created, updated, exported, loaded and deleted one clearly named fact for the existing customer and confirmed the cleanup (0 leftover rows). It also confirmed `updated_at` advances on update. Wrong-role requests now return 403. **Not run against the real DB:** staff audit writes and the purge's actual deletes | Run the staff and purge paths against a disposable database |
| **MCP transports partly exercised** | Checked 9 Oct on a local server: `/mcp` returns 401 with no token and with an invalid token; stdio refuses to start without `MCP_ACCESS_TOKEN`. An authenticated `tools/list` and `tools/call` were not run, because the only token script resets a Supabase user's password and needs the lead's approval | Run one authenticated call on each transport and record it |
| ~~Migrations not confirmed applied~~ **Confirmed 9 Oct** | `prisma migrate status`: 10 migrations found, database schema up to date. Read-only counts show the new tables exist (`customer_memory` 0 rows, `agent_memory_records` 0, `customer_memory_access_logs` 3, 1 customer profile) and all four tools are active | None |
| ~~Stale documents~~ **Fixed 9 Oct** | `architecture-diagram.md`/`.txt` now show the memory edge as built and annotate the Tools node with MCP; `agent-task-contract.md` §3 describes memory. `architecture-diagrams-week-4-and-5.md` is left as the dated Week 4/5 snapshot | None |
| ~~Retention undefined~~ **Defined 9 Oct** | Retention table in the memory note (facts 365 idle days, audit 730, idle conversations without runs 365, runs/approvals never auto-deleted). Purge implemented in `lib/retention.ts` but **off by default** (`RETENTION_ENABLED=false`); customer JSON export and admin-only audit read added. Backup window with Supabase not verified | Lead to approve the periods and switch the purge on; confirm the backup window |
| ~~Lint noise~~ **Fixed 9 Oct** | ESLint now ignores `dist/` and scratch scripts; the regex escape in `knowledge-index.ts` is fixed. `npm run lint` is clean | None |

## Links and evidence

- GitHub commits/tags/PRs: *to be added by the lead; the workspace is not a single git repository and no commit links were available when this was written.*
- ClickUp board/tasks: *to be added.*
- Code: `resolv-hq-backend/src/routes/memory.ts`, `routes/admin/memory.ts`, `routes/chat.ts`, `lib/mcp-server.ts`, `tests/mcp-server.test.ts`; migrations `20261008000000_customer_memory_controls` and `20261008100000_console_memory_integration`.

## Individual contributions

*Not recorded here. The repository has no author history I could read; the task tracker lists owners as AEL/QSL (memory), AIL (MCP and state) and PRL (reports). Fill in member, task and evidence before submission.*

## Plan for Week 7 (evaluation, observability and guardrails)

1. Make a usable provider: Anthropic has no credit and the OpenAI row names a model (`gpt-4`) that returns 404; Gemini's free tier allows 5 requests per minute.
2. Run an authenticated `tools/list` and `tools/call` on both MCP transports.
3. Tweak the escalation reply so a remembered contact preference is promised as an attempt, not a commitment (trace observation 4).
4. Build the 30+ scenario evaluation set, including memory cases (stale fact, conflicting instruction in a fact, disabled memory).
5. Collect tracing and guardrail evidence, and start the Failure Catalogue.
