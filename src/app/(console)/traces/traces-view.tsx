"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { cn } from "cn"
import { ChevronDownIcon } from "@hugeicons/core-free-icons"

export interface TraceRunViewRow {
  id: string | null
  title: string | null
  date: string | null
  status: string | null
  model: string | null
  prompt_version: string | null
  latency_ms: number | null
  events: unknown
}

interface TraceEvent {
  time: string
  label: string
  detail?: unknown
  kind: string
}

const statusVariant: Record<string, "approve" | "default" | "destructive"> = {
  completed: "approve",
  recovered: "default",
  awaiting_approval: "default",
  in_progress: "default",
  failed: "destructive",
}

const kindDot: Record<string, string> = {
  request: "bg-muted-foreground",
  context: "bg-primary",
  retrieval: "bg-primary",
  plan: "bg-primary",
  tool: "bg-primary",
  observation: "bg-primary",
  decision: "bg-primary",
  approval: "bg-primary",
  result: "bg-approve",
}

const kinds = ["request", "context", "retrieval", "plan", "tool", "observation", "decision", "approval", "result"]

function eventsOf(run: TraceRunViewRow): TraceEvent[] {
  if (!Array.isArray(run.events)) return []
  return run.events as unknown as TraceEvent[]
}

export function TracesView({ runs }: { runs: TraceRunViewRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(runs[0]?.id ?? null)
  const [kindFilter, setKindFilter] = useState<string>("all")

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Traces &amp; logs</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Exactly what happened on each run — model, retrieval, tool calls, latency and outcome.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setKindFilter("all")}
          className={cn(
            "rounded-full border px-2.5 py-1 text-sm font-medium capitalize transition-colors",
            kindFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All events
        </button>
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-sm font-medium capitalize transition-colors",
              kindFilter === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {runs.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No runs recorded yet — start one from Agent Workspace.</p>
        )}
        {runs.map((run) => {
          const open = expandedId === run.id
          const allEvents = eventsOf(run)
          const events = kindFilter === "all" ? allEvents : allEvents.filter((e) => e.kind === kindFilter)
          return (
            <div key={run.id} className="glass-panel overflow-hidden">
              <button
                onClick={() => setExpandedId(open ? null : run.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-medium text-foreground">{run.title}</p>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{run.date ? new Date(run.date).toLocaleString() : "—"}</span>
                    <span>·</span>
                    <span>{run.model}</span>
                    <span>·</span>
                    <span>{run.prompt_version}</span>
                    <span>·</span>
                    <span className="tabular">{run.latency_ms != null ? `${(run.latency_ms / 1000).toFixed(1)}s` : "—"}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={statusVariant[run.status ?? ""] ?? "default"}>{(run.status ?? "").replace("_", " ")}</Badge>
                  <Icon icon={ChevronDownIcon} size={19} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
                </div>
              </button>

              {open && (
                <div className="border-t border-border px-4 py-3">
                  <ol className="flex flex-col gap-2.5">
                    {events.map((event, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs">
                        <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", kindDot[event.kind] ?? "bg-muted-foreground")} />
                        <span className="tabular w-32 shrink-0 text-muted-foreground">
                          {event.time ? new Date(event.time).toLocaleTimeString() : ""}
                        </span>
                        <div className="min-w-0">
                          <p className="text-foreground">{event.label}</p>
                          {event.detail != null && (
                            <p className="text-muted-foreground">
                              {typeof event.detail === "string" ? event.detail : JSON.stringify(event.detail)}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                    {events.length === 0 && <p className="text-xs text-muted-foreground">No events match this filter.</p>}
                  </ol>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
