// Turns the backend's persistent trace rows (agent_trace_logs, returned as
// `timeline` by POST /chat/conversations/:id/messages) into the ordered steps
// the Agent activity column shows: Sense -> Plan -> Act -> Observe -> Boundary
// check -> Respond, each with its real latency and token count.
import type { RunStep } from "@/types/console"

export interface TimelineRow {
  seq: number
  kind: "retrieval" | "model_call" | "tool_call" | "guardrail" | "outcome"
  iteration: number | null
  provider: string | null
  model: string | null
  tool_name: string | null
  tool_input: unknown
  detail: string | null
  latency_ms: number | null
  input_tokens: number | null
  output_tokens: number | null
  error: string | null
  outcome: string | null
}

const OUTCOME_LABEL: Record<string, string> = {
  answered: "Answered",
  escalated: "Escalated for approval",
  blocked: "Blocked by boundary rule",
  fallback: "Answered by keyword search (no model available)",
}

/** 842 -> "842", 2000 -> "2k", 2450 -> "2.4k", 12800 -> "12.8k", 1.2M -> "1.2M". */
export function formatTokens(n: number): string {
  const compact = (value: number, unit: string) => `${Math.floor(value * 10) / 10}${unit}`.replace(".0", "")
  if (n < 1_000) return String(n)
  if (n < 1_000_000) return compact(n / 1_000, "k")
  return compact(n / 1_000_000, "M")
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

function tokenText(row: TimelineRow): string | undefined {
  if (row.input_tokens == null && row.output_tokens == null) return undefined
  return `${(row.input_tokens ?? 0).toLocaleString()} in · ${(row.output_tokens ?? 0).toLocaleString()} out tokens`
}

function retrievalDetail(row: TimelineRow): string {
  try {
    const docs = JSON.parse(row.detail ?? "[]") as { title: string; score?: number }[]
    if (docs.length === 0) return "No matching knowledge passages — the model answers without sources."
    return `${docs.length} passage${docs.length === 1 ? "" : "s"}: ${docs.map((d) => d.title).join(", ")}`
  } catch {
    return row.detail ?? ""
  }
}

export function timelineToSteps(rows: TimelineRow[], handoffs: string[] = []): RunStep[] {
  const steps: RunStep[] = []
  const add = (key: string, label: string, status: RunStep["status"], text?: string | null, meta?: RunStep["meta"]) =>
    steps.push({ key, label, status, detail: text ? { type: "text", text } : undefined, meta })

  handoffs.forEach((text, i) => add(`handoff-${i}`, text, "done"))

  const hasGuardrail = rows.some((r) => r.kind === "guardrail")
  for (const row of rows) {
    const key = `trace-${row.seq}`
    switch (row.kind) {
      case "retrieval":
        add(key, "Sense · retrieved context", "done", retrievalDetail(row))
        break
      case "model_call": {
        const wantsTools = row.detail?.startsWith("Requested tools:")
        const label = row.error
          ? `Plan · model call ${row.iteration} failed`
          : wantsTools
            ? `Plan · step ${row.iteration}`
            : "Respond · drafted answer"
        const who = row.provider ? `${row.provider} (${row.model})` : null
        add(key, label, row.error ? "failed" : "done", row.error ?? [who, row.detail].filter(Boolean).join(" — "), {
          latencyMs: row.latency_ms ?? undefined,
          tokens: tokenText(row),
        })
        break
      }
      case "tool_call": {
        const name = row.tool_name ?? "tool"
        add(`${key}-act`, `Act · ${name}`, row.error ? "failed" : "done", row.tool_input ? JSON.stringify(row.tool_input) : "no arguments", {
          latencyMs: row.latency_ms ?? undefined,
        })
        add(`${key}-obs`, `Observe · ${name}`, row.error ? "failed" : "done", row.error ?? row.detail)
        break
      }
      case "guardrail":
        add(key, "Boundary check · blocked", "failed", row.detail)
        break
      case "outcome":
        if (!hasGuardrail && row.outcome !== "fallback") add(`${key}-guard`, "Boundary check · passed", "done")
        add(key, `Outcome · ${OUTCOME_LABEL[row.outcome ?? ""] ?? row.outcome ?? "finished"}`, row.outcome === "fallback" ? "failed" : "done", row.error, {
          latencyMs: row.latency_ms ?? undefined,
        })
        break
    }
  }
  return steps
}
