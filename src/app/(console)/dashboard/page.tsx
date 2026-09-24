import Link from "next/link"
import { StatCard } from "@/components/console/stat-card"
import { apiFetch } from "@/backend/api/server"
import {
  Pulse02Icon,
  CheckmarkCircle02Icon,
  Knowledge01Icon,
  Wrench01Icon,
  AiBrain01Icon,
  Alert02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"

const statusDot: Record<string, string> = {
  completed: "bg-approve",
  awaiting_approval: "bg-primary",
  running: "bg-primary",
  failed: "bg-destructive",
}

const statusLabel: Record<string, string> = {
  completed: "Completed",
  awaiting_approval: "Awaiting approval",
  running: "Running",
  failed: "Blocked",
}

interface RecentRun {
  id: string
  status: string
  started_at: string
  current_step: string | null
  model: string | null
}

interface DashboardResponse {
  recentRuns: RecentRun[]
  stats: {
    tasksToday: number
    ragDocuments: number
    activeTools: number
    memoryRecords: number
    failedRuns: number
    pendingApprovals: number
  }
}

export default async function DashboardPage() {
  const { recentRuns, stats } = await apiFetch<DashboardResponse>("/admin/dashboard")

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Agent Command Center</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Monitor the support agent&rsquo;s workflows, decisions, tools and knowledge.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Agent status" value="Online" icon={Pulse02Icon} />
        <StatCard label="Tasks today" value={String(stats.tasksToday)} icon={CheckmarkCircle02Icon} />
        <StatCard label="RAG documents" value={String(stats.ragDocuments)} icon={Knowledge01Icon} />
        <StatCard label="Active tools" value={String(stats.activeTools)} icon={Wrench01Icon} />
        <StatCard label="Memory records" value={String(stats.memoryRecords)} icon={AiBrain01Icon} />
        <StatCard label="Failed runs (7d)" value={String(stats.failedRuns)} icon={Alert02Icon} tone="danger" />
        <StatCard label="Pending approvals" value={String(stats.pendingApprovals)} icon={SecurityCheckIcon} tone="warn" />
      </div>

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
                <p className="truncate text-xs font-medium text-foreground">{run.current_step ?? run.model ?? "Run"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                <span className={`size-1.5 rounded-full ${statusDot[run.status] ?? "bg-muted-foreground"}`} />
                {statusLabel[run.status] ?? run.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
