"use client"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RunTimeline } from "@/components/console/run-timeline"
import { ApprovalCard } from "@/components/console/approval-card"
import { useConsoleStore } from "@/lib/stores/console-store"
import type { AgentStatus } from "@/types/console"
import { BubbleChatIcon } from "@hugeicons/core-free-icons"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"

const processLabel: Record<AgentStatus, string> = {
  ready: "Idle — waiting for a task.",
  thinking: "Working on your request…",
  awaiting_approval: "Paused — waiting for your approval.",
  completed: "Finished the task.",
  failed: "The run failed.",
}

/** Mobile stand-in for the Agent activity column: a chat bubble showing what the agent is doing. */
export function ActivityBubble() {
  const status = useConsoleStore((s) => s.status)
  const run = useConsoleStore((s) => s.run)
  const error = useConsoleStore((s) => s.error)
  const busy = status === "thinking"
  const attention = status === "awaiting_approval"
  const lastStep = run.at(-1)

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Agent activity" />}
      >
        <Icon icon={BubbleChatIcon} size={18} />
        {(busy || attention) && (
          <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary motion-safe:animate-pulse" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto p-3">
        <p className="text-sm font-medium text-foreground">Agent activity</p>
        <div className="w-fit max-w-full rounded-lg rounded-bl-sm border border-border bg-card px-3 py-2 text-xs/relaxed text-card-foreground">
          <p>{processLabel[status]}</p>
          {lastStep && !busy && <p className="mt-1 text-muted-foreground">Last step: {lastStep.label}</p>}
          {error && <p className="mt-1 text-destructive">{error}</p>}
        </div>
        {busy && (
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1 text-sm text-primary">
            <AgentThinkingOrb />
            Working&hellip;
          </div>
        )}
        <RunTimeline />
        <ApprovalCard />
      </PopoverContent>
    </Popover>
  )
}
