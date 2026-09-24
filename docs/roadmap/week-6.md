# Week 6 — Memory, State and Interoperability

**Brief dates:** 5–9 Oct 2026 | **Status today (24 Sept):** the schema exists; the actual memory behaviour doesn't yet.

## What the brief asks for

- Workflow/session state modeled explicitly.
- One justified persistent-memory use case, with what's stored/why/access/retention/deletion documented.
- Demonstration that memory improves a real task without silently controlling critical decisions.
- One external integration, OR one project capability documented as an MCP-style interface (capability, inputs, outputs, permissions, security boundary).

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Session/workflow state | ✅ | Modeled in Supabase — `ai_conversations`/`ai_messages`, `agent_runs`/`agent_steps`, `requests`/`request_status_history` (per `docs/database-schema.md`). |
| Persistent memory mechanism | ⚠️ | `customer_memory_facts` and `agent_memory_records` exist as tables, but `resolv-hq-backend/docs/system-prompt-spec.md` states plainly: *"`customer_memory` exists... but isn't in the assistant's context yet."* The schema is there; the agent doesn't actually read it. This is this week's headline task. |
| Memory Design & Data Handling Note | ❌ | Not written yet. |
| Demonstrated effect on a real task | ❌ | Can't be demonstrated until the wiring above lands. |
| MCP-style interface spec | ❌ | Not written. The four tools in `agent-tools.ts` already have clean input/output schemas (`function-calling-schemas.md`) — documenting them as an MCP-style interface is a writing task, not a build task. |

## Action plan

1. **Wire `customer_memory_facts` into the assistant's context.** Small, contained change: extend whatever loads `knowledge_documents`/`requests` for a caller in `chat.ts`/`ai.ts` to also load that caller's approved memory facts, and add them to the system prompt context per `system-prompt-spec.md` §4's rule 4 (memory is informative, never authorizing an action on its own).
2. **Write the Memory Design and Data Handling Note**: what's stored (customer-approved preference facts — e.g. preferred contact channel, standing notes), why (personalizes routing/answers without re-asking), who can access it (RLS-scoped to the owning customer; staff never see another customer's), retention (kept until the customer removes it via Profile > Saved Information), deletion (customer-initiated, immediate).
3. **Demonstrate it changing a real answer** — capture one trace where a remembered fact (e.g., a preferred contact channel) visibly affects a drafted escalation, without letting memory alone authorize the escalation (the approval gate still applies).
4. **Write the MCP-style interface spec** for the existing tool registry: for each of the four tools, capability, input schema, output schema, permission/authorization model (per-caller scoping already enforced in code), and security boundary (read-only, no cross-customer access, no state mutation). This satisfies the brief's "OR document an MCP-style interface" option without standing up an actual external MCP server.
5. Week 6 progress report.

## Deliverables checklist

- [ ] `customer_memory_facts` actually read by the assistant
- [ ] Memory Design and Data Handling Note
- [ ] Trace demonstrating memory affecting a real answer
- [ ] MCP-style interface specification for the tool registry
- [ ] Week 6 progress report
