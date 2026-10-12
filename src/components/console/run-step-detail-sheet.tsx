import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { ProviderFailures } from "@/components/console/provider-failures"
import { isProviderFailureMessage } from "@/lib/provider-errors"
import { useConsoleStore } from "@/lib/stores/console-store"
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

export function RunStepDetailSheet() {
  const run = useConsoleStore((s) => s.run)
  const selectedStepKey = useConsoleStore((s) => s.selectedStepKey)
  const selectStep = useConsoleStore((s) => s.selectStep)
  const approve = useConsoleStore((s) => s.approve)
  const reject = useConsoleStore((s) => s.reject)
  const step = run.find((s) => s.key === selectedStepKey)

  return (
    <Sheet open={Boolean(step)} onOpenChange={(open) => !open && selectStep(null)}>
      <SheetContent>
        {step && (
          <>
            <SheetHeader>
              <SheetTitle>{step.label}</SheetTitle>
              <SheetDescription>
                Step {run.findIndex((s) => s.key === step.key) + 1} of {run.length} in this agent run.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6 text-sm">
              {step.detail?.type === "text" &&
                (isProviderFailureMessage(step.detail.text) ? (
                  <ProviderFailures message={step.detail.text} />
                ) : (
                  <p className="text-foreground/90">{step.detail.text}</p>
                ))}

              {step.detail?.type === "approval" && (
                <>
                  <Field label="Title" value={step.detail.title} />
                  <Field label="Description" value={step.detail.description} />
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <Badge className="mt-1" variant="secondary">
                        {step.detail.category}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Priority</p>
                      <Badge
                        className="mt-1"
                        variant={step.detail.priority === "high" ? "destructive" : "default"}
                      >
                        {step.detail.priority}
                      </Badge>
                    </div>
                  </div>
                  {step.detail.keyFacts && <Field label="Key facts" value={step.detail.keyFacts} />}
                  {step.detail.suggestedAction && (
                    <Field label="Suggested next step" value={step.detail.suggestedAction} />
                  )}
                  {step.detail.status === "pending" ? (
                    <div className="mt-2 flex gap-2">
                      <Button className="flex-1" onClick={() => void approve()}>
                        Approve
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => void reject()}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={
                        step.detail.status === "approved"
                          ? "flex items-center gap-1.5 text-approve"
                          : "flex items-center gap-1.5 text-destructive"
                      }
                    >
                      <Icon icon={step.detail.status === "approved" ? CheckmarkCircle02Icon : Cancel01Icon} size={19} />
                      {step.detail.status === "approved" ? "Approved" : "Rejected"}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  )
}
