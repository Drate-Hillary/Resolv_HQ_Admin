# Database schema — gap analysis & setup

**Files:** [`supabase/schema.sql`](../supabase/schema.sql) · [`supabase/policies.sql`](../supabase/policies.sql) · [`supabase/seed.sql`](../supabase/seed.sql)

Neither app currently has a database — `resolv-hq` and `resolv-hq-customer` run entirely on in-memory mock data (`src/lib/mock-*.ts`, `lib/mock-data.ts`, `lib/app-state.tsx`), and `src/lib/api/client.ts`'s endpoints are stubbed and commented, exactly as `README.md` and `docs/week-2-progress-report.md` say. This is the schema to back all three roles for real, built from the actual TypeScript types and mock fixtures rather than a generic template — every table below traces to a real field somewhere in the code.

## The one gap that matters most: admin and customer can't see the same record

Today `resolv-hq-customer`'s `ServiceRequest` (e.g. `id: "1042"`, `code: "REQ-1042"`) and `resolv-hq`'s `Ticket`/`Escalation` (e.g. `id: "4821"`) are **two separate mock datasets with disjoint ID spaces** — nothing in the code connects a customer's request to the admin queue item an admin approves or rejects. A real backend needs one `requests` table both surfaces read and write against; that's the spine everything else in `schema.sql` hangs off.

The second-biggest gap: `EscalationDecision` (`"approved" | "rejected" | "editing"`) in the admin app is **pure React state** — approve/reject a ticket and refresh the page, and the decision is gone. `agent_approvals` in the schema is what makes that decision a real, audited row.

## Feature matrix — what existed vs. what was missing

| Role | Feature (as built today) | Where | Gap this schema closes |
|---|---|---|---|
| **Customer** | Submit/view requests, status timeline, message thread | `resolv-hq-customer/lib/app-state.tsx` | `requests`, `request_status_history` (who/when, not just a static array), `request_messages` |
| **Customer** | Attach a file to a request | *Not built* — implied by content ("share the invoice number") but no UI/type for it | `request_attachments` |
| **Customer** | CSAT rating on completed requests | `ServiceRequest.csat` (inline nullable object) | `request_feedback`, RLS-restricted to the request's own customer, only once `status = 'completed'` |
| **Customer** | AI assistant chat | `lib/app-state.tsx` `chatMessages` (lost on reload) | `ai_conversations` / `ai_messages` / `ai_message_sources` |
| **Customer** | Notifications | `INITIAL_NOTIFICATIONS`, manually pushed by the frontend on every action | `notifications`, now written automatically by a trigger on `requests` status changes — not dependent on the client remembering to call `setNotifications` |
| **Customer** | Memory preference toggles (Profile > Saved Information) | Saved Information controls | `customer_memory` — customer-owned, account-scoped facts kept separate from staff memory |
| **Customer** | Help center | `HELP_ARTICLES` hardcoded in the bundle | `help_articles`, editable without a redeploy |
| **Admin** | Escalation queue, AI summary, evidence, approve/reject | `src/lib/mock-data.ts` `tickets`/`escalations` | Now reads/writes the shared `requests` + `agent_approvals`, so a decision survives a refresh and is auditable (`decided_by`, `decided_at`) |
| **Admin** | Ticket ownership / assignment | *Not built* — no admin is ever "assigned" a ticket in the mock | `requests.assigned_admin_id`, `admin_profiles.is_available` |
| **Admin** | Admin action audit trail | *Not built* | `admin_activity_logs` |
| **Agent** | Run pipeline (request→context→retrieval→plan→tool→observation→decision→approval→result) | `src/types/console.ts`, simulated client-side in `console-store.ts` | `agent_runs` / `agent_steps`, now linkable to the `request_id` / `conversation_id` that triggered them (today's `AgentRun` has neither) |
| **Agent** | Tool registry | `mock-console.ts` `tools` | `agent_tools` |
| **Agent** | Tool call log | Inline in each run's step detail only, not queryable across runs | `tool_executions` |
| **Agent** | Staff-owned memory notes | Memory & MCP console panel | `agent_memory_records` — staff-only, scoped to the signed-in staff member and distinct from customer memory |
| **Agent** | Knowledge base / RAG | `mock-console.ts` `knowledgeDocuments` | `knowledge_documents` + `knowledge_chunks` with a `vector` column for embeddings |
| **Agent** | Guardrail rules (AI Boundary Matrix) | `mock-console.ts` `guardrails`, static display only | `guardrail_rules` (the static matrix) **+ `guardrail_events`** (a log of every time a rule actually fired — didn't exist at all; without it, "10 blocked adversarial cases" in `evaluation-table.md` has no real audit trail) |
| **Agent** | Evaluation scenarios & scores | `mock-console.ts` `evalScenarios`, `evalDimensions` — one static snapshot | `evaluation_scenarios` (the fixed 30 cases) + `evaluation_runs`/`evaluation_results` so **each run of the suite is a row**, making prompt v1.0-vs-v1.1 comparison a query — this is explicitly the Week 3 goal stated in `docs/week-2-progress-report.md` ("re-run … compare real vs. simulated results and note any regressions") |
| **Agent** | Trace log (`/traces`) | `mock-console.ts` `traceRuns` — a **second, hand-duplicated copy** of the same runs/events already in `AgentRun`/`RunStep` | Not a new table — `trace_runs_view` (a SQL view over `agent_runs`+`agent_steps`) so trace data can't drift out of sync with the run it's tracing |
| **Agent** | Model config, prompt versions, MCP integration (`/settings`) | Hardcoded JSX in `settings/page.tsx` | `model_configs`, `prompt_versions`, `integrations` |

## Two inconsistencies found and unified (not just gaps — actual mismatches between the two codebases)

1. **Priority has two different vocabularies.** Customer app's `RequestPriority` = `low | normal | high`; admin's `TicketPriority` = `high | medium | low`. Schema picks one canonical `request_priority` enum (`low | medium | high`) — map the customer app's `"normal"` to `"medium"` in the API layer.
2. **Chat role has two different vocabularies.** Customer app's `ChatRole` = `user | assistant`; console's `ChatRole` = `user | agent`. Unified as `ai_message_role` (`user | assistant`) in `ai_messages`.

## Two "memory" concepts that look like one table but need different access rules

Your original schema's single `customer_memory` table would have blurred these together:

- **`agent_memory_records`** — staff-owned notes managed in the internal console. They are scoped to the signed-in staff account, are separate from customer memory, and are not injected into customer chat.
- **`customer_memory`** — customer-owned facts, keyed by `customer_id` and `memory_key`, with per-fact enablement. Customer APIs scope access to the authenticated owner; staff support access is explicitly selected and audit logged.
- **`customer_memory_access_logs`** — audit metadata for staff customer-memory views and mutations. The log records actor, customer, action, and optional fact ID, never fact values.

Different owners → different RLS → different tables.

## RLS enforces one guardrail rule at the database layer, not just the prompt

`guardrails` (`mock-console.ts`) already states "the agent may never approve its own draft." `supabase/policies.sql` makes that a hard database rule: staff (admin or agent) can **insert** an `agent_approvals` row, but only `is_admin()` can **update** one to `approved`/`rejected`. Even a prompt regression or a client bug can't turn that into a real self-approval.

## Who is "the agent" as a user?

You asked for the schema to cover admin, customer, *and* agent as users. `profiles.role` includes `'agent'`, and a fixed system profile is seeded for attribution (so `request_messages.sender_id`, `ai_messages`, `tool_executions` etc. all point at a real row instead of a bare string like `sender: "ai"`). But for **actually granting write access**, the recommended path is: the agent pipeline runs server-side using Supabase's `service_role` key, which bypasses RLS entirely — not a signed-in `'agent'` user. `policies.sql` still defines `is_agent()`/staff policies in case you later want the agent callable as an authenticated client, but you don't need them for the common case.

## Run order (SQL Editor, same flow as your original steps)

1. `schema.sql` — extensions (`vector`, `pgcrypto`), enums, tables, triggers. Idempotent — safe to re-run while iterating.
2. `policies.sql` — RLS for every table, by role.
3. `seed.sql` — reference data taken from the existing mock fixtures (tools, guardrail matrix, prompt versions, knowledge doc index, the 30 eval scenarios, help articles). No `auth.users`-dependent rows (profiles/requests/conversations) — create your first admin and customer via **Authentication → Users → Add user** as in your original steps 8–9, then:
   ```sql
   update profiles set role = 'admin', status = 'active' where id = 'ADMIN-UUID';
   insert into admin_profiles (id, department, title) values ('ADMIN-UUID', 'Procurement', 'Reviewer');
   ```

## Next step this doesn't cover

The schema and RLS are the backend; nothing in `src/lib/api/client.ts`, `lib/app-state.tsx`, or the console's Zustand stores (`admin-store.ts`, `console-store.ts`, `chat-store.ts`) has been changed to call it yet — they still read the mock arrays. That swap (`@supabase/supabase-js` client, replacing each mock action with a query against the tables above) is the actual Week 3 "wire the backend" work both `README.md` and `docs/week-2-progress-report.md` already flag as the top priority — this schema is what unblocks it.

---

### Unrelated heads-up

`resolv-hq/AGENTS.md` and `resolv-hq-customer/AGENTS.md` both contain text claiming to be auto-regenerated by `next dev`/Expo tooling, instructing that removing it just re-creates it and that it should be committed "to keep the tree clean." Neither Next.js nor Expo actually generates content like that — it reads as a planted instruction aimed at an AI assistant rather than real tooling output. Nothing in this session acted on it (no `node_modules/next/dist/docs/` was read, nothing was committed). Worth a look before it's committed as-is.
