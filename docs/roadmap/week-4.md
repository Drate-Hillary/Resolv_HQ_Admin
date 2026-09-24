# Week 4 — Tools and Function Calling

**Brief dates:** 21–25 Sept 2026 | **Status today (24 Sept, one day before this week closes):** the hardest technical work is done; what's missing is naming/packaging it the way the brief expects, plus the domain decision that everything upstream depends on.

## What the brief asks for

- At least two tools/functions: purpose, input schema, output schema, authorization, failure behaviour.
- Tool/function calling implemented through the orchestration layer.
- At least one tool retrieves current application data or performs a low-risk simulated side effect.
- Tests for missing parameters, unauthorized requests, unavailable services, unexpected responses.
- Human approval before any higher-impact action.

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| ≥2 tools with strict schemas | ✅ | Four tools in `resolv-hq-backend/src/lib/agent-tools.ts` — `search_knowledge_base`, `account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket` — all declare `additionalProperties: false` and explicit `required` arrays. Exceeds the minimum of two. |
| Tool-calling implemented | ✅ | `react-agent.ts`'s ReAct loop actually executes tool calls the model requests, via native tool-calling through the LLM gateway. |
| Tool Catalogue (named artifact) | ⚠️ | The content exists in `docs/function-calling-schemas.md` (purpose, schema, mapping, failure notes for all four tools) — it just isn't labeled or indexed as "the Tool Catalogue" the brief expects a grader to find by name. Cheap fix: add a short cross-reference or rename. |
| Read/side-effect tool | ✅ | `draft_escalation_ticket` is the low-risk simulated side effect (produces a labeled draft, writes nothing) — correctly scoped as read-only per the boundary matrix. |
| Failure/auth test evidence | ⚠️ | `function-calling-schemas.md` mentions smoke tests (empty-summary rejection, retry-then-succeed) but there's no dedicated, itemized test log covering: a missing required parameter, an unauthorized cross-customer lookup attempt, and a tool timeout — worth a short standalone evidence doc even though the underlying behaviour is already implemented (data access is already scoped per-caller by `chat.ts`'s loaders). |
| Updated architecture diagram | ❌ | Still the Week 1 gap — extend the same diagram with the tool-calling step. |
| Human approval gate | ✅ | `agent_approvals` + `routes/admin/approvals.ts` + `decideApproval()` form a real, working approval chokepoint before anything downstream happens. |
| Week 4 report | ❌ | Not yet written — due before this week closes (25 Sept). |

## The domain decision has to land this week

This is the week the brief requires "at least two explicit tools" — and it's exactly the week the domain split (procurement in the console vs. support-ticket triage in the backend, see [`../brief-alignment-review.md`](../brief-alignment-review.md)) becomes impossible to defend, because the tools that actually exist (`account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket`) have no procurement equivalent. Resolve it now, before Week 5 builds further on top of one domain while the docs still describe another:

1. Rewrite `resolv-hq/README.md`'s "worked domain" paragraph to describe the support-request triage agent instead of procurement.
2. Replace or retire `src/backend/mock-console.ts`'s procurement script (inventory/supplier/requisition) with a scenario that matches the real tools, or connect the console's pages to the real backend now that the model/tool layer is live-capable.
3. Carry this same rewrite through `model-selection-note.md`, `prompt-specification.md`, and `evaluation-table.md` (tracked in Week 2's file, but this is the natural week to actually do it since the tool names are the forcing function).

## Action plan

1. Do the domain rewrite above.
2. Add a short `docs/tool-catalogue.md` (or a header note in `function-calling-schemas.md`) explicitly labeled as the brief's Tool Catalogue deliverable, listing all four tools' purpose/schema/authorization/failure-behaviour in one place.
3. Write a short **Tool Failure & Authorization Test Evidence** doc: run and record (a) a missing-required-parameter call to `draft_escalation_ticket`, (b) an attempt to read another customer's account/request data, (c) a simulated tool timeout — all three already have the underlying protections in place per `agent-tools.ts` and `chat.ts`'s per-caller scoping; this just needs to be captured as evidence rather than left implicit.
4. Extend the architecture diagram with the tool-calling step (model → tool call → data layer → observation).
5. Write the Week 4 progress report, with the domain-reconciliation decision as the week's headline "key engineering decision and why."

## Deliverables checklist

- [ ] Domain conflict resolved across README + docs + console
- [ ] Tool Catalogue explicitly labeled/indexed
- [ ] Failure/authorization test evidence captured
- [ ] Architecture diagram extended with tool-calling
- [ ] Week 4 progress report
