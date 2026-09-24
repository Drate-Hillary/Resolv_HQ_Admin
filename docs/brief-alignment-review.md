# Brief Alignment Review — RESOLV-HQ vs. the BSE4104 Capstone Brief

**Date:** 24 Sept 2026 | **Reviewed against:** [`capstone-project-brief.md`](./capstone-project-brief.md) ("Group H.txt") | **Calendar position:** Week 4 of 8 (Tools and Function Calling, 21–25 Sept 2026)

This reviews the brief against the actual state of the three repositories (`resolv-hq` console, `resolv-hq-backend`, `resolv-hq-customer`) — not against what the docs *claim* is built, but what the code shows.

## Headline finding: the project is describing two different use cases at once

The brief requires **one** clearly bounded workflow (§2, §3) — a chat surface alone isn't enough, but neither is switching domains between repos. Right now this project has two, and they don't match:

**A. The `resolv-hq` console's stated domain is procurement.** Its `README.md` says outright: *"The worked domain is a university department's procurement assistant: it can look up inventory, compare supplier quotations, search policy documents, and draft a requisition."* This is the **SME procurement-preparation agent** use case from §3. It's fully fleshed out — `src/backend/mock-console.ts` scripts an inventory-check → quotation-comparison → requisition-draft flow with a "budget code CS-OPEX-2026," `docs/model-selection-note.md` justifies Claude Sonnet 5 for "a support/procurement workload," and `docs/evaluation-table.md`'s 10 test cases are entirely procurement scenarios (printer toner requisitions, approval thresholds, supplier quotation PDFs).

**B. The real backend and customer app implement a support-ticket/help-desk domain.** `resolv-hq-backend`'s actual agent (`src/lib/react-agent.ts`, `src/lib/agent-tools.ts`) has tools named `search_knowledge_base`, `account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket` — grounded in customer `requests`, `profiles`, and `knowledge_documents` tables. Its boundary matrix (`docs/ai-boundary-matrix.md`) exists to stop the model claiming it processed a **refund, billing change, cancellation, or account edit** — none of which are procurement concepts. This is much closer to the **Utility/service help-desk triage agent** use case from §3 (knowledge-base troubleshooting, a status-check tool, ticket creation/routing), though it has drifted to include billing/refunds, which that use case's boundary line doesn't mention at all.

**Consequence:** everything in `resolv-hq/docs/` that documents the "AI" (model selection note, prompt specification, evaluation table) is written against the procurement fiction that only exists in the frontend's scripted mock (`mock-console.ts`), not against the domain the backend team is actually building. A grader reading the console README and then the backend code will reasonably conclude two different projects were merged. This needs to be resolved before Week 5 — pick one, and it should be the one the backend already reflects, since re-pointing the console's copy/mock data is far cheaper than re-doing the backend's schema, tools, and boundary matrix around procurement.

**Recommended fix:** decide the single approved use case (help-desk/service-request triage is closest to what's built and matches a §3 entry), then:
1. Rewrite `resolv-hq/README.md`'s domain description to match.
2. Replace `mock-console.ts`'s procurement script with a scenario consistent with the real tools (`account_status_lookup`, `outage_status_checker`/request-status, `draft_escalation_ticket`).
3. Revise `model-selection-note.md`, `prompt-specification.md`, and `evaluation-table.md` so their scenarios reference real tool names and the real domain, not requisitions and supplier quotations.
4. If billing/refunds are meant to stay in scope, note that explicitly — the closest §3 template (utility help-desk) doesn't cover billing, so the group should either narrow scope to match a listed use case or write the justification for the variant, since §2 requires the proposal map to one clearly bounded problem.

## Where the engineering scope genuinely matches the brief

Setting the domain confusion aside, the *pipeline* being built matches §4's minimum scope well, and in a couple of places is ahead of schedule:

- **Boundary matrix, done properly (§1, §6):** `ai-boundary-matrix.md` describes two enforcement layers — a system-prompt rule and a deterministic regex backstop (`detectBoundaryViolation()`) that catches the model even if it ignores the prompt. That's stronger than the brief asks for at this stage and is good evidence for the Week 7 guardrails deliverable.
- **Tool schemas are strict (Week 4, §7):** all four tools in `agent-tools.ts` declare `additionalProperties: false` and explicit `required` arrays — exactly what "strict JSON schema" tool definitions require, and this is Week 4's own focus week.
- **Agent loop implemented early (Week 5 content, done in Week 4):** `react-agent.ts`'s `runReActLoop()` — Sense → Plan → Act → Observe → Respond, with a `MAX_ITERATIONS` cap — is genuinely Week 5's deliverable, already working ahead of the Week 5 window (28 Sept–2 Oct). Worth calling out as a strength in the Week 4 report rather than letting it go unremarked.
- **Not "just a chatbot":** the tool-calling + human-approval-queue (`agent_approvals`, admin console) satisfies §2's proposal rule that the system do more than generate text.

## Gaps against the brief's own Week 2–4 minimums

- **"Working baseline model interaction" (Week 2, §7) is not actually met yet.** `docs/system-prompt-spec.md` states plainly: *"no provider API key registered/exercised yet"* — the assistant falls back to deterministic keyword matching (`answerQuestion()`), not a live model call. `evaluation-table.md` confirms its 10 cases are "traced behaviour of the scripted agent pipeline... not yet a live model run." This is the single most load-bearing open item: RAG, tools, the agent loop, and the boundary matrix are all built *around* a model call that doesn't exist yet. Wiring one real provider call end-to-end should be the top priority this week — it's a Week 2 deliverable still outstanding in Week 4.
- **No Week 1 Project Charter or user stories found in either repo.** The brief requires these as Week 1 evidence (§7). They may exist in ClickUp/MUELE outside the repo, but nothing under `docs/` or the repo root matches — worth confirming they're filed somewhere with a link, since "Primary Evidence" for the course is GitHub + ClickUp + MUELE together.
- **SSE/streaming and error boundaries are explicitly flagged as not started** in `docs/week-3-iryn.md` (Tasks 7–8) — not a brief requirement by name, but they block the "working baseline model interaction" item above, since a real model call needs a failure path in the UI.
- **Task 9 and 10 from the internal Week 3 task breakdown were scoped against a "mock DB / CSV" and literal `outage_status_checker` framing that doesn't match the real Supabase schema** — already caught and resolved sensibly in `function-calling-schemas.md` by mapping to the real domain model, but it's the same domain-mismatch pattern as the headline finding above, just caught locally instead of at the product level.

## Repository/evidence housekeeping

- The top-level `RESOLV_HQ` repo has **no commits yet** and the three sub-projects (`resolv-hq`, `resolv-hq-backend`, `resolv-hq-customer`) are staged as gitlinks with no `.gitmodules` file — i.e., not functioning submodules. Since "Primary Evidence" for grading is GitHub history, this is worth fixing before it's time to point a grader at commit history across the three repos.
- The brief's recommended structure separates `docs/requirements/`, `docs/architecture/`, `docs/weekly-reports/`, `docs/evaluation/`, plus a top-level `evidence/traces|screenshots|demo/`. Current docs are a flat list of report-style files in `resolv-hq/docs/`. Not required, but worth adopting before Week 7–8 when the evaluation/evidence pack becomes a graded deliverable — it'll be easier to point a grader at `evidence/traces/` than to a mixed folder of reports and specs.

## Summary

| Area | Status |
|---|---|
| Single bounded use case (§2, §3) | ❌ **Two conflicting domains** — procurement (console/docs) vs. help-desk/ticketing (backend/customer app). Fix before Week 5. |
| Boundary matrix / guardrails | ✅ Strong — two-layer enforcement, ahead of the Week 7 ask. |
| Tools/function calling (Week 4) | ✅ Four strict-schema, read-only tools; matches this week's focus. |
| Bounded agent loop (Week 5) | ✅ Already implemented, one week early. |
| Foundation model integration (Week 2) | ❌ **Not live yet** — no provider API key exercised; still keyword-fallback. |
| Week 1 evidence (charter, user stories) | ⚠️ Not found in either repo — verify it exists in ClickUp/MUELE. |
| Git evidence trail | ⚠️ Top-level repo has no commits; nested repos aren't real submodules. |

**Bottom line:** the *engineering shape* of the project (model → RAG → tools → agent → memory → evaluation → guardrails, with a two-layer boundary matrix) matches what the brief wants, and parts of it are ahead of schedule. The thing to fix immediately is that the product doesn't agree with itself about what it *is* — and until a single use case is picked and every doc/mock/README reflects it, the Week 2 "working baseline model interaction" item can't be honestly marked done, because there's no live model answering questions in either domain yet.
