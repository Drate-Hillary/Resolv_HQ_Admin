import type { ModelConfig } from "./models.js"
import { TRIAGE_SYSTEM_PROMPT } from "./dataset.js"

export interface ProviderResult {
  rawText: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

export interface ProviderError {
  error: string
  latencyMs: number
}

export type CallResult = { ok: true; result: ProviderResult } | { ok: false; result: ProviderError }

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const start = performance.now()
  const value = await fn()
  return { value, latencyMs: performance.now() - start }
}

async function callOpenAI(model: ModelConfig, ticket: string): Promise<CallResult> {
  try {
    const { default: OpenAI } = await import("openai")
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { value: response, latencyMs } = await timed(() =>
      client.chat.completions.create({
        model: model.modelId,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: TRIAGE_SYSTEM_PROMPT },
          { role: "user", content: ticket },
        ],
      }),
    )
    return {
      ok: true,
      result: {
        rawText: response.choices[0]?.message?.content ?? "",
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        latencyMs,
      },
    }
  } catch (err) {
    return { ok: false, result: { error: err instanceof Error ? err.message : String(err), latencyMs: 0 } }
  }
}

async function callClaude(model: ModelConfig, ticket: string): Promise<CallResult> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk")
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { value: response, latencyMs } = await timed(() =>
      client.messages.create({
        model: model.modelId,
        max_tokens: 512,
        system: TRIAGE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: ticket }],
      }),
    )
    const textBlock = response.content.find((block) => block.type === "text")
    return {
      ok: true,
      result: {
        rawText: textBlock && textBlock.type === "text" ? textBlock.text : "",
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latencyMs,
      },
    }
  } catch (err) {
    return { ok: false, result: { error: err instanceof Error ? err.message : String(err), latencyMs: 0 } }
  }
}

async function callGemini(model: ModelConfig, ticket: string): Promise<CallResult> {
  try {
    const { GoogleGenAI } = await import("@google/genai")
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
    const { value: response, latencyMs } = await timed(() =>
      client.models.generateContent({
        model: model.modelId,
        contents: ticket,
        config: {
          systemInstruction: TRIAGE_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      }),
    )
    return {
      ok: true,
      result: {
        rawText: response.text ?? "",
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        latencyMs,
      },
    }
  } catch (err) {
    return { ok: false, result: { error: err instanceof Error ? err.message : String(err), latencyMs: 0 } }
  }
}

export async function callProvider(model: ModelConfig, ticket: string): Promise<CallResult> {
  switch (model.provider) {
    case "openai":
      return callOpenAI(model, ticket)
    case "anthropic":
      return callClaude(model, ticket)
    case "google":
      return callGemini(model, ticket)
  }
}
