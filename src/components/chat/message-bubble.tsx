import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "cn"
import type { ChatMessage } from "@/types"

const bubbleEnter = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      {...bubbleEnter}
      className={cn("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && (
        <Avatar className="mb-0.5">
          <AvatarFallback className="bg-primary/10 text-primary">R</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.8125rem]/relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-card-foreground"
        )}
      >
        <p className="text-pretty">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  )
}
