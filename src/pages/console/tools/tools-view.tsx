"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { apiClient } from "@/backend/api/client"
import { Wrench01Icon } from "@hugeicons/core-free-icons"

export interface AgentToolRow {
  id: string
  name: string
  description: string | null
  requires_approval: boolean
  is_active: boolean
  created_at: string
}

export function ToolsView({ initialTools }: { initialTools: AgentToolRow[] }) {
  const [tools, setTools] = useState(initialTools)
  const [selected, setSelected] = useState<AgentToolRow | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  async function toggleStatus(tool: AgentToolRow) {
    setPending(tool.id)
    try {
      const { data } = await apiClient.patch<AgentToolRow>(`/admin/tools/${tool.id}/status`)
      setTools((prev) => prev.map((t) => (t.id === tool.id ? data : t)))
      setSelected((s) => (s?.id === tool.id ? data : s))
    } catch {
      // Leave status as-is if the request failed.
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Tools</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The approved functions the agent may call — every action outside this list is unavailable to it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <div key={tool.id} className="glass-panel flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon icon={Wrench01Icon} size={20} />
              </span>
              <button
                onClick={() => toggleStatus(tool)}
                disabled={pending === tool.id}
                className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-50"
              >
                <span className={`size-1.5 rounded-full ${tool.is_active ? "bg-approve" : "bg-muted-foreground"}`} />
                {pending === tool.id ? "Updating…" : tool.is_active ? "active" : "disabled"}
              </button>
            </div>
            <h3 className="mt-3 text-sm font-medium text-foreground">{tool.name}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{tool.description ?? "No description."}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tool.requires_approval && <Badge variant="default">approval required</Badge>}
            </div>
            <button
              className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              onClick={() => setSelected(tool)}
            >
              View details
            </button>
          </div>
        ))}
        {tools.length === 0 && <p className="text-xs text-muted-foreground">No tools registered.</p>}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.description ?? "No description."}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-6 pb-6 text-sm">
                <DetailRow label="Approval required" value={selected.requires_approval ? "Yes" : "No"} />
                <DetailRow label="Status" value={selected.is_active ? "Active" : "Disabled"} />
                <DetailRow label="Registered" value={new Date(selected.created_at).toLocaleDateString("en-US")} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-2.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  )
}
