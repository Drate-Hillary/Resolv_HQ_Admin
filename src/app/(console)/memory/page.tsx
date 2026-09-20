import { apiFetch } from "@/backend/api/server"
import { MemoryView, type AgentMemoryRecordRow } from "./memory-view"

export default async function MemoryPage() {
  const records = await apiFetch<AgentMemoryRecordRow[]>("/admin/memory-records")

  return <MemoryView initialRecords={records} />
}
