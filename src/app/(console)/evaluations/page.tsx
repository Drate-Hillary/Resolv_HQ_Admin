import { apiFetch } from "@/backend/api/server"
import { EvaluationsView, type EvalRow } from "./evaluations-view"
import type { EvalDimension } from "@/types/console"

interface EvaluationsResponse {
  rows: EvalRow[]
  overallScore: number | null
  dimensions: EvalDimension[]
}

export default async function EvaluationsPage() {
  const { rows, overallScore, dimensions } = await apiFetch<EvaluationsResponse>("/admin/evaluations")

  return <EvaluationsView rows={rows} overallScore={overallScore} dimensions={dimensions} />
}
