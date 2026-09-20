"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { apiClient } from "@/backend/api/client"
import { Search01Icon, Delete02Icon, AiBrain01Icon } from "@hugeicons/core-free-icons"

export interface AgentMemoryRecordRow {
  id: string
  request_id: string | null
  title: string
  content: string
  reason: string
  access_scope: string
  source: string
  retention_days: number
  created_at: string
  expires_at: string
}

export function MemoryView({ initialRecords }: { initialRecords: AgentMemoryRecordRow[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [query, setQuery] = useState("")

  const filtered = records.filter(
    (r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.content.toLowerCase().includes(query.toLowerCase())
  )

  async function deleteRecord(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    await apiClient.delete(`/admin/memory-records/${id}`)
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Memory</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          What the agent remembers between sessions, why it&rsquo;s kept, and how long it stays.
        </p>
      </div>

      <div className="relative w-full sm:max-w-64">
        <Icon icon={Search01Icon} size={19} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memory…"
          className="h-8 w-full rounded-md border border-border bg-transparent pl-8 pr-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((record) => (
          <div key={record.id} className="glass-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon icon={AiBrain01Icon} size={19} />
                </span>
                <div>
                  <h3 className="text-xs font-medium text-foreground">{record.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{record.content}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete memory"
                onClick={() => deleteRecord(record.id)}
              >
                <Icon icon={Delete02Icon} size={19} />
              </Button>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Why stored</dt>
                <dd className="mt-0.5 text-foreground">{record.reason}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Who can access</dt>
                <dd className="mt-0.5 text-foreground">{record.access_scope}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Retention</dt>
                <dd className="tabular mt-0.5 text-foreground">{record.retention_days} days</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="mt-0.5 text-foreground">{record.source}</dd>
              </div>
            </dl>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No memory records match &ldquo;{query}&rdquo;.</p>
        )}
      </div>
    </div>
  )
}
