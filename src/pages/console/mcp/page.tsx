import { apiFetch } from "@/backend/api/server"
import { McpTester, type RegistryTool } from "./mcp-tester"

export default async function McpTesterPage() {
  const registry = await apiFetch<RegistryTool[]>("/admin/tools")

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          MCP
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">MCP tester</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Call the backend&apos;s MCP endpoint as the signed-in staff member: list the advertised
          tools, run any tool with your own arguments, or run the smoke suite. The suite is
          generated from the schemas the server advertises. Check each tool&apos;s read-only badge
          before calling it: this page does not stop a write-capable tool from running.
        </p>
      </div>
      <McpTester registry={registry} />
    </div>
  )
}
