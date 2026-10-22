import { useEffect, useState } from "react"
import { CpuIcon } from "@hugeicons/core-free-icons"
import { apiClient } from "@/backend/api/client"
import { Icon } from "@/components/ui/icon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConsoleStore } from "@/lib/stores/console-store"
import type { AgentProviderRow } from "@/pages/console/providers/providers-view"

const AUTO = "auto"

const label = (p: AgentProviderRow) => (p.model ? `${p.name} · ${p.model}` : p.name)

/** Lets an admin choose which registered, active model the agent uses; "Automatic" leaves the choice to the backend. */
export function ModelPicker({ disabled }: { disabled?: boolean }) {
  const selected = useConsoleStore((s) => s.selectedProviderId)
  const setSelected = useConsoleStore((s) => s.setSelectedProvider)
  const [providers, setProviders] = useState<AgentProviderRow[]>([])

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<AgentProviderRow[]>("/admin/agent-providers")
      .then(({ data }) => {
        if (cancelled) return
        const active = data.filter((p) => p.status === "active")
        setProviders(active)
        // A model that was disabled or removed since last time can't be used any more.
        if (selected && !active.some((p) => p.id === selected)) setSelected(null)
      })
      .catch(() => {
        if (!cancelled) setProviders([])
      })
    return () => {
      cancelled = true
    }
    // Only the first load: re-running on every selection would refetch for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (providers.length === 0) return null

  return (
    <Select
      value={selected ?? AUTO}
      onValueChange={(value) => setSelected(value === AUTO ? null : (value as string))}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="max-w-44 border-transparent bg-transparent dark:bg-transparent" aria-label="Model">
        <Icon icon={CpuIcon} size={14} className="shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={AUTO}>Automatic</SelectItem>
        {providers.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {label(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
