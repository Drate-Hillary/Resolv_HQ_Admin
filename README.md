# RESOLV-HQ

A Next.js console for a bounded, read-only-tool customer/staff support-request triage assistant — the ReAct-style agent pipeline (model → RAG → tools → agent loop → memory → evaluation → observability → guardrails) built out as a real, navigable UI so every Week 2 deliverable has a working surface to point at, not just a document.

The worked domain is a support-request triage assistant: it can answer questions from an approved knowledge base, look up the caller's own account/request status, and draft an escalation ticket — but it can never issue a refund, change billing or account details, cancel a service, or take any other state-changing action on its own. Those actions always stop for a human (see [Guardrails](#guardrails--boundary-matrix)).

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, `shadcn`/Base UI components
- **State**: Zustand (`src/lib/stores`)
- **HTTP**: Axios client (`src/lib/api/client.ts`) — scaffolded with a bearer-token interceptor; live endpoints are stubbed and commented pending backend availability
- **Icons/animation**: Hugeicons, Framer Motion

## App structure

| Route | Purpose |
|---|---|
| `/chat` | Customer-facing chat — the agent's grounded, cited responses to end users |
| `/admin` | Human escalation queue — ticket list, AI-drafted summary, evidence, approve/reject |
| `/dashboard` | Agent Command Center — live-style stats, recent runs, evaluation snapshot |
| `/agent` | Agent workspace — task chat alongside a step-by-step run timeline and approval gate |
| `/knowledge` | RAG corpus — indexed documents, chunk counts, source provenance, grounded-answer example |
| `/tools` | Tool registry — each tool's inputs/outputs, permission level, approval requirement, failure behaviour |
| `/memory` | Memory records the agent is allowed to recall, with reason, access scope and retention |
| `/evaluations` | Evaluation scenarios by category with pass/block/recover/fail results and latency |
| `/traces` | Per-run trace log — model, prompt version, retrieval, tool calls, approvals |
| `/guardrails` | The AI Boundary Matrix — what the agent may do unsupervised vs. what always needs a human |
| `/settings` | Model configuration, prompt version registry, tool-exposure integration (MCP) |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start with `/dashboard` or `/agent` to see the pipeline; `/chat` and `/admin` are the two end-user-facing surfaces.

## Week 2 deliverables — status

| Deliverable | Status | Where |
|---|---|---|
| Working baseline model interaction | **UI-complete, backend pending.** The full request → retrieval → plan → tool → approval loop is built and navigable end-to-end (`/agent`), but runs are simulated client-side — `console-store.ts` scripts each step's timing rather than calling a live model. `api/client.ts` has the real endpoints stubbed and commented, ready to swap in for the live Claude Sonnet 5 call in Week 3. | `src/lib/stores/console-store.ts`, `src/lib/api/client.ts` |
| Model Selection Note (1 page) | **Done.** Claude Sonnet 5 selected (Haiku 4.5 as a cost-tiered secondary), justified against the RAG + read-only-tool architecture. | [`docs/model-selection-note.md`](docs/model-selection-note.md) |
| Prompt Specification + version history | **Done.** v1.0 (role/task/context/constraints/output format/failure behaviour) and v1.1 (false-premise verification, added after a real evaluation failure). | [`docs/prompt-specification.md`](docs/prompt-specification.md) |
| 10-case prompt evaluation table | **Done.** 10 cases spanning vague intent, unanswerable policy, tool-unavailable, adversarial, unauthorized-action, and multi-issue input, with expected vs. actual behaviour against Prompt Spec v1.0. Drawn from the console's own scenario fixtures (`evalScenarios`, 30 total) plus one new multi-issue case. | [`docs/evaluation-table.md`](docs/evaluation-table.md) · full 30-scenario fixture set at `/evaluations` |
| AI Boundary Matrix / guardrails | **Done.** Ten capability rules enumerated with AI-allowed vs. human-approval-required flags and notes; enforced in the agent workspace (the approval step always blocks). | `src/app/(console)/guardrails/page.tsx`, `src/lib/mock-console.ts` (`guardrails`) |
| Week 2 progress report (1–2 pages) | **Done.** Objectives vs. achievements, key decisions, risks, plan for Week 3. | [`docs/week-2-progress-report.md`](docs/week-2-progress-report.md) |

**Honest read:** all five written deliverables now exist as real documents (`docs/`), each grounded in what's actually in this repo — the model selection reasons about the real architecture, the prompt spec's v1.1 change is traced to an actual evaluation failure, and the eval table reuses the app's own fixture data rather than invented numbers. The one deliverable still genuinely incomplete is the live model connection itself: `api/client.ts`'s endpoints are stubbed, not called, so today's "actual behaviour" column reflects a manual walkthrough against the spec, not a real Sonnet 5 run — that's the top Week 3 priority per the progress report.

## Database

No backend exists yet — everything above runs on in-memory mock data. `supabase/schema.sql` + `supabase/policies.sql` + `supabase/seed.sql` are the Postgres/Supabase schema for all three roles (customer, admin, agent), built directly from this repo's real types and mock fixtures rather than a generic template. See [`docs/database-schema.md`](docs/database-schema.md) for the full gap analysis and run order.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
