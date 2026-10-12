import { PageStatus } from "@/components/console/page-status"
import { useApiData } from "@/hooks/use-api-data"
import { TracesView, type AgentRunRow } from "./traces-view"

export default function TracesPage() {
  const { data, loading, error } = useApiData<AgentRunRow[]>("/admin/traces")

  if (!data) return <PageStatus loading={loading} error={error} />

  return <TracesView runs={data} />
}
