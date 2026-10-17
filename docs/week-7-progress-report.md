# Week 7 Progress Report — RESOLV-HQ

**Group/project:** RESOLV-HQ | **Author:** Hillary (Project Lead) | **Week ending:** 16 Oct 2026 | **Focus:** Evaluation, Observability and Guardrails

## Summary

Persistent trace logging works and is verified on live Gemini runs. The guardrails are implemented and 32 of 32 automated tests pass. A nine-entry Failure Catalogue is compiled. The 34-scenario evaluation set is defined, but **only 9 scenarios have a recorded result and 25 are not run**. One real failure (F4, a restaurant's prices quoted as support information) is still open. The guardrails are well tested at the code level and thinly evidenced on a live model.

## Objectives vs. achievements

| Week 7 objective | Status | Evidence |
|---|---|---|
| 30+ scenarios, six categories | ⚠️ Defined, mostly unrun | [`evaluation-set-week-7.md`](./evaluation-set-week-7.md), [`evaluation-results-week-7.md`](./evaluation-results-week-7.md): 5 pass (code-path), 3 partial, 1 fail, 25 not run |
| Measurable criteria | ✅ | Six criteria, each with a measurement source |
| Logs/traces (model, prompt, retrieval, tool, latency/error, outcome) | ✅ | `agent_trace_logs`; [`../evidence/traces/week-7-trace-logging.md`](../evidence/traces/week-7-trace-logging.md). Live run: 9 rows, 4 iterations, 22.0 s, 4,360 in / 624 out tokens. Console Traces page renders any run's steps |
| Guardrails (validation, allow-list, authorization, iteration limit, approval, injection awareness) | ✅ code / ⚠️ live | [`guardrail-evidence-week-7.md`](./guardrail-evidence-week-7.md): 12 listed, 9 with passing tests. Injection handling not run live |
| Failure Catalogue, ≥5 failures, re-tested | ✅ | [`failure-catalogue.md`](./failure-catalogue.md): 9 entries, 8 fixed or mitigated with re-test, **F4 open** |

## Deliverables

| # | Deliverable | File | Status |
|---|---|---|---|
| 1 | Evaluation dataset and results | `evaluation-set-week-7.md`, `evaluation-results-week-7.md` | Dataset complete; results partial |
| 2 | Observability/tracing evidence | `evidence/traces/week-7-trace-logging.md` | Complete; no live cap-exhaustion trace |
| 3 | Guardrail evidence | `guardrail-evidence-week-7.md` | Complete; live adversarial runs missing |
| 4 | Failure Catalogue | `failure-catalogue.md` | Complete; F4 open |
| 5 | Progress report | this file | Final apart from the links and contributions below |

## Also built this week

- **Console:** chat-first layout, Scheduler board reading the backend's real tasks and tickets, trace-log cards and step timeline, show-password toggle on login.
- **Realtime:** WebSocket endpoint `/ws` (first-message token auth, SSE kept as fallback) used by the web console and the customer app; RabbitMQ event bus with direct-delivery fallback.
- **Deployment:** backend on Fly.io, web console on Vercel. First Fly deploy failed because the image lacked the Prisma schema and migrations for the release command; Dockerfile fixed, redeploy pending.

## Key decisions

- Counted only real failures, including open ones. Scripted results are labelled as code-path evidence, never as live passes.
- F4 left unfixed because unpublishing a document is an admin action on production data.
- Trace writes stay best-effort so logging cannot break a customer reply.
- RabbitMQ chosen over Kafka for scale and simplicity. The bus fails open.

## Failures and fragile areas

| Item | Next step |
|---|---|
| **F4 open:** live model quotes KFC prices, cited | Owner unpublishes the document; re-run D7. Longer term, a per-document category |
| **25 scenarios not run** | Run at ≤ 4 requests/minute, record run IDs (table in the results file) |
| **F6:** repeated identical tool calls use all 4 iterations | Add a rule against identical repeats; capture a live cap hit |
| **Latency:** 22.0 s on the tool run against a 15 s target | Profile non-model time; measure p50/p95 |
| **CI:** Docker build workflows only | Add lint, typecheck and test steps |
| **Not verified:** `/ws` push to a signed-in client, customer app on device, authenticated MCP calls, Fly deploy | Rebuild and redeploy, then test with real logins |

## Links and evidence

- GitHub commit/tag/PR: *to be added by the lead.* ClickUp board/tasks: *to be added.*
- Code: `resolv-hq-backend/src/lib/{trace-log,react-agent,ai-boundary,ws,bus}.ts`, `routes/chat.ts`, `routes/admin/{traces,scheduler}.ts`, `tests/` (32 tests passing on 16 Oct).

## Individual contributions

*To be completed by the lead: member, task owned, evidence. No author history was available to read.*

## Plan for Week 8

1. Run the 25 unrun scenarios live and complete the results file.
2. Resolve F4 and re-run D7; fix F6.
3. Finish the Fly deploy and connect the Vercel console to it.
4. Add lint, typecheck and test steps to CI.
5. Tagged release, README and run instructions, final report and demo.
