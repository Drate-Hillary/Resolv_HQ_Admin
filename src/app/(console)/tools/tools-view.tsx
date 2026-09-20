"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { apiClient } from "@/backend/api/client"
import { Wrench01Icon } from "@hugeicons/core-free-icons"

export interface AgentToolRow {
  id: string
  name: string
  purpose: string
  input_schema: unknown
  output_schema: unknown
  permission: "read" | "write"
  approval_required: boolean
  status: "active" | "disabled"
  failure_behavior: string
  used_by: string
}

interface SchemaField {
  name: string
  type: string
}

function asFields(value: unknown): SchemaField[] {
  if (!Array.isArray(value)) return []
  return value.filter((f): f is SchemaField => typeof f === "object" && f !== null && "name" in f && "type" in f)
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
                <span className={`size-1.5 rounded-full ${tool.status === "active" ? "bg-approve" : "bg-muted-foreground"}`} />
                {pending === tool.id ? "Updating…" : tool.status}
              </button>
            </div>
            <h3 className="mt-3 text-sm font-medium text-foreground">{tool.name}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{tool.purpose}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant={tool.permission === "write" ? "priority-medium" : "secondary"}>
                {tool.permission}
              </Badge>
              {tool.approval_required && <Badge variant="default">approval required</Badge>}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setSelected(tool)}>
              View schema
            </Button>
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
                <SheetDescription>{selected.purpose}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-6 pb-6 text-sm">
                <SchemaBlock label="Input" fields={asFields(selected.input_schema)} />
                <SchemaBlock label="Output" fields={asFields(selected.output_schema)} />
                <DetailRow label="Permission" value={selected.permission} />
                <DetailRow label="Approval required" value={selected.approval_required ? "Yes" : "No"} />
                <DetailRow label="Failure behaviour" value={selected.failure_behavior} />
                <DetailRow label="Used by" value={selected.used_by} />
                <Button
                  variant={selected.status === "active" ? "destructive" : "default"}
                  size="sm"
                  disabled={pending === selected.id}
                  onClick={() => toggleStatus(selected)}
                >
                  {selected.status === "active" ? "Disable tool" : "Enable tool"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function SchemaBlock({ label, fields }: { label: string; fields: SchemaField[] }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-2.5 py-2 font-mono text-sm">
        {fields.map((f) => (
          <div key={f.name} className="flex justify-between gap-3">
            <span className="text-foreground">{f.name}</span>
            <span className="text-muted-foreground">{f.type}</span>
          </div>
        ))}
      </div>
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
