import { ChatHeader, ChatSidebar } from "@/components/chat/chat-header"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatWindow } from "@/components/chat/chat-window"
import { EmptyState } from "@/components/chat/empty-state"
import { useChatStore } from "@/lib/stores/chat-store"

const SUGGESTIONS = [
  "How do I raise a billing dispute?",
  "What details should a refund request include?",
  "What statuses can a payment show?",
  "What is the status of my request?",
]

export default function ChatPage() {
  const hasMessages = useChatStore((s) => s.stream.length > 0)
  const isLoading = useChatStore((s) => s.isLoading)
  const sendMessage = useChatStore((s) => s.sendMessage)

  return (
    <div className="flex h-svh bg-background">
      <ChatSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader />
        {hasMessages ? (
          <>
            <main className="min-h-0 flex-1 overflow-y-auto">
              <ChatWindow />
            </main>
            <div className="shrink-0 px-4 pt-2 pb-3">
              <div className="mx-auto max-w-3xl">
                <ChatInput />
              </div>
            </div>
          </>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
            <div className="flex w-full max-w-3xl flex-col gap-8">
              <EmptyState
                title="How can I help you today?"
                subtitle="Ask about billing, refunds or the status of a request. Anything that changes your account goes to a person for approval."
                suggestions={SUGGESTIONS}
                disabled={isLoading}
                onPick={(text) => void sendMessage(text)}
              />
              <ChatInput />
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
