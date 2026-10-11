import assert from "node:assert/strict"
import { test } from "node:test"
import {
  SAMPLE_STRING,
  UNEXPECTED_ARGUMENT_KEY,
  buildRequest,
  buildValidArguments,
  classify,
  constFalseOutputKeys,
  extractTools,
  hasStructuredContent,
  listingDiff,
  planCallsFor,
  sampleValue,
  unknownToolName,
  wasRejected,
  type McpTool,
} from "./mcp-tester.ts"

// Deliberately generic tools: the helpers must work for any server, not just ours.
const noArgs: McpTool = {
  name: "ping",
  inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
}
const withRequired: McpTool = {
  name: "lookup",
  inputSchema: {
    type: "object",
    properties: { term: { type: "string" }, limit: { type: "integer" }, note: { type: "string" } },
    required: ["term", "limit"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { done: { const: false }, label: { type: "string" } },
  },
}
const openSchema: McpTool = {
  name: "loose",
  inputSchema: { type: "object", properties: { a: { type: "string" } }, required: ["a"] },
}

test("buildRequest produces a JSON-RPC 2.0 envelope and omits absent params", () => {
  assert.deepEqual(buildRequest(7, "tools/list"), { jsonrpc: "2.0", id: 7, method: "tools/list" })
  assert.deepEqual(buildRequest(8, "tools/call", { name: "x" }), {
    jsonrpc: "2.0",
    id: 8,
    method: "tools/call",
    params: { name: "x" },
  })
})

test("sampleValue satisfies each schema type, enum and const", () => {
  assert.equal(sampleValue({ type: "string" }), SAMPLE_STRING)
  assert.equal(sampleValue({ type: "integer" }), 1)
  assert.equal(sampleValue({ type: "boolean" }), true)
  assert.deepEqual(sampleValue({ type: "array" }), [])
  assert.equal(sampleValue({ enum: ["low", "high"] }), "low")
  assert.equal(sampleValue({ const: false }), false)
  assert.equal(sampleValue({ type: ["null", "string"] }), SAMPLE_STRING)
  assert.equal(sampleValue({}), undefined)
})

test("buildValidArguments includes required properties only", () => {
  assert.deepEqual(buildValidArguments(noArgs), {})
  assert.deepEqual(buildValidArguments(withRequired), { term: SAMPLE_STRING, limit: 1 })
  assert.deepEqual(buildValidArguments({ name: "bare" }), {})
})

test("planCallsFor: tool with no arguments gets a valid call and an unexpected-argument case only", () => {
  const calls = planCallsFor(noArgs)
  assert.deepEqual(calls.map((c) => c.expect), ["accepted", "rejected"])
  assert.deepEqual(calls[1].args, { [UNEXPECTED_ARGUMENT_KEY]: SAMPLE_STRING })
})

test("planCallsFor: required arguments add missing and wrong-type cases", () => {
  const calls = planCallsFor(withRequired)
  assert.deepEqual(
    calls.map((c) => c.expect),
    ["accepted", "rejected", "rejected", "rejected"],
  )
  const missing = calls.find((c) => c.label.includes("missing"))!
  assert.deepEqual(missing.args, { limit: 1 })
  const wrongType = calls.find((c) => c.label.includes("wrong type"))!
  assert.equal((wrongType.args as Record<string, unknown>).term, 12345)
  assert.ok(calls.every((c) => c.toolName === "lookup"))
})

test("planCallsFor: no unexpected-argument case when the schema allows extra properties", () => {
  const calls = planCallsFor(openSchema)
  assert.ok(!calls.some((c) => c.label.includes("unexpected")))
  assert.ok(calls.some((c) => c.label.includes("missing")))
})

test("wrong-type value differs from a non-string declared type", () => {
  const calls = planCallsFor({
    name: "n",
    inputSchema: { type: "object", properties: { count: { type: "integer" } }, required: ["count"], additionalProperties: false },
  })
  const wrongType = calls.find((c) => c.label.includes("wrong type"))!
  assert.equal(typeof (wrongType.args as Record<string, unknown>).count, "string")
})

test("classify distinguishes success, tool error, JSON-RPC error and HTTP error", () => {
  assert.equal(classify(200, { result: { content: [], structuredContent: {} } }), "success")
  assert.equal(classify(200, { result: { isError: true, content: [] } }), "tool_error")
  assert.equal(classify(200, { error: { code: -32602, message: "bad" } }), "rpc_error")
  assert.equal(classify(401, { error: "Unauthorized" }), "http_error")
  assert.equal(classify(500, "oops"), "http_error")
  assert.equal(classify(200, null), "success")
})

test("wasRejected and hasStructuredContent", () => {
  assert.equal(wasRejected(200, { result: { isError: true } }), true)
  assert.equal(wasRejected(200, { result: { structuredContent: {} } }), false)
  assert.equal(hasStructuredContent(200, { result: { structuredContent: { a: 1 } } }), true)
  assert.equal(hasStructuredContent(200, { result: { content: [] } }), false)
  assert.equal(hasStructuredContent(200, { result: { isError: true, structuredContent: {} } }), false)
})

test("constFalseOutputKeys finds contract flags pinned to false", () => {
  assert.deepEqual(constFalseOutputKeys(withRequired), ["done"])
  assert.deepEqual(constFalseOutputKeys(noArgs), [])
})

test("listingDiff reports missing and unexpected tools", () => {
  assert.deepEqual(listingDiff(["a", "b"], ["a", "b"]), { missing: [], unexpected: [] })
  assert.deepEqual(listingDiff(["a", "x"], ["a", "b"]), { missing: ["b"], unexpected: ["x"] })
})

test("extractTools only trusts a 200 response with a tools array", () => {
  assert.deepEqual(extractTools(200, { result: { tools: [noArgs] } }), [noArgs])
  assert.equal(extractTools(401, { result: { tools: [noArgs] } }), null)
  assert.equal(extractTools(200, { result: {} }), null)
  assert.equal(extractTools(200, "not json"), null)
})

test("unknownToolName never collides with a plausible tool name", () => {
  const name = unknownToolName("abc")
  assert.ok(name.endsWith("abc"))
  assert.ok(![noArgs, withRequired, openSchema].some((t) => t.name === name))
})
