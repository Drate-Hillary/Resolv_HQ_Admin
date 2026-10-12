"use client"

import { Badge } from "@/components/ui/badge"

export interface AgentRunRow {
  id: string
  customer_id: string | null
  conversation_id: string | null
  request_id: string | null
  status: "running" | "awaiting_approval" | "completed" | "failed"
  iterations: number
  current_step: string | null
  tool_name: string | null
  tool_input: unknown
  tool_output: unknown
  model: string | null
  prompt_version: string | null
  started_at: string
  completed_at: string | null
  error_message: string | null
}

const statusVariant: Record<string, "approve" | "default" | "destructive"> = {
  completed: "approve",
  awaiting_approval: "default",
  running: "default",
  failed: "destructive",
}

export function TracesView({ runs }: { runs: AgentRunRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Traces &amp; logs</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Exactly what happened on each run — model, current step, tool call and outcome.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {runs.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No runs recorded yet — start one from Agent Workspace.</p>
        )}
        {runs.map((run) => (
          <div key={run.id} className="glass-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{run.current_step ?? "—"}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{new Date(run.started_at).toLocaleString()}</span>
                  <span>·</span>
                  <span>{run.model ?? "—"}</span>
                  <span>·</span>
                  <span>{run.prompt_version ?? "—"}</span>
                  <span>·</span>
                  <span className="tabular">{run.iterations} iterations</span>
                </div>
              </div>
              <Badge variant={statusVariant[run.status] ?? "default"}>{run.status.replace("_", " ")}</Badge>
            </div>

            {(run.tool_name || run.error_message) && (
              <div className="mt-3 border-t border-border pt-3 text-xs">
                {run.tool_name && (
                  <p className="text-muted-foreground">
                    Tool: <span className="text-foreground">{run.tool_name}</span>
                  </p>
                )}
                {run.error_message && <p className="mt-1 text-destructive">{run.error_message}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
