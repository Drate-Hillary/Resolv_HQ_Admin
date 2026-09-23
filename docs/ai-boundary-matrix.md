# AI Boundary Matrix — Implementation Report

**Workstream:** Human-in-the-Loop Dashboard Integration (governance/guardrails) | **Date:** 22 Sep 2026

Covers the brief task: *"AI Boundary Matrix Prompt Guardrails — Encode system instruction constraints preventing the LLM from attempting state-changing actions (e.g., executing refunds or updating account data)."* Implemented in `resolv-hq-backend` as two layers, since a prompt is an instruction, not a guarantee.

## Tasks

| Task | Status | Notes |
|---|---|---|
| **AI Boundary Matrix Prompt Guardrails** — Encode system instruction constraints preventing the LLM from attempting state-changing actions. | ✅ Done | Two layers, both live in `generateAssistantReply()` (`src/lib/ai.ts`), the one path every chat message goes through. |

### Layer 1 — Prompt-level constraint (pre-existing)

`src/lib/prompts/system-prompt.ts` (`SYSTEM_PROMPT_VERSION = "v1.0"`), specified in full in `docs/system-prompt-spec.md`. Defines the assistant's identity, in/out-of-scope behavior, and 9 strict compliance rules — rule 2, **"No fabricated actions,"** is the boundary matrix itself: *"Never claim to have processed, refunded, cancelled, updated, or deleted anything. Offer to open a request; a human completes the action."* Out-of-scope actions are enumerated explicitly (§4): refunds, billing changes, cancellations, account/credential changes, data export or deletion.

### Layer 2 — Structural backstop (new)

`src/lib/ai-boundary.ts`: a deterministic check on the model's *actual output*, independent of whether it followed the prompt. `detectBoundaryViolation()` scans the response for first-person claims of having performed a blocked action, scoped to the exact same four categories as the spec's out-of-scope list:

| Category | Example phrasing it catches |
|---|---|
| Refund/billing change | "I've processed your refund of $20." |
| Cancellation | "I've cancelled your subscription." |
| Account/credential change | "I have updated your account email." |
| Data export or deletion | "I've deleted your data as requested." |

If a violation is detected, `generateAssistantReply()` discards the model's response, substitutes a safe fallback ("I can help get that started, but I'm not able to complete it myself — actions like this always go through a support request that a person reviews and carries out. Want me to open one for you?"), and logs the category + matched text via `console.warn` for visibility. The step narration returned to the frontend also reflects it (`"Blocked a boundary-matrix violation"`).

## Why two layers

The project's own Week 2 finding was explicit: *"Treat the AI Boundary Matrix as non-negotiable and enforce it structurally, not just in the prompt."* Layer 1 tells the model what it may never claim; Layer 2 catches it if the model ignores that instruction anyway — a prompt failure can't turn into an actual unauthorized claim reaching the customer.

## Verification

Smoke-tested `detectBoundaryViolation()` against 6 cases:

- 4 fabricated-action phrasings (one per category above) — all correctly caught.
- 2 compliant responses ("a specialist will follow up soon", "I can open a support request for this refund") — both correctly passed through, no false positives.

`tsc --noEmit` and `eslint` both pass clean on `resolv-hq-backend`.

## Known limitation

The detector is a small set of first-person regex patterns, deliberately narrow — a missed paraphrase is an acceptable gap for a backstop layer, but a false positive blocking a legitimate answer is not. It has not been tested against a live LLM's actual phrasing variety (no provider API key registered/exercised yet, per `model-abstraction-and-rate-limiting.md`), only against hand-written test cases. Worth revisiting once real model output is flowing through it.
