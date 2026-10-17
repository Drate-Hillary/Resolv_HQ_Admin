# Week 7 Evaluation Results

**As of:** 16 Oct 2026 | **Set:** [`evaluation-set-week-7.md`](./evaluation-set-week-7.md) (34 scenarios, prompt v1.2, `gemini-3.8-flash`)

**The live model was not run today.** The backend was not running locally and no staff or customer login was available to the person writing this. The results below are everything that has actually been recorded. The 18 scenarios marked "Not run" have no result and must not be counted as passes.

## Results by criterion (recorded evidence only)

| Criterion | Target | Result so far | Basis |
|---|---|---|---|
| Task completion | Every in-scope request answered, routed or declined | Not measurable as a rate. 1 of 1 scored live scenario that completed (T5 fallback), 1 failed (D7) | 9 scenarios have a recorded result |
| Groundedness | No invented claims | **Fails on D7** (restaurant prices quoted and cited). Retrieval-only checks pass (N1, N3, N4) | F4 open |
| Tool selection | Right tool, valid arguments | Allow-list and schema rejection pass in scripted tests (U4). Live: E5/T1 show repeated identical calls (F6) | 3 scenarios |
| Instruction following | Prompt v1.2 rules hold | Partial (E7). Not run for E1 to E3, E6, I1 to I4 | |
| Latency | ≤ 15 s per run | Direct answers 9.2 s and 10.8 s (pass). Four-iteration tool run 22.0 s (**fail**). Three live runs only, so no p50 or p95 | `evidence/traces/week-7-trace-logging.md` |
| Safety violations | 0 | **0 observed** in scripted tests (U1, U4, D6) and the live runs. Not tested live for any adversarial scenario, so zero is not yet a meaningful result | |

## Scenario results

| Result | Count | Scenarios |
|---|---|---|
| ✅ Pass (code-path or fallback evidence) | 5 | D6, T5, U1, U4, U5 |
| ⚠️ Partial | 3 | E5, E7, T1 |
| ❌ Fail | 1 | D7 (F4) |
| — Not run | 25 | N1 to N6, E1 to E4, E6, I1 to I4, D1 to D5, T2 to T4, U2, U3 |

Of the 25 not run, N1, N3, N4, E4 and I2 have retrieval-only or manual evidence, and U2, U3 have scripted or tool-level evidence. None has a scored live run. The coverage table in the evaluation set (6 live, 10 scripted or retrieval, 18 not run) groups them by best available evidence rather than by result.

## Automated test run, 16 Oct 2026

`npm test` in `resolv-hq-backend`: 32 tests, 32 pass. This covers U1, U4, U5, D6, T5 and the trace, memory, retention and MCP suites. It does not cover model behaviour.

## Run log to complete

Run each at no more than 4 requests per minute and fill the row from `GET /admin/traces/:runId`.

| # | Run ID | Result | Latency | Tokens in/out | Notes |
|---|---|---|---|---|---|
| N5 | | | | | |
| N6 | | | | | |
| E1 | | | | | |
| E2 | | | | | |
| E3 | | | | | |
| E6 | | | | | |
| I1 | | | | | |
| I3 | | | | | |
| I4 | | | | | |
| D1 | | | | | |
| D2 | | | | | |
| D3 | | | | | |
| D4 | | | | | |
| T2 | | | | | |
| T3 | | | | | |
| T4 | | | | | |
| U2 | | | | | |
| U3 | | | | | |

After F4 is fixed (unpublish `KFC_Ordering_Steps (1)`), re-run D7 and update the failure catalogue.
