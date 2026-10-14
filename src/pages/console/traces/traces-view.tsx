import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { RunTraceDetail } from "@/components/console/run-trace-detail"
import { ProviderFailures } from "@/components/console/provider-failures"
import { isProviderFailureMessage } from "@/lib/provider-errors"

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

// Fixed locale + timezone so server and client render identical text (avoids hydration mismatch).
const startedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
})

function formatStartedAt(iso: string) {
  return `${startedAtFormatter.format(new Date(iso))} UTC`
}

export function TracesView({ runs }: { runs: AgentRunRow[] }) {
  const [openRunId, setOpenRunId] = useState<string | null>(null)
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Traces &amp; logs</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Exactly what happened on each run — open one to see retrieval, every model and tool call with latency and tokens, and the outcome.
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
                  <span>{formatStartedAt(run.started_at)}</span>
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

            <button
              onClick={() => setOpenRunId(openRunId === run.id ? null : run.id)}
              className="mt-3 text-xs font-medium text-primary hover:underline"
              aria-expanded={openRunId === run.id}
            >
              {openRunId === run.id ? "Hide step trace" : "Show step trace"}
            </button>
            {openRunId === run.id && (
              <div className="mt-2 border-t border-border pt-2">
                <RunTraceDetail runId={run.id} />
              </div>
            )}

            {(run.tool_name || run.error_message) && (
              <div className="mt-3 border-t border-border pt-3 text-xs">
                {run.tool_name && (
                  <p className="text-muted-foreground">
                    Tool: <span className="text-foreground">{run.tool_name}</span>
                  </p>
                )}
                {run.error_message &&
                  (isProviderFailureMessage(run.error_message) ? (
                    <div className="mt-2">
                      <ProviderFailures message={run.error_message} />
                    </div>
                  ) : (
                    <p className="mt-1 text-destructive">{run.error_message}</p>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
