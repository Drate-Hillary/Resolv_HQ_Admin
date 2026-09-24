# Week 3 — Context Engineering and RAG

**Brief dates:** 14–18 Sept 2026 | **Status today (24 Sept):** pipeline works, evidence artifacts are incomplete.

## What the brief asks for

- A controlled corpus (10–50 documents/records) with recorded provenance.
- Ingestion, chunking/segmentation, indexing, retrieval implemented.
- Model context built from retrieved evidence, with sources shown.
- At least 15 RAG test questions: answerable, partially answerable, deliberately unanswerable.
- At least 3 documented retrieval/grounding failures and their causes.

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Controlled corpus | ⚠️ | `help_articles` / `knowledge_documents` tables exist and are wired into the assistant's context (per `docs/database-schema.md`, `resolv-hq-backend/docs/system-prompt-spec.md`) — but there's no standalone **Corpus/Source Register** listing each document's title, source, and provenance, and no confirmed count against the brief's 10–50 recommendation. |
| Retrieval + indexing | ✅ | `answerQuestion()`/`scoreArticle()` in `lib/ai.ts` does keyword-ranked retrieval over published knowledge documents — not vector/embedding-based, but the brief does not require a vector store, only "retrieval." This satisfies the minimum. (A vector store is tracked separately as internal Task 13/14 — treat as optional polish, not a brief requirement.) |
| Source grounding | ✅ | `prompt-specification.md` requires every factual claim to carry a document + section citation; `system-prompt-spec.md` requires the same. |
| Unsupported-answer handling | ✅ | Both the prompt spec and the clarification gate (`docs/clarification-prompting-logic.md`) require "the knowledge base doesn't cover this" instead of a guess. |
| RAG architecture diagram | ❌ | Not found — extend the Week 1 architecture diagram with the retrieval path instead of starting a new one. |
| 15-case RAG evaluation | ❌ | Only the Week 2 10-case *prompt* evaluation exists; no separate 15-question RAG-specific set (answerable / partial / unanswerable) has been run. |
| 3 documented retrieval failures | ⚠️ | Partial material exists inside `evaluation-table.md` (case 5: a false premise wasn't verified before reasoning; case 3: correctly reported "no matching source") but nothing is compiled as a dedicated failure list yet. |
| Week 3 report | ⚠️ | Four detailed per-person task-breakdown reports exist (`docs/week-3-hillary.md`, `-iryn.md`, `-opis.md`, `-yawe.md`, sourced from `docs/week-3-report.docx`) — good raw evidence, but the brief expects **one** short weekly report from the group leader (§8). Keep the four as an appendix; write one consolidated summary as the actual Week 3 report. |

## Action plan

1. **Write a Corpus/Source Register**: one row per `help_articles`/`knowledge_documents` entry — title, source (public/team-authored/synthetic), date added, and a one-line provenance note. Confirm the count sits in the brief's 10–50 range; add or trim as needed.
2. **Extend the architecture diagram** (from Week 1) with the retrieval path: ingestion → storage → keyword ranking → context assembly → citation.
3. **Write 15 RAG test questions** — 5 clearly answerable from the corpus, 5 partially answerable (grounded but incomplete), 5 deliberately unanswerable — and run them once the Week 2 live-model gap is closed, recording expected vs. actual.
4. **Compile 3 documented retrieval/grounding failures**: reuse eval case 5 (unverified false premise) as failure #1, and produce two more from the new 15-case run — for each, state the cause (e.g., "corpus lacked a section on X," "keyword ranking picked the wrong article because Y").
5. **Consolidate the four Week 3 person-reports into one canonical `docs/week-3-progress-report.md`** in the brief's §8 format (work completed, key decisions, failures, links, individual contributions, next-week plan), keeping the four detailed docs as backing appendices.

## Deliverables checklist

- [ ] Corpus/Source Register
- [ ] RAG architecture diagram (extended from Week 1)
- [ ] 15-case RAG evaluation results
- [ ] 3 documented retrieval/grounding failures with causes
- [ ] One consolidated Week 3 progress report
