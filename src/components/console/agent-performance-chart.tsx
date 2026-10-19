import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface AgentPerformance {
  id: string
  name: string
  model: string | null
  responses: number
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export function AgentPerformanceChart({ data }: { data: AgentPerformance[] }) {
  const total = data.reduce((n, a) => n + a.responses, 0)

  if (data.length === 0) {
    return <p className="py-10 text-center text-xs text-muted-foreground">No agent providers registered yet.</p>
  }

  const config = Object.fromEntries(
    data.map((a, i) => [a.id, { label: a.name, color: COLORS[i % COLORS.length] }])
  ) satisfies ChartConfig

  // With no responses yet every slice would be zero and the pie would be blank,
  // so draw a neutral ring instead and say why.
  const chartData =
    total > 0
      ? data.filter((a) => a.responses > 0).map((a) => ({ agent: a.id, responses: a.responses, fill: COLORS[data.indexOf(a) % COLORS.length] }))
      : [{ agent: "none", responses: 1, fill: "var(--muted)" }]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <PieChart>
            {total > 0 && <ChartTooltip content={<ChartTooltipContent nameKey="agent" hideLabel />} />}
            <Pie data={chartData} dataKey="responses" nameKey="agent" innerRadius={55} strokeWidth={2} isAnimationActive={false}>
              {chartData.map((d) => (
                <Cell key={d.agent} fill={d.fill} />
              ))}
            </Pie>
            {total > 0 && <ChartLegend content={<ChartLegendContent nameKey="agent" />} />}
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
          <span className="text-xl font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">responses</span>
        </div>
      </div>
      {total === 0 && (
        <p className="text-center text-xs text-muted-foreground">No responses yet — they appear here once an agent answers.</p>
      )}
      <ul className="flex flex-col divide-y divide-border">
        {data.map((a, i) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0">
            <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
              <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate">{a.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {a.responses} {a.responses === 1 ? "response" : "responses"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
