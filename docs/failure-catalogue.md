# Failure Catalogue — RESOLV-HQ

**Compiled:** 13 Oct 2026 | **Owner role:** Quality/Security Lead | **Brief ask (Week 7):** at least 5 genuine failures, each re-tested after a fix.

This pulls together the failures already written up across the docs, adds the ones found this week, and states for each whether it was **re-tested**, how, and what is still open. Where a re-test was not independent or not on a live model, that is said plainly.

## Summary

| ID | Layer | Failure | Found | Status | Re-tested? |
|---|---|---|---|---|---|
| F1 | Prompt | False premise not verified | Wk 2 eval, case 5 | Fixed (prompt v1.1) | Manual walkthrough only |
| F2 | Retrieval | No relevance threshold — unrelated passage served as the answer | 3 Oct, 15-case RAG eval | Fixed | ✅ keyword path (10/4/1 vs 5/4/6) + re-probed 13 Oct |
| F3 | Retrieval | Stemmer mangles "statuses" → right passage ranks second | 3 Oct | Fixed | ✅ keyword path + re-probed 13 Oct |
| F4 | Retrieval / data | Off-domain document (KFC menu) answers support queries | 3 Oct; **reproduced on the live model 13 Oct** | **OPEN** | ❌ fails live (see below) |
| F5 | Gateway | Every provider unavailable (quota / no credit) | Wk 5 trace T2 | Mitigated (graceful fallback) | ✅ failure and recovery captured live |
| F6 | Tools | Repeated tool misses burn the iteration budget | Wk 5 trace T4 | Contained (cap + safe decline) | ✅ captured live; cap-exhaustion path not |
| F7 | Observability | Agent flow wasn't traceable: fixed placeholder steps, no timings/tokens, tool calls not persisted | 12–13 Oct | Fixed | ✅ persisted rows verified live; new timeline UI re-test below |
| F8 | Deployment | Customer app timed out on every request (stale API URL/port) | 13 Oct | Fixed | ⚠️ `/health` 200 via LAN IP; on-device re-test is the user's |
| F9 | Infrastructure | Database unreachable (`P1001`) from intermittent DNS | 12 Oct | Worked around, **root cause open** | ✅ migrations succeeded on retry |

Nine entries, eight with a fix or mitigation and some form of re-test. **F4 is the one that is genuinely not fixed.**

---

## F1 — False premise not verified *(prompt)*
- **Observed:** the user assumed a discontinued self-service feature still existed; the agent reasoned as if it did without checking the knowledge base.
- **Cause:** prompt v1.0 had no rule to verify a stated premise against a source first.
- **Fix:** prompt v1.1 (`prompt-specification.md`).
- **Re-test:** manual walkthrough only. **Not re-run against the live model.**

## F2 — No relevance threshold
- **Observed (3 of 15 cases):** "How do I reset my password?" returned a sentence about *not sharing* passwords; "support opening hours" returned ticket-review text; "cancel my subscription" returned `0 resolved 0 closed 0 cancelled Page 1 of 3`.
- **Cause:** any single shared word scored > 0 (`scoreText`, `lib/text-match.ts`), so one coincidental word counted as grounding — and the `search_knowledge_base` tool applied the same filter, so the model was handed the same junk.
- **Fix:** `isRelevant()` requires a share of the distinctive query terms; applied in `answerQuestion()`, `rankKnowledge()` and the tool.
- **Re-test:** 15-case set 5 pass / 4 partial / 6 fail → **10 / 4 / 1**. Re-probed 13 Oct with the three offending query/passage pairs: all three now return not-relevant (3/3). **Caveat:** the fixes were tuned on the same 15 questions, so this isn't independent, and the recall cost of the stricter threshold is unmeasured.

## F3 — Stemmer mangles "statuses"
- **Observed:** "What statuses can a payment show?" ranked a passage that merely mentions statuses above the one listing them.
- **Cause:** `stem()` turned "statuses" into "statuse" (the `-es` rule only covered `ss|sh|ch|x|z`).
- **Fix:** "statuses" → "status".
- **Re-test:** A2 now returns the Payments passage; the 13 Oct probe passes (relevant = true). Same non-independence caveat as F2.

## F4 — Off-domain document answers support queries — **OPEN**
- **Observed (3 Oct, keyword path):** a Big Boss Burger price question and a "where is my delivery driver" question were answered from a KFC Uganda ordering guide.
- **Reproduced on the live model, 13 Oct:** query *"price for a streetwise 2"* → Gemini-Resolv answered *"A Streetwise 2 Large … costs 19,000 UGX"* and cited `KFC_Ordering_Steps (1)`, page 1 (run `34ed4362-414e-44e8-a871-9b0e6174bac7`; trace in `evidence/traces/week-7-trace-logging.md`). A Resolv-HQ support assistant is quoting a restaurant's prices as if they were its own information.
- **Cause:** the restaurant guide is published in the same corpus as the support documents, and retrieval has no notion of topic or document scope. Retrieval is working as designed; the data and scoping are wrong.
- **Fix needed (not applied):** unpublish `KFC_Ordering_Steps (1)` — an admin action on production data, left for the project owner to decide — and longer term add a per-document category so only support-domain documents are searched.
- **Re-test:** not possible until the document is unpublished. Then re-send the same query; the expected result is the "not covered — want me to raise a request?" answer with no sources.

## F5 — All model providers unavailable
- **Observed (Wk 5, T2):** Gemini `429 RESOURCE_EXHAUSTED` (free tier, 20 requests/day); Anthropic `400 credit balance too low`.
- **Cause:** account capacity, not code.
- **Behaviour/fix:** the gateway retries transient errors with backoff, hands off between providers, and `generateAssistantReply()` finally degrades to the deterministic keyword answer rather than returning an error. The failed run is recorded (`status: failed`, `error_message`).
- **Re-test:** the failure and recovery were captured live (T2). **Residual weakness:** the customer gets a lower-quality keyword answer, and the quota/credit problem itself remains a billing action.

## F6 — Repeated tool misses burn the iteration budget
- **Observed (Wk 5, T4):** three tool calls returned no match, the model re-planned twice, then declined safely and offered escalation — using 3 of 4 permitted iterations.
- **Behaviour/fix:** `MAX_ITERATIONS = 4` caps the loop; the final answer was grounded with no fabricated hours.
- **Re-test:** captured live. **Not captured:** a run that actually hits the cap and returns the fallback message. That path is untested on a live model.

## F7 — Agent activity wasn't traceable
- **Observed (12–13 Oct):** the console's "Agent activity" timeline was three fixed strings ("Understanding your request" → "Calling Gemini-Resolv" → "Produced a final answer"); a direct answer showed only a `respond` step; there was no latency or token count, and tool calls existed only in an in-memory list lost after the reply. The Logs/Traces item was therefore still open.
- **Cause:** the display trace logged a `plan` step only when a tool was called, provider token counts were never read, and nothing persisted per-step data.
- **Fix:** `agent_trace_logs` (retrieval, each model call, each tool call, guardrail block, outcome — with latency, tokens and errors); the chat response now returns that timeline and the console renders it step by step; the Traces & Logs page can open any run's step trace.
- **Re-test:** run `34ed4362-…` persisted 3 rows with correct latency (6,039 ms model call, 9,213 ms total). Token counts and the new timeline UI: see "Re-test log" below.

## F8 — Customer app timed out on every request
- **Observed:** `Failed to load profile / requests / notifications — The request timed out.`
- **Cause:** `EXPO_PUBLIC_API_BASE_URL` pointed at `192.168.1.10:4000`; the PC was `192.168.1.8` and the Dockerised backend is published on **3001**.
- **Fix:** `.env.local` → `http://192.168.1.8:3001`.
- **Re-test:** `GET /health` returns 200 on that address from the PC. End-to-end confirmation from the phone/Expo is outstanding. **Residual risk:** the LAN IP is DHCP-assigned and can change again.

## F9 — Database unreachable (`P1001`)
- **Observed:** `prisma migrate` could not reach the Supabase pooler.
- **Cause:** intermittent DNS resolution on the local network (3 of 6 lookups failed).
- **Workaround/re-test:** retrying succeeded; the trace-log migrations applied. **Root cause open** — switching the machine's DNS to 8.8.8.8 / 1.1.1.1 is the suggested fix.

---

## Known gaps — not counted as failures (never observed to fail)
- **Boundary Layer 2** (`detectBoundaryViolation`) has never tripped on a live model; the model refused correctly in T5/T6, so the backstop is unproven in practice.
- **Iteration-cap exhaustion** is covered by the automated E2E test with a scripted model that never stops calling tools (stops at 4 calls and returns the safe fallback), but has still not happened on a live model (see F6).
- **Rate limiting** fails open if Redis is unreachable, by design; not tested under real load.
- **`outage_status_checker`** category narrowing was removed rather than fixed (needs a join `chat.ts` doesn't do).
- **Clarification gate** thresholds (the 6-word rule) are untested against real customer phrasing.
- **Partial answers** don't disclose which part of a question is uncovered (shares F2's root cause).

## Re-test log
| Date | Item | Result |
|---|---|---|
| 13 Oct | F2 ×3 query/passage probes | 3/3 not-relevant (pass) |
| 13 Oct | F3 A2 probe | relevant (pass) |
| 13 Oct | F4 live query "price for a streetwise 2" | **still fails** (KFC prices quoted) |
| 13 Oct | F7 persisted trace, run 34ed4362 | 3 rows, latency present |
| 13 Oct | F7 after rebuild, live tool-calling run | 9 rows incl. 3 `tool_call`; real per-call latency and tokens (4,360 in / 624 out) — pass |
| 13 Oct | F6 live: unanswerable question | used all 4 iterations, re-queried the same tool 3×, answered on the 4th — cap not exceeded but no margin |
