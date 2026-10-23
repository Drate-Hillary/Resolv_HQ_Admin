# Evidence pack — RESOLV-HQ

Layout follows the brief's recommended `evidence/` structure. Files link to their sources rather than copying them.

## `traces/` — real execution traces

| File | What it shows |
|---|---|
| [`traces/week-5-execution-traces.md`](./traces/week-5-execution-traces.md) | Agent-loop runs: success, provider failure and fallback (T2), out-of-scope refusal (T5/T6), tool miss ending in a safe decline (T4) |
| [`traces/week-6-memory-traces.md`](./traces/week-6-memory-traces.md) | Memory off vs on, one pair of live runs |
| [`traces/week-7-trace-logging.md`](./traces/week-7-trace-logging.md) | Persisted `agent_trace_logs` rows, per-call latency and tokens; live F4 reproduction |

## `screenshots/` — to capture

Empty until the team adds them. Minimum set, each named `NN-description.png`:

1. `01-chat-grounded-answer.png` — answer with citations
2. `02-approvals-queue.png` — pending escalation draft awaiting staff
3. `03-trace-timeline.png` — "Show step trace" for one run
4. `04-failure-f4.png` — the off-domain answer (and the fixed result after the document is unpublished)
5. `05-memory-off-vs-on.png`
6. `06-tests-passing.png` — `npm test` in backend and console

## `demo/`

- [`demo/demo-script.md`](./demo/demo-script.md) — 12–15 minute run sheet with timings, commands and fallbacks.
- A recording of a full rehearsal should be saved here as `demo/rehearsal.mp4` (or a link in `demo/recording.md`).

## Written evidence (in `docs/`)

| Brief item | Document |
|---|---|
| Evaluation set and results | [`evaluation-set-week-7.md`](../docs/evaluation-set-week-7.md), [`evaluation-results-week-7.md`](../docs/evaluation-results-week-7.md) |
| Guardrail evidence | [`guardrail-evidence-week-7.md`](../docs/guardrail-evidence-week-7.md) |
| Failure Catalogue with re-tests | [`failure-catalogue.md`](../docs/failure-catalogue.md) |
| RAG evaluation | [`rag-evaluation-15-case.md`](../docs/rag-evaluation-15-case.md) |
| Tool failure and authorization tests | [`tool-failure-auth-test-evidence.md`](../docs/tool-failure-auth-test-evidence.md) |
| Final report | [`final-engineering-report.md`](../docs/final-engineering-report.md) |

## Test results (21 Oct 2026)

| Repo | Command | Result |
|---|---|---|
| `resolv-hq-backend` | `npm test` | 41 tests, 41 pass, 0 fail |
| `resolv-hq-backend` | `npx tsc --noEmit` | no errors |
| `resolv-hq` | `npm test` | 17 tests, 17 pass, 0 fail |
| `resolv-hq` | `npx tsc --noEmit` | no errors |

These use scripted models and faked databases, so they prove code paths, not live model behaviour.
