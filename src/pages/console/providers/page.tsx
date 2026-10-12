import { apiFetch } from "@/backend/api/server"
import { ProvidersView, type AgentProviderRow } from "./providers-view"

export default async function ProvidersPage() {
  const providers = await apiFetch<AgentProviderRow[]>("/admin/agent-providers")

  return <ProvidersView initialProviders={providers} />
}
