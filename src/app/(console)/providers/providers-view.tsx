"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/backend/api/client"
import { CpuIcon, Key01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

export interface AgentProviderRow {
  id: string
  name: string
  provider: string
  model: string | null
  api_key_last4: string
  status: "active" | "disabled"
  created_at: string
  updated_at: string
}

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "custom", label: "Custom endpoint" },
]

const emptyForm = { name: "", provider: "", model: "", apiKey: "" }

export function ProvidersView({ initialProviders }: { initialProviders: AgentProviderRow[] }) {
  const [providers, setProviders] = useState(initialProviders)
  const [pending, setPending] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function registerModel() {
    if (!form.name.trim() || !form.provider || !form.apiKey.trim()) {
      toast.error("Name, provider, and API key are required.")
      return
    }

    setSubmitting(true)
    try {
      const { data } = await apiClient.post<AgentProviderRow>("/admin/agent-providers", {
        name: form.name.trim(),
        provider: form.provider,
        model: form.model.trim() || null,
        api_key: form.apiKey.trim(),
      })
      setProviders((prev) => [data, ...prev])
      toast.success(`${data.name} registered`, {
        description: `Ready to use for agent runs.`,
      })
      setForm(emptyForm)
      setOpen(false)
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Could not register the model. Please try again."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(provider: AgentProviderRow) {
    setPending(provider.id)
    try {
      const { data } = await apiClient.patch<AgentProviderRow>(`/admin/agent-providers/${provider.id}/status`)
      setProviders((prev) => prev.map((p) => (p.id === provider.id ? data : p)))
      toast(`${data.name} ${data.status === "active" ? "enabled" : "disabled"}`)
    } catch {
      toast.error("Could not update the provider's status.")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">AI models</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The model providers and API keys the agent is allowed to call.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="lg">
                <Icon icon={PlusSignIcon} data-icon="inline-start" />
                Register model
              </Button>
            }
          />
          <DialogContent>
            <DialogTitle>Register an AI model</DialogTitle>
            <DialogDescription>
              Add a provider and API key. The key is stored server-side and never shown again in full.
            </DialogDescription>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="provider-name">Name</Label>
                <Input
                  id="provider-name"
                  placeholder="e.g. Production GPT-4o"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="provider-select">Provider</Label>
                <Select
                  value={form.provider}
                  onValueChange={(value) => setForm((f) => ({ ...f, provider: value as string }))}
                >
                  <SelectTrigger id="provider-select" className="w-full">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="provider-model">Model</Label>
                <Input
                  id="provider-model"
                  placeholder="e.g. gpt-4o-mini (optional)"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="provider-api-key">API key</Label>
                <Input
                  id="provider-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder="sk-…"
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={registerModel} disabled={submitting}>
                {submitting ? "Registering…" : "Register model"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="glass-panel flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon icon={CpuIcon} size={20} />
              </span>
              <button
                onClick={() => toggleStatus(provider)}
                disabled={pending === provider.id}
                className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-50"
              >
                <span className={`size-1.5 rounded-full ${provider.status === "active" ? "bg-approve" : "bg-muted-foreground"}`} />
                {pending === provider.id ? "Updating…" : provider.status}
              </button>
            </div>
            <h3 className="mt-3 text-sm font-medium text-foreground">{provider.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {provider.model ?? "No default model set"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="default">{provider.provider}</Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon icon={Key01Icon} size={13} />
                •••• {provider.api_key_last4}
              </span>
            </div>
          </div>
        ))}
        {providers.length === 0 && (
          <p className="text-xs text-muted-foreground">No models registered yet.</p>
        )}
      </div>
    </div>
  )
}
