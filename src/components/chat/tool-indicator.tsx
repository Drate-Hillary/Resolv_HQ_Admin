import { motion } from "framer-motion"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import type { ToolEvent } from "@/types"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"
import { Icon } from "@/components/ui/icon"

/** A one-line "working" step, indented to line up with the assistant's text. */
export function ToolIndicator({ event }: { event: ToolEvent }) {
  const running = event.status === "running"

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      className="ml-10 flex w-fit items-center gap-2 text-sm text-muted-foreground"
    >
      {running ? <AgentThinkingOrb /> : <Icon icon={Tick02Icon} size={14} />}
      <span className={running ? "animate-pulse motion-reduce:animate-none" : undefined}>
        {event.label}
        {running ? "…" : ""}
      </span>
    </motion.div>
  )
}
