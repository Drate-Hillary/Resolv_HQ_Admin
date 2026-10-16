import { WorkspaceChat } from "@/components/console/workspace-chat"
import { ActivityBubble } from "@/components/console/activity-bubble"
import { RunTimeline } from "@/components/console/run-timeline"
import { RunStepDetailSheet } from "@/components/console/run-step-detail-sheet"
import { ApprovalCard } from "@/components/console/approval-card"

/**
 * The console's home: a full-height chat. Past tasks and "New task" live in the sidebar;
 * the agent's step-by-step activity and approval card sit in a side panel on wide screens
 * and in a popover on small ones.
 */
export default function AgentWorkspacePage() {
  return (
    <div className="flex h-full flex-col lg:grid lg:grid-cols-[1fr_22rem] lg:divide-x lg:divide-border">
      <section className="relative flex min-h-0 flex-1 flex-col">
        <div className="absolute top-2 right-2 z-10 lg:hidden">
          <ActivityBubble />
        </div>
        <WorkspaceChat />
      </section>

      <section className="hidden min-h-0 flex-col lg:flex">
        <div className="flex h-10 shrink-0 items-center border-b border-border px-4">
          <h2 className="text-sm font-medium tracking-tight text-muted-foreground">Agent activity</h2>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <RunTimeline />
          <ApprovalCard />
        </div>
      </section>

      <RunStepDetailSheet />
    </div>
  )
}
