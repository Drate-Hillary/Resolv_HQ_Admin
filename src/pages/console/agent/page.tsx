"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { WorkspaceChat } from "@/components/console/workspace-chat"
import { RecentTasks } from "@/components/console/recent-tasks"
import { RecentTasksSheet } from "@/components/console/recent-tasks-sheet"
import { ActivityBubble } from "@/components/console/activity-bubble"
import { RunTimeline } from "@/components/console/run-timeline"
import { RunStepDetailSheet } from "@/components/console/run-step-detail-sheet"
import { ApprovalCard } from "@/components/console/approval-card"
import { useConsoleStore } from "@/lib/stores/console-store"
import { Add01Icon } from "@hugeicons/core-free-icons"

export default function AgentWorkspacePage() {
  const newTask = useConsoleStore((s) => s.newTask)
  const busy = useConsoleStore((s) => s.status === "thinking")

  // History is persisted in localStorage; hydrate after mount to avoid an SSR mismatch.
  useEffect(() => {
    void useConsoleStore.persist.rehydrate()
  }, [])

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col lg:grid lg:grid-cols-[16rem_1fr_1fr] lg:divide-x lg:divide-border">
      <section className="hidden min-h-0 flex-col lg:flex">
        <div className="flex h-10 shrink-0 items-center border-b border-border px-4">
          <h2 className="text-sm font-medium tracking-tight text-muted-foreground">Recent tasks</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RecentTasks />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col lg:flex-none">
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-2 lg:px-4">
          <div className="flex items-center gap-1">
            <div className="lg:hidden">
              <RecentTasksSheet />
            </div>
            <h2 className="text-sm font-medium tracking-tight text-muted-foreground">Task</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={newTask} disabled={busy}>
              <Icon icon={Add01Icon} size={14} />
              New task
            </Button>
            <div className="lg:hidden">
              <ActivityBubble />
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <WorkspaceChat />
        </div>
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
