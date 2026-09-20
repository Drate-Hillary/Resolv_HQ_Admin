import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { apiFetch } from "@/backend/api/server"
import { IntegrationsManager, type Integration } from "./integrations-manager"
import { AgentProvidersManager, type AgentProvider } from "./agent-providers-manager"
import { CpuIcon, FileAttachmentIcon, ServerCogIcon, AiBrain01Icon } from "@hugeicons/core-free-icons"

const modelFieldLabel: Record<string, string> = {
  foundation_model: "Foundation model",
  context_window: "Context window",
  temperature: "Temperature",
}

interface ModelConfig {
  key: string
  value: string
  updated_at: string
}

interface PromptVersion {
  id: string
  name: string
  version: string
  status: "active" | "deprecated"
  diff_note: string | null
  created_at: string
}

interface SettingsResponse {
  modelConfigs: ModelConfig[]
  promptVersions: PromptVersion[]
  integrations: Integration[]
}

export default async function SettingsPage() {
  const [{ modelConfigs, promptVersions, integrations }, agentProviders] = await Promise.all([
    apiFetch<SettingsResponse>("/admin/settings"),
    apiFetch<AgentProvider[]>("/admin/agent-providers"),
  ])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Model, prompt versioning and external integrations.</p>
      </div>

      <section className="glass-panel p-4">
        <div className="flex items-center gap-2">
          <Icon icon={CpuIcon} size={20} className="text-primary" />
          <h3 className="text-xs font-medium text-foreground">Model</h3>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
          {modelConfigs.map((c) => (
            <Field key={c.key} label={modelFieldLabel[c.key] ?? c.key} value={c.value} />
          ))}
          {modelConfigs.length === 0 && <p className="text-muted-foreground">No model configuration recorded.</p>}
        </dl>
      </section>

      <section className="glass-panel p-4">
        <div className="flex items-center gap-2">
          <Icon icon={FileAttachmentIcon} size={20} className="text-primary" />
          <h3 className="text-xs font-medium text-foreground">Prompt versions</h3>
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-border text-xs">
          {promptVersions.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <span className="text-foreground">{p.name}</span>
              <span className="flex items-center gap-2">
                <span className="tabular text-muted-foreground">v{p.version}</span>
                <Badge variant={p.status === "active" ? "approve" : "secondary"}>{p.status}</Badge>
              </span>
            </li>
          ))}
          {promptVersions.length === 0 && <p className="py-2.5 text-muted-foreground">No prompt versions recorded.</p>}
        </ul>
      </section>

      <section className="glass-panel p-4">
        <div className="flex items-center gap-2">
          <Icon icon={ServerCogIcon} size={20} className="text-primary" />
          <h3 className="text-xs font-medium text-foreground">Integrations</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The agent exposes its tools through an MCP-style interface, so other agents or systems can call the
          same approved functions under the same guardrails.
        </p>
        <IntegrationsManager initialIntegrations={integrations} />
      </section>

      <section className="glass-panel p-4">
        <div className="flex items-center gap-2">
          <Icon icon={AiBrain01Icon} size={20} className="text-primary" />
          <h3 className="text-xs font-medium text-foreground">AI agents</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Register the AI agents/providers available to the console, along with the API key used to call
          each one. Keys are never shown again after saving — only a masked reference.
        </p>
        <AgentProvidersManager initialAgentProviders={agentProviders} />
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  )
}
