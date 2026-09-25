# Week 4 — Tools and Function Calling

**Brief dates:** 21–25 Sept 2026 | **Status today (25 Sept, this week closes today):** domain conflict resolved, Tool Catalogue and test evidence written, architecture diagram drawn. Only the Week 4 progress report itself remains open.

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
| Tool Catalogue (named artifact) | ✅ | [`docs/tool-catalogue.md`](../tool-catalogue.md) — purpose, exact schema, authorization, and failure behaviour for all four tools, indexed under the name the brief expects. |
| Read/side-effect tool | ✅ | `draft_escalation_ticket` is the low-risk simulated side effect (produces a labeled draft, writes nothing) — correctly scoped as read-only per the boundary matrix. |
| Failure/auth test evidence | ✅ | [`docs/tool-failure-auth-test-evidence.md`](../tool-failure-auth-test-evidence.md) — real, executed output (not hypothetical) for missing-parameter, cross-customer-authorization, unavailable-tool, and ungrounded-query cases, run directly against `agent-tools.ts` via `tsx`. Also surfaced a genuine keyword-overlap retrieval weakness along the way, logged for the Week 7 Failure Catalogue. |
| Updated architecture diagram | ✅ | [`docs/architecture-diagram.md`](../architecture-diagram.md) — the first version of the running diagram (none existed before), covering client surfaces through the LLM gateway, ReAct loop, tools, boundary matrix, and approval queue, with the Week 4 addition (the Agent Tools subgraph) called out explicitly. |
| Human approval gate | ✅ | `agent_approvals` + `routes/admin/approvals.ts` + `decideApproval()` form a real, working approval chokepoint before anything downstream happens. |
| Week 4 report | ❌ | Not yet written — due before this week closes (25 Sept). |

## The domain decision — resolved

This was the week the domain split (procurement in the console vs. support-ticket triage in the backend, see [`../brief-alignment-review.md`](../brief-alignment-review.md)) became impossible to defend, because the tools that actually exist (`account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket`) have no procurement equivalent. It's now resolved — see [`../domain-conflict-resolution.md`](../domain-conflict-resolution.md) for the full file-by-file account:

1. ✅ `resolv-hq/README.md`'s "worked domain" paragraph rewritten to describe the support-request triage agent.
2. ✅ `src/backend/mock-console.ts`'s procurement script replaced with a scenario matching the real tools (login-failure/account-status/escalation-ticket).
3. ✅ The same rewrite carried through `model-selection-note.md`, `prompt-specification.md`, and `evaluation-table.md`.

## Action plan

1. ~~Do the domain rewrite above.~~ Done — see [`../domain-conflict-resolution.md`](../domain-conflict-resolution.md).
2. ~~Add a Tool Catalogue.~~ Done — [`../tool-catalogue.md`](../tool-catalogue.md).
3. ~~Write Tool Failure & Authorization Test Evidence.~~ Done — [`../tool-failure-auth-test-evidence.md`](../tool-failure-auth-test-evidence.md).
4. ~~Extend the architecture diagram with the tool-calling step.~~ Done — [`../architecture-diagram.md`](../architecture-diagram.md).
5. Write the Week 4 progress report, with the domain-reconciliation decision as the week's headline "key engineering decision and why." — still open, the one remaining item this week.

## Deliverables checklist

- [x] Domain conflict resolved across README + docs + console
- [x] Tool Catalogue explicitly labeled/indexed
- [x] Failure/authorization test evidence captured
- [x] Architecture diagram extended with tool-calling
- [ ] Week 4 progress report
