# Tool Catalogue — RESOLV-HQ Agent Tools

**Closes:** Week 4's *"Tool Catalogue and tool/API schemas"* deliverable ([brief §7](./capstone-project-brief.md#week-4-21--25-sept-2026-tools-and-function-calling)) | **Source of truth:** `resolv-hq-backend/src/lib/agent-tools.ts` | **Date:** 25 Sept 2026

The narrative behind these tools — what existed before, what changed, why the brief's original tool names don't map 1:1 onto this domain's data model — is in [`function-calling-schemas.md`](./function-calling-schemas.md). This document is the catalogue itself, in the form the brief expects: one entry per tool with its purpose, exact schema, authorization model, and failure behaviour.

All four tools are **read-only** — none of them writes to the database or has any side effect. They are called by the ReAct loop's Act step (`resolv-hq-backend/src/lib/react-agent.ts`) and executed by `executeAgentTool()` (`agent-tools.ts`).

---

## 1. `search_knowledge_base`

**Purpose:** search the published knowledge base for articles relevant to a topic. The model is instructed to use this whenever it needs information to answer, instead of guessing.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "The topic or question to search for." }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

**Output:** plain text — the top 3 matching articles (title + first 500 characters of content), ranked by keyword overlap between the query and each article's title/content. Returns `"No matching knowledge base articles found."` when nothing scores above zero.

**Authorization:** operates only on the `knowledge` array passed in by the caller — the set of *published* knowledge documents already loaded by `chat.ts` for this conversation. There is no argument or code path that lets it reach unpublished/draft/archived documents or another tenant's corpus.

**Failure behaviour:** cannot fail in the traditional sense (no external call, no I/O) — an empty or non-matching query degrades to the "no matching articles" message rather than an error, which the prompt spec requires the model to treat as "the knowledge base doesn't cover this" rather than a reason to guess.

---

## 2. `account_status_lookup`

**Purpose:** look up the caller's own account status — role, active/suspended state, organization, and location. Takes no arguments; it always resolves to the caller, never another customer.

**Input schema**
```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

**Output:** plain text, e.g. `"Role: customer\nStatus: active\nLocation: Kampala, Uganda\nMember since: 2025-01-10"`.

**Authorization:** the tool function itself receives only an `account` object built by `chat.ts`'s `loadAccountInput(userId, role)` — which is documented in-code as *"always the caller's own account, resolved server-side from `req.user`, never client-supplied"* (`resolv-hq-backend/src/routes/chat.ts:16-19`). There is no `userId` or account-selector argument in the tool's own schema at all, so there is no parameter an LLM could manipulate to request someone else's account — the authorization boundary is structural, not a runtime check. See [`tool-failure-auth-test-evidence.md`](./tool-failure-auth-test-evidence.md) for an executed test proving this.

**Failure behaviour:** none of its own — it renders whatever `account` object it's given. If `chat.ts`'s upstream load ever fails, that fails before this tool is ever invoked.

---

## 3. `outage_status_checker`

**Purpose:** check whether the caller has any known open issues (their own unresolved support requests) — answers "is something wrong with my account/service?" before the model guesses. Takes no arguments.

**Input schema**
```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

**Output:** plain text — one line per open request (`"- \"<title>\": <status>"`), or `"No known open issues — nothing currently on file is unresolved."` when the caller has none.

**Authorization:** same pattern as `account_status_lookup` — it only ever sees `activeRequests`, the caller's own requests as loaded server-side by `chat.ts`. No request-ID or customer-ID argument exists in the schema, so there is no way to ask it about a different caller's requests.

**Note on naming:** the brief's own task list names this tool `outage_status_checker`, but there is no literal "outage" concept in this domain's schema (support tickets, not infrastructure incidents). This was flagged and deliberately mapped during implementation (`docs/week-3-iryn.md`, Task 10; `function-calling-schemas.md`) — the tool answers the same underlying question ("is something broken for me right now?") using the closest real signal that exists: the caller's own open requests. A `category` filter parameter was originally added and then removed after testing showed the underlying data (`AiRequestInput`) doesn't carry a category field to filter on — see the test evidence doc for how this was caught.

**Failure behaviour:** none of its own, for the same reason as `account_status_lookup`.

---

## 4. `draft_escalation_ticket`

**Purpose:** prepare a **draft** escalation ticket (title, description, suggested category, suggested priority) for a human to review and file. Explicitly does not create or submit anything — the model is instructed to tell the caller it has *prepared* a draft for review, never that anything has been filed.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "summary": {
      "type": "string",
      "description": "A one-sentence summary of the issue to escalate, based on the conversation so far."
    }
  },
  "required": ["summary"],
  "additionalProperties": false
}
```

**Output:** plain text, always prefixed `"DRAFT (not submitted — a human must review and file this):"`, followed by a title/description/suggested-category/suggested-priority block. Category and priority come from `classifyRequest()` (`resolv-hq-backend/src/lib/classify.ts`), a pure keyword-matching classifier with no side effects.

**Authorization:** this is the one tool that produces an artifact meant to eventually become real (a filed ticket) — which is exactly why it's designed to be inert. It writes nothing to the `requests` table; the only way a draft becomes a real ticket is through the separate, human-operated approval flow (`agent_approvals` + `routes/admin/approvals.ts` + `decideApproval()`), which this tool has no access to and cannot trigger itself.

**Failure behaviour:** if `summary` is missing or empty/whitespace, returns `"Cannot draft a ticket without a summary of the issue."` instead of drafting a hollow ticket — verified directly in [`tool-failure-auth-test-evidence.md`](./tool-failure-auth-test-evidence.md), Case 1. (The schema already marks `summary` as `required`, so this is a defense-in-depth check for the case where a tool call arrives without it in practice.)

---

## Schema strictness — verified across all four

Every tool declares `additionalProperties: false` and an explicit `required` array — the definition of "strict" for JSON-Schema function calling, meaning a model cannot pass an undeclared argument and every optional-vs-mandatory input is explicit. Confirmed by direct inspection of `AGENT_TOOL_DEFINITIONS` (see the test evidence doc's Case 5 for the executed proof):

| Tool | Required | Additional properties |
|---|---|---|
| `search_knowledge_base` | `["query"]` | `false` |
| `account_status_lookup` | `[]` | `false` |
| `outage_status_checker` | `[]` | `false` |
| `draft_escalation_ticket` | `["summary"]` | `false` |

## Risk / approval classification

| Tool | Risk | Human approval required? |
|---|---|---|
| `search_knowledge_base` | None — read-only, published data only | No — AI unsupervised |
| `account_status_lookup` | None — read-only, caller's own data only | No — AI unsupervised |
| `outage_status_checker` | None — read-only, caller's own data only | No — AI unsupervised |
| `draft_escalation_ticket` | Low — produces a draft only | **Yes**, before the draft becomes a filed ticket (`agent_approvals` queue) |

This matches the boundary matrix in [`ai-boundary-matrix.md`](./ai-boundary-matrix.md) and the login page's boundary-matrix preview (`resolv-hq/src/app/auth/login/page.tsx`).
