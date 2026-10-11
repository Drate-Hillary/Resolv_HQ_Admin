# Task Tracker — Weeks 1–8, by Status and Priority

**Compiled:** 24 Sept 2026 · **Last updated:** 8 Oct 2026 (Week 6 memory integration) | **Consolidates:** [`week-1.md`](./week-1.md) – [`week-8.md`](./week-8.md)

Every task the brief asks for across all 8 weeks, grouped by actual status, sorted **highest priority first** within each group. Priority reflects how much it blocks other work or graded rubric items — not the week it's nominally due in. Each entry explains what the task actually involves, why it sits at that priority, who's best placed to own it (per the brief's §5 role split), and the concrete evidence or gap behind the status.

**Priority key:** 🔴 P0 Critical/blocking · 🟠 P1 High (core rubric item) · 🟡 P2 Medium (evidence/consolidation) · 🟢 P3 Low (can slip or be dropped — see [`../brief-alignment-review.md`](../brief-alignment-review.md)'s "features not necessary" follow-up)

**Owner roles** (brief §5): Project/Requirements Lead (PRL) · Application/Integration Lead (AIL) · AI Engineering Lead (AEL) · Quality/Security Lead (QSL) · DevOps/Documentation Lead (DDL)

---

## ✅ Completed

### 🟠 P1 — core rubric items already working

**≥2 tools with strict JSON schemas** *(Week 4 · Owner: AEL)*
The brief requires at least two explicit tools with defined input/output schemas and authorization rules. Four exist — `search_knowledge_base`, `account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket` — all in `resolv-hq-backend/src/lib/agent-tools.ts`, each declaring `additionalProperties: false` and an explicit `required` array, which is what makes a JSON-Schema tool definition "strict" (a model can't smuggle in an undeclared argument). This exceeds the brief's minimum of two.

**Tool-calling implemented through the orchestration layer** *(Week 4 · Owner: AEL)*
Not enough to define tool schemas — the model has to actually be able to call them mid-conversation and get real results back. `react-agent.ts`'s loop does this: when the model requests a tool, the loop executes it against `agent-tools.ts` and feeds the result back in as a `tool`-role message before continuing.

**Read-only / simulated side-effect tool** *(Week 4 · Owner: AEL)*
The brief wants at least one tool that either reads live application data or performs a low-risk *simulated* side effect (e.g., drafting a ticket). `draft_escalation_ticket` is exactly that: it classifies the request and returns a labeled draft ("DRAFT — not submitted"), but writes nothing to the database — satisfying the "simulated, not real" requirement deliberately, since a tool literally named "draft" is the easiest one to accidentally make too powerful.

**Human approval gate before higher-impact action** *(Week 4/7 · Owner: QSL)*
Any AI-proposed action with real consequence must stop for a human before it takes effect. `agent_approvals` (table) + `routes/admin/approvals.ts` (queue endpoints) + `decideApproval()` (the single choke point every approval passes through) form a working, auditable gate — nothing the agent drafts can become real without a staff decision recorded here.

**Domain conflict resolved across README + docs + console** *(Week 4 · Owner: PRL + AIL)*
Previously the single most consequential open item: `resolv-hq/README.md` and its docs described a procurement assistant that only ever existed as a scripted demo, while the real backend and customer app implement a support-request triage agent. Resolved 25 Sept — see [`../domain-conflict-resolution.md`](../domain-conflict-resolution.md) for the full file-by-file account. `README.md`, `src/backend/mock-console.ts`, `console-store.ts`, the login page, the knowledge page, and the dashboard subtitle were all rewritten to the support domain, and the same correction was carried through `model-selection-note.md`, `prompt-specification.md`, and `evaluation-table.md` (including fixing a pre-existing arithmetic error in the evaluation summary and several dead route/file references). A repo-wide grep for procurement-domain language now returns zero matches, and `npx tsc --noEmit` is clean.

**Tool Catalogue explicitly labeled/indexed** *(Week 4 · Owner: AEL)*
[`../tool-catalogue.md`](../tool-catalogue.md) — purpose, exact JSON schema, authorization model, and failure behaviour for all four tools, indexed under the name the brief expects a grader to find.

**Week 4 progress report** *(Week 4 · Owner: PRL)*
[`../week-4-progress-report.txt`](../week-4-progress-report.txt) — objectives vs. achievements, key decisions (domain-conflict resolution as the headline), risks/challenges, and the plan for Week 5, in the brief's §8 format. Written 25 Sept.

**Failure/authorization test evidence captured** *(Week 4 · Owner: QSL)*
[`../tool-failure-auth-test-evidence.md`](../tool-failure-auth-test-evidence.md) — real, executed output (via `tsx` against the actual `agent-tools.ts`, not a hypothetical description) for a missing-required-parameter call, a cross-customer authorization check, an unrecognized-tool call, and an ungrounded query. Also surfaced a genuine keyword-overlap retrieval weakness along the way, logged for the Week 7 Failure Catalogue.

**Architecture diagram — first version** *(Weeks 1/3/4 · Owner: AIL)*
[`../architecture-diagram.md`](../architecture-diagram.md) — no diagram existed anywhere in the workspace before this; now covers client surfaces through the LLM gateway, ReAct loop, the four agent tools, the boundary matrix, and the approval queue, in Mermaid so it can be extended in place. Counts as done for Weeks 1/3/4's asks. The brief expects it to keep growing through Week 7 (Week 6: memory + MCP annotation; Week 7: failure-catalogue pointers).

**Multi-step bounded agent loop (Sense→Plan→Act→Observe→Respond)** *(Week 5 · Owner: AEL)*
This is the brief's Week 5 centerpiece — a workflow where the system decides among approved next actions itself, rather than following a fixed script. `react-agent.ts`'s `runReActLoop()` implements the full cycle and is called from `generateAssistantReply()` in place of the old single-shot completion call. Notably, this was built and committed on 22 Sept — a full week ahead of its nominal slot.

**Iteration cap / safe stop condition** *(Week 5 · Owner: AEL)*
A bounded agent has to know when to stop, not just when to act. `MAX_ITERATIONS = 4` caps the loop; hitting it returns a safe "I wasn't able to work through this fully" message instead of looping indefinitely or guessing to force an answer.

**Approved tool set enforced (no open-ended execution)** *(Week 5 · Owner: QSL)*
The loop can only ever call the four registered, read-only tools — there's no code path for it to reach outside that set, which is what keeps "bounded" true rather than aspirational.

**Human hand-off/approval built into the loop itself** *(Week 5 · Owner: QSL)*
Anything the agent drafts mid-loop (an escalation ticket) routes to the same `agent_approvals` queue as everything else — the loop's autonomy stops at "propose," never "execute."

**Agent Task Contract** *(Week 5 · Owner: AEL)* — **Done 2 Oct**
[`../agent-task-contract.md`](../agent-task-contract.md) — goal, closed set of four tools, caller-scoped state, limits (`MAX_ITERATIONS = 4`), five stop conditions, hand-off/approval conditions, and customer/staff parity, consolidated from `react-loop-core.md`, `ai-boundary-matrix.md` and `tool-catalogue.md`. States its own known gaps (§9) rather than overclaiming.

**Architecture diagram — Week 5 extension** *(Week 5 · Owner: AIL)* — **Done 2 Oct**
`../architecture-diagram.md` extended in place with the ReAct loop's five-phase subgraph, the iteration cap, all five exit paths and the approval hand-off. Standalone Week 4 + Week 5 copies are in [`../architecture-diagrams-week-4-and-5.md`](../architecture-diagrams-week-4-and-5.md).

**Bounded agent workflow report** *(Week 5 · Owner: AEL)* — **Done 2 Oct**
[`../bounded-agent-workflow-report.md`](../bounded-agent-workflow-report.md) — how the workflow runs, every bound and where it is enforced, evidence with its strength labelled, and what is not yet proven.

**Week 5 progress report** *(Week 5 · Owner: PRL)* — **Done 2 Oct**
[`../week-5-progress-report.md`](../week-5-progress-report.md) — objectives vs. achievements, decisions, risks, and the Week 6 plan. Honest about the partial trace set.

**Customer memory discovery, context, and console integration** *(Week 6 · Owner: AEL/QSL)* — **Code and documentation implemented 8 Oct**
Customer memory is loaded server-side into authenticated customer chat context. The console discovers aggregate memory metadata and registered tools from backend registries, provides separate staff-owned memory CRUD, and supports access to a specifically selected customer's facts and master preference. Staff customer-memory views and changes are audited without copying values into the audit log. The new backend migration must be applied before the new console endpoints are available in a deployed database. See [`../memory-design-and-data-handling-note.md`](../memory-design-and-data-handling-note.md).

**Memory Design and Data Handling Note** *(Week 6 · Owner: QSL)* — **Done 8 Oct**
[`../memory-design-and-data-handling-note.md`](../memory-design-and-data-handling-note.md) documents customer and console memory flows, account-scoped access, staff audit logging, retention/deletion limits, and remaining production work.

**Internal console memory integration** *(Week 6 · Owner: AEL/QSL)* — **Implemented 8 Oct**
Staff-owned memory is separate from customer chat context; customer memory is accessed only after explicit selection, and staff views/changes are audit logged. Apply the backend migration before deploying the integration.

**MCP server and interface specification** *(Week 6 · Owner: AIL)* — **Implemented 8 Oct**
[`../mcp-style-interface-spec.md`](../mcp-style-interface-spec.md) documents authenticated Streamable HTTP at `/mcp` and a stdio process, input/normalized output contracts for all four tools, caller/role scope, activation, error behavior, and setup. Both transports share the existing tool logic; no customer ID is accepted as tool input, tool-registry failures are closed, and stdio re-verifies its startup token per tool call.

**Real-time messaging and live notifications (unplanned, outside the 8-week brief)** *(Owner: AIL)* — **Done 2 Oct**
Requested because ticket messages took too long to arrive. Server-Sent Events stream (`resolv-hq-backend/src/routes/events.ts`, `lib/realtime.ts`; Redis pub/sub with local fallback) pushes new messages, typing signals and notifications instantly; `POST /requests/:id/typing` added; message send no longer waits on notification work or a second fetch. Console: animated three-dot typing indicator, instant optimistic send, live bell with per-type labels and filters (All / Unread / Support / Request update / AI / Completed / System). Type-check and lint clean on both apps; recipient targeting verified with a hub test. **Not yet verified:** end-to-end in a browser with two users. **Not covered:** the `resolv-hq-customer` mobile app does not yet consume `/events`.

### 🟡 P2 — solid supporting work

**Model chosen and documented** *(Week 2 · Owner: AEL)*
The brief wants a specific model recommendation with capability/cost/latency/privacy/access reasoning, not just "we used an LLM." `docs/model-selection-note.md` recommends Claude Sonnet 5 as primary (Haiku 4.5 for low-stakes paths), covering all five dimensions the brief asks for. Domain language and dead route references corrected as part of the Week 4 domain-conflict fix.

**≥2 versioned, meaningful prompt iterations** *(Week 2 · Owner: AEL)*
Prompts have to be treated as versioned artifacts, not edited in place with no history. `prompt-specification.md` documents a v1.0 → v1.1 change driven directly by a real evaluation failure (case 5's unverified false premise) — exactly the "meaningful, evidence-driven iteration" the brief wants, not a cosmetic wording tweak.

**Live-model plumbing (gateway, retry, caching)** *(Week 2 · Owner: AEL)*
Before a model call can be "live," the surrounding infrastructure has to exist: a provider abstraction, retry/backoff on transient failures, and caching so identical requests don't burn quota. All three are built in `resolv-hq-backend/src/lib/llm/` (`gateway.ts`'s `completeWithFallback()`, `retry.ts`, real `providers/anthropic.ts` and `providers/openai.ts` clients) and wired into `generateAssistantReply()`. This is code-complete — it just hasn't been exercised with a real registered API key yet (tracked under Pending below), so no model has actually answered a question live so far.

**Retrieval + indexing implemented** *(Week 3 · Owner: AEL)*
The brief's RAG minimum needs retrieval over a controlled corpus, not answers from the model's own memory. `answerQuestion()`/`scoreArticle()` in `lib/ai.ts` keyword-ranks published knowledge documents and returns the top matches. It's not embedding/vector-based, but the brief doesn't require that — keyword retrieval over a small, controlled corpus satisfies the minimum ask.

**Source grounding (citations)** *(Week 3 · Owner: AEL)*
An answer without a traceable source isn't gradeable as "grounded." Both `prompt-specification.md` and `system-prompt-spec.md` require every factual claim to carry a document + section citation, and this is enforced as a prompt rule the evaluation cases already check for.

**Unsupported-answer handling** *(Week 3 · Owner: AEL)*
Guessing when the corpus doesn't cover a question is exactly the failure mode RAG is supposed to prevent. The clarification gate (`clarification-prompting-logic.md`) and the prompt spec both require "the knowledge base doesn't cover this, want me to escalate?" instead of a fabricated answer.

**Session/workflow state modeled explicitly** *(Week 6 · Owner: AIL)*
Week 6 needs state to be a first-class, inspectable thing, not implicit in scattered variables. Supabase tables already do this: `ai_conversations`/`ai_messages` for chat turns, `agent_runs`/`agent_steps` for run progress, `requests`/`request_status_history` for the underlying case. This is a real foundation to build the memory work on top of.

**Two-layer guardrail enforcement** *(Week 7 · Owner: QSL)*
A prompt instruction alone is not a guarantee the model will follow it — the brief's Week 7 ask is for guardrails backed by evidence, not just good intentions in a system prompt. `docs/ai-boundary-matrix.md` documents exactly that: Layer 1 is the system-prompt rule ("never claim to have processed a refund/cancellation/account change"), Layer 2 is `detectBoundaryViolation()`, a deterministic regex check on the model's *actual output* that substitutes a safe fallback if the model claims a blocked action anyway. This is ahead of where most teams would be at Week 7's own deadline.

**Agent iteration limits enforced** *(Week 7 · Owner: QSL)*
Same underlying `MAX_ITERATIONS` cap from Week 5, double-counted here because it's also explicitly one of Week 7's named guardrail asks (alongside validation, allow-lists, and approval controls).

**Duplicate Week 2 report reconciled** *(Week 2 · Owner: PRL)* — **Done 3 Oct**
The two files were not true duplicates: the root `week 2 report.md` was a role/deliverable breakdown, not a progress report. [`../week-2-progress-report.md`](../week-2-progress-report.md) is now canonical (with a banner saying so); the root file was moved to [`../week-2-role-breakdown.md`](../week-2-role-breakdown.md) and cross-linked, so nothing was lost and only one report sits at the repo root level of grading.

**3 documented retrieval/grounding failures** *(Week 3 · Owner: QSL)* — **Done 3 Oct**
[`../retrieval-grounding-failures.md`](../retrieval-grounding-failures.md) — four failures with causes traced to code: false premise not verified (case 5), no relevance threshold so unrelated passages are served as answers, a stemmer bug ("statuses" → "statuse") that ranks the wrong passage, and an off-domain document retrievable for support queries. **Update 3 Oct: F2 (no relevance threshold) and F3 (stemmer) are fixed in code and re-tested on the keyword path (15-case: 5/4/6 → 10/4/1); F4 needs the KFC document unpublished.** All but case 5 were observed on the keyword path only, not a live model; the fixes were tuned on the same 15 questions.

**Week 3 report consolidated to one file** *(Week 3 · Owner: PRL)* — **Done 3 Oct**
[`../week-3-progress-report.md`](../week-3-progress-report.md) — objectives vs. achievements, Tasks 1–20 status, decisions, risks, plan; the four workstream reports are kept as appendices. Rows marked † in it were not re-verified.

**RAG architecture diagram** *(Week 3 · Owner: AEL)* — **Done 3 Oct**
Added in place to [`../architecture-diagram.md`](../architecture-diagram.md): ingestion → storage → retrieval/ranking → context assembly → citation, with the "nothing scores > 0" exit marked as the known weak point.

### 🟢 P3 — baseline housekeeping

**GitHub repositories created with real commit history** *(Week 1 · Owner: DDL)*
The brief's minimum Week 1 evidence includes a functioning GitHub setup. All three repos exist; `resolv-hq-backend` in particular has 10+ commits spread across named feature/fix branches (`feat/ReAct-implement`, `fix/ai-boundary-matrix`, etc.) — genuine incremental history, not one dump commit. (This is separate from the *outer* workspace's git problems — see the Not Completed section.)

---

## 🟡 Pending (real progress exists, not finished)

### 🔴 P0 — do these before anything else

**Register a real model API key and confirm one live call** *(Week 2 · Owner: AEL)*
**Updated 2 Oct — half done.** An Anthropic provider was registered 25 Sept and a live Gemini call (`gemini-3.8-flash`) did answer one query end to end (Week 5 trace T1). But the Anthropic account returns `400 credit balance is too low` and Gemini's free tier (20 requests/day) returned `429` mid-run, so **no provider currently has capacity** and everything falls back to `answerQuestion()`. **What's left:** add Anthropic credit (or move Gemini to a paid tier) — an account/billing action for the project owner — then confirm a `/chat` call shows a live `providerName`/`model`. This is now the single blocker for the traces, the 15-case RAG eval and the Week 7 scenario set.

### 🟠 P1 — core rubric items, real work started

**AI Boundary Matrix as a Week 1 planning artifact** *(Week 1 · Owner: PRL)*
The brief wants the boundary matrix drafted early, as a scoping decision, not discovered after the fact. `ai-boundary-matrix.md` exists and is genuinely thorough, but it's written as a 22 Sept *implementation report* for a specific enforcement task — it never states, up front, "here is what this agent may do / must stay deterministic / needs approval for" in one planning-style table, and it doesn't name the chosen use case. **What's left:** add (or extract into) a short planning table at the top, dated to reflect when the boundary was actually decided, referencing the resolved single use case.

**3 execution traces incl. one failure/recovery case** *(Week 5 · Owner: AEL)* — **brief minimum met 3 Oct; only optional extras remain**
The brief wants traces of the *real* agent loop, including a genuine failure and its recovery. `evaluation-table.md` has scenario-level results that gesture at this (e.g., a tool timeout that retried and succeeded), but those are traces of the scripted mock pipeline, not `react-agent.ts` running against a live model. **Updated 2 Oct — 2 of 3 captured** in [`../../evidence/traces/week-5-execution-traces.md`](../../evidence/traces/week-5-execution-traces.md): T1 live-model success (no tool called) and T2 a real failure/recovery (both providers failed → keyword fallback; provider-level, not tool-level). **Updated 3 Oct — now 6 captured:** T3 live Plan→Act→Observe with two tools, T4 a tool-level miss → two re-plans → safe decline, T5/T6 live customer-vs-staff parity on a refund-pressure prompt (both only drafted; nothing claimed done). Gemini's quota had reset; Anthropic is still out of credit. **Still not captured:** a run that hits `MAX_ITERATIONS`, and boundary Layer 2 tripping on a live model (the model refused correctly, so it had nothing to catch).

**Corpus/Source Register** *(Week 3 · Owner: AEL)*
**Updated 3 Oct — written, but it shows the gap.** [`../corpus-source-register.md`](../corpus-source-register.md) lists every published document with source type, date and passage count. The live corpus is **3 documents (1 substantive, 1 all-zero ticket report, 1 off-domain KFC menu) — below the brief's 10–50.** **Update 3 Oct:** 8 synthetic support articles are drafted in [`../corpus/`](../corpus/) (not uploaded). **What's left (admin action):** upload them, unpublish the KFC and empty Ticket Summary documents (→ 9 documents, one short of 10), and update the register.

**15-case RAG evaluation** *(Week 3 · Owner: QSL)*
**Updated 3 Oct — run on retrieval + keyword fallback only: 5 pass · 4 partial · 6 fail** ([`../rag-evaluation-15-case.md`](../rag-evaluation-15-case.md)); notably 0 of 5 unanswerable questions were declined. **Re-run 3 Oct after retrieval fixes: 10 pass · 4 partial · 1 fail** (not independent — fixes were tuned on these questions). **What's left:** re-run on a live model once a provider has capacity, and with a fresh question set after the new corpus is uploaded.

### 🟡 P2 — consolidation and evidence hygiene

**Trace/logging pipeline extended** *(Week 7 · Owner: DDL)*
`admin_activity_logs` already captures approval decisions and assignments with real structure — a solid foundation — but nothing yet logs the agent's own reasoning steps or tool calls now that the ReAct loop is live. **What's left:** extend the existing log table (or add a purpose-built one) to record each run's steps, latency, and outcome.

**Scenario coverage scaled toward 30+** *(Week 7 · Owner: QSL)*
The category shape is already right at 10 cases (see above); the brief's Week 7 minimum is 30+. **What's left:** add volume — more edge cases, more adversarial attempts, one failure case per tool — once the domain and live model are both settled, so the added cases aren't scenarios that need rewriting again later.

### 🟢 P3 — verify but don't chase

**ClickUp board confirmed and linked** *(Week 1 · Owner: PRL)*
Can't be verified from the repository alone — the brief lists ClickUp as primary evidence alongside GitHub and MUELE. **What's left:** confirm the board exists, backfill Weeks 1–4 tasks onto it retroactively so the evidence trail is consistent with the actual work timeline, and link it from the charter and every weekly report going forward.

---

## ❌ Not Completed

### 🔴 P0 — the one blocking gap

**Use-case decision recorded in writing** *(Week 1 · Owner: PRL)*
Everything else on this list — the charter, the user stories, the prompt spec rewrite, the evaluation scenarios — depends on one paragraph existing somewhere authoritative that states which single use case this project is: a customer/staff support-request triage agent, not procurement. **What's left:** write it, once, and reference it from the charter, the README, and the AI Boundary Matrix rather than leaving the decision implicit in "well, that's what the code does."

### 🟠 P1 — core rubric deliverables still missing

**Project Charter (2–3 pages)** *(Week 1 · Owner: PRL)*
Required Week 1 evidence — problem, user, pain point, AI value, scope, assumptions, constraints — and not found anywhere in any of the three repos. **What's left:** write it using the brief's minimum proposal statement as a skeleton; most of the substance (boundary matrix, tool list, domain) already exists elsewhere and just needs assembling into this one document.

**8–12 user stories + acceptance criteria** *(Week 1 · Owner: PRL)*
Not found in-repo. **What's left:** these can be derived retroactively from features that already work — e.g. "As a customer, I want to ask about my request's status without waiting for a reply" (backed by `outage_status_checker`), "As an admin, I want any AI-proposed action to sit in a queue I approve before anything changes" (backed by `agent_approvals`) — rather than invented from a blank page.

**Week 1 progress report** *(Week 1 · Owner: PRL)*
Not found — the earliest report on file is Week 2's. **What's left:** write it using the brief's §8 template, noting plainly that it was compiled retrospectively in Week 4 for evidence purposes, with the real completion date stated rather than silently backdated.

**Demonstration of memory affecting a real answer** *(Week 6 · Owner: AEL)*
**Done 9 Oct (one pair of live runs):** [`../../evidence/traces/week-6-memory-traces.md`](../../evidence/traces/week-6-memory-traces.md). **What's left:** repeat through the full chat route so the pending `agent_approvals` row is also captured, once a second provider works.

**Week 6 progress report** *(Week 6 · Owner: PRL)* — **Drafted 9 Oct**
[`../week-6-progress-report.md`](../week-6-progress-report.md) and [`../state-model.md`](../state-model.md). Commit links, ClickUp links and the individual-contributions table still need to be filled in by the lead.

**Repository/evidence trail fix** *(Week 8 · Owner: DDL)*
The outer `RESOLV_HQ` workspace has no commits, and the three sub-repos are staged as gitlinks with no `.gitmodules` — not functioning submodules. Since GitHub history is primary grading evidence, a grader trying to clone the project as presented would hit this immediately. **What's left:** either wire real submodules so a recursive clone works, or drop the wrapper-repo idea and document the 3-repo layout explicitly in a top-level README with links to each.

**Tagged release in each repo** *(Week 8 · Owner: DDL)*
Depends on everything above landing first — no point tagging a release that still describes the wrong domain or lacks a live model.

**Final engineering report (8–12 pages)** *(Week 8 · Owner: PRL)*
Depends on every earlier artifact (charter, model/prompt docs, RAG docs, tool catalogue, agent contract, memory note, evaluation results) existing to summarize — by design, this should be assembly and cross-referencing, not new writing, if the earlier weeks are closed out properly.

**Final evaluation/evidence pack** *(Week 8 · Owner: QSL)*
Depends on Week 7's 30+ scenario set, Failure Catalogue, and the real execution traces from Week 5.

**Presentation deck + rehearsed live demonstration** *(Week 8 · Owner: PRL + AIL)*
Depends on the domain fix and a genuinely live model being real by then — rehearsing a demo against the scripted mock would visibly fall apart under the "inspect what the AI/agent did" expectation the brief's §10 explicitly calls out.

### 🟡 P2 — important but sequenced after the above

**Failure Catalogue (≥5 failures, re-tested)** *(Week 7 · Owner: QSL)*
Not compiled yet, but the raw material already exists — "Known limitation" sections are scattered across `ai-boundary-matrix.md`, `function-calling-schemas.md`, `model-abstraction-and-rate-limiting.md`, `clarification-prompting-logic.md`, and `evaluation-table.md`, plus a new genuine one found during Week 4's tool testing: keyword-overlap retrieval can surface a coincidentally-matching article for an unrelated query instead of correctly reporting no grounding (see `docs/tool-failure-auth-test-evidence.md`). **What's left:** pull them into one catalogue, add any new failures found while scaling the eval set, and re-test each after a fix — this is compilation, not fresh investigation.

**Week 7 progress report** *(Week 7 · Owner: PRL)*
Future week; not yet due.

**ClickUp board fully closed out** *(Week 8 · Owner: PRL)*
Depends on the board existing and being kept current from Week 1 onward (see the Pending section above).

### 🟢 P3 — safe to skip unless time remains

**Baseline CI workflow (lint/typecheck/Docker build)** *(Week 7 · Owner: DDL)*
Nothing under `.github/` covers this across any of the three repos today. Good practice, but not a brief requirement — see the earlier "features not necessary" review. Only worth doing if everything above is already closed.

**Minimal E2E test suite** *(Week 7 · Owner: QSL)*
No automated test files exist in any repo. Same reasoning — a handful of manual, documented smoke tests satisfy the brief's "tests" line more efficiently than building an automated suite from scratch this late.

---

## Suggestions — priority-ordered path to finishing on time

1. ~~Lock the use-case decision in writing and rewrite `README.md`/`mock-console.ts`/the AI docs to match.~~ **Done 25 Sept** — see [`../domain-conflict-resolution.md`](../domain-conflict-resolution.md).
2. **First thing in Week 6 (P0, the one remaining blocker):** the key is registered but no provider has capacity (Anthropic out of credit, Gemini free tier exhausted). Fund one, confirm a live `/chat` call, then re-run the two missing Week 5 traces. Everything downstream — RAG grounding, evaluation, traces — still depends on it.
3. **Backfill Week 1 (P1):** Project Charter and 8–12 user stories — derive the stories from already-built features rather than inventing new ones. (The architecture diagram is now done — see item below.)
4. **Close the remaining documentation debt (P1):** the AI Boundary Matrix still needs its Week 1 planning-table framing. ~~Write the Agent Task Contract and extend the diagram.~~ **Done 2 Oct.** ~~Rewrite the prompt spec and evaluation table, label the Tool Catalogue, capture the failure/auth test evidence.~~ **Done 25 Sept** as part of the Week 4 close-out.
5. ~~**Wire customer memory into authenticated chat and integrate the console memory page**~~ **Implemented 8 Oct.** Remaining memory evidence: capture a real trace showing a remembered fact affecting a drafted answer while the approval gate remains in force.
6. **Scale evaluation and compile the Failure Catalogue (P2):** grow the 10-case table to 30+ against the real domain and live model, and pull the "Known limitation" notes already scattered across five implementation docs (now six, including the Week 4 test-evidence doc) into one catalogue with re-tests.
7. **Deliberately skip the P3 items unless time is left over:** CI pipeline and an automated E2E suite are good practice but aren't graded — a few manual smoke tests are enough.
8. **Week 8, last:** fix the git/submodule evidence trail before tagging anything, then assemble the final report and evidence pack — by this point it should be almost entirely pointers into documents that already exist from steps 1–6.
