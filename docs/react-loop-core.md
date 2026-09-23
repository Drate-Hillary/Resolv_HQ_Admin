# ReAct Loop Core Implementation — Report

**Workstream:** RAG Engine & LLM Service Connectivity | **Date:** 22 Sep 2026

Covers the brief task: *"ReAct Loop Core Implementation — Program the agent's Sense-Plan-Act-Observe-Respond cycle to manage multi-turn reasoning steps effectively."* Checked first — nothing existed (the chat path was single-turn RAG: one context bundle stuffed into one prompt, one completion, done; the admin console's "Agent Workspace" is a scripted UI demo per `docs/system-prompt-spec.md` §2, not a real loop). Implemented in `resolv-hq-backend`.

## Task

| Task | Status | Notes |
|---|---|---|
| **ReAct Loop Core Implementation** — Sense-Plan-Act-Observe-Respond cycle for multi-turn reasoning. | ✅ Done (new) | `src/lib/react-agent.ts`'s `runReActLoop()`, called from `generateAssistantReply()` (`lib/ai.ts`) in place of the old single-shot completion call. |

## The cycle, concretely

| Phase | What it is here |
|---|---|
| **Sense** | The caller's message plus everything already loaded for them (`knowledge_documents`, their own `requests`) — built once by `lib/ai.ts` before entering the loop, same as before. |
| **Plan** | The model itself decides, every iteration, whether it has enough to answer or needs a tool — a real decision made through native tool-calling, not a scripted branch. |
| **Act** | If the model asked for a tool, the loop actually executes it (`lib/agent-tools.ts`). Every tool is read-only — consistent with the AI Boundary Matrix (`docs/ai-boundary-matrix.md`), nothing here ever changes state. |
| **Observe** | The tool's result is appended to the conversation as a `tool`-role message; the loop goes back to Plan with it in context. |
| **Respond** | Once the model answers with plain content instead of another tool call, that's the final response — or a hard `MAX_ITERATIONS` (4) cap is hit first, in which case the loop stops and returns a safe "I wasn't able to work through this fully" message rather than looping forever. |

## Tools available to the Act step

Two, both read-only, both operating only on data already scoped to the caller (nothing fetches outside what `chat.ts` already loaded for this specific customer):

- **`search_knowledge_base(query)`** — keyword-ranks the caller's published knowledge documents and returns the top 3 excerpts.
- **`check_request_status()`** — returns the caller's own request(s) and their status.

## What had to change to make this real

The existing `LlmClient` interface (`lib/llm/types.ts`) only supported a single request → single text response — no way to represent "the model wants to call a tool." Extended:

- `LlmMessage` is now a real discriminated union (`system` / `user` / `assistant` with optional `toolCalls` / `tool` with a `toolCallId`) instead of a single flat shape.
- `LlmClient.complete()` takes an optional `tools` array and its result can carry `toolCalls` instead of `content`.
- **`providers/openai.ts`** and **`providers/anthropic.ts`** both implement the actual wire-format translation — OpenAI's `tool_calls`/`tool_call_id` shape and Anthropic's `tool_use`/`tool_result` content-block shape are meaningfully different, so each provider owns its own mapping; nothing above `LlmClient` needs to know which one is in use (the Model Abstraction Layer guarantee still holds).
- **`gateway.ts`** now only caches a *final* answer — a turn where the model asks for a tool is one step of a stateful loop, not a standalone cacheable result.

## Verification

- `tsc --noEmit` and `eslint` both pass clean on `resolv-hq-backend` (caught and fixed a real bug along the way: my first `LlmMessage` union merged `system`/`user` into one variant, which silently broke TypeScript's discriminated-union narrowing — split into separate variants).
- `executeAgentTool()` smoke-tested directly (no LLM needed for this part): knowledge search returns the matching article, returns "no matching articles" for an unrelated query, request-status returns the caller's own request, and an unknown tool name degrades to a clear message instead of throwing.
- Backend boots and answers `/health` correctly with the new loop wired in.

## Known limitation

**Not yet exercised against a live LLM's actual tool-calling behavior** — no provider API key is registered yet (same standing caveat as `model-abstraction-and-rate-limiting.md`, `ai-boundary-matrix.md`, and `clarification-prompting-logic.md`). The message-shape conversions are verified by TypeScript against the real `openai` and `@anthropic-ai/sdk` request/response types, but a live model's actual tool-selection behavior, when it chooses to loop versus answer directly, and whether 4 iterations is the right ceiling are all things to watch once a real key is registered.
