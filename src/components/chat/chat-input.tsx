import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"
import { Icon } from "@/components/ui/icon"
import { useChatStore } from "@/lib/stores/chat-store"

const MAX_HEIGHT_PX = 200

interface ComposerProps {
  onSend: (text: string) => void
  busy?: boolean
  placeholder?: string
  /** Small print under the box. Pass null to hide it. */
  footnote?: string | null
  className?: string
}

/** Large rounded prompt box: grows with the text, Enter sends, Shift+Enter adds a line. */
export function Composer({
  onSend,
  busy = false,
  placeholder = "Message Resolv-HQ",
  footnote = "Resolv-HQ can make mistakes. Real actions always need a person's approval.",
  className,
}: ComposerProps) {
  const [draft, setDraft] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)
  const canSend = draft.trim().length > 0 && !busy

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [draft])

  const submit = () => {
    if (!canSend) return
    onSend(draft)
    setDraft("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-2 rounded-3xl border border-border bg-background py-2 pr-2 pl-5 shadow-sm transition-shadow focus-within:border-ring/40 focus-within:shadow-md">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          aria-label="Message"
          placeholder={busy ? "Waiting for a reply…" : placeholder}
          className="max-h-50 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[0.9375rem]/6 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon icon={ArrowUp02Icon} size={18} strokeWidth={2.25} />
        </button>
      </div>
      {footnote && <p className="mt-2 text-center text-xs text-muted-foreground">{footnote}</p>}
    </div>
  )
}

/** The public chat's composer, wired to the chat store. */
export function ChatInput() {
  const isLoading = useChatStore((s) => s.isLoading)
  const sendMessage = useChatStore((s) => s.sendMessage)
  return <Composer onSend={(text) => void sendMessage(text)} busy={isLoading} />
}
