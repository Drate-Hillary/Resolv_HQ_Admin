import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface ConfidenceBucket {
  bucket: string
  runs: number
  flagged: number
  flaggedRate: number
}

export interface ProviderReliability {
  name: string
  model: string | null
  /** null: the client never sets one, so the vendor default applies. */
  temperature: number | null
  runs: number
  avgConfidence: number
  flaggedRate: number
}

export interface Reliability {
  runsAnalysed: number
  avgConfidence: number
  flaggedRate: number
  byConfidence: ConfidenceBucket[]
  byProvider: ProviderReliability[]
}

const hallucinationConfig = {
  runs: { label: "Runs", color: "var(--chart-1)" },
  flaggedRate: { label: "Flagged rate (%)", color: "var(--destructive)" },
} satisfies ChartConfig

/** Share of answers flagged as possible hallucinations at each level of retrieval confidence. */
export function HallucinationChart({ data }: { data: ConfidenceBucket[] }) {
  return (
    <ChartContainer config={hallucinationConfig} className="aspect-auto h-60 w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis yAxisId="runs" hide allowDecimals={false} />
        <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} width={34} tickFormatter={(v: number) => `${v}%`} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar yAxisId="runs" dataKey="runs" fill="var(--color-runs)" barSize={22} radius={4} />
        <Line yAxisId="rate" dataKey="flaggedRate" type="monotone" stroke="var(--color-flaggedRate)" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ChartContainer>
  )
}

const providerConfig = {
  avgConfidence: { label: "Avg confidence (%)", color: "var(--chart-1)" },
  flaggedRate: { label: "Flagged rate (%)", color: "var(--destructive)" },
} satisfies ChartConfig

/** Confidence and flagged rate per registered model, labelled with the temperature it runs at. */
export function TemperatureChart({ data }: { data: ProviderReliability[] }) {
  const rows = data.map((p) => ({ ...p, label: `${p.name} · ${p.temperature === null ? "default" : `T=${p.temperature}`}` }))
  return (
    <ChartContainer config={providerConfig} className="aspect-auto h-60 w-full">
      <ComposedChart data={rows} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={34} tickFormatter={(v: number) => `${v}%`} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="avgConfidence" fill="var(--color-avgConfidence)" barSize={14} radius={7} />
        <Bar dataKey="flaggedRate" fill="var(--color-flaggedRate)" barSize={14} radius={7} />
      </ComposedChart>
    </ChartContainer>
  )
}
