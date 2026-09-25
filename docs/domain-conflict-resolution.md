# Domain Conflict Resolution — Implementation Report

**Workstream:** Project/Requirements + Application/Integration | **Date:** 25 Sept 2026 | **Closes:** Week 4 checklist item *"Domain conflict resolved across README + docs + console"* ([`roadmap/week-4.md`](./roadmap/week-4.md), [`roadmap/task-tracker.md`](./roadmap/task-tracker.md))

## The problem

[`brief-alignment-review.md`](./brief-alignment-review.md) found that this project was describing two different use cases at once, in violation of the brief's §2 rule that a proposal solve *one* clearly bounded problem:

- The `resolv-hq` console's README, login page, dashboard copy, knowledge-page example, and every "AI documentation" deliverable (`model-selection-note.md`, `prompt-specification.md`, `evaluation-table.md`) described a **procurement assistant** — inventory lookups, supplier quotation comparisons, purchase requisitions, department budget codes.
- The real backend (`resolv-hq-backend`) and customer app implement a **support-request triage assistant** — knowledge-base grounded answers, account/request status lookups, and escalation-ticket drafting, guarded against ever executing a refund, billing change, cancellation, or account edit.

The procurement framing existed only in a scripted client-side demo (`src/backend/mock-console.ts`'s `buildDemoRun()`) and was never built against the real backend — none of its tools, data, or terminology has any counterpart in `resolv-hq-backend`.

## The decision

Recorded in [`roadmap/README.md`](./roadmap/README.md): the project's single bounded use case is the **Resolv HQ Support Agent** — a customer/staff support-request triage agent (the brief §3 *Utility/service help-desk triage agent* template) — because that is what the backend and customer app already implement. The console was brought in line with it rather than the reverse, since rewriting UI copy and one demo script is far cheaper than rebuilding a schema, tool set, and boundary matrix around procurement.

## What changed

### Console UI and copy (`resolv-hq`)

| File | Change |
|---|---|
| `README.md` | Top domain-description paragraph rewritten: "a bounded, read-only-tool customer/staff support-request triage assistant" that "can answer questions from an approved knowledge base, look up the caller's own account/request status, and draft an escalation ticket" — replacing the procurement/inventory/requisition description. |
| `src/backend/mock-console.ts` | `buildDemoRun()`'s entire scripted scenario rewritten from an inventory/supplier/requisition flow to a login-failure/account-status/escalation-ticket flow, using a real tool name (`account_status_lookup`) and ending in an escalation-ticket approval instead of a purchase requisition. |
| `src/lib/stores/console-store.ts` | The approve/reject result messages no longer hardcode "requisition"/"Kampala Tech Supplies." A new `approvalAction()` helper derives the summary from whatever the current run's approval step actually names, so the store is now domain-agnostic and won't need editing again if the scenario changes. |
| `src/app/auth/login/page.tsx` | Boundary-matrix preview rows and headline copy rewritten to the real guardrails (refund / billing-or-account-change / service-cancellation blocked; escalation-ticket drafting allowed). Also corrected a comment that falsely claimed the rows were "a real excerpt from the seeded boundary matrix (`supabase/seed.sql` → `guardrail_rules`)" — that table does not exist in either repo (confirmed by search); the copy was always hardcoded, and the comment now says so. |
| `src/app/(console)/knowledge/knowledge-view.tsx` | "Example grounded answer" block rewritten from a procurement-policy citation to an account-troubleshooting citation. |
| `src/app/(console)/dashboard/page.tsx` | Subtitle changed from "Monitor the procurement agent's..." to "Monitor the support agent's...". |

### AI documentation (`resolv-hq/docs/`)

| File | Change |
|---|---|
| `model-selection-note.md` | Removed "support/procurement workload," "inventory, supplier data," "department budget codes, supplier names," and the requisition/refund example — replaced with the support-triage equivalents (knowledge-base articles, account/request records, case history). Also fixed dead references to `/guardrails` and `/evaluations` (routes that no longer exist in the codebase — see Known follow-ups) with pointers to the actual files (`docs/ai-boundary-matrix.md`, `docs/evaluation-table.md`). |
| `prompt-specification.md` | Role and constraints rewritten: refunds/billing/cancellations are now stated as things the assistant has *no mechanism* to perform (matching the real backend's `system-prompt-spec.md` §4) rather than things it "drafts... for approval." Drafting is now scoped only to escalation tickets, matching what `draft_escalation_ticket` actually does. Fixed a broken intro reference to `src/lib/mock-console.ts` / `src/lib/mock-data.ts` — neither path exists; the file only exists at `src/backend/mock-console.ts`, and the mock-data file never existed in this repo. |
| `evaluation-table.md` | All 10 scenarios rewritten from procurement cases (printer-toner requisition, supplier-quotation PDF injection, inventory-lookup timeout, purchase-submission attempt) to support-domain equivalents (login-failure troubleshooting, screenshot-embedded injection, `account_status_lookup` timeout, unauthorized ticket-filing/refund attempt), preserving the same category coverage and the same case-5 failure that drives Prompt Spec v1.1. **Also corrected a pre-existing arithmetic error**: the old summary claimed "7/10 fully passed, 2/10 blocked" (11 total against 10 rows); the actual row-by-row split is 5 passed (3 plain + 2 recovered), 3 blocked, 1 failed, 1 partial — corrected in the rewrite. |

## Verification

- `npx tsc --noEmit` in `resolv-hq` — clean, no type errors introduced.
- `grep -rin "procurement|requisition|supplier|quotation|budget code|kampala tech" docs README.md src` from the `resolv-hq` root — zero matches after the changes (was 20+ matches across 7 files before).
- Two files (`src/components/console/approval-card.tsx`, `run-step-detail-sheet.tsx`) use a `UGX`/`en-UG` currency formatter — left as-is; this is generic, reusable UI for any future approval with a monetary amount, not domain-specific leftover, and both already guard on `amount != null` so they simply don't render for the new escalation-ticket scenario (which has no amount).

## Known follow-ups (not in scope for this fix)

- **`README.md`'s "App structure" table is stale beyond the domain issue.** It lists `/memory`, `/evaluations`, `/guardrails`, and `/settings` as routes; none of the four exist in the codebase today (only `/agent`, `/tools`, `/dashboard`, `/traces`, `/providers`, `/knowledge`, `/chat`, `/admin` do). This predates the domain fix and needs a separate pass reconciling the documented route table with the actual `src/app/` structure.
- **`src/app/globals.css` and `src/app/layout.tsx`** show as modified in git status (an Inter → Montserrat font swap) — pre-existing, unrelated to this change, not touched here.

## Result

Checked against `roadmap/task-tracker.md`: **"Domain conflict resolved across README + docs + console" — ✅ Done.** Every file that described the procurement domain (README, console UI copy, and all three AI documentation artifacts) now describes the single approved use case, and the sweep above confirms no procurement-domain language remains anywhere in `resolv-hq`.
