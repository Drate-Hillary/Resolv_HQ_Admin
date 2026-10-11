import { ChatHeader } from "@/components/chat/chat-header"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatWindow } from "@/components/chat/chat-window"
import { MemorySettings } from "@/components/chat/memory-settings"

export default function ChatPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 120% 60% at 50% 0%, color-mix(in oklch, var(--primary) 6%, transparent), transparent)",
      }}
    >
      <ChatHeader />
      <main className="flex-1">
        <div className="mx-auto flex max-w-160 flex-col gap-6 px-4 py-6">
          <MemorySettings />
          <ChatWindow />
        </div>
      </main>
      <ChatInput />
    </div>
  )
}
