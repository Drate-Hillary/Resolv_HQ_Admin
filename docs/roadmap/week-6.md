# Week 6 — Memory, State and Interoperability

**Brief dates:** 5–9 Oct 2026 | **Status updated 8 Oct 2026:** customer chat memory and internal console memory management are backend-integrated; the four agent tools are exposed over authenticated Streamable HTTP and stdio MCP transports. A real-answer memory trace remains.

## What the brief asks for

- Workflow/session state modeled explicitly.
- One justified persistent-memory use case, with what's stored/why/access/retention/deletion documented.
- Demonstration that memory improves a real task without silently controlling critical decisions.
- One external integration, OR one project capability documented as an MCP-style interface (capability, inputs, outputs, permissions, security boundary).

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Session/workflow state | ✅ | Modeled in Supabase — `ai_conversations`/`ai_messages`, `agent_runs`/`agent_steps`, `requests`/`request_status_history` (per `docs/database-schema.md`). |
| Customer memory persistence and context | ✅ | Customer app facts are server-backed, customer-scoped, individually enabled, and loaded by the authenticated chat route into model context when the customer's master preference is enabled. See [`../memory-design-and-data-handling-note.md`](../memory-design-and-data-handling-note.md). |
| Memory Design & Data Handling Note | ✅ | [`../memory-design-and-data-handling-note.md`](../memory-design-and-data-handling-note.md) documents customer and console data flows, access limits, audit behavior, retention/deletion behavior, guardrails, and remaining production policies. |
| Internal console memory integration | ✅ | Staff can manage their own separate memory and, after explicitly selecting a customer, view/manage that customer's facts and master preference. Staff customer-memory access and mutations are audit logged without recording fact values. Apply the backend migration before deploying this integration. |
| Demonstrated effect on a real task | ✅ | [`../../evidence/traces/week-6-memory-traces.md`](../../evidence/traces/week-6-memory-traces.md): live memory-off and memory-on runs. One pair; approval row not written because the chat route was bypassed. |
| MCP server and interface | ✅ | [`../mcp-style-interface-spec.md`](../mcp-style-interface-spec.md) describes the implemented `/mcp` Streamable HTTP endpoint and stdio process, all four tools' input/output contracts, identity and role scopes, and error behavior. Both transports share handlers and fail closed on tool-registry errors. |

## Action plan

1. ✅ **Customer memory is wired into customer chat.** The backend loads only the authenticated customer's enabled records when their persisted master preference is on; the prompt treats them as untrusted, non-authorizing context. The internal console now uses authenticated backend endpoints for staff-owned and explicitly selected customer memory.
2. ✅ **Write the Memory Design and Data Handling Note.** Completed in [`../memory-design-and-data-handling-note.md`](../memory-design-and-data-handling-note.md), including the difference between current behavior and the intended production controls.
3. **Demonstrate it changing a real answer** — capture one trace where a remembered fact (e.g., a preferred contact channel) visibly affects a drafted escalation, without letting memory alone authorize the escalation (the approval gate still applies).
4. ✅ **Implement and document MCP transports** for the existing tool registry in [`../mcp-style-interface-spec.md`](../mcp-style-interface-spec.md). Streamable HTTP at `/mcp` and stdio use authenticated identities, shared read-only handlers, and the same tool schemas. The spec records that staff request visibility is broader than customer visibility and that draft approval persistence is a separate host action, not part of the MCP draft tool.
5. Week 6 progress report.

## Deliverables checklist

- [x] Backend customer-scoped memory table and read/update/delete API
- [x] Load enabled customer memory into authenticated customer model context
- [x] Persist customer master and per-fact memory controls
- [x] Browser-local console prototype and editable memory UI
- [x] Memory Design and Data Handling Note
- [x] Connect internal console UI to staff/customer memory APIs
- [x] Trace demonstrating memory affecting a real answer
- [x] MCP-style interface specification for the tool registry
- [x] Week 6 progress report ([`../week-6-progress-report.md`](../week-6-progress-report.md))
- [x] State model ([`../state-model.md`](../state-model.md))
- [x] Customer create route (`POST /memory-facts`) and memory/MCP automated tests
- [x] Mobile screen for adding a memory fact
