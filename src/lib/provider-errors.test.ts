import test from "node:test"
import assert from "node:assert/strict"
import { parseProviderFailures } from "./provider-errors.ts"

const message =
  'All registered providers failed: Gemini-Resolv: Google 503: { "error": { "code": 503, "message": "This model is currently experiencing high demand.", "status": "UNAVAILABLE" } } ; ' +
  'Anthropic Prod: 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."}}; ' +
  "Resolv-HQ OpenAI: 404 The model `gpt-4` does not exist or you do not have access to it."

test("splits the gateway message into per-provider failures with cause and fix", () => {
  const [gemini, anthropic, openai] = parseProviderFailures(message)
  assert.equal(gemini.provider, "Gemini-Resolv")
  assert.match(gemini.error, /^503, /)
  assert.match(gemini.fix, /Retry later/)
  assert.equal(anthropic.provider, "Anthropic Prod")
  assert.equal(anthropic.cause, "The account has no credit.")
  assert.equal(openai.provider, "Resolv-HQ OpenAI")
  assert.match(openai.cause, /gpt-4/)
  assert.match(openai.fix, /Providers page/)
})

test("classifies a network failure", () => {
  const [failure] = parseProviderFailures("All registered providers failed: Gemini-Resolv: fetch failed")
  assert.equal(failure.error, '"fetch failed"')
  assert.match(failure.cause, /network/)
})
