import { PageStatus } from "@/components/console/page-status"
import { useApiData } from "@/hooks/use-api-data"
import { ToolsView, type AgentToolRow } from "./tools-view"

export default function ToolsPage() {
  const { data, loading, error } = useApiData<AgentToolRow[]>("/admin/tools")

  if (!data) return <PageStatus loading={loading} error={error} />

  return <ToolsView initialTools={data} />
}
