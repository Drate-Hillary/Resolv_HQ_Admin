import { useState } from "react"
import { PulseIcon } from "@hugeicons/core-free-icons"
import { WorkspaceChat } from "@/components/console/workspace-chat"
import { RunTimeline } from "@/components/console/run-timeline"
import { RunStepDetailSheet } from "@/components/console/run-step-detail-sheet"
import { ApprovalCard } from "@/components/console/approval-card"
import { AgentWorkingIndicator } from "@/components/console/agent-working-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useConsoleStore } from "@/lib/stores/console-store"

/**
 * The console's home: a full-height chat. Past tasks and "New task" live in the sidebar;
 * the agent's step-by-step activity and approval card open in a drawer from the icon at the top right.
 */
export default function AgentWorkspacePage() {
  const [open, setOpen] = useState(false)
  const status = useConsoleStore((s) => s.status)
  const busy = status === "thinking"
  const attention = status === "awaiting_approval"

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute top-2 right-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open agent activity"
          onClick={() => setOpen(true)}
        >
          <Icon icon={PulseIcon} size={18} />
          {(busy || attention) && (
            <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary motion-safe:animate-pulse" />
          )}
        </Button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        <WorkspaceChat />
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Agent activity</SheetTitle>
            <SheetDescription>What the agent is doing, step by step.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            {busy && <AgentWorkingIndicator />}
            <RunTimeline />
            <ApprovalCard />
          </div>
        </SheetContent>
      </Sheet>

      <RunStepDetailSheet />
    </div>
  )
}
