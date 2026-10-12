import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface RunsByDay {
  date: string
  runs: number
  failed: number
}

const chartConfig = {
  runs: { label: "Runs", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--destructive)" },
} satisfies ChartConfig

// Bars are 10px wide; a radius of half that makes the ends fully round.
const BAR_SIZE = 10
const BAR_RADIUS = BAR_SIZE / 2

export function RunsChart({ data }: { data: RunsByDay[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) =>
            new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })
          }
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
              }
            />
          }
        />
        <Bar dataKey="runs" fill="var(--color-runs)" barSize={BAR_SIZE} radius={BAR_RADIUS} />
        <Bar dataKey="failed" fill="var(--color-failed)" barSize={BAR_SIZE} radius={BAR_RADIUS} />
      </BarChart>
    </ChartContainer>
  )
}
