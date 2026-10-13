import { useEffect, useState } from "react"
import type { OrbState } from "thinking-orbs"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"
import { useConsoleStore } from "@/lib/stores/console-store"

// The chat call is not streamed, so the UI cannot see which phase the agent is
// really in mid-flight. The orb therefore walks the loop in its true order
// (read -> retrieve -> reason -> compose) on a timer and holds on the last
// state; the real per-step timings and tokens appear in the timeline when the
// run finishes.
const phases: { state: OrbState; label: string; afterMs: number }[] = [
  { state: "listening", label: "Reading", afterMs: 0 },
  { state: "searching", label: "Retrieving", afterMs: 1200 },
  { state: "solving", label: "Reasoning", afterMs: 3000 },
  { state: "composing", label: "Writing", afterMs: 7000 },
]

function currentPhase(elapsedMs: number) {
  return [...phases].reverse().find((p) => elapsedMs >= p.afterMs) ?? phases[0]
}

/** Compact "agent is running" chip: orb state + phase, elapsed time, tokens used. */
export function AgentWorkingIndicator() {
  const startedAt = useConsoleStore((s) => s.runStartedAt)
  const sessionTokens = useConsoleStore((s) => s.sessionTokens)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = startedAt ? Math.max(0, now - startedAt) : 0
  const phase = currentPhase(elapsed)

  return (
    <div
      role="status"
      className="flex w-fit items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 py-0.5 pr-2 pl-1 text-xs text-primary tabular-nums"
    >
      <AgentThinkingOrb state={phase.state} />
      <span>{phase.label}</span>
      <span className="text-primary/60">· {(elapsed / 1000).toFixed(1)}s</span>
      <span className="text-primary/60">· {sessionTokens.toLocaleString()} tokens</span>
    </div>
  )
}
