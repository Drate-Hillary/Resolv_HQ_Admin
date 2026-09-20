// Pricing snapshot taken 2026-09-17 - verify against each provider's live pricing
// page before trusting cost numbers for a real decision; these rates change and
// some carry time-limited introductory pricing (noted below).
export interface ModelConfig {
  key: "openai" | "claude" | "gemini"
  label: string
  provider: "openai" | "anthropic" | "google"
  modelId: string
  /** USD per 1M input tokens. */
  inputPricePerM: number
  /** USD per 1M output tokens. */
  outputPricePerM: number
  pricingNote?: string
}

export const MODELS: ModelConfig[] = [
  {
    key: "openai",
    label: "GPT-4o mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
    inputPricePerM: 0.15,
    outputPricePerM: 0.6,
  },
  {
    key: "claude",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5",
    inputPricePerM: 1.0,
    outputPricePerM: 5.0,
    pricingNote:
      "Requested model was Claude 3.5 Haiku, retired 2026-02-19 (no longer callable via the API). Substituted its current successor, Claude Haiku 4.5, per user decision.",
  },
  {
    key: "gemini",
    label: "Gemini 3.8 Flash",
    provider: "google",
    modelId: "gemini-3.8-flash",
    inputPricePerM: 0.75,
    outputPricePerM: 3.75,
    pricingNote:
      "Requested model was Gemini 1.5 Flash, retired (API now returns 404). Substituted the current Gemini 3.x Flash release per user decision. " +
      "$0.75/$3.75 is an introductory rate through 2026-12-31; it doubles to $1.50/$7.50 on 2027-01-01 - recompute cost numbers after that date.",
  },
]

export function estimateCostUsd(model: ModelConfig, inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * model.inputPricePerM + (outputTokens / 1_000_000) * model.outputPricePerM
}
