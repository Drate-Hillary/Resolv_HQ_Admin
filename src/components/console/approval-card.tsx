import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { useConsoleStore } from "@/lib/stores/console-store"
import { Alert02Icon } from "@hugeicons/core-free-icons"

export function ApprovalCard() {
  const run = useConsoleStore((s) => s.run)
  const status = useConsoleStore((s) => s.status)
  const approve = useConsoleStore((s) => s.approve)
  const reject = useConsoleStore((s) => s.reject)
  const step = run.find((s) => s.key === "approval")

  if (status !== "awaiting_approval" || step?.detail?.type !== "approval") return null
  const { title, category, priority } = step.detail

  return (
    <div className="glass-panel border-primary/30 p-4">
      <div className="flex items-start gap-2.5">
        <Icon icon={Alert02Icon} size={21} className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Human approval required</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The agent has drafted an escalation ticket and cannot file it without your sign-off.
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2.5 rounded-md border border-border px-3 py-2.5 text-sm">
        <div className="col-span-2">
          <dt className="text-muted-foreground">Ticket</dt>
          <dd className="mt-0.5 text-foreground">{title}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Category</dt>
          <dd className="mt-0.5 text-foreground">{category}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Priority</dt>
          <dd className="mt-0.5 text-foreground capitalize">{priority}</dd>
        </div>
      </dl>

      <div className="mt-3 flex gap-2">
        <Button variant="destructive" className="flex-1" onClick={() => void reject()}>
          Reject
        </Button>
        <Button className="flex-1" onClick={() => void approve()}>
          Approve
        </Button>
      </div>
    </div>
  )
}
