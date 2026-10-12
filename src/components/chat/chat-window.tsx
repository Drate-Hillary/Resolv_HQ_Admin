import { useEffect, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ToolIndicator } from "@/components/chat/tool-indicator"
import { useChatStore } from "@/lib/stores/chat-store"

export function ChatWindow() {
  const stream = useChatStore((s) => s.stream)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [stream.length])

  return (
    <div className="mx-auto flex max-w-160 flex-col gap-3 px-4 py-6">
      <AnimatePresence initial={false}>
        {stream.map((item) =>
          item.type === "message" ? (
            <MessageBubble key={item.id} message={item} />
          ) : (
            <ToolIndicator key={item.id} event={item} />
          )
        )}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
