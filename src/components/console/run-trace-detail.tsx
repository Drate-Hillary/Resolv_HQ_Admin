import { useEffect, useState } from "react"
import { apiClient } from "@/backend/api/client"
import { formatDuration, type TimelineRow } from "@/lib/run-timeline"
import { cn } from "cn"

const KIND_LABEL: Record<TimelineRow["kind"], string> = {
  retrieval: "Retrieval",
  model_call: "Model call",
  tool_call: "Tool call",
  guardrail: "Guardrail",
  outcome: "Outcome",
}

/** Loads and shows one run's persisted trace (agent_trace_logs) as an ordered table. */
export function RunTraceDetail({ runId }: { runId: string }) {
  const [rows, setRows] = useState<TimelineRow[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<{ events: TimelineRow[] }>(`/admin/traces/${runId}`)
      .then((res) => !cancelled && setRows(res.data.events))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [runId])

  if (failed) return <p className="text-xs text-destructive">Could not load this run's trace.</p>
  if (!rows) return <p className="text-xs text-muted-foreground">Loading trace…</p>
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">No step-level trace was recorded for this run (it predates trace logging).</p>

  return (
    <ol className="flex flex-col divide-y divide-border text-xs">
      {rows.map((r) => {
        const tokens = r.input_tokens != null || r.output_tokens != null ? `${r.input_tokens ?? 0} in / ${r.output_tokens ?? 0} out` : null
        return (
          <li key={r.seq} className="grid grid-cols-[1.5rem_6rem_1fr_auto] items-baseline gap-2 py-1.5">
            <span className="text-muted-foreground tabular-nums">{r.seq}</span>
            <span className="font-medium text-foreground">{KIND_LABEL[r.kind]}{r.tool_name ? ` · ${r.tool_name}` : ""}</span>
            <span className={cn("min-w-0 break-words", r.error ? "text-destructive" : "text-muted-foreground")}>
              {r.error ?? r.outcome ?? r.detail ?? "—"}
              {r.provider && <span className="text-muted-foreground"> ({r.provider}{r.model ? ` · ${r.model}` : ""})</span>}
            </span>
            <span className="text-right text-muted-foreground tabular-nums">
              {[r.latency_ms != null ? formatDuration(r.latency_ms) : null, tokens].filter(Boolean).join(" · ")}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
