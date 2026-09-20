import Link from "next/link"
import { StatCard } from "@/components/console/stat-card"
import { Progress } from "@/components/ui/progress"
import { Icon } from "@/components/ui/icon"
import { apiFetch } from "@/backend/api/server"
import type { EvalDimension } from "@/types/console"
import {
  Pulse02Icon,
  CheckmarkCircle02Icon,
  Time01Icon,
  Chart01Icon,
  Knowledge01Icon,
  Wrench01Icon,
  AiBrain01Icon,
  Target01Icon,
  Alert02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"

const statusDot: Record<string, string> = {
  completed: "bg-approve",
  recovered: "bg-primary",
  awaiting_approval: "bg-primary",
  in_progress: "bg-primary",
  failed: "bg-destructive",
}

const statusLabel: Record<string, string> = {
  completed: "Completed",
  recovered: "Recovered",
  awaiting_approval: "Awaiting approval",
  in_progress: "In progress",
  failed: "Blocked",
}

interface RecentRun {
  id: string | null
  title: string | null
  date: string | null
  status: string | null
}

interface DashboardResponse {
  recentRuns: RecentRun[]
  successRate: number
  evalDimensions: EvalDimension[]
  avgLatencyMs: number
  avgCsat: string | null
  stats: {
    tasksToday: number
    ragDocuments: number
    activeTools: number
    memoryRecords: number
    evalScenarios: number
    failedRuns: number
    pendingApprovals: number
  }
}

export default async function DashboardPage() {
  const { recentRuns, successRate, evalDimensions, avgLatencyMs, avgCsat, stats } =
    await apiFetch<DashboardResponse>("/admin/dashboard")

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Agent Command Center</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Monitor the procurement agent&rsquo;s workflows, decisions, tools, knowledge and evaluation performance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Agent status" value="Online" icon={Pulse02Icon} />
        <StatCard label="Tasks today" value={String(stats.tasksToday)} icon={CheckmarkCircle02Icon} />
        <StatCard label="Success rate" value={`${successRate}%`} icon={Target01Icon} />
        <StatCard label="Avg latency" value={`${(avgLatencyMs / 1000).toFixed(1)}s`} icon={Time01Icon} />
        <StatCard label="Eval scenarios" value={String(stats.evalScenarios)} icon={Chart01Icon} />
        <StatCard label="RAG documents" value={String(stats.ragDocuments)} icon={Knowledge01Icon} />
        <StatCard label="Active tools" value={String(stats.activeTools)} icon={Wrench01Icon} />
        <StatCard label="Memory records" value={String(stats.memoryRecords)} icon={AiBrain01Icon} />
        <StatCard label="Failed runs (7d)" value={String(stats.failedRuns)} icon={Alert02Icon} tone="danger" />
        <StatCard label="Pending approvals" value={String(stats.pendingApprovals)} icon={SecurityCheckIcon} tone="warn" />
        <StatCard label="Avg CSAT" value={avgCsat ? `${avgCsat}/5` : "—"} icon={CheckmarkCircle02Icon} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground">Recent runs</h3>
            <Link href="/traces" className="text-sm font-medium text-primary hover:underline">
              View all traces
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {recentRuns.length === 0 && (
              <li className="py-2.5 text-xs text-muted-foreground">No runs yet — start one from Agent Workspace.</li>
            )}
            {recentRuns.map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{run.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {run.date ? new Date(run.date).toLocaleString() : "—"}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${statusDot[run.status ?? ""] ?? "bg-muted-foreground"}`} />
                  {statusLabel[run.status ?? ""] ?? run.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground">Evaluation snapshot</h3>
            <Link href="/evaluations" className="text-sm font-medium text-primary hover:underline">
              View scenarios
            </Link>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <Icon icon={Chart01Icon} size={21} className="text-primary" />
            <span className="tabular text-2xl font-semibold text-foreground">{successRate}%</span>
            <span className="text-sm text-muted-foreground">overall score</span>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {evalDimensions.length === 0 && (
              <p className="text-xs text-muted-foreground">No evaluation runs recorded yet.</p>
            )}
            {evalDimensions.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="tabular font-medium text-foreground">{d.score}%</span>
                </div>
                <Progress value={d.score} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
