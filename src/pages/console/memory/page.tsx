import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/backend/api/server"
import { MemoryAccessPanel } from "./memory-access-panel"

interface MemorySummary {
  recordCount: number
  customerRecordCount: number
  staffRecordCount: number
  keys: {
    key: string
    recordCount: number
  }[]
}

interface AgentTool {
  id: string
  name: string
  description: string | null
  requires_approval: boolean | null
  is_active: boolean | null
  created_at: string | null
  executable: boolean
  inputSchema: Record<string, unknown> | null
}

function displayKey(key: string) {
  return key.replace(/[_-]+/g, " ")
}

export default async function MemoryMcpPage() {
  const [memory, tools] = await Promise.all([
    apiFetch<MemorySummary>("/admin/memory"),
    apiFetch<AgentTool[]>("/admin/tools"),
  ])
  const activeToolCount = tools.filter((tool) => tool.is_active).length
  const executableToolCount = tools.filter((tool) => tool.executable && tool.is_active).length

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Memory + MCP
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Memory and tool discovery
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Discover registered agent tools, manage your own staff memory, and inspect or manage
          facts for a customer selected through the authenticated backend.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Customer memory records" value={memory.customerRecordCount} />
        <SummaryCard label="Staff memory records" value={memory.staffRecordCount} />
        <SummaryCard label="Memory keys detected" value={memory.keys.length} />
        <SummaryCard label="Registered tools" value={tools.length} />
        <SummaryCard label="Active / executable" value={`${activeToolCount} / ${executableToolCount}`} />
      </div>

      <MemoryAccessPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detected memory fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memory.keys.map(({ key, recordCount }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-muted/20 p-3"
              >
                <span className="text-sm font-medium capitalize text-foreground">{displayKey(key)}</span>
                <Badge variant="secondary">{recordCount} records</Badge>
              </div>
            ))}
            {memory.keys.length === 0 && (
              <p className="text-sm text-muted-foreground">No memory fields are currently stored.</p>
            )}
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              The overview is aggregated. Values are returned only after staff explicitly select
              a customer through the protected memory-management panel.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tool interface discovery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.id} className="rounded-md border border-border/70 bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant={tool.is_active ? "approve" : "secondary"}>
                      {tool.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={tool.executable ? "default" : "outline"}>
                      {tool.executable ? "Executable" : "Catalogue only"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {tool.description || "No description registered."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Approval: {tool.requires_approval ? "required" : "not required"}
                  </span>
                  {tool.inputSchema && (
                    <details className="w-full">
                      <summary className="cursor-pointer font-medium text-foreground">
                        Input schema
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-[11px]">
                        {JSON.stringify(tool.inputSchema, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {tools.length === 0 && (
              <p className="text-sm text-muted-foreground">No tools are currently registered.</p>
            )}
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              These entries come from the agent tool registry. The same tools are served over MCP
              (Streamable HTTP at /mcp, and stdio); use the MCP Tester page to call them.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data and authority boundary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Customer memory is customer-scoped. Staff customer-memory reads and changes are
            restricted to an explicitly selected customer and recorded in the access log.
          </p>
          <p>
            Memory can inform an answer, but it does not authorize actions. Consequential actions
            remain subject to the application approval workflow.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
