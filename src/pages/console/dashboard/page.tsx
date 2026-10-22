import { Link } from "react-router-dom"
import { RunsChart, type RunsByDay } from "@/components/console/runs-chart"
import { AgentPerformanceChart, type AgentPerformance } from "@/components/console/agent-performance-chart"
import { HallucinationChart, TemperatureChart, type Reliability } from "@/components/console/reliability-charts"
import { StatCard } from "@/components/console/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageStatus } from "@/components/console/page-status"
import { useApiData } from "@/hooks/use-api-data"
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
  reliability?: Reliability
  agentPerformance: AgentPerformance[]
  runsByDay: RunsByDay[]
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

export default function DashboardPage() {
  const { data, loading, error } = useApiData<DashboardResponse>("/admin/dashboard")

  if (!data) return <PageStatus loading={loading} error={error} />

  const { runsByDay, recentRuns, stats, agentPerformance } = data
  // An API that has not been restarted since the reliability metrics were added omits this block; show it empty rather than blanking the page.
  const reliability: Reliability = data.reliability ?? {
    runsAnalysed: 0,
    avgConfidence: 0,
    flaggedRate: 0,
    byConfidence: [],
    byProvider: [],
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Agent Command Center</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Monitor the support agent&rsquo;s workflows, decisions, tools and knowledge.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Agent status" value="Online" icon={Pulse02Icon} />
        <StatCard label="Tasks today" value={String(stats.tasksToday)} icon={CheckmarkCircle02Icon} />
        <StatCard label="Pending approvals" value={String(stats.pendingApprovals)} icon={SecurityCheckIcon} tone={stats.pendingApprovals > 0 ? "warn" : "default"} />
        <StatCard label="Failed runs (7d)" value={String(stats.failedRuns)} icon={Alert02Icon} tone={stats.failedRuns > 0 ? "danger" : "default"} />
        <StatCard label="RAG documents" value={String(stats.ragDocuments)} icon={Knowledge01Icon} />
        <StatCard label="Active tools" value={String(stats.activeTools)} icon={Wrench01Icon} />
        <StatCard label="Memory records" value={String(stats.memoryRecords)} icon={AiBrain01Icon} />
      </div>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Agent runs</TabsTrigger>
          <TabsTrigger value="hallucination">Hallucination</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
        </TabsList>

        <TabsContent value="runs">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass-panel p-5 lg:col-span-2">
              <h3 className="text-sm font-medium text-foreground">Agent runs</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Last 7 days</p>
              <div className="mt-4">
                <RunsChart data={runsByDay} />
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-sm font-medium text-foreground">Responses by agent provider</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Which model answered</p>
              <div className="mt-4">
                <AgentPerformanceChart data={agentPerformance} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hallucination">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass-panel p-5 lg:col-span-2">
              <h3 className="text-sm font-medium text-foreground">Hallucination vs confidence</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Last 7 days · bars: runs at each confidence level · line: share flagged as a possible hallucination
              </p>
              <div className="mt-4">
                {reliability.runsAnalysed === 0 ? (
                  <p className="py-16 text-center text-xs text-muted-foreground">No model-answered runs in the last 7 days yet.</p>
                ) : (
                  <HallucinationChart data={reliability.byConfidence} />
                )}
              </div>
            </div>
            <div className="glass-panel flex flex-col gap-3 p-5">
              <h3 className="text-sm font-medium text-foreground">How this is measured</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Figure label="Runs" value={String(reliability.runsAnalysed)} />
                <Figure label="Avg confidence" value={`${reliability.avgConfidence}%`} />
                <Figure label="Flagged" value={`${reliability.flaggedRate}%`} />
              </div>
              <p className="text-xs/relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Confidence</span> is how strongly the best retrieved passage matched the
                question. The model does not report its own confidence.
              </p>
              <p className="text-xs/relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Flagged</span> means the boundary matrix blocked the answer for claiming
                an action the agent cannot take, or it answered with no retrieved source and no tool result. These are proxies for
                hallucination, not a verified count.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="temperature">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass-panel p-5 lg:col-span-2">
              <h3 className="text-sm font-medium text-foreground">Confidence and flagged rate by model temperature</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Last 7 days · each registered model, labelled with its temperature</p>
              <div className="mt-4">
                {reliability.byProvider.length === 0 ? (
                  <p className="py-16 text-center text-xs text-muted-foreground">No models registered yet.</p>
                ) : (
                  <TemperatureChart data={reliability.byProvider} />
                )}
              </div>
            </div>
            <div className="glass-panel p-5">
              <h3 className="text-sm font-medium text-foreground">Configured temperatures</h3>
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {reliability.byProvider.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.model ?? "default model"} · {p.runs} runs</p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground">{p.temperature === null ? "Vendor default" : p.temperature}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs/relaxed text-muted-foreground">
                Only LangChain models pin a temperature (0). The other clients leave it unset, so the provider&rsquo;s own default
                applies and no number is available.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Recent runs</h3>
          <Link to="/traces" className="text-xs font-medium text-primary hover:underline">
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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
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

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-2">
      <p className="text-base font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
