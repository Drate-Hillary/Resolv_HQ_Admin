import { apiFetch } from "@/backend/api/server"
import { TracesView, type TraceRunViewRow } from "./traces-view"

export default async function TracesPage() {
  const runs = await apiFetch<TraceRunViewRow[]>("/admin/traces")

  return <TracesView runs={runs} />
}
