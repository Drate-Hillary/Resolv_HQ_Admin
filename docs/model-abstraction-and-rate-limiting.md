# Model Abstraction Layer & Rate Limiting — Implementation Report

**Workstream:** RAG Engine & LLM Service Connectivity | **Date:** 21 Sep 2026

Covers two related brief tasks implemented together in `resolv-hq-backend`: the LLM provider wrapper, and the resilience layer (retries, caching, rate limiting) built on top of it.

## Tasks

| Task | Status | Notes |
|---|---|---|
| **Model Abstraction Layer Integration** — Implement a flexible model wrapper to allow seamless swapping between LLM providers without rewriting agent code. | ✅ Done | New `src/lib/llm/` module: a single `LlmClient` interface (`types.ts`) with one implementation per provider (`providers/openai.ts` via the `openai` SDK, `providers/anthropic.ts` via `@anthropic-ai/sdk`). `gateway.ts`'s `completeWithFallback()` is the one entry point agent/chat code calls — it reads the `agent_providers` table (already-registered providers, oldest-first) and tries each active row until one succeeds. Registering, disabling, or adding a provider in the `/providers` admin page changes behavior without touching any calling code. `lib/ai.ts` gained `generateAssistantReply()`, which calls the gateway with a system prompt built from `knowledge_documents` + the caller's own requests, falling back to the existing deterministic keyword-matching (`answerQuestion`) if no provider is active or every call fails — `routes/chat.ts` now calls this instead of the old synchronous keyword-only logic. `google`/`custom` providers are registerable but have no client implementation yet; the gateway skips them with a clear message and moves to the next active provider. |
| **Rate Limiting & Retry Logic Engine** — Build exponential backoff and error-handling pipelines for handling API rate limits, timeouts, and gateway failures. | ✅ Done | Three parts, all in `resolv-hq-backend`: (1) `lib/llm/retry.ts` — each provider call inside the gateway is retried up to 3 times with exponential backoff (500ms → 1s → 2s), but only for transient errors (HTTP 429/5xx, timeout/connection errors); anything else fails immediately rather than wasting retries. (2) `lib/llm/gateway.ts` caching — an identical request (SHA-256 hash of the message array) served from Redis for 10 minutes never reaches a provider at all. (3) `middleware/rate-limit.ts` — Redis-backed fixed-window limiter (`INCR`/`PEXPIRE`), keyed per authenticated user, wired in `app.ts`: 300 req/5min globally, 20 req/min specifically on `/chat` (the route that calls the LLM gateway). Both the cache and the limiter **fail open** on a Redis error (logged, not thrown) rather than taking the API down. |

## Infrastructure changes

- **New dependencies:** `openai`, `@anthropic-ai/sdk`, `ioredis` (`resolv-hq-backend/package.json`).
- **`docker-compose.yml`:** added a `redis` service; the `backend` service now depends on it and gets `REDIS_URL=redis://redis:6379` injected automatically.
- **`.env.example`:** documents `REDIS_URL` (defaults to `redis://localhost:6379` for bare `npm run dev`, outside Docker).

## Verification

- `tsc --noEmit` and `eslint` both pass clean on `resolv-hq-backend`.
- Backend boots and answers `/health` correctly with Redis unreachable, confirming the fail-open behavior rather than a hard dependency.
- **Not yet exercised against a live Redis or a real provider API key** — this machine doesn't have Redis running locally and Docker Desktop's daemon wasn't started at implementation time. `docker compose up` (once Docker's daemon is running) brings up Redis automatically; outside Docker, `docker run -p 6379:6379 redis:alpine` works too.

## Plan for next steps

1. Start Redis (via Docker or locally) and confirm rate-limit headers (`X-RateLimit-Limit`/`X-RateLimit-Remaining`) and cache hits (`cached: true` in the gateway result) behave as expected under real traffic.
2. Register a real OpenAI or Anthropic API key on `/providers` and confirm `generateAssistantReply()` returns a live model response instead of falling back to keyword matching.
3. Add a `google` (or other) provider client implementation once that provider is actually needed — the registry and gateway already support it structurally, only `providers/google.ts` + a `gateway.ts` case are missing.
4. Consider whether the global 300 req/5min and chat-specific 20 req/min limits need tuning once real usage patterns are observed.
