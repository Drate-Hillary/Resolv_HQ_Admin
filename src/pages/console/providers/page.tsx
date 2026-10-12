import { PageStatus } from "@/components/console/page-status"
import { useApiData } from "@/hooks/use-api-data"
import { ProvidersView, type AgentProviderRow } from "./providers-view"

export default function ProvidersPage() {
  const { data, loading, error } = useApiData<AgentProviderRow[]>("/admin/agent-providers")

  if (!data) return <PageStatus loading={loading} error={error} />

  return <ProvidersView initialProviders={data} />
}
