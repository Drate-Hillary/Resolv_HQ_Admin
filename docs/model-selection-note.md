# Model Selection Note

**Project:** RESOLV-HQ | **Author:** Person 1 (Integration Lead) | **Date:** 11 Sep 2026

## Recommendation

**Primary model: Claude Sonnet 5** (`claude-sonnet-5`), via the Claude API.
**Secondary (optional, cost-tiering): Claude Haiku 4.5**, for low-stakes, high-volume paths (e.g. simple FAQ/status lookups) where Sonnet-level reasoning isn't needed.

## Capability

The agent loop RESOLV-HQ runs (retrieve → plan → call a read-only tool → observe → decide → stop for approval) needs a model that is reliable at three things simultaneously: structured tool-calling, staying grounded in retrieved knowledge-base text rather than its own priors, and following a hard boundary matrix (no refund, no billing/account change, no cancellation, no deletion — see `docs/ai-boundary-matrix.md`) without being talked out of it by an in-conversation request. Claude Sonnet 5 handles multi-step agentic tool use natively (the same tool-use API the console's `/tools` registry is designed against), supports a context window large enough to hold retrieved knowledge-base chunks plus recent turns plus memory records without aggressive truncation, and is consistently strong at instruction-following under adversarial pressure — directly relevant given the adversarial category already defined in the evaluation table (`docs/evaluation-table.md`: prompt injection, system-prompt extraction, role-play jailbreaks).

## Cost

Sonnet sits in the mid tier of the Claude lineup: meaningfully cheaper per token than Opus-class models, at a level appropriate for a support-request-triage workload that is high-volume but not research-grade reasoning. Where volume matters more than reasoning depth (e.g. routing a ticket, confirming an account status), the architecture can route to Haiku 4.5 instead and reserve Sonnet for turns that touch knowledge-base grounding or an approval decision — see current Anthropic pricing for exact per-token rates, which change over time and shouldn't be hard-coded into this note.

## Latency

Sonnet's interactive latency is well within the budget this UI already assumes — the console's own dashboard stats and per-scenario latencies in `docs/evaluation-table.md` (0.9s–4.2s, including tool-failure retries) are consistent with a Sonnet-class model doing one to three tool calls per turn. Haiku is faster still and is the better choice specifically where a sub-second response matters more than depth.

## Privacy

Enterprise API access does not train on customer prompts/completions by default, and supports configurable data retention. That matters here because retrieved context routinely includes the caller's own case history, request details, and (on the chat/admin side) customer contact information — content that must not be retained beyond what the product needs or used to improve a third party's model.

## Access

Available directly via the Anthropic API (what this integration targets first), with the same model also reachable through Bedrock/Vertex if the deployment later needs to sit inside an existing cloud governance boundary rather than a direct API key. This flexibility avoids a re-integration if the hosting requirement changes after Week 2.

## Why this fits the RAG + read-only-tool architecture

The system is deliberately bounded: the model only ever *reads* (knowledge-base articles, the caller's own account/request records, memory) and *drafts* (an escalation ticket) — it never mutates state directly. That means the model doesn't need to be optimized for autonomous execution; it needs to be optimized for **grounded answers it can cite, correct tool selection among a small fixed set, and a clean refusal/escalation habit when the retrieved context doesn't support an answer or the action requires human sign-off.** Sonnet 5 is the best fit on that specific profile among the currently available Claude models — strong enough to reason over multi-document retrieval and multi-step tool plans, calibrated enough to decline rather than fabricate, without paying for Opus-level cost on a bounded, read-only task.
