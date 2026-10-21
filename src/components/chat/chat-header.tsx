import { Add01Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Icon } from "@/components/ui/icon"
import { useChatStore } from "@/lib/stores/chat-store"
import { MemoryDialog } from "@/components/chat/memory-dialog"

function AgentOnline() {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="relative flex size-1.5">
        <span className="motion-safe:absolute motion-safe:inline-flex motion-safe:size-full motion-safe:animate-ping motion-safe:rounded-full motion-safe:bg-signal motion-safe:opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
      </span>
      Agent online
    </div>
  )
}

function NewChatButton({ compact = false }: { compact?: boolean }) {
  const newChat = useChatStore((s) => s.newChat)
  const isLoading = useChatStore((s) => s.isLoading)
  return (
    <button
      type="button"
      onClick={newChat}
      disabled={isLoading}
      aria-label="New chat"
      className={
        compact
          ? "flex size-9 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
          : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
      }
    >
      <Icon icon={Add01Icon} size={compact ? 18 : 16} />
      {!compact && "New chat"}
    </button>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Icon icon={SparklesIcon} size={18} />
      </span>
      <span className="text-base font-bold tracking-tight text-foreground">Resolv-HQ</span>
    </div>
  )
}

/** Left rail on tablet/desktop: new chat, saved information, status. */
export function ChatSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar p-3 md:flex">
      <div className="px-2 py-2">
        <Brand />
      </div>
      <nav className="mt-3 flex flex-col gap-0.5" aria-label="Chat">
        <NewChatButton />
        <MemoryDialog />
      </nav>
      <div className="mt-auto px-3 py-2">
        <AgentOnline />
      </div>
    </aside>
  )
}

/** Compact top bar on phones, where the rail is hidden. */
export function ChatHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 md:hidden">
      <Brand />
      <div className="flex items-center gap-1">
        <AgentOnline />
        <NewChatButton compact />
        <MemoryDialog compact />
      </div>
    </header>
  )
}
