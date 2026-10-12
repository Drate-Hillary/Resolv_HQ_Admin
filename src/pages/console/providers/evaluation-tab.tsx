"use client"

import { useState } from "react"
import { toast } from "sonner"
import { toastError } from "@/lib/errors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/backend/api/client"
import type { AgentProviderRow } from "./providers-view"

interface EvalCaseResult {
  id: string
  label: string
  passed: boolean
  latency_ms: number
  error?: string
}

interface EvalResult {
  passed: number
  total: number
  avg_latency_ms: number
  cases: EvalCaseResult[]
  ran_at: string
}

export function EvaluationTab({ providers }: { providers: AgentProviderRow[] }) {
  const [results, setResults] = useState<Record<string, EvalResult>>({})
  const [running, setRunning] = useState<string | null>(null)

  async function run(provider: AgentProviderRow) {
    setRunning(provider.id)
    try {
      const { data } = await apiClient.post<EvalResult>(`/admin/agent-providers/${provider.id}/evaluate`)
      setResults((prev) => ({ ...prev, [provider.id]: data }))
      toast.success(`${provider.name}: ${data.passed}/${data.total} passed`)
    } catch (err) {
      toastError(err, "Could not run the evaluation.")
    } finally {
      setRunning(null)
    }
  }

  if (providers.length === 0) {
    return <p className="text-xs text-muted-foreground">Register a model to evaluate it.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Runs a short test suite (format following, reasoning, prompt-injection resistance, refund escalation) directly
        against each model and records pass/fail and latency. Runs use your API key and incur a small cost.
      </p>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {providers.map((provider) => {
          const result = results[provider.id]
          return (
            <div key={provider.id} className="glass-panel flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{provider.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {provider.provider} · {provider.model ?? "default model"}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => run(provider)} disabled={running !== null}>
                  {running === provider.id ? "Running…" : result ? "Re-run" : "Run evaluation"}
                </Button>
              </div>

              {result && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={result.passed === result.total ? "approve" : "destructive"}>
                      {result.passed}/{result.total} passed
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      avg {(result.avg_latency_ms / 1000).toFixed(1)}s · {new Date(result.ran_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <ul className="flex flex-col divide-y divide-border text-xs">
                    {result.cases.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-foreground">
                          {c.label}
                          {c.error && <span className="block text-destructive">{c.error}</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-muted-foreground">{(c.latency_ms / 1000).toFixed(1)}s</span>
                          <Badge variant={c.passed ? "approve" : "destructive"}>{c.passed ? "Pass" : "Fail"}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
