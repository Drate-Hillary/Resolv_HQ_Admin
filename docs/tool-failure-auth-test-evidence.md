# Tool Failure & Authorization Test Evidence — Week 4

**Closes:** Week 4's *"Tests for missing parameters, unauthorized requests, unavailable services, unexpected tool responses"* requirement ([brief §7](./capstone-project-brief.md#week-4-21--25-sept-2026-tools-and-function-calling)) | **Date:** 25 Sept 2026 | **Tools under test:** see [`tool-catalogue.md`](./tool-catalogue.md)

## Method

`executeAgentTool()` and the four tool functions in `resolv-hq-backend/src/lib/agent-tools.ts` are pure — they take a `context` object (`knowledge`, `activeRequests`, `account`) already scoped to one caller and produce a plain-text result, with no database or network call inside the tool layer itself. That means they can be exercised directly, outside a running server, and the result is the exact same code path production hits (`react-agent.ts`'s Act step calls this same `executeAgentTool()`).

A throwaway script was run with `npx tsx` against the real source file (not a reimplementation), covering six cases, then deleted — it was never committed. The commands and **actual captured output** are below, verbatim.

---

## Case 1 — Missing required parameter

**Setup:** call `draft_escalation_ticket` with no `summary` at all — simulating a tool call that reached the executor without its one required argument (defense-in-depth: the JSON schema already marks `summary` as `required`, so this checks the function body still refuses if one ever got through anyway).

```ts
executeAgentTool("draft_escalation_ticket", {}, customerA)
```

**Actual output:**
```
Cannot draft a ticket without a summary of the issue.
```

**Assessment:** ✅ Passed. No hollow ticket is drafted; the failure is explicit and would surface to the caller as "I need a bit more detail before I can draft that," not a silent empty draft.

---

## Case 2 — Unauthorized / cross-customer access

**Setup:** the strongest authorization test available at this layer isn't a permission check to trigger — it's proving there is no argument or code path by which one caller's tool call could ever see another caller's data. Two distinct caller contexts were built (`customer A`: Kampala, one open request "Login failure after reset"; `customer B`: Jinja, one resolved request "Billing question"), and the same two tools were called once per context.

```ts
executeAgentTool("account_status_lookup", {}, customerA)
executeAgentTool("account_status_lookup", {}, customerB)
executeAgentTool("outage_status_checker", {}, customerA)
executeAgentTool("outage_status_checker", {}, customerB)
```

**Actual output:**
```
=== account_status_lookup, context = customer A ===
Role: customer
Status: active
Location: Kampala, Uganda
Member since: 2025-01-10

=== account_status_lookup, context = customer B ===
Role: customer
Status: active
Location: Jinja, Uganda
Member since: 2024-06-02

=== outage_status_checker, context = customer A ===
- "Login failure after reset": open

=== outage_status_checker, context = customer B ===
- "Billing question": resolved
```

**Assessment:** ✅ Passed. Each call returned only the data for the context it was given — there is no argument in either tool's schema (both take `{}`, `required: []`) that could name a different caller, so a model cannot construct a call that reaches across customers even if it tried. In production, that `context` is built once per request by `chat.ts`'s `loadAccountInput(userId, role)`, documented in-code as *"always the caller's own account, resolved server-side from `req.user`, never client-supplied"* — the authorization boundary is structural (no selector exists), not a runtime permission check that could have a bug in it.

---

## Case 3 — Unavailable / unrecognized tool

**Setup:** call the executor with a tool name that isn't registered — simulating a model hallucinating a tool, or a tool that's been retired.

```ts
executeAgentTool("refund_processor", {}, customerA)
```

**Actual output:**
```
Unknown tool "refund_processor".
```

**Assessment:** ✅ Passed. No exception, no silent no-op — a clear, catchable message the ReAct loop can surface as "I wasn't able to complete that step" rather than crashing the turn. Notably, `refund_processor` isn't just an arbitrary unknown name — it's exactly the kind of tool this system deliberately does **not** expose, per the boundary matrix.

---

## Case 4 — Unexpected tool response: ungrounded query

**Setup:** query the knowledge base for something with zero keyword overlap with the corpus.

```ts
executeAgentTool("search_knowledge_base", { query: "vegetable garden watering schedule" }, customerA)
```

**Actual output:**
```
No matching knowledge base articles found.
```

**Assessment:** ✅ Passed. Matches the prompt spec's requirement to say the knowledge base doesn't cover a question rather than guess.

---

## Case 5 — Schema strictness (structural check)

**Setup:** read `AGENT_TOOL_DEFINITIONS` directly and confirm every tool declares `required` and `additionalProperties: false`.

**Actual output:**
```json
[
  { "name": "search_knowledge_base", "required": ["query"], "additionalProperties": false },
  { "name": "account_status_lookup", "required": [], "additionalProperties": false },
  { "name": "outage_status_checker", "required": [], "additionalProperties": false },
  { "name": "draft_escalation_ticket", "required": ["summary"], "additionalProperties": false }
]
```

**Assessment:** ✅ Passed. All four are strict — a model cannot pass an undeclared argument to any of them.

---

## A genuine finding along the way — logged for the Week 7 Failure Catalogue

While preparing Case 4, an initial test used the query `"how do I reset a satellite modem"` against the same one-article corpus (whose content mentions "password *reset*"). It did **not** return "no matching articles" — it matched:

```
=== search_knowledge_base("how do I reset a satellite modem") ===
### Account Access Troubleshooting Guide
If a login failure persists after a password reset...
```

**Why:** `scoreMatch()` (`agent-tools.ts`) ranks by raw word overlap between the query and each article's title/content, with no relevance threshold beyond "score > 0." A single shared word ("reset") between two otherwise unrelated topics (satellite modems vs. password resets) is enough to produce a confident-looking match. This is a real, reproducible retrieval weakness, not a hypothetical — it's the keyword-ranking equivalent of the false-premise failure that already drove Prompt Spec v1.1, and it's exactly the kind of case the brief's Week 3 RAG evaluation and Week 7 Failure Catalogue ask for. Recommended write-up: *"Keyword-overlap retrieval can surface a coincidentally-matching article for an unrelated query instead of correctly reporting no grounding, when the query happens to share a common word with an article's content."* Worth carrying into `docs/evaluation-table.md`'s RAG-specific cases (Week 3) and the compiled Failure Catalogue (Week 7) rather than only living in this test log.

---

## Summary

| Case | What it tests | Result |
|---|---|---|
| 1 | Missing required parameter | ✅ Passed |
| 2 | Unauthorized / cross-customer access | ✅ Passed (structural — no selector argument exists) |
| 3 | Unavailable / unrecognized tool | ✅ Passed |
| 4 | Unexpected response — ungrounded query | ✅ Passed |
| 5 | Schema strictness | ✅ Passed |
| — | Keyword-overlap false-match (found incidentally) | ⚠️ Genuine limitation — logged for Week 7 |

All required Week 4 test categories (missing parameter, unauthorized request, unavailable service, unexpected response) are covered with real, executed evidence against the actual tool implementation — not a hypothetical description of expected behaviour.
