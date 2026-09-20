import { Icon } from "@/components/ui/icon"
import { apiFetch } from "@/backend/api/server"
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

interface GuardrailRule {
  capability: string
  ai_allowed: boolean
  human_approval: boolean
  note: string | null
}

export default async function GuardrailsPage() {
  const guardrails = await apiFetch<GuardrailRule[]>("/admin/guardrails")

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Guardrails</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The agent&rsquo;s boundary matrix — what it may do on its own, and what always stops for a human.
        </p>
      </div>

      <div className="glass-panel overflow-x-auto">
        <table className="w-full min-w-150 text-left text-xs">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Capability</th>
              <th className="px-4 py-2.5 text-center font-medium">AI allowed</th>
              <th className="px-4 py-2.5 text-center font-medium">Human approval</th>
              <th className="px-4 py-2.5 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {guardrails.map((rule) => (
              <tr key={rule.capability} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{rule.capability}</td>
                <td className="px-4 py-2.5 text-center">
                  <BoundaryMark ok={rule.ai_allowed} />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <BoundaryMark ok={rule.human_approval} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{rule.note ?? "—"}</td>
              </tr>
            ))}
            {guardrails.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No guardrail rules configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-panel p-4 text-xs text-muted-foreground">
        The agent cannot submit a requisition, approve one, release a payment, change a permission, or delete a
        record on its own — those actions always stop here and wait for a person, no matter the amount or the
        agent&rsquo;s confidence.
      </div>
    </div>
  )
}

function BoundaryMark({ ok }: { ok: boolean }) {
  return (
    <Icon
      icon={ok ? CheckmarkCircle02Icon : Cancel01Icon}
      size={20}
      className={ok ? "mx-auto text-approve" : "mx-auto text-destructive"}
    />
  )
}
