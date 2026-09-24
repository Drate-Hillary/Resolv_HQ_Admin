# Week 8 — Hardening, Final Release and Demonstration

**Brief dates:** 19–23 Oct 2026 | **Presentations:** 27/29/30 Oct 2026

## What the brief asks for

- Review requirements, architecture, model/prompt behaviour, RAG, tools, agent limits, memory, tests, security, documentation.
- Fix critical defects; document known remaining limitations.
- A deployed or reproducibly runnable tagged release.
- Final engineering report (8–12 pages, excluding appendices).
- Final evaluation/evidence pack.
- Presentation deck and live demonstration.
- Completed ClickUp board and final repository evidence.

## What has to be true going into this week for it to be achievable

By the end of Week 7, all of the following need to already be closed (this week has no slack for open build work):

- A single, consistently-described use case across README, docs, and code (Week 4).
- A live model wired and exercised (Week 2).
- 30+ evaluated scenarios and a compiled Failure Catalogue (Week 7).
- A working memory demonstration (Week 6).
- Real execution traces for the agent loop (Week 5).

If any of these are still open going into Week 8, they take priority over new polish — a smaller, fully-consistent system demonstrates better than a larger, contradictory one, per the brief's own scoring emphasis on explainability over scale.

## Action plan

1. **Fix the repository evidence trail first.** The outer `RESOLV_HQ` workspace currently has no commits and the three sub-repos are staged as broken gitlinks with no `.gitmodules`. Either wire real Git submodules so `git clone --recurse-submodules` reproduces the whole system, or drop the wrapper repo idea and clearly document in a top-level README that the system is three independently-tagged repos with links to each. Do this before tagging anything — a broken clone is a bad first impression for graders using GitHub as primary evidence.
2. **Cut a tagged release in each repo** (`resolv-hq`, `resolv-hq-backend`, `resolv-hq-customer`) with working run instructions verified from a clean checkout — not just "worked on my machine."
3. **Fix critical defects surfaced by Week 7's Failure Catalogue re-tests**; for anything not fixed, document it plainly as a known limitation rather than hiding it — the brief's demonstration expectation explicitly wants a real failure shown, not just a happy path.
4. **Write the final engineering report (8–12 pages)** using the brief's §9 template — by this point every section should be a pointer/summary into an already-written doc rather than new writing:
   - §3 Architecture → the diagram maintained since Week 1.
   - §4 Model/Prompt → `model-selection-note.md` + `prompt-specification.md` (post-rewrite).
   - §5 RAG → the Corpus/Source Register + RAG diagram + 15-case results (Week 3).
   - §6 Tools/Agent → the Tool Catalogue + Agent Task Contract (Weeks 4–5).
   - §7 Memory/Interop → the Memory Design Note + MCP-style spec (Week 6).
   - §8 Evaluation/Guardrails → the 30+ scenario set + Failure Catalogue (Week 7).
5. **Assemble the final evaluation/evidence pack**: all traces under `evidence/traces/`, screenshots under `evidence/screenshots/`, and a demo script/recording under `evidence/demo/` — adopting the brief's recommended `evidence/` layout now, even if it wasn't used earlier, makes this pack far easier to hand to a grader.
6. **Prepare the 12–15 minute demo** per the brief's §10 structure: problem/justification (~2 min) → architecture progression (~2 min) → live successful workflow (~4 min) → one evidence view, e.g. a real trace (~2 min) → one real failure + recovery (~2 min) → guardrails and lessons (~2 min). Rehearse the live workflow against the real backend, not the scripted mock — by this week that should no longer be a distinction that exists.
7. **Close out the ClickUp board** — every week's tasks marked complete or explicitly carried over with a reason, linked from the final report.

## Deliverables checklist

- [ ] Repository/evidence trail fixed (real submodules or documented 3-repo structure)
- [ ] Tagged, reproducibly-runnable release in each repo
- [ ] Critical defects fixed; remaining limitations documented
- [ ] Final engineering report (8–12 pages)
- [ ] Final evaluation/evidence pack (`evidence/traces`, `screenshots`, `demo`)
- [ ] Presentation deck + rehearsed live demonstration
- [ ] ClickUp board fully closed out
