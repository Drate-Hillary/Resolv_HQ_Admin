import { apiFetch } from "@/backend/api/server"
import { TracesView, type AgentRunRow } from "./traces-view"

export default async function TracesPage() {
  const runs = await apiFetch<AgentRunRow[]>("/admin/traces")

  return <TracesView runs={runs} />
}
