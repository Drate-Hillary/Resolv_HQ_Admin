import { apiFetch } from "@/backend/api/server"
import { ToolsView, type AgentToolRow } from "./tools-view"

export default async function ToolsPage() {
  const tools = await apiFetch<AgentToolRow[]>("/admin/tools")

  return <ToolsView initialTools={tools} />
}
