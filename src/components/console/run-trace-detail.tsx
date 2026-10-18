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

const KIND_STYLE: Record<TimelineRow["kind"], string> = {
  retrieval: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  model_call: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  tool_call: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  guardrail: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  outcome: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

/** Loads one run's persisted trace (agent_trace_logs) and shows it as a timeline of step cards. */
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

  if (failed) return <p className="text-xs text-destructive">Could not load this run&apos;s trace.</p>
  if (!rows) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted/60 motion-safe:animate-pulse" />
        ))}
      </div>
    )
  }
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">No step-level trace was recorded for this run (it predates trace logging).</p>
  }

  // Bars are relative to the slowest step, so the eye lands on where the time went.
  const slowest = Math.max(1, ...rows.map((r) => r.latency_ms ?? 0))

  return (
    <ol className="relative flex flex-col gap-2 before:absolute before:top-3 before:bottom-3 before:left-[0.8rem] before:w-px before:bg-border">
      {rows.map((r) => {
        const tokens = r.input_tokens != null || r.output_tokens != null ? `${r.input_tokens ?? 0} in · ${r.output_tokens ?? 0} out` : null
        return (
          <li key={r.seq} className="relative flex gap-3">
            <span className="z-10 mt-2.5 flex size-[1.6rem] shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs text-muted-foreground tabular-nums">
              {r.seq}
            </span>
            <div className={cn("min-w-0 flex-1 rounded-lg border bg-card p-3 text-xs", r.error ? "border-destructive/40" : "border-border")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", KIND_STYLE[r.kind])}>{KIND_LABEL[r.kind]}</span>
                  {r.tool_name && <span className="font-medium text-foreground">{r.tool_name}</span>}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {[r.latency_ms != null ? formatDuration(r.latency_ms) : null, tokens].filter(Boolean).join(" · ")}
                </span>
              </div>
              <p className={cn("mt-1.5 break-words", r.error ? "text-destructive" : "text-muted-foreground")}>
                {r.error ?? r.outcome ?? r.detail ?? "—"}
                {r.provider && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({r.provider}
                    {r.model ? ` · ${r.model}` : ""})
                  </span>
                )}
              </p>
              {r.latency_ms != null && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn("h-full rounded-full", r.error ? "bg-destructive/60" : "bg-primary/50")}
                    style={{ width: `${Math.max(3, (r.latency_ms / slowest) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
