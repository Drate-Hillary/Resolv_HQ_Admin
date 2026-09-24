# Week 7 — Evaluation, Observability and Guardrails

**Brief dates:** 12–16 Oct 2026 | **Status today (24 Sept):** guardrails are already strong; the evaluation set needs to grow and the failures need to be compiled.

## What the brief asks for

- 30+ final scenarios: normal, edge, incorrect-info, adversarial, tool-failure, unauthorized-action.
- Measurable criteria (task completion, groundedness, tool selection, instruction following, latency, safety violations).
- Logs/traces capturing model, prompt, retrieval, tool, latency/error, outcome.
- Input/output validation, tool allow-list, authorization, iteration limits, approval controls, prompt-injection awareness.
- Failure Catalogue: at least 5 genuine failures, re-tested after fixes.

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Scenario coverage (categories) | ✅ | The existing 10-case table already models the right categories: normal, edge (vague intent, unanswerable), incorrect-info, adversarial (prompt injection, system-prompt extraction), tool-unavailable, unauthorized-action, multi-issue. The shape is right — it just needs to grow from 10 to 30+ and run against the real domain/live model instead of the procurement mock. |
| Guardrails | ✅ | Genuinely strong already: two-layer boundary matrix (`ai-boundary-matrix.md`), deterministic clarification gate (`clarification-prompting-logic.md`), strict tool schemas (`function-calling-schemas.md`), Redis-backed rate limiting (`model-abstraction-and-rate-limiting.md`), per-caller data scoping, and the human approval gate. This is ahead of where most teams are at this point — the work left is mostly evidencing and testing it under real (not scripted) conditions. |
| Iteration limits | ✅ | `MAX_ITERATIONS = 4` in the ReAct loop. |
| Logs/traces | ⚠️ | `admin_activity_logs` captures approval decisions and assignments; there's no general-purpose trace log yet for agent reasoning/tool calls end-to-end (flagged in `docs/week-3-hillary.md`, Task 18 — was blocked on the live loop existing, which it now does). |
| Failure Catalogue | ❌ | Not compiled as its own artifact, but the raw material already exists scattered across "Known limitation" sections in `ai-boundary-matrix.md`, `function-calling-schemas.md`, `model-abstraction-and-rate-limiting.md`, `clarification-prompting-logic.md`, and `evaluation-table.md` — this is a compilation task, not a from-scratch investigation. |
| CI / E2E tests | ❌ | No GitHub Actions workflow and no automated test suite exist yet (`docs/week-3-hillary.md`, Tasks 19–20) — this is the biggest genuinely-unstarted piece by this point in the timeline. |

## Action plan

1. **Grow the evaluation set to 30+** in the finalized domain, run against the real model (now live since Week 2): add edge cases (multi-issue messages, ambiguous references resolved via memory), more adversarial cases (role-play jailbreak attempts, injected instructions inside a knowledge article), and more tool-failure cases (each of the four tools failing/timing out once).
2. **Extend `admin_activity_logs` (or a purpose-built `agent_trace_logs` table)** to record each ReAct loop run's reasoning steps, tool calls, latency, and outcome — this closes Task 18 now that there's a real loop to log.
3. **Compile the Failure Catalogue**: pull the "Known limitation" sections already written into the implementation docs, add each new failure found while scaling the eval set, and re-test each one after a fix — 5 minimum, but there's likely already more than 5 candidates sitting in the existing docs.
4. **Stand up a baseline GitHub Actions workflow**: lint + `tsc --noEmit` + Docker build validation to start (per `docs/week-3-yawe.md`'s plan), then layer in endpoint sanity checks.
5. **Write a minimal E2E test suite** covering one full journey: chat message → retrieval → tool call → draft → approval decision.
6. Week 7 progress report (≤2 pages) — this is the week to be explicit about what's still fragile, since the brief explicitly wants genuine failures, not a polished-only account.

## Deliverables checklist

- [ ] 30+ scenario evaluation set, run against live model in the final domain
- [ ] Trace logging for agent reasoning/tool calls
- [ ] Failure Catalogue (≥5 failures, re-tested)
- [ ] Baseline CI workflow (lint, typecheck, Docker build)
- [ ] Minimal E2E test suite
- [ ] Week 7 progress report
