"use client"

import { cn } from "cn"
import { useConsoleStore } from "@/lib/stores/console-store"
import type { AgentStatus } from "@/types/console"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"

const statusMeta: Record<AgentStatus, { label: string; tone: "idle" | "active" | "warn" | "danger" }> = {
  ready: { label: "Ready", tone: "idle" },
  thinking: { label: "Thinking", tone: "active" },
  awaiting_approval: { label: "Awaiting approval", tone: "warn" },
  completed: { label: "Completed", tone: "idle" },
  failed: { label: "Failed", tone: "danger" },
}

const toneClass: Record<string, string> = {
  idle: "bg-secondary text-muted-foreground",
  active: "bg-primary/10 text-primary",
  warn: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
}

const dotClass: Record<string, string> = {
  idle: "bg-muted-foreground",
  active: "bg-primary",
  warn: "bg-primary",
  danger: "bg-destructive",
}

export function AgentStatusPill() {
  const status = useConsoleStore((s) => s.status)
  const meta = statusMeta[status]
  const pulsing = meta.tone === "active" || meta.tone === "warn"

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium", toneClass[meta.tone])}>
      {status === "thinking" ? (
        <AgentThinkingOrb />
      ) : (
        <span className="relative flex size-1.5">
          {pulsing && (
            <span className={cn("motion-safe:absolute motion-safe:inline-flex motion-safe:size-full motion-safe:animate-ping motion-safe:rounded-full motion-safe:opacity-75", dotClass[meta.tone])} />
          )}
          <span className={cn("relative inline-flex size-1.5 rounded-full", dotClass[meta.tone])} />
        </span>
      )}
      {meta.label}
    </div>
  )
}
