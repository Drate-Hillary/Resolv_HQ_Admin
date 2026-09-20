import "dotenv/config"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { TRIAGE_CASES, type TriageCase } from "./dataset.js"
import { gradeResponse } from "./grade.js"
import { estimateCostUsd, MODELS, type ModelConfig } from "./models.js"
import { callProvider, type CallResult } from "./providers.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface CaseRun {
  caseId: string
  ok: boolean
  latencyMs: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  score: number
  notes: string[]
  error?: string
}

interface ModelSummary {
  model: ModelConfig
  runs: CaseRun[]
  avgLatencyMs: number
  p90LatencyMs: number
  accuracyPct: number
  totalCostUsd: number
  avgCostUsdPerTicket: number
  errorCount: number
}

function parseArgs(argv: string[]) {
  const args = { dryRun: false, limit: undefined as number | undefined, only: undefined as string | undefined }
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true
    else if (arg.startsWith("--limit=")) args.limit = Number(arg.split("=")[1])
    else if (arg.startsWith("--model=")) args.only = arg.split("=")[1]
  }
  return args
}

const REQUIRED_ENV_VAR: Record<ModelConfig["provider"], string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
}

// Deterministic-ish synthetic responses so the harness (dataset -> call -> grade ->
// aggregate -> report) can be exercised end to end without live API keys.
function dryRunCall(model: ModelConfig, triageCase: TriageCase): CallResult {
  const seed = [...`${model.key}:${triageCase.id}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const shouldBeCorrect = seed % 5 !== 0 // ~80% correct
  const speedFactor = model.key === "gemini" ? 0.7 : model.key === "openai" ? 0.85 : 1.0
  const latencyMs = Math.round((400 + (seed % 900)) * speedFactor)
  const inputTokens = 120 + triageCase.ticket.length
  const outputTokens = 40 + (seed % 30)

  const body = shouldBeCorrect
    ? triageCase.expected
    : { category: "spam" as const, priority: "low" as const, escalate: false, summary: "synthetic dry-run miss" }

  return {
    ok: true,
    result: {
      rawText: JSON.stringify({ ...body, summary: `[dry-run] ${triageCase.ticket.slice(0, 40)}` }),
      inputTokens,
      outputTokens,
      latencyMs,
    },
  }
}

async function runCase(model: ModelConfig, triageCase: TriageCase, dryRun: boolean): Promise<CaseRun> {
  const result = dryRun ? dryRunCall(model, triageCase) : await callProvider(model, triageCase.ticket)

  if (!result.ok) {
    return {
      caseId: triageCase.id,
      ok: false,
      latencyMs: result.result.latencyMs,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      score: 0,
      notes: [],
      error: result.result.error,
    }
  }

  const { rawText, inputTokens, outputTokens, latencyMs } = result.result
  const grade = gradeResponse(triageCase, rawText)
  const costUsd = estimateCostUsd(model, inputTokens, outputTokens)

  return {
    caseId: triageCase.id,
    ok: true,
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd,
    score: grade.score,
    notes: grade.notes,
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]
}

function summarize(model: ModelConfig, runs: CaseRun[]): ModelSummary {
  const okRuns = runs.filter((r) => r.ok)
  const latencies = okRuns.map((r) => r.latencyMs)
  const avgLatencyMs = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
  const totalCostUsd = okRuns.reduce((a, r) => a + r.costUsd, 0)
  const accuracyPct = okRuns.length ? (okRuns.reduce((a, r) => a + r.score, 0) / okRuns.length) * 100 : 0

  return {
    model,
    runs,
    avgLatencyMs,
    p90LatencyMs: percentile(latencies, 90),
    accuracyPct,
    totalCostUsd,
    avgCostUsdPerTicket: okRuns.length ? totalCostUsd / okRuns.length : 0,
    errorCount: runs.length - okRuns.length,
  }
}

function printSummaryTable(summaries: ModelSummary[]) {
  console.table(
    summaries.map((s) => ({
      Model: s.model.label,
      "Avg latency (ms)": Math.round(s.avgLatencyMs),
      "P90 latency (ms)": Math.round(s.p90LatencyMs),
      "Accuracy (%)": s.accuracyPct.toFixed(1),
      "Avg cost/ticket ($)": s.avgCostUsdPerTicket.toFixed(6),
      "Total cost ($)": s.totalCostUsd.toFixed(6),
      Errors: s.errorCount,
    })),
  )
}

function buildMarkdownReport(summaries: ModelSummary[], dryRun: boolean, caseCount: number): string {
  const lines: string[] = []
  lines.push("# Foundation Model Benchmark - Customer Support Triage")
  lines.push("")
  lines.push(`Generated ${new Date().toISOString()}${dryRun ? " (**DRY RUN - synthetic data, not real model output**)" : ""}`)
  lines.push("")
  lines.push(`${caseCount} triage cases per model, drawn from \`src/dataset.ts\` (mirrors the eval taxonomy in \`docs/evaluation-table.md\`: normal, edge, incorrect-info, adversarial, unauthorized-action, safety).`)
  lines.push("")
  lines.push("## Model substitutions")
  lines.push("")
  lines.push("Two of the originally requested models are retired and no longer callable via API as of 2026-09-17:")
  lines.push("")
  for (const s of summaries) {
    if (s.model.pricingNote) lines.push(`- **${s.model.label}**: ${s.model.pricingNote}`)
  }
  lines.push("")
  lines.push("## Results")
  lines.push("")
  lines.push("| Model | Avg latency (ms) | P90 latency (ms) | Accuracy (%) | Avg cost/ticket ($) | Total cost ($) | Errors |")
  lines.push("|---|---|---|---|---|---|---|")
  for (const s of summaries) {
    lines.push(
      `| ${s.model.label} | ${Math.round(s.avgLatencyMs)} | ${Math.round(s.p90LatencyMs)} | ${s.accuracyPct.toFixed(1)} | ${s.avgCostUsdPerTicket.toFixed(6)} | ${s.totalCostUsd.toFixed(6)} | ${s.errorCount} |`,
    )
  }
  lines.push("")
  lines.push("## Per-case detail")
  lines.push("")
  for (const s of summaries) {
    lines.push(`### ${s.model.label}`)
    lines.push("")
    lines.push("| Case | OK | Latency (ms) | Score | Notes |")
    lines.push("|---|---|---|---|---|")
    for (const r of s.runs) {
      const notes = r.error ? `**error:** ${r.error}` : r.notes.join("; ") || "-"
      lines.push(`| ${r.caseId} | ${r.ok ? "yes" : "no"} | ${Math.round(r.latencyMs)} | ${r.score.toFixed(2)} | ${notes} |`)
    }
    lines.push("")
  }
  lines.push("## Caveats")
  lines.push("")
  lines.push("- Sample size is 12 tickets per model - enough to catch gross behavioral differences (e.g. prompt-injection compliance), not enough for a statistically tight accuracy estimate. Re-run multiple trials before treating the accuracy percentage as precise.")
  lines.push("- Pricing is a snapshot (see `src/models.ts`); recompute before a real cost decision, especially for Gemini's introductory rate which expires 2026-12-31.")
  lines.push("- Latency includes network round-trip from wherever this script runs, not just model inference time.")
  if (dryRun) lines.push("- **This report was generated in `--dry-run` mode.** All scores, latencies, and token counts are synthetic placeholders used to validate the harness - re-run without `--dry-run` and with real API keys for actual results.")
  return lines.join("\n")
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const cases = args.limit ? TRIAGE_CASES.slice(0, args.limit) : TRIAGE_CASES
  const modelsToRun = args.only ? MODELS.filter((m) => m.key === args.only) : MODELS

  if (modelsToRun.length === 0) {
    console.error(`No model matches --model=${args.only}. Valid keys: ${MODELS.map((m) => m.key).join(", ")}`)
    process.exit(1)
  }

  if (!args.dryRun) {
    const missing = modelsToRun.filter((m) => !process.env[REQUIRED_ENV_VAR[m.provider]])
    if (missing.length > 0) {
      console.error(
        `Missing API key(s) for: ${missing.map((m) => `${m.label} (${REQUIRED_ENV_VAR[m.provider]})`).join(", ")}. ` +
          `Set them in scripts/model-benchmark/.env (see .env.example), or pass --model=<key> to run a subset, or --dry-run to validate the harness without calling any API.`,
      )
      process.exit(1)
    }
  }

  console.log(`Running ${cases.length} case(s) x ${modelsToRun.length} model(s)${args.dryRun ? " [DRY RUN]" : ""}...`)

  const summaries: ModelSummary[] = []
  for (const model of modelsToRun) {
    const runs: CaseRun[] = []
    for (const triageCase of cases) {
      process.stdout.write(`  ${model.label} / ${triageCase.id}... `)
      const run = await runCase(model, triageCase, args.dryRun)
      console.log(run.ok ? `${Math.round(run.latencyMs)}ms, score ${run.score.toFixed(2)}` : `ERROR: ${run.error}`)
      runs.push(run)
    }
    summaries.push(summarize(model, runs))
  }

  console.log("")
  printSummaryTable(summaries)

  const resultsDir = path.join(__dirname, "..", "results")
  await mkdir(resultsDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const jsonPath = path.join(resultsDir, `${stamp}.json`)
  const mdPath = path.join(resultsDir, `${stamp}-report.md`)

  await writeFile(jsonPath, JSON.stringify({ dryRun: args.dryRun, generatedAt: new Date().toISOString(), summaries }, null, 2))
  await writeFile(mdPath, buildMarkdownReport(summaries, args.dryRun, cases.length))

  console.log(`\nWrote ${path.relative(process.cwd(), jsonPath)}`)
  console.log(`Wrote ${path.relative(process.cwd(), mdPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
