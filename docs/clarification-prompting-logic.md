# Clarification Prompting Logic — Implementation Report

**Workstream:** RAG Engine & LLM Service Connectivity (agent behavior/governance) | **Date:** 22 Sep 2026

Covers the brief task: *"Clarification Prompting Logic — Implement structured logic that forces the agent to ask exactly one targeted clarifying question when incoming requests are too vague to route."* Checked first — nothing existed for this (`grep -i "clarif|vague|ambiguous"` across `resolv-hq-backend/src` returned no matches) — then implemented in `resolv-hq-backend`.

## Task

| Task | Status | Notes |
|---|---|---|
| **Clarification Prompting Logic** — force the agent to ask exactly one targeted clarifying question when a request is too vague to route. | ✅ Done (new) | `src/lib/clarification.ts`: a deterministic gate that runs in `generateAssistantReply()` (`lib/ai.ts`) *before* the LLM or the keyword-matching fallback ever sees the query. If the message is judged too vague, the function returns immediately with exactly one clarifying question — the model is never called for that turn, so there's no risk of it guessing, hallucinating a category, or asking more than one question. |

## Why "structured logic," not a prompt instruction

Consistent with this project's existing principle (see `docs/ai-boundary-matrix.md`): an instruction in the system prompt is not a guarantee. Rather than asking the model to *decide* when to clarify, the decision is made deterministically in code, before the model is even invoked — a model that would have "helpfully" guessed at an answer never gets the chance to for a vague message.

## How it decides "too vague to route"

A message is a clarification candidate only if **both**:
1. It has fewer than 6 words, **and**
2. It scores zero against the knowledge base (no grounded match at all).

Checked in that order deliberately — a long message, or one that already matched something in the knowledge base, is never treated as vague even if it happens to contain a phrase like "I have an issue" as part of something more specific (e.g. *"I have an issue with my last invoice"* correctly proceeds normally; *"I have an issue"* alone does not).

Requests that clearly want a request-status lookup (matches `/request|status/i` and the caller has open requests) skip the gate entirely — that intent is never ambiguous.

If the gate fires, it checks the message against a set of known vague-phrase patterns for a **targeted** question; if none match but the message is still short and ungrounded, it falls back to one generic clarifying question.

## No hardcoded values

Same pattern as the AI Boundary Matrix: every trigger phrase and its question is a row in a new `clarification_triggers` table, not a literal in the source. `routes/admin/clarification-triggers.ts` gives staff full CRUD (`GET`/`POST`/`PATCH`/`DELETE` on `/admin/clarification-triggers`), validates regex syntax before saving, and invalidates `lib/clarification.ts`'s 60-second in-process cache on every mutation so an edit takes effect on the next message, not after a redeploy. The only value that stayed in code is the 6-word length threshold — a structural parameter, not domain content, consistent with how `lib/llm/retry.ts`'s backoff settings were treated.

## Verification

Regex-tested the seeded triggers against 8 sample queries (no live DB call needed for this part — pure pattern logic):

| Query | Result |
|---|---|
| `"hi"` | Clarify — matched greeting pattern |
| `"I need help"` | Clarify — matched help pattern |
| `"it's broken"` | Clarify — matched broken pattern |
| `"I have a problem"` | Clarify — matched problem/issue pattern |
| `"I have an issue with my last invoice"` | **Proceeds normally** (8 words — not vague despite containing the phrase) |
| `"My internet keeps disconnecting every evening around 8pm"` | Proceeds normally (long, specific) |
| `"asdf"` | Clarify — generic fallback (short, no knowledge match) |
| `"password reset"` (given a nonzero knowledge score) | Proceeds normally (short, but grounded) |

All 8 behaved as intended, including the deliberate false-positive check (case 5), which is why the word-count/knowledge-score gate is checked before pattern-matching rather than after.

`tsc --noEmit` and `eslint` both pass clean on `resolv-hq-backend`; backend boots and answers `/health` correctly.

## SQL to run

```sql
create table clarification_triggers (
    id uuid primary key default uuid_generate_v4(),
    pattern text,
    question text not null,
    is_fallback boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz default now()
);

create index idx_clarification_triggers_is_active on clarification_triggers(is_active);

insert into clarification_triggers (pattern, question, is_fallback) values
  ('^(hi|hey|hello)[.! ]*$', 'Hi! What can I help you with today — a billing question, your account, or something not working as expected?', false),
  ('\b(help|need help)\b', 'Sure — could you tell me a bit more about what you need help with?', false),
  ('\b(it''?s broken|not working|something''?s wrong|doesn''?t work)\b', 'Sorry to hear that — what exactly isn''t working, and when did you first notice it?', false),
  ('\bi have (a |an )?(problem|issue)\b', 'I''d like to help — could you describe the specific problem you''re running into?', false),
  (null, 'Could you give me a bit more detail about what you need? For example, is this about billing, your account, or something not working as expected?', true);
```

## Known limitation

Untested against live model behavior (no provider API key registered yet, per `model-abstraction-and-rate-limiting.md`) — verified only against the deterministic gate logic itself, which is by design the part that doesn't depend on the model at all. Worth a follow-up pass once a real conversation is flowing through it, to see whether the 6-word threshold and seeded phrases need tuning against real customer phrasing.
