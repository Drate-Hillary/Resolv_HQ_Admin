import { useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChatStore } from "@/lib/stores/chat-store"

export function ChatInput() {
  const [draft, setDraft] = useState("")
  const isLoading = useChatStore((s) => s.isLoading)
  const sendMessage = useChatStore((s) => s.sendMessage)

  const submit = () => {
    if (!draft.trim() || isLoading) return
    sendMessage(draft)
    setDraft("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-160 items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isLoading}
          placeholder={isLoading ? "Waiting for a reply…" : "Type a message…"}
          rows={1}
          className="min-h-9 py-2"
        />
        <Button onClick={submit} disabled={isLoading || !draft.trim()} size="lg">
          Send
        </Button>
      </div>
    </div>
  )
}
