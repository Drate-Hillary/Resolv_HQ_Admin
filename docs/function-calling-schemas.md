# Function Calling & JSON Schema Definitions — Report

**Workstream:** RAG Engine & LLM Service Connectivity | **Date:** 22 Sep 2026

Covers the brief task: *"Function Calling & JSON Schema Definitions — Define strict JSON schemas for read-only tools (account_status_lookup, outage_status_checker, draft_escalation_ticket)."* Checked first: the ReAct loop (`docs/react-loop-core.md`, implemented earlier the same day) already had function-calling infrastructure and two tools, but neither matched the brief's names or schema strictness — `search_knowledge_base` had a loose schema (no `additionalProperties: false`) and `check_request_status` wasn't one of the three named tools at all. Fixed in `resolv-hq-backend`.

## Task

| Task | Status | Notes |
|---|---|---|
| **Function Calling & JSON Schema Definitions** — strict schemas for `account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket`. | ✅ Done (fixed) | All four tools in `src/lib/agent-tools.ts` now declare `additionalProperties: false` and an explicit `required` array — the definition of "strict" for JSON Schema function-calling (a model can't pass an undeclared argument, and every schema is explicit about what's optional vs. mandatory). |

## Mapping the brief's tools onto the real schema

None of the three named tools have a literal 1:1 match in this schema — `outages` and `escalation tickets` aren't concepts that exist as tables. This exact gap was already flagged in `docs/week-3-iryn.md` (Task 10): *"this task needs to be scoped against the actual domain model (support tickets) rather than the outage-checker framing in the brief."* That's exactly what happened here:

| Brief tool | Schema | Real mapping |
|---|---|---|
| `account_status_lookup` | No arguments — always resolves to the caller's own account. | Reads `profiles` + `customer_profiles` for `req.user.id` (new `AiAccountInput`, loaded by `chat.ts`'s `loadAccountInput()`). Never another customer's — same data-isolation rule as every other per-caller lookup in this codebase. |
| `outage_status_checker` | No arguments. | Reads the caller's own open `requests` — the closest real "is something wrong for me" signal that exists. (Originally also took an optional `category` filter — removed; see "Bug caught" below.) |
| `draft_escalation_ticket` | `{ summary: string }`, `summary` required. | Runs the existing `classifyRequest()` (category + priority) against the summary and returns a **draft only** — title/description/category/priority — explicitly labeled "not submitted." Nothing is written to `requests`. |

`search_knowledge_base` (from the earlier ReAct work) also got its schema tightened to `additionalProperties: false` in this pass, so all four tools are consistently strict.

## Why `draft_escalation_ticket` doesn't create anything

The task explicitly scopes this to **read-only tools**. A tool literally named "draft" is exactly the kind of thing that could tempt an agent into treating drafting and filing as the same action — so the implementation is deliberately inert: it returns a proposal string prefixed `"DRAFT (not submitted — a human must review and file this)"`, and the tool's own description tells the model to say it's *prepared* the draft, never that it's been filed. This is the same boundary `docs/ai-boundary-matrix.md` already enforces for every other action.

## Bug caught during implementation

`outage_status_checker` was originally given an optional `category` enum parameter to narrow the check. While wiring it up, found that `AiRequestInput` (the shape `chat.ts` already loads) only carries `{id, title, status}` — no category — so the filter was comparing a request's *title* against a category name, which could never correctly match anything. Removed the parameter rather than ship a schema that advertises an argument the implementation can't honor; a strict schema that's also wrong isn't actually strict. Noted below as a legitimate follow-up.

## Verification

- `tsc --noEmit` and `eslint` both pass clean on `resolv-hq-backend`.
- All four tools smoke-tested directly via `executeAgentTool()`: confirmed `additionalProperties: false` on every schema, `account_status_lookup` returns the caller's real account fields, `outage_status_checker` correctly reports both "has open issues" and "none" states, `draft_escalation_ticket` produces a correctly-classified draft and correctly refuses an empty summary.
- Backend boots and answers `/health` correctly with the new tool set.

## Known limitations

- Not yet exercised against a live model's actual tool-selection behavior (same standing caveat as every other AI-feature doc today — no provider API key registered).
- `outage_status_checker`'s category narrowing was removed rather than fixed properly — doing it right means threading `category` through `AiRequestInput` (a join against `request_categories` that `chat.ts` doesn't currently do). Worth adding once there's a real need for it.
