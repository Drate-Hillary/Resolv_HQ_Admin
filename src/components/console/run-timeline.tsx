import { Icon } from "@/components/ui/icon"
import { cn } from "cn"
import { useConsoleStore } from "@/lib/stores/console-store"
import { formatDuration } from "@/lib/run-timeline"
import type { RunStep } from "@/types/console"
import { Tick02Icon, Alert02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

function stepPreview(step: RunStep): string | null {
  if (!step.detail) return null
  switch (step.detail.type) {
    case "text":
      return step.detail.text
    case "approval":
      return step.detail.title
  }
}

export function RunTimeline() {
  const run = useConsoleStore((s) => s.run)
  const selectedStepKey = useConsoleStore((s) => s.selectedStepKey)
  const selectStep = useConsoleStore((s) => s.selectStep)
  const lastRunTokens = useConsoleStore((s) => s.lastRunTokens)
  const sessionTokens = useConsoleStore((s) => s.sessionTokens)

  return (
    <>
    <ol className="flex flex-col">
      {run.map((step, i) => {
        const isLast = i === run.length - 1
        const clickable = step.status !== "pending"
        const isHandoff = step.label.startsWith("Handoff:")
        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepBadge status={step.status} />
              {!isLast && <span className="my-0.5 w-px flex-1 bg-border" />}
            </div>
            <button
              disabled={!clickable}
              onClick={() => selectStep(step.key)}
              className={cn(
                "-mt-0.5 mb-4 flex-1 rounded-md px-2 py-1 text-left transition-colors",
                clickable ? "hover:bg-muted" : "cursor-default opacity-50",
                selectedStepKey === step.key && "bg-muted"
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <p
                  className={cn(
                    "text-xs font-medium",
                    step.status === "pending"
                      ? "text-muted-foreground"
                      : isHandoff
                        ? "text-primary"
                        : "text-foreground"
                  )}
                >
                  {step.label}
                </p>
                {isHandoff && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-primary">
                    Hand Off
                  </span>
                )}
              </div>
              {(step.meta?.latencyMs != null || step.meta?.tokens) && (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {[step.meta.latencyMs != null ? formatDuration(step.meta.latencyMs) : null, step.meta.tokens].filter(Boolean).join(" Â· ")}
                </p>
              )}
              {step.status !== "pending" && stepPreview(step) && (
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {stepPreview(step)}
                </p>
              )}
            </button>
          </li>
        )
      })}
    </ol>
    {lastRunTokens && (
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        {lastRunTokens.input + lastRunTokens.output > 0
          ? `${(lastRunTokens.input + lastRunTokens.output).toLocaleString()} tokens this run (${lastRunTokens.input.toLocaleString()} in · ${lastRunTokens.output.toLocaleString()} out) · ${sessionTokens.toLocaleString()} this conversation`
          : "No tokens used this run (answered from cache or without a model call)"}
      </p>
    )}
    </>
  )
}

function StepBadge({ status }: { status: RunStep["status"] }) {
  if (status === "done") {
    return (
      <span className="flex items-center justify-center rounded-full size-5 shrink-0 bg-primary text-primary-foreground">
        <Icon icon={Tick02Icon} size={16} strokeWidth={2.5} />
      </span>
    )
  }
  if (status === "active") {
    return (
      <span className="flex items-center justify-center border rounded-full size-5 shrink-0 border-primary bg-primary/15">
        <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
      </span>
    )
  }
  if (status === "blocked") {
    return (
      <span className="flex items-center justify-center border rounded-full size-5 shrink-0 border-primary bg-primary/15 text-primary">
        <Icon icon={Alert02Icon} size={16} strokeWidth={2.5} />
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="flex items-center justify-center border rounded-full size-5 shrink-0 border-destructive bg-destructive/15 text-destructive">
        <Icon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
      </span>
    )
  }
  return <span className="border rounded-full size-5 shrink-0 border-border bg-secondary" />
}
