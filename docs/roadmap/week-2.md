# Week 2 — Foundation-Model Engineering and Prompting

**Brief dates:** 7–11 Sept 2026 | **Status today (24 Sept):** further along in code than the docs admit — closer to done than it looks.

## What the brief asks for

- An accessible model chosen and documented (capability, cost, latency, privacy, access).
- Model integrated into the application.
- Prompt Specification v1.0 (role, task, context, constraints, output format, failure behaviour).
- At least 10 test cases, expected vs. actual.
- At least two versioned, meaningful prompt iterations.

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Model chosen + documented | ✅ | `docs/model-selection-note.md` recommends Claude Sonnet 5 (+ Haiku 4.5 for low-stakes paths), with capability/cost/latency/privacy/access all covered. Solid note — only needs its procurement-flavored line ("support/procurement workload") edited to match the single chosen domain. |
| Model integrated into the app | ⚠️ | The plumbing is actually **done**: `resolv-hq-backend/src/lib/llm/gateway.ts`'s `completeWithFallback()`, real `providers/anthropic.ts` and `providers/openai.ts` clients, retry-with-backoff (`retry.ts`), Redis caching, and `generateAssistantReply()` wired into `routes/chat.ts` (see commits "Add support for multiple AI providers", "Implement rate limiting and caching with Redis", and `docs/model-abstraction-and-rate-limiting.md`). **The only missing piece is registering one real provider API key** via the `/providers` admin page and confirming a live call actually returns a model response instead of falling back to `answerQuestion()`'s keyword matching. This is a same-day task, not a build task. |
| Prompt Specification v1.0 | ⚠️ | `docs/prompt-specification.md` exists with role/task/context/constraints/output/failure sections — well structured — but it's written entirely in procurement language ("procurement, order, and account questions," "purchase requisition," "refund threshold"). Needs a straight rewrite into the support-agent domain, keeping the structure. |
| 10-case evaluation table | ⚠️ | `docs/evaluation-table.md` has exactly 10 cases across the right categories (normal, edge, incorrect-info, adversarial, tool-unavailable, unauthorized, multi-issue) — good category coverage — but every scenario is procurement (printer toner, approval thresholds, supplier quotation PDFs) and is evaluated against the **scripted frontend mock**, not the real backend. Needs re-running against the real domain and, once the live key is registered, against the real model. |
| ≥2 versioned prompt iterations | ✅ | `prompt-specification.md` already documents v1.0 → v1.1 (driven by eval case 5's failure) — good practice, keep it going. |
| Week 2 progress report | ⚠️ | Exists twice: `resolv-hq/week 2 report.md` (repo root) and `resolv-hq/docs/week-2-progress-report.md`. Reconcile into one canonical file before this becomes a "which one is real" question during grading. |

## Action plan

1. **Register a real Claude Sonnet 5 API key** on the `/providers` admin page in a dev/test environment (never commit it — `.env.example` already documents the shape).
2. **Send one real message through `/chat`** and confirm the response's `providerName`/`model` reflect a live Anthropic call, not the keyword fallback. Capture this as a screenshot or saved trace — this is the single piece of evidence that actually closes the Week 2 gap, and every later week (RAG grounding, agent loop, evaluation) depends on a real model existing to test against.
3. **Rewrite `model-selection-note.md`, `prompt-specification.md`, and `evaluation-table.md`** to reference the single chosen domain (support-request triage) and the real tool names (`search_knowledge_base`, `account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket`) instead of procurement/requisition language.
4. **Re-run the 10 evaluation cases** against the real domain and, once step 2 lands, the real model — update "Actual behaviour" from scripted-pipeline output to real traced output.
5. **Merge the two Week 2 report files** into one canonical `docs/week-2-progress-report.md`, delete or archive the root-level duplicate.

## Deliverables checklist

- [ ] Live model call confirmed end-to-end (not just plumbing)
- [ ] Model Selection Note rewritten for the correct domain
- [ ] Prompt Specification v1.0 rewritten for the correct domain
- [ ] 10-case evaluation table re-run against real domain + real model
- [ ] Duplicate Week 2 report resolved
