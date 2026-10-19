import test from "node:test"
import assert from "node:assert/strict"
import { parseProviderFailures, summarizeProviderFailures } from "./provider-errors.ts"

const message =
  'All registered providers failed: Gemini-Resolv: Google 503: { "error": { "code": 503, "message": "This model is currently experiencing high demand.", "status": "UNAVAILABLE" } } ; ' +
  'Anthropic Prod: 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."}}; ' +
  "Resolv-HQ OpenAI: 404 The model `gpt-4` does not exist or you do not have access to it."

test("splits the gateway message into per-provider failures with cause and fix", () => {
  const [gemini, anthropic, openai] = parseProviderFailures(message)
  assert.equal(gemini.provider, "Gemini-Resolv")
  assert.match(gemini.error, /^503, /)
  assert.match(gemini.fix, /Retry in a few minutes/)
  assert.equal(anthropic.provider, "Anthropic Prod")
  assert.equal(anthropic.cause, "The account has run out of credit.")
  assert.equal(openai.provider, "Resolv-HQ OpenAI")
  assert.match(openai.cause, /gpt-4/)
  assert.match(openai.fix, /AI Models page/)
})

test("tells free-tier quota, empty credit and no-credits apart, with the retry time", () => {
  const [gemini, anthropic, openai] = parseProviderFailures(
    'All registered providers failed: Gemini-Resolv: 429, "Google 429: { "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits.\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20\nPlease retry in 18h18m31.5s.", "status": "RESOURCE_EXHAUSTED" } }; ' +
      'Anthropic Prod: 400, "Your credit balance is too low to access the Anthropic API."; ' +
      'Resolv-HQ OpenAI: 429, "You have no credits remaining. Add credits to continue."',
  )
  assert.match(gemini.cause, /free-tier quota.*about 18 hours/)
  assert.ok(!gemini.error.includes("http"))
  assert.match(anthropic.cause, /run out of credit/)
  assert.match(openai.cause, /run out of credit/)
})

test("summarizes every failed provider in one sentence for a toast", () => {
  const text = summarizeProviderFailures("All registered providers failed: A: 402 payment required; B: 402 payment required")
  assert.match(text, /^All 2 AI providers couldn't answer\. The account has run out of credit\./)
})

test("classifies a network failure", () => {
  const [failure] = parseProviderFailures("All registered providers failed: Gemini-Resolv: fetch failed")
  assert.equal(failure.error, '"fetch failed"')
  assert.match(failure.cause, /network/)
})
