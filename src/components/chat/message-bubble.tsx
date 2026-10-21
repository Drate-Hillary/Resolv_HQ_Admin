import { useState } from "react"
import { motion } from "framer-motion"
import { Copy01Icon, SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { ReplyText } from "@/components/chat/reply-text"
import { Icon } from "@/components/ui/icon"
import type { ChatMessage } from "@/types"

const enter = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
}

interface MessageRowProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

/**
 * Assistant-style chat row: the user's message is a soft pill on the right, the
 * assistant's reply is plain text on the page with a small mark and a copy action
 * (no bubble), the layout most chat agents use.
 */
export function MessageRow({ role, content, timestamp }: MessageRowProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the text stays selectable.
    }
  }

  if (role === "user") {
    return (
      <motion.div {...enter} className="flex justify-end">
        <p className="max-w-[85%] rounded-3xl bg-muted px-4 py-2.5 text-[0.9375rem]/7 text-pretty whitespace-pre-wrap text-foreground sm:max-w-[75%]">
          {content}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div {...enter} className="group/msg flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Icon icon={SparklesIcon} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <ReplyText content={content} className="text-[0.9375rem]/7 text-foreground" />
        <div className="mt-1 flex items-center gap-2 text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover/msg:opacity-100 sm:focus-within:opacity-100">
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy reply"}
            className="flex size-7 items-center justify-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <Icon icon={copied ? Tick02Icon : Copy01Icon} size={15} />
          </button>
          {timestamp && <span className="text-xs">{timestamp}</span>}
        </div>
      </div>
    </motion.div>
  )
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <MessageRow
      role={message.role === "user" ? "user" : "assistant"}
      content={message.content}
      timestamp={message.timestamp}
    />
  )
}
