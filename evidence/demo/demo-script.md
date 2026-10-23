# Demo script — 12–15 minutes (brief §10)

Rehearse against the **real backend and a live model**, not the scripted mock. Keep a second provider key ready; if both hit quota, use the fallback in the last column.

## Before you start (10 min)

- [ ] Backend up (`npm run dev` or the deployed URL); `GET /health` returns 200.
- [ ] Console open on `/chat`, signed in as staff; customer account signed in on a second window or the phone (use the LAN IP in `EXPO_PUBLIC_API_BASE_URL`, F8).
- [ ] Unpublish `KFC_Ordering_Steps (1)` only if you want F4 shown as *fixed*; leave it published to show F4 as an *open failure* (recommended: show it open, then unpublish live and re-run).
- [ ] Send one warm-up message; stay under 4 requests/minute (provider free tier).
- [ ] Have run IDs of one good trace ready as a fallback if a live call stalls.

## Run sheet

| Time | Segment | Show | If it breaks |
|---|---|---|---|
| 0:00–2:00 | Problem and why AI | Repetitive lookups; the one human-decision slice (refund/billing). State the single use case | — |
| 2:00–4:00 | Architecture and progression | `architecture-diagram.md`: model → RAG → tools → bounded loop → eval/guardrails. Say which parts are deterministic | Use the static diagram |
| 4:00–8:00 | **Live workflow** | Customer asks "Where is my request?" → agent calls `outage_status_checker`/`get_my_tickets`; then a KB question with a citation; then "I want a refund" → agent drafts an escalation → staff **approve** in `/admin` → customer sees the outcome | Fall back to the week-5 trace T1 and say so |
| 8:00–10:00 | **Evidence view** | Traces & Logs → "Show step trace" for that run: retrieval, model call (provider, prompt v1.2, latency, tokens), tool call, outcome. Point to `agent_trace_logs` | Open `evidence/traces/week-7-trace-logging.md` |
| 10:00–12:00 | **Real failure** | F4: ask "price for a streetwise 2"; the assistant quotes a restaurant's price with a citation. Explain cause (corpus scoping), the fix (unpublish / per-document category), re-run to show "not covered — want me to raise a request?" | Show run `34ed4362-…` and the failure catalogue entry |
| 12:00–14:00 | Guardrails and lessons | Ask for a refund directly → refused, no write; show the approval gate, allow-list, 4-iteration cap, rate limits; 41 + 17 tests passing. Lessons: scope the corpus, record scripted vs live honestly, own the data | Show `guardrail-evidence-week-7.md` |
| 14:00–15:00 | Questions | Be ready on: the model note vs Gemini, the 25 unrun scenarios, why F6 was not fixed, latency 22 s | — |

## Questions you should answer plainly

- **"Which model ran this?"** Gemini through the gateway; the model note recommended Claude Sonnet 5, and quota forced the change.
- **"How many scenarios passed?"** Quote the final count from `evaluation-results-week-7.md`, and say how many were scripted versus live.
- **"What if the model ignores the boundary?"** No write tool exists, so it cannot act. The approval queue stops anything proposed, and `detectBoundaryViolation` is a backstop that has not tripped live.
