# Agent Task Contract — RESOLV-HQ Support Assistant

**Week 5 — Agent Architecture and Bounded Autonomy** 

This is the single, formal statement of what the agent is for, what it may use, what it operates on, how far it may go, and when it must stop. It consolidates content previously spread across [`react-loop-core.md`](./react-loop-core.md), [`ai-boundary-matrix.md`](./ai-boundary-matrix.md) and [`tool-catalogue.md`](./tool-catalogue.md); where those documents and this one differ, this contract is authoritative. Implementation: `resolv-hq-backend/src/lib/react-agent.ts` (`runReActLoop()`), called from `generateAssistantReply()` in `src/lib/ai.ts`.

## 1. Goal

> **Resolve or route a customer support query without ever executing a state-changing action itself.**

The agent answers from the published knowledge base and the caller's own account/request data, and, when a human must act, prepares a *draft* for review. It never claims to have done something it has not.

**Why this task needs a multi-step loop:** a single support question often needs more than one lookup (for example, "is my login problem already known?" needs the caller's open requests, then a knowledge-base search, then possibly an escalation draft). The model chooses which approved action comes next based on what the previous one returned, rather than following a fixed script.

## 2. Approved tools (closed set)

The agent can call only these four. Anything else the model names returns `Unknown tool "<name>"` and nothing runs. All schemas use `additionalProperties: false` with an explicit `required` array; full schemas and failure behaviour are in [`tool-catalogue.md`](./tool-catalogue.md).

| Tool | Reads / produces | Risk | Human approval |
|---|---|---|---|
| `search_knowledge_base(query)` | Top 3 published knowledge passages | Read-only | No |
| `account_status_lookup()` | Caller's own role, status, org, location | Read-only | No |
| `outage_status_checker()` | Caller's own unresolved requests | Read-only | No |
| `draft_escalation_ticket(summary, keyFacts?, suggestedAction?)` | A structured **draft** only; writes nothing | Low | **Yes** — becomes a real ticket only via `agent_approvals` + `decideApproval()` |

## 3. State the agent operates on

- The conversation: system prompt (`SYSTEM_PROMPT_VERSION = "v1.1"`), the caller's message, and the loop's own assistant/tool messages for this turn.
- Pre-loaded, **caller-scoped** context built before the loop starts: published `knowledge_documents` passages, the caller's own `requests`, and the caller's own account row. All are resolved from the authenticated `req.user.id`, never from a client-supplied identifier.
- No tool accepts a customer/account selector argument, so no tool call can reach another caller's data (executed proof: [`tool-failure-auth-test-evidence.md`](./tool-failure-auth-test-evidence.md), Case 2).
- **Persistent memory (Week 6):** for customer callers only, the backend also loads that customer's enabled `customer_memory` facts, and only if their `memory_enabled` master switch is on. They are bounded by `CUSTOMER_MEMORY_CONTEXT_BUDGET_CHARS`, placed in the prompt as untrusted context, and never authorize an action or bypass the approval gate. Staff callers get none. See [`state-model.md`](./state-model.md).
- State lives only for the turn; the loop keeps no hidden memory between turns.

## 4. Limits

| Limit | Value | Where enforced |
|---|---|---|
| Max Plan→Act→Observe iterations per turn | **4** (`MAX_ITERATIONS`) | `react-agent.ts` |
| Tools executable | The four above, nothing else | `executeAgentTool()` switch + `default` branch |
| Side effects | None. Every tool is pure/read-only; the draft tool writes nothing | `agent-tools.ts` |
| Data reach | The caller's own data only | Per-caller loaders in `chat.ts`/`ai.ts` |
| Claims of completed actions | Forbidden: refunds, cancellations, account/credential changes, data export/deletion | Prompt rule 2 **and** deterministic `detectBoundaryViolation()` on the output |
| Malformed tool arguments | Not executed; error returned to the model to retry (consumes an iteration) | `react-agent.ts` (`argumentsParseError`) |
| Provider failure | Retry with backoff, then next provider, then keyword fallback | `llm/gateway.ts`, `generateAssistantReply()` |

## 5. Loop design

| Phase | What happens | Code |
|---|---|---|
| **Sense** | Build context: prompt + query + caller-scoped data | `ai.ts` before entering the loop |
| **Plan** | Model decides (native tool-calling): answer now, or call a tool | `completeWithFallback(messages, AGENT_TOOL_DEFINITIONS)` |
| **Act** | Loop executes the requested approved tool | `executeAgentTool()` |
| **Observe** | Tool result appended as a `tool` message; back to Plan | `messages.push({role:"tool", …})` |
| **Respond** | Plain-content answer ends the loop; boundary check runs on it | `detectBoundaryViolation()` in `ai.ts` |

## 6. Stop conditions

The loop ends when **any** of these occur:

1. **Normal completion:** the model returns content with no tool calls → that is the answer.
2. **Iteration cap:** 4 cycles used without a final answer → return the safe message *"I wasn't able to work through this fully — could you rephrase your question, or would you like me to open a support request instead?"*
3. **Boundary violation detected:** the final text matches an active `boundary_rules` pattern (fabricated refund/cancellation/account change/deletion) → the model's text is discarded and replaced by that rule's safe fallback; a warning is logged.
4. **Gateway unavailable:** no provider can answer after retries → deterministic keyword fallback (`answerQuestion()`), with `fallbackReason` recorded.
5. **Clarification gate (before the loop):** a vague query gets one targeted clarifying question and the loop is never entered.

## 7. Human hand-off and approval conditions

The agent hands off to a person when:

- the caller needs something only a human can do (refund, cancellation, account change, deletion, anything state-changing) → the agent calls `draft_escalation_ticket`, tells the caller it has been **prepared for review, never filed**, and `chat.ts` persists the draft as an `agent_approvals` row;
- the answer is not grounded in the knowledge base, or the iteration cap is hit → the agent offers to open a support request;
- a boundary violation is caught → the safe fallback offers a request that "a person reviews and carries out".

Staff then approve or reject through the approval queue; the decision is recorded in `admin_activity_logs`. The agent has no access to `decideApproval()` and cannot trigger it.

## 8. Caller parity (customer vs. staff)

The loop behaves identically for customers and staff. `buildSystemPrompt()` adds exactly one sentence for a staff caller (they are previewing the assistant; "every rule above still applies unchanged"). The tool set, `MAX_ITERATIONS`, boundary matrix, scoping to `req.user.id`, and the approval requirement are the same in both cases. A staff caller does **not** gain the ability to make the agent perform state-changing actions. This is confirmed by reading the code path (`system-prompt.ts` lines 23–32; `react-agent.ts` takes no role parameter). A live side-by-side run was attempted but could not complete; see [`evidence/traces/week-5-execution-traces.md`](../evidence/traces/week-5-execution-traces.md).

## 9. Known gaps against this contract (stated honestly)

- Iteration-cap and boundary-violation behaviour are verified by code reading and the offline boundary smoke tests ([`ai-boundary-matrix.md`](./ai-boundary-matrix.md)), **not yet by a live-model trace**.
- Whether 4 is the right ceiling is untested against a live model's real tool-use behaviour.
- The boundary detector is a deliberately narrow set of first-person patterns; paraphrases can slip past it.
