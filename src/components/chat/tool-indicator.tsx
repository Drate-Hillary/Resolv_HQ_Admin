import { motion } from "framer-motion"
import { cn } from "cn"
import type { ToolEvent } from "@/types"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"

export function ToolIndicator({ event }: { event: ToolEvent }) {
  const running = event.status === "running"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="ml-9 flex w-fit items-center gap-1.5 rounded-full border border-dashed border-signal/40 bg-signal/5 px-2.5 py-1 text-sm text-signal"
    >
      {running ? (
        <AgentThinkingOrb />
      ) : (
        <span className={cn("size-1.5 rounded-full bg-signal")} />
      )}
      {event.label}
      {running ? "…" : ""}
    </motion.div>
  )
}
