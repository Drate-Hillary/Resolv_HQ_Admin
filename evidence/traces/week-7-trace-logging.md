# Week 7 — Trace logging (closes Task 18)

**Date:** 12 Oct 2026 | **Code:** `resolv-hq-backend` (`src/lib/trace-log.ts`, `src/lib/react-agent.ts`, `src/routes/chat.ts`, `src/routes/admin/traces.ts`)

## What was added

`agent_runs` stays the one-row-per-task summary. New table **`agent_trace_logs`** (migration `20261012000000_agent_trace_logs`) holds the ordered detail under each run:

| Brief asks for | Where it is recorded |
|---|---|
| Model | `provider`, `model` on each `model_call` row and the `outcome` row |
| Prompt | `prompt_version` (`SYSTEM_PROMPT_VERSION`) on the `retrieval` and `model_call` rows; the user query (300 chars) in the retrieval row's `tool_input` |
| Retrieval | `retrieval` row: ids, titles, scores of the passages shown to the model |
| Tool | `tool_call` rows: `tool_name`, `tool_input`, truncated observation in `detail` |
| Latency / error | `latency_ms` per model call and tool call, total on the `outcome` row; `error` set for failed model calls, malformed tool arguments, non-allow-listed tools |
| Outcome | `outcome` row: answered / escalated / blocked / fallback; a `guardrail` row precedes it when the boundary matrix replaced the draft |

Read a run back with `GET /admin/traces/:runId` (staff only) → `{ run, events[] }` ordered by `seq`.

## Verification

- `tsc --noEmit` and `eslint` clean.
- `tests/trace-log.test.ts` (3 tests, pass): normal tool-using run, gateway failure → fallback with error, boundary block adds guardrail row.

## Not yet verified (be honest in the report)

- The migration has **not been applied** to a database and no live `/chat` call has been traced end to end; run `npm run migrate:deploy`, send one chat message, then `GET /admin/traces/<runId>` and paste the output here.
- Trace writes are best-effort (an insert failure is logged, never blocks the reply), so a silent gap is possible if the table is missing.
- Tool `latency_ms` is near 0 today because all tools are synchronous and in-memory; it becomes meaningful once a tool does I/O.

## Live verification (13 Oct 2026) — migration applied, real Gemini call

Migration `20261012000000_agent_trace_logs` applied to Supabase. Query sent through `/chat`: **"price for a streetwise 2"** (conversation `642efa50-…`). Run `34ed4362-414e-44e8-a871-9b0e6174bac7`, status `completed`, prompt `v1.2`. Rows read back from `agent_trace_logs`:

| seq | kind | provider / model | latency | detail |
|---|---|---|---|---|
| 1 | retrieval | — | — | 1 passage: `KFC_Ordering_Steps (1)`, score 2.45; query recorded |
| 2 | model_call (iter 1) | Gemini-Resolv / gemini-3.8-flash | 6039 ms | Answer: "A Streetwise 2 Large … costs 19,000 UGX", cites source page 1 |
| 3 | outcome | Gemini-Resolv / gemini-3.8-flash | 9213 ms total | `answered`, no error |

Observations:
- The model answered in one iteration with no tool call, so no `tool_call` rows appear in this run; tool rows are covered only by the unit tests so far. A run that calls `search_knowledge_base` / `check_request_status` still needs to be captured live.
- ~3.2 s of the 9.2 s total is outside the model call (retrieval, memory/context loading, boundary check) — worth a note for the latency criterion.
- The reply's `trace` field only shows `respond` because the display trace logs a "plan" entry only when a tool is called; the persistent log has the full picture.
- 9 trace rows exist in the table in total (earlier runs also logged).

## Live verification 2 (13 Oct) — tokens and a tool-calling run

Backend rebuilt (`docker compose up -d --build backend`), migration `20261013000000_trace_token_usage` applied. Two live `/chat` calls with Gemini-Resolv (`gemini-3.8-flash`):

**Run A — "What is the status of my request?"** (no tool): retrieval → 1 model call (6,491 ms, 1,355 in / 419 out tokens) → outcome `answered`, 10,784 ms total.

**Run B — "Use the search_knowledge_base tool to look up our escalation policy for unresolved billing disputes, then summarise it."** Four iterations, 22.0 s total, 4,360 in / 624 out tokens:

| seq | kind | iter | latency | tokens in/out | detail |
|---|---|---|---|---|---|
| 1 | retrieval | | | | 0 passages |
| 2 | model_call | 1 | 9,099 ms | 852 / 76 | Requested `search_knowledge_base` |
| 3 | tool_call | 1 | 12 ms | | returned Billing Policy excerpt |
| 4 | model_call | 2 | 3,191 ms | 1,042 / 95 | Requested `search_knowledge_base` again |
| 5 | tool_call | 2 | 0 ms | | "No matching knowledge base articles found." |
| 6 | model_call | 3 | 2,384 ms | 1,159 / 34 | Requested `search_knowledge_base` again |
| 7 | tool_call | 3 | 1 ms | | Billing Policy excerpt again |
| 8 | model_call | 4 | 4,890 ms | 1,307 / 419 | Final: no specific escalation policy found |
| 9 | outcome | | 22,006 ms total | | `answered` |

What this shows: `tool_call` rows now exist from a real run, and tokens/latency are real provider values. It also shows the loop used all 4 iterations (`MAX_ITERATIONS`) on a question the corpus cannot answer, re-querying the same tool three times (see F6 in `docs/failure-catalogue.md`). The model happened to produce a final answer on the 4th iteration, so the cap-exhaustion path is still not captured.
