"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/backend/api/client"

export interface AgentProvider {
  id: string
  name: string
  provider: string
  model: string | null
  apiKeyMasked: string
  status: "active" | "disabled"
  createdAt: string
  updatedAt: string
}

const PROVIDER_OPTIONS = ["OpenAI", "Anthropic", "Google", "Custom"]

const emptyDraft = { name: "", provider: PROVIDER_OPTIONS[0], model: "", apiKey: "" }

export function AgentProvidersManager({ initialAgentProviders }: { initialAgentProviders: AgentProvider[] }) {
  const [agentProviders, setAgentProviders] = useState(initialAgentProviders)
  const [draft, setDraft] = useState(emptyDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function register() {
    if (!draft.name.trim() || !draft.provider.trim() || !draft.apiKey.trim()) {
      setError("Name, provider and API key are required.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await apiClient.post<AgentProvider>("/admin/agent-providers", {
        name: draft.name.trim(),
        provider: draft.provider.trim(),
        model: draft.model.trim() || undefined,
        apiKey: draft.apiKey.trim(),
      })
      setAgentProviders((prev) => [data, ...prev])
      setDraft(emptyDraft)
      setFormOpen(false)
    } catch {
      setError("Failed to register the agent. Check the API key and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(row: AgentProvider) {
    setBusyId(row.id)
    try {
      const { data } = await apiClient.patch<AgentProvider>(`/admin/agent-providers/${row.id}`, {
        status: row.status === "active" ? "disabled" : "active",
      })
      setAgentProviders((prev) => prev.map((r) => (r.id === row.id ? data : r)))
    } catch {
      // Leave the row as-is; the admin can retry.
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      await apiClient.delete(`/admin/agent-providers/${id}`)
      setAgentProviders((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // No-op — row stays if the delete failed.
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      {agentProviders.length === 0 && !formOpen && (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No AI agents registered yet.
        </p>
      )}

      {agentProviders.map((row) => (
        <div key={row.id} className="rounded-md border border-border px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">{row.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant={row.status === "active" ? "approve" : "secondary"}>{row.status}</Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === row.id}
                onClick={() => toggleStatus(row)}
              >
                {row.status === "active" ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === row.id}
                onClick={() => remove(row.id)}
              >
                Remove
              </Button>
            </div>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="mt-0.5 text-foreground">{row.provider}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Model</dt>
              <dd className="mt-0.5 text-foreground">{row.model ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">API key</dt>
              <dd className="tabular mt-0.5 text-foreground">{row.apiKeyMasked}</dd>
            </div>
          </dl>
        </div>
      ))}

      {formOpen ? (
        <div className="rounded-md border border-border px-3 py-3 text-xs">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Name</label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Support Classifier"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Provider</label>
              <select
                value={draft.provider}
                onChange={(e) => setDraft((d) => ({ ...d, provider: e.target.value }))}
                className="h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Model (optional)</label>
              <Input
                value={draft.model}
                onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                placeholder="gpt-4o"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">API key</label>
              <Input
                type="password"
                value={draft.apiKey}
                onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-destructive">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" disabled={submitting} onClick={register}>
              Register agent
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={submitting}
              onClick={() => {
                setFormOpen(false)
                setDraft(emptyDraft)
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setFormOpen(true)}>
          Register AI agent
        </Button>
      )}
    </div>
  )
}
