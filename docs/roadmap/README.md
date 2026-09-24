# Roadmap — Getting RESOLV-HQ to a Compliant, On-Time Week 8

**Written:** 24 Sept 2026 (Week 4 of 8) | **Deadline:** 23 Oct 2026 | **Presentations:** 27/29/30 Oct 2026

This folder is the week-by-week execution plan for closing the gaps found in [`../brief-alignment-review.md`](../brief-alignment-review.md) against [`../capstone-project-brief.md`](../capstone-project-brief.md), while staying on the brief's own calendar. Each file (`week-1.md` … `week-8.md`) states what the brief asks for that week, what the repos actually show today, and the concrete work needed to close the gap.

## The one decision everything else depends on

**Adopt a single bounded use case: the "Resolv HQ Support Agent"** — a customer/staff support-request triage agent, closest to the brief's §3 *Utility/service help-desk triage agent* template:

> Grounded knowledge-base Q&A, own-account/request status lookup, and drafting an escalation ticket for human approval — and it never itself executes a refund, billing change, cancellation, or account/credential mutation.

This is not a new build — it's **already what `resolv-hq-backend` and `resolv-hq-customer` implement** (`agent-tools.ts`'s `search_knowledge_base` / `account_status_lookup` / `outage_status_checker` / `draft_escalation_ticket`, the `requests`/`knowledge_documents`/`agent_approvals` schema, the boundary matrix around refunds/billing/cancellations/account edits). The only thing that needs to change is **everything in `resolv-hq/docs/` and `resolv-hq/README.md` that currently describes a procurement assistant instead** (inventory, supplier quotations, purchase requisitions) — that framing exists only in the frontend's scripted demo (`mock-console.ts`) and was never built on the backend. Retire it; don't try to build a second product to match it.

Every week file below assumes this decision has been made. Week 4's file has the concrete first steps (rename/rewrite tasks) since that's the week this needs to happen in.

## How to read the status markers

- ✅ Done — evidence exists in the repo and matches the brief's ask.
- ⚠️ Partial — real work exists but doesn't fully satisfy the brief's ask yet (named gap given).
- ❌ Missing — no artifact found for this ask.

## Index

| Week | Dates | Focus | Net status today |
|---|---|---|---|
| [1](./week-1.md) | 31 Aug–4 Sep | Problem Framing | ❌ Backfill needed — charter, user stories, diagram missing |
| [2](./week-2.md) | 7–11 Sep | Foundation Model & Prompting | ⚠️ Code complete, needs a live key + domain rewrite |
| [3](./week-3.md) | 14–18 Sep | Context Engineering / RAG | ⚠️ Pipeline works, missing register/diagram/15-case eval |
| [4](./week-4.md) | 21–25 Sep (**current**) | Tools & Function Calling | ⚠️ Tools done, catalogue/test-evidence docs need extracting |
| [5](./week-5.md) | 28 Sep–2 Oct | Bounded Agent | ✅ Loop already built early — mostly evidence-capture left |
| [6](./week-6.md) | 5–9 Oct | Memory, State, Interop | ❌ Memory table exists but isn't wired into the agent yet |
| [7](./week-7.md) | 12–16 Oct | Evaluation & Guardrails | ⚠️ Strong guardrails, eval set needs scaling to 30+ |
| [8](./week-8.md) | 19–23 Oct | Hardening & Release | Final report, tagged release, repo/evidence cleanup |

## Standing risks across every week

1. **Git evidence trail.** The outer `RESOLV_HQ` workspace has no commits and the three sub-repos are staged as broken gitlinks (no `.gitmodules`). Since GitHub history is primary grading evidence, fix this before Week 8 — either wire real submodules or document the 3-repo layout explicitly in a top-level README.
2. **No architecture diagram anywhere yet** — the brief asks for one from Week 1 onward, updated each week. Draw it once (Week 1/4 task below) and keep updating the same file rather than starting fresh each week.
3. **Two duplicate/near-duplicate week-2 reports exist** (`resolv-hq/week 2 report.md` at repo root and `resolv-hq/docs/week-2-progress-report.md`) — reconcile into one before a grader finds both.
