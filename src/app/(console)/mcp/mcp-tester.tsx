"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/backend/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  MCP_ACCEPT_HEADER,
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
  unknownToolName,
  wasRejected,
  type McpTool,
  type RpcResult,
  type ToolCallBody,
} from "@/lib/mcp-tester"

export interface RegistryTool {
  id: string
  name: string
  is_active: boolean | null
  executable: boolean
}

interface SmokeCheck {
  name: string
  expectation: string
  status: "pass" | "fail"
  detail: string
}

// The MCP route of the backend the console is already configured to talk to.
const MCP_PATH = "/mcp"

let rpcId = 0

async function rpc(method: string, params?: unknown): Promise<RpcResult> {
  const request = buildRequest(++rpcId, method, params)
  const started = performance.now()
  const response = await apiClient.post(MCP_PATH, request, {
    headers: { Accept: MCP_ACCEPT_HEADER, "Content-Type": "application/json" },
    // Keep 4xx/5xx responses: a rejected call is a result we want to display.
    validateStatus: () => true,
  })
  return { request, status: response.status, ms: Math.round(performance.now() - started), body: response.data }
}

function callTool(name: string, args: unknown) {
  return rpc("tools/call", { name, arguments: args })
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function errorText(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) return String((error as Error).message)
  return "Request failed"
}

const RESULT_LABEL = {
  success: "Success",
  tool_error: "Tool error",
  rpc_error: "JSON-RPC error",
  http_error: "HTTP error",
} as const

export function McpTester({ registry }: { registry: RegistryTool[] }) {
  const endpoint = `${apiClient.defaults.baseURL ?? ""}${MCP_PATH}`
  const [tools, setTools] = useState<McpTool[]>([])
  const [listResult, setListResult] = useState<RpcResult | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  // null = show the generated valid arguments; a string = what the user typed.
  const [argsOverride, setArgsOverride] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)
  const [callResult, setCallResult] = useState<RpcResult | null>(null)
  const [callError, setCallError] = useState<string | null>(null)
  const [suite, setSuite] = useState<SmokeCheck[] | null>(null)
  const [suiteRunning, setSuiteRunning] = useState(false)

  const selectedTool = tools.find((tool) => tool.name === selectedName) ?? tools[0] ?? null
  const argsText = argsOverride ?? (selectedTool ? pretty(buildValidArguments(selectedTool)) : "{}")

  async function fetchTools(): Promise<{ result: RpcResult | null; error: string | null }> {
    try {
      return { result: await rpc("tools/list"), error: null }
    } catch (error) {
      return { result: null, error: errorText(error) }
    }
  }

  function applyTools({ result, error }: { result: RpcResult | null; error: string | null }) {
    setLoading(false)
    setListResult(result)
    const list = result ? extractTools(result.status, result.body) : null
    setTools(list ?? [])
    setListError(list ? null : (error ?? `tools/list failed (HTTP ${result?.status}).`))
  }

  useEffect(() => {
    let cancelled = false
    void fetchTools().then((outcome) => {
      if (!cancelled) applyTools(outcome)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function refreshTools() {
    setLoading(true)
    void fetchTools().then(applyTools)
  }

  function pickTool(tool: McpTool) {
    setSelectedName(tool.name)
    setArgsOverride(null)
    setCallResult(null)
    setCallError(null)
  }

  async function runCall() {
    if (!selectedTool) return
    let args: unknown
    try {
      args = JSON.parse(argsText || "{}")
    } catch {
      setCallError("Arguments are not valid JSON.")
      return
    }
    setCalling(true)
    setCallError(null)
    try {
      setCallResult(await callTool(selectedTool.name, args))
    } catch (error) {
      setCallError(errorText(error))
    } finally {
      setCalling(false)
    }
  }

  function addUnexpectedArgument() {
    try {
      const args = JSON.parse(argsText || "{}") as Record<string, unknown>
      setArgsOverride(pretty({ ...args, [UNEXPECTED_ARGUMENT_KEY]: SAMPLE_STRING }))
    } catch {
      setCallError("Arguments are not valid JSON.")
    }
  }

  async function runSuite() {
    setSuiteRunning(true)
    setSuite(null)
    const checks: SmokeCheck[] = []
    const add = (name: string, expectation: string, ok: boolean, detail: string) =>
      checks.push({ name, expectation, status: ok ? "pass" : "fail", detail })

    try {
      const list = await rpc("tools/list")
      const advertisedTools = extractTools(list.status, list.body) ?? []
      const advertised = advertisedTools.map((tool) => tool.name)
      const expected = registry.filter((tool) => tool.is_active && tool.executable).map((tool) => tool.name)
      const { missing, unexpected } = listingDiff(advertised, expected)
      add(
        "tools/list matches the registry",
        "Every active executable tool in the registry is advertised, and nothing else",
        list.status === 200 && missing.length === 0 && unexpected.length === 0,
        `advertised: ${advertised.join(", ") || "none"}${missing.length ? `; missing: ${missing.join(", ")}` : ""}${unexpected.length ? `; unexpected: ${unexpected.join(", ")}` : ""}`,
      )

      for (const tool of advertisedTools) {
        for (const planned of planCallsFor(tool)) {
          const r = await callTool(planned.toolName, planned.args)
          const ok = planned.expect === "accepted" ? hasStructuredContent(r.status, r.body) : wasRejected(r.status, r.body)
          add(planned.label, planned.expectation, ok, `${RESULT_LABEL[classify(r.status, r.body)]}, HTTP ${r.status}, ${r.ms} ms`)

          // A valid call must also honour any "flag is false" promise in the output schema.
          if (planned.expect === "accepted" && ok) {
            const structured = (r.body as ToolCallBody).result?.structuredContent as Record<string, unknown> | undefined
            for (const key of constFalseOutputKeys(tool)) {
              add(
                `${tool.name}: "${key}" is false`,
                "The output schema pins this property to false",
                structured?.[key] === false,
                `${key} = ${String(structured?.[key])}`,
              )
            }
          }
        }
      }

      const unknownName = unknownToolName(String(rpcId + 1))
      const unknown = await callTool(unknownName, {})
      add("Unknown tool is rejected", "A tool name the server does not advertise is an error", wasRejected(unknown.status, unknown.body), `${RESULT_LABEL[classify(unknown.status, unknown.body)]}, HTTP ${unknown.status}`)
    } catch (error) {
      add("Suite aborted", "All requests reach the endpoint", false, errorText(error))
    }
    setSuite(checks)
    setSuiteRunning(false)
  }

  const callBody = callResult?.body as ToolCallBody | null
  const callKind = callResult ? classify(callResult.status, callResult.body) : null
  const passed = suite?.filter((c) => c.status === "pass").length ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs">POST {endpoint}</code>
            <Badge variant="outline">Authorization: your Supabase session</Badge>
            <Badge variant="secondary">Stateless, JSON responses</Badge>
            {listResult && (
              <Badge variant={listResult.status === 200 ? "approve" : "destructive"}>
                {listResult.status === 200 ? `Connected, ${tools.length} tools` : `HTTP ${listResult.status}`}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The stdio transport shares these handlers but runs as a separate process and cannot be
            called from the browser.
          </p>
          {listError && <p className="text-sm text-destructive">{listError}</p>}
          <Button variant="outline" size="sm" onClick={refreshTools} disabled={loading}>
            {loading ? "Loading…" : "Refresh tools/list"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Advertised tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.name}
                type="button"
                onClick={() => pickTool(tool)}
                className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                  tool.name === selectedTool?.name ? "border-primary bg-primary/5" : "border-border/70 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <span className="block font-medium text-foreground">{tool.name}</span>
                {tool.annotations?.readOnlyHint && (
                  <Badge variant="approve" className="mt-2">
                    read-only
                  </Badge>
                )}
              </button>
            ))}
            {!loading && tools.length === 0 && (
              <p className="text-sm text-muted-foreground">No tools advertised. Check the registry on the Tools page.</p>
            )}
            {registry.some((t) => !t.is_active) && (
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                Inactive in the registry (not advertised):{" "}
                {registry.filter((t) => !t.is_active).map((t) => t.name).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedTool ? selectedTool.name : "Call a tool"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedTool && <p className="text-sm text-muted-foreground">Select a tool to call it.</p>}
            {selectedTool && (
              <>
                <p className="text-sm text-muted-foreground">{selectedTool.description}</p>
                <details>
                  <summary className="cursor-pointer text-xs font-medium text-foreground">Input and output schema</summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-[11px]">
                    {pretty({ inputSchema: selectedTool.inputSchema, outputSchema: selectedTool.outputSchema })}
                  </pre>
                </details>
                <div className="space-y-2">
                  <label htmlFor="mcp-args" className="text-xs font-medium text-foreground">
                    Arguments (JSON)
                  </label>
                  <Textarea
                    id="mcp-args"
                    value={argsText}
                    onChange={(event) => setArgsOverride(event.target.value)}
                    className="min-h-28 font-mono"
                    spellCheck={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void runCall()} disabled={calling}>
                      {calling ? "Calling…" : "Call tool"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={addUnexpectedArgument}>
                      Add unexpected argument
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setArgsOverride(null)}>
                      Reset
                    </Button>
                  </div>
                </div>
                {callError && <p className="text-sm text-destructive">{callError}</p>}
                {callResult && callKind && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={callKind === "success" ? "approve" : "destructive"}>{RESULT_LABEL[callKind]}</Badge>
                      <Badge variant="outline">HTTP {callResult.status}</Badge>
                      <Badge variant="outline">{callResult.ms} ms</Badge>
                      {callBody?.result?.structuredContent !== undefined && <Badge variant="secondary">structuredContent</Badge>}
                    </div>
                    {callBody?.result?.content?.map((item, index) => (
                      <p key={index} className="rounded bg-muted/40 p-3 text-xs">
                        {item.text}
                      </p>
                    ))}
                    {callBody?.error?.message && <p className="text-sm text-destructive">{callBody.error.message}</p>}
                    {callBody?.result?.structuredContent !== undefined && (
                      <pre className="overflow-x-auto rounded bg-background p-3 text-[11px]">{pretty(callBody.result.structuredContent)}</pre>
                    )}
                    <details>
                      <summary className="cursor-pointer text-xs font-medium text-foreground">Raw request and response</summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-[11px]">
                        {pretty({ request: callResult.request, response: callResult.body })}
                      </pre>
                    </details>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Smoke suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Built from the advertised schemas: compares the listing with the registry, makes one
            valid call per tool, and checks that unexpected, missing and wrongly typed arguments and
            an unknown tool name are rejected. Your session&apos;s role determines what the lookups
            return.
          </p>
          <Button onClick={() => void runSuite()} disabled={suiteRunning || loading}>
            {suiteRunning ? "Running…" : "Run smoke suite"}
          </Button>
          {suite && (
            <div className="space-y-2">
              <Badge variant={passed === suite.length ? "approve" : "destructive"}>
                {passed} of {suite.length} checks passed
              </Badge>
              {suite.map((check, index) => (
                <div key={`${check.name}-${index}`} className="flex items-start gap-3 rounded-md border border-border/70 bg-muted/20 p-3">
                  <Badge variant={check.status === "pass" ? "approve" : "destructive"}>{check.status}</Badge>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">{check.name}</p>
                    <p className="text-xs text-muted-foreground">{check.expectation}</p>
                    <p className="break-words text-xs text-muted-foreground">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
