# Task Tracker — Weeks 1–8, by Status and Priority

**Compiled:** 24 Sept 2026 (Week 4 of 8) | **Consolidates:** [`week-1.md`](./week-1.md) – [`week-8.md`](./week-8.md)

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

**Failure/authorization test evidence captured** *(Week 4 · Owner: QSL)*
[`../tool-failure-auth-test-evidence.md`](../tool-failure-auth-test-evidence.md) — real, executed output (via `tsx` against the actual `agent-tools.ts`, not a hypothetical description) for a missing-required-parameter call, a cross-customer authorization check, an unrecognized-tool call, and an ungrounded query. Also surfaced a genuine keyword-overlap retrieval weakness along the way, logged for the Week 7 Failure Catalogue.

**Architecture diagram — first version** *(Weeks 1/3/4 · Owner: AIL)*
[`../architecture-diagram.md`](../architecture-diagram.md) — no diagram existed anywhere in the workspace before this; now covers client surfaces through the LLM gateway, ReAct loop, the four agent tools, the boundary matrix, and the approval queue, in Mermaid so it can be extended in place. Counts as done for Weeks 1/3/4's asks; **still needs the Week 5 extension** (expanding the ReAct node into its own five-phase subgraph) — tracked in Pending below rather than closed outright, since the brief expects this diagram to keep growing through Week 7.

**Multi-step bounded agent loop (Sense→Plan→Act→Observe→Respond)** *(Week 5 · Owner: AEL)*
This is the brief's Week 5 centerpiece — a workflow where the system decides among approved next actions itself, rather than following a fixed script. `react-agent.ts`'s `runReActLoop()` implements the full cycle and is called from `generateAssistantReply()` in place of the old single-shot completion call. Notably, this was built and committed on 22 Sept — a full week ahead of its nominal slot.

**Iteration cap / safe stop condition** *(Week 5 · Owner: AEL)*
A bounded agent has to know when to stop, not just when to act. `MAX_ITERATIONS = 4` caps the loop; hitting it returns a safe "I wasn't able to work through this fully" message instead of looping indefinitely or guessing to force an answer.

**Approved tool set enforced (no open-ended execution)** *(Week 5 · Owner: QSL)*
The loop can only ever call the four registered, read-only tools — there's no code path for it to reach outside that set, which is what keeps "bounded" true rather than aspirational.

**Human hand-off/approval built into the loop itself** *(Week 5 · Owner: QSL)*
Anything the agent drafts mid-loop (an escalation ticket) routes to the same `agent_approvals` queue as everything else — the loop's autonomy stops at "propose," never "execute."

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

### 🟢 P3 — baseline housekeeping

**GitHub repositories created with real commit history** *(Week 1 · Owner: DDL)*
The brief's minimum Week 1 evidence includes a functioning GitHub setup. All three repos exist; `resolv-hq-backend` in particular has 10+ commits spread across named feature/fix branches (`feat/ReAct-implement`, `fix/ai-boundary-matrix`, etc.) — genuine incremental history, not one dump commit. (This is separate from the *outer* workspace's git problems — see the Not Completed section.)

---

## 🟡 Pending (real progress exists, not finished)

### 🔴 P0 — do these before anything else

**Register a real model API key and confirm one live call** *(Week 2 · Owner: AEL)*
All the plumbing for a live model call exists (see Completed above) but `system-prompt-spec.md` states outright that no provider API key has been registered or exercised — every response today still falls back to `answerQuestion()`'s keyword matching. **What's left:** add a real Anthropic key via the `/providers` admin page, send one real message through `/chat`, and confirm the response's `providerName`/`model` fields show a live call rather than the fallback. This single step is what makes every later week's evaluation and tracing work meaningful rather than theoretical.

### 🟠 P1 — core rubric items, real work started

**AI Boundary Matrix as a Week 1 planning artifact** *(Week 1 · Owner: PRL)*
The brief wants the boundary matrix drafted early, as a scoping decision, not discovered after the fact. `ai-boundary-matrix.md` exists and is genuinely thorough, but it's written as a 22 Sept *implementation report* for a specific enforcement task — it never states, up front, "here is what this agent may do / must stay deterministic / needs approval for" in one planning-style table, and it doesn't name the chosen use case. **What's left:** add (or extract into) a short planning table at the top, dated to reflect when the boundary was actually decided, referencing the resolved single use case.

**3 execution traces incl. one failure/recovery case** *(Week 5 · Owner: AEL)*
The brief wants traces of the *real* agent loop, including a genuine failure and its recovery. `evaluation-table.md` has scenario-level results that gesture at this (e.g., a tool timeout that retried and succeeded), but those are traces of the scripted mock pipeline, not `react-agent.ts` running against a live model. **What's left:** once the live model is confirmed, run three real conversations and save the full traces (messages, tool calls, iteration counts).

**Architecture diagram — Week 5 extension** *(Week 5 · Owner: AIL)*
The diagram now exists (`docs/architecture-diagram.md`, see Completed) with the client/gateway/tools/boundary/approval layers drawn. **What's left:** expand the `ReAct` node into its own subgraph showing the five-phase Sense→Plan→Act→Observe→Respond cycle and the `MAX_ITERATIONS` stop condition explicitly, per the Agent Task Contract — a small addition to the existing file, not a redraw.

**Persistent memory wired into the agent's context** *(Week 6 · Owner: AEL)*
This is the one item on the whole tracker that's still a genuine, non-trivial code task rather than documentation or evidence-capture. `customer_memory_facts` exists as a table, but `system-prompt-spec.md` says plainly it "isn't in the assistant's context yet." **What's left:** extend whatever loads a caller's context in `chat.ts`/`ai.ts` to also pull their approved memory facts into the prompt, following the same "informative, never authorizing" rule the spec already lays out for when this gets added.

### 🟡 P2 — consolidation and evidence hygiene

**3 documented retrieval/grounding failures** *(Week 3 · Owner: QSL)*
The brief wants at least three real, explained retrieval failures, not just passing test cases. `evaluation-table.md`'s case 5 (a false premise the model didn't verify before reasoning) already qualifies as one. **What's left:** find two more (easiest source: the 15-case RAG eval once it's written) and compile all three into their own short artifact with the cause stated for each.

**Week 3 report consolidated to one file** *(Week 3 · Owner: PRL)*
Four detailed, high-quality task-breakdown reports exist (`week-3-hillary.md`, `-iryn.md`, `-opis.md`, `-yawe.md`), but the brief's §8 format expects one short report from the group leader. **What's left:** write one 1–2 page summary in the brief's format, keeping the four detailed docs as backing appendices rather than discarding them.

**Duplicate Week 2 report reconciled** *(Week 2 · Owner: PRL)*
`resolv-hq/week 2 report.md` (repo root) and `resolv-hq/docs/week-2-progress-report.md` both exist and may have drifted apart. **What's left:** pick one as canonical, merge anything useful from the other, and remove or clearly archive the duplicate before it becomes a "which one is real" question during grading.

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

**Corpus/Source Register** *(Week 3 · Owner: AEL)*
The brief wants a record of every document in the corpus, its source, and its provenance. `help_articles`/`knowledge_documents` exist and are used, but nothing lists them with provenance as a standalone artifact. **What's left:** one row per document — title, source type (public/team-authored/synthetic), date added — and a confirmed count within the brief's recommended 10–50 range.

**RAG architecture diagram** *(Week 3 · Owner: AEL)*
Not found. **What's left:** extend the Week 1 diagram with the retrieval path specifically (ingestion → storage → ranking → context assembly → citation) rather than drawing a separate one.

**15-case RAG evaluation** *(Week 3 · Owner: QSL)*
Only the Week 2 10-case *prompt* evaluation exists; no separate RAG-specific set exists. **What's left:** 5 answerable, 5 partially answerable, 5 deliberately unanswerable questions, run once the live model is confirmed, with expected vs. actual recorded for each.

**Week 4 progress report** *(Week 4 · Owner: PRL)*
Due before this week closes (25 Sept) and not yet written. **What's left:** write it using the domain-conflict resolution as the week's headline "key engineering decision and why" — it's a genuinely good story to tell honestly.

**Agent Task Contract** *(Week 5 · Owner: AEL)*
The brief wants goal/tools/state/limits/stop-conditions stated as one formal contract. The content already exists informally, split across `react-loop-core.md` and `ai-boundary-matrix.md`. **What's left:** consolidate it into one named document — this is assembly, not new design work.

**Memory Design and Data Handling Note** *(Week 6 · Owner: QSL)*
Blocked on the memory-wiring code task above landing first. **What's left, once that's done:** document what's stored (approved preference facts), why, who can access it (RLS-scoped to the owning customer), retention, and deletion.

**Demonstration of memory affecting a real answer** *(Week 6 · Owner: AEL)*
Same blocker. **What's left:** one captured trace showing a remembered fact visibly changing a drafted response, while the approval gate still applies — memory should inform, never silently authorize.

**MCP-style interface specification** *(Week 6 · Owner: AIL)*
Not written, but mostly a documentation task: the four tools already have clean input/output schemas in `function-calling-schemas.md`. **What's left:** restate them as capability/input/output/permissions/security-boundary entries — satisfies the brief's "OR document an MCP-style interface" option without building an actual external MCP server.

**Week 6 progress report** *(Week 6 · Owner: PRL)*
Future week; not yet due.

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
2. **This week (P0, the one remaining blocker):** register one real model API key and confirm a live `/chat` call actually reaches it. Everything downstream — RAG grounding, evaluation, traces — is still meaningless to finish against a fallback that isn't a real model call.
3. **Backfill Week 1 (P1):** Project Charter and 8–12 user stories — derive the stories from already-built features rather than inventing new ones. (The architecture diagram is now done — see item below.)
4. **Close the remaining documentation debt (P1):** the AI Boundary Matrix still needs its Week 1 planning-table framing, and the Agent Task Contract still needs writing. ~~Rewrite the prompt spec and evaluation table, label the Tool Catalogue, capture the failure/auth test evidence.~~ **Done 25 Sept** as part of the Week 4 close-out.
5. **Wire memory into the agent's context (P1):** this is the one remaining piece of *code* work standing between the project and a fully-covered brief — everything else left is documentation, evaluation volume, or evidence capture.
6. **Scale evaluation and compile the Failure Catalogue (P2):** grow the 10-case table to 30+ against the real domain and live model, and pull the "Known limitation" notes already scattered across five implementation docs (now six, including the Week 4 test-evidence doc) into one catalogue with re-tests.
7. **Deliberately skip the P3 items unless time is left over:** CI pipeline and an automated E2E suite are good practice but aren't graded — a few manual smoke tests are enough.
8. **Week 8, last:** fix the git/submodule evidence trail before tagging anything, then assemble the final report and evidence pack — by this point it should be almost entirely pointers into documents that already exist from steps 1–6.
