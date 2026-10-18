import { useMemo, useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { RunTraceDetail } from "@/components/console/run-trace-detail"
import { ProviderFailures } from "@/components/console/provider-failures"
import { isProviderFailureMessage } from "@/lib/provider-errors"
import { formatDuration } from "@/lib/run-timeline"
import { cn } from "cn"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

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

type Status = AgentRunRow["status"]

const statusVariant: Record<string, "approve" | "default" | "destructive"> = {
  completed: "approve",
  awaiting_approval: "default",
  running: "default",
  failed: "destructive",
}

const statusAccent: Record<Status, string> = {
  completed: "before:bg-emerald-500",
  awaiting_approval: "before:bg-amber-500",
  running: "before:bg-primary",
  failed: "before:bg-destructive",
}

const FILTERS: { id: Status | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "awaiting_approval", label: "Awaiting approval" },
  { id: "running", label: "Running" },
  { id: "failed", label: "Failed" },
]

// Fixed locale + timezone so server and client render identical text (avoids hydration mismatch).
const startedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
})

function formatStartedAt(iso: string) {
  return `${startedAtFormatter.format(new Date(iso))} UTC`
}

const stepLabel = (run: AgentRunRow) => (run.current_step ?? "No step recorded").replace(/_/g, " ")
const durationMs = (run: AgentRunRow) => (run.completed_at ? Date.parse(run.completed_at) - Date.parse(run.started_at) : null)

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="glass-panel px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-xl font-semibold tracking-tight tabular-nums", tone ?? "text-foreground")}>{value}</p>
    </div>
  )
}

function RunCard({ run, onOpen }: { run: AgentRunRow; onOpen: () => void }) {
  const duration = durationMs(run)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "glass-panel relative flex flex-col gap-3 overflow-hidden p-4 pl-5 text-left outline-none transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/40",
        statusAccent[run.status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground capitalize">{stepLabel(run)}</p>
        <Badge variant={statusVariant[run.status] ?? "default"}>{run.status.replace("_", " ")}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{formatStartedAt(run.started_at)}</p>
      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        {run.model && <span className="rounded-full bg-muted px-2 py-0.5">{run.model}</span>}
        <span className="rounded-full bg-muted px-2 py-0.5 tabular-nums">{run.iterations} iterations</span>
        {duration != null && <span className="rounded-full bg-muted px-2 py-0.5 tabular-nums">{formatDuration(duration)}</span>}
        {run.tool_name && <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{run.tool_name}</span>}
      </div>
      {run.error_message && (
        <p className="line-clamp-2 text-xs text-destructive">
          {isProviderFailureMessage(run.error_message) ? "Every model provider failed for this run." : run.error_message}
        </p>
      )}
    </button>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-xs text-foreground">{children}</dd>
    </div>
  )
}

function RunDialog({ run, onClose }: { run: AgentRunRow; onClose: () => void }) {
  const duration = durationMs(run)
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[min(44rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogDescription>Run {run.id.slice(0, 8)}</DialogDescription>
            <DialogTitle className="mt-1 text-base capitalize">{stepLabel(run)}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[run.status] ?? "default"}>{run.status.replace("_", " ")}</Badge>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close run">
              <Icon icon={Cancel01Icon} size={14} />
            </Button>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-3">
          <Detail label="Started">{formatStartedAt(run.started_at)}</Detail>
          <Detail label="Duration">{duration != null ? formatDuration(duration) : "Not finished"}</Detail>
          <Detail label="Iterations">{run.iterations}</Detail>
          <Detail label="Model">{run.model ?? "—"}</Detail>
          <Detail label="Prompt version">{run.prompt_version ?? "—"}</Detail>
          <Detail label="Tool">{run.tool_name ?? "—"}</Detail>
        </dl>

        {run.error_message &&
          (isProviderFailureMessage(run.error_message) ? (
            <ProviderFailures message={run.error_message} />
          ) : (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{run.error_message}</p>
          ))}

        <section>
          <h3 className="mb-2 text-sm font-medium text-foreground">Step trace</h3>
          <RunTraceDetail runId={run.id} />
        </section>
      </DialogContent>
    </Dialog>
  )
}

export function TracesView({ runs }: { runs: AgentRunRow[] }) {
  const [openRunId, setOpenRunId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Status | "all">("all")

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: runs.length }
    for (const run of runs) c[run.status] = (c[run.status] ?? 0) + 1
    return c
  }, [runs])
  const shown = filter === "all" ? runs : runs.filter((r) => r.status === filter)
  const open = runs.find((r) => r.id === openRunId)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Traces &amp; logs</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Exactly what happened on each run. Open one to see retrieval, every model and tool call with latency and tokens, and the outcome.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Runs" value={counts.all} />
        <Stat label="Completed" value={counts.completed ?? 0} tone="text-emerald-600" />
        <Stat label="Awaiting approval" value={counts.awaiting_approval ?? 0} tone="text-amber-600" />
        <Stat label="Failed" value={counts.failed ?? 0} tone={counts.failed ? "text-destructive" : undefined} />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter runs by status">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label} <span className="tabular-nums opacity-70">{counts[f.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          {runs.length === 0 ? "No runs recorded yet. Start one from the Chat page." : "No runs with this status."}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((run) => (
            <RunCard key={run.id} run={run} onOpen={() => setOpenRunId(run.id)} />
          ))}
        </div>
      )}

      {open && <RunDialog key={open.id} run={open} onClose={() => setOpenRunId(null)} />}
    </div>
  )
}
