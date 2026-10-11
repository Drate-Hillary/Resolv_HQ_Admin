// Pure helpers behind the console MCP tester. Nothing here names a specific
// tool: sample arguments, negative cases and output checks are all derived from
// what the server advertises in `tools/list`, so adding or renaming a tool
// needs no change here. No imports, so it runs under `node --test` unchanged.

export const JSONRPC_VERSION = "2.0"
export const MCP_ACCEPT_HEADER = "application/json, text/event-stream"
export const SAMPLE_STRING = "mcp-smoke-test"
export const UNEXPECTED_ARGUMENT_KEY = "__unexpected_argument__"
export const UNKNOWN_TOOL_PREFIX = "__no_such_tool__"

export interface JsonSchema {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean | JsonSchema
  enum?: unknown[]
  const?: unknown
  items?: JsonSchema
  description?: string
}

export interface McpTool {
  name: string
  description?: string
  inputSchema?: JsonSchema
  outputSchema?: JsonSchema
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; openWorldHint?: boolean }
}

export interface RpcResult {
  request: unknown
  status: number
  ms: number
  body: unknown
}

export interface ToolCallBody {
  result?: {
    content?: { type: string; text?: string }[]
    structuredContent?: unknown
    isError?: boolean
  }
  error?: { code: number; message: string }
}

export type ResponseKind = "success" | "tool_error" | "rpc_error" | "http_error"

export interface PlannedCall {
  label: string
  expectation: string
  toolName: string
  args: unknown
  /** "accepted" must succeed with structuredContent; "rejected" must be an error of any kind. */
  expect: "accepted" | "rejected"
}

export function buildRequest(id: number, method: string, params?: unknown) {
  return { jsonrpc: JSONRPC_VERSION, id, method, ...(params === undefined ? {} : { params }) }
}

function primaryType(schema: JsonSchema): string | undefined {
  return Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type
}

/** A value that satisfies the schema, or undefined when none can be built. */
export function sampleValue(schema: JsonSchema): unknown {
  if (schema.const !== undefined) return schema.const
  if (schema.enum && schema.enum.length > 0) return schema.enum[0]
  switch (primaryType(schema)) {
    case "string":
      return SAMPLE_STRING
    case "integer":
    case "number":
      return 1
    case "boolean":
      return true
    case "array":
      return []
    case "object":
      return buildObject(schema)
    default:
      return undefined
  }
}

function buildObject(schema: JsonSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of schema.required ?? []) {
    const value = sampleValue(schema.properties?.[key] ?? {})
    if (value !== undefined) out[key] = value
  }
  return out
}

/** Arguments that satisfy the tool's input schema (required properties only). */
export function buildValidArguments(tool: McpTool): Record<string, unknown> {
  return buildObject(tool.inputSchema ?? {})
}

/** A value of the wrong type for the schema, used to check type validation. */
function wrongTypeValue(schema: JsonSchema): unknown {
  return primaryType(schema) === "string" ? 12345 : "not-the-declared-type"
}

export function unknownToolName(suffix: string) {
  return `${UNKNOWN_TOOL_PREFIX}${suffix}`
}

/** The calls the smoke suite makes for one tool: one valid call plus schema-derived negative cases. */
export function planCallsFor(tool: McpTool): PlannedCall[] {
  const schema = tool.inputSchema ?? {}
  const valid = buildValidArguments(tool)
  const calls: PlannedCall[] = [
    {
      label: `${tool.name}: valid call`,
      expectation: "Succeeds and returns structuredContent",
      toolName: tool.name,
      args: valid,
      expect: "accepted",
    },
  ]

  if (schema.additionalProperties === false) {
    calls.push({
      label: `${tool.name}: unexpected argument`,
      expectation: "The schema forbids additional properties, so this is rejected",
      toolName: tool.name,
      args: { ...valid, [UNEXPECTED_ARGUMENT_KEY]: SAMPLE_STRING },
      expect: "rejected",
    })
  }

  const firstRequired = schema.required?.[0]
  if (firstRequired !== undefined) {
    const { [firstRequired]: omitted, ...rest } = valid
    void omitted
    calls.push({
      label: `${tool.name}: missing "${firstRequired}"`,
      expectation: "A required argument is omitted, so this is rejected",
      toolName: tool.name,
      args: rest,
      expect: "rejected",
    })
    const property = schema.properties?.[firstRequired]
    if (property) {
      calls.push({
        label: `${tool.name}: wrong type for "${firstRequired}"`,
        expectation: "The argument has the wrong type, so this is rejected",
        toolName: tool.name,
        args: { ...valid, [firstRequired]: wrongTypeValue(property) },
        expect: "rejected",
      })
    }
  }
  return calls
}

export function classify(status: number, body: unknown): ResponseKind {
  const parsed = (body ?? null) as ToolCallBody | null
  if (status >= 400) return "http_error"
  if (parsed?.error) return "rpc_error"
  if (parsed?.result?.isError) return "tool_error"
  return "success"
}

/** True when the call was refused in any form. */
export function wasRejected(status: number, body: unknown): boolean {
  return classify(status, body) !== "success"
}

export function hasStructuredContent(status: number, body: unknown): boolean {
  return classify(status, body) === "success" && (body as ToolCallBody | null)?.result?.structuredContent !== undefined
}

/**
 * Property names the tool's output schema pins to `const: false`, e.g. a
 * "submitted" flag. Used to assert the live result matches its declared contract.
 */
export function constFalseOutputKeys(tool: McpTool): string[] {
  return Object.entries(tool.outputSchema?.properties ?? {})
    .filter(([, schema]) => schema.const === false)
    .map(([key]) => key)
}

export function listingDiff(advertised: string[], registryActive: string[]) {
  return {
    missing: registryActive.filter((name) => !advertised.includes(name)),
    unexpected: advertised.filter((name) => !registryActive.includes(name)),
  }
}

export function extractTools(status: number, body: unknown): McpTool[] | null {
  if (status !== 200) return null
  const tools = (body as { result?: { tools?: McpTool[] } } | null)?.result?.tools
  return Array.isArray(tools) ? tools : null
}
