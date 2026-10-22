import { useEffect, useRef } from "react"
import { useConsoleStore } from "@/lib/stores/console-store"
import { AgentWorkingIndicator } from "@/components/console/agent-working-indicator"
import { OpenRequestLink } from "@/components/console/open-request-link"
import { Composer } from "@/components/chat/chat-input"
import { AttachDocument } from "@/components/console/attach-document"
import { ModelPicker } from "@/components/console/model-picker"
import { EmptyState } from "@/components/chat/empty-state"
import { MessageRow } from "@/components/chat/message-bubble"

const busyStatuses = ["thinking"]

const SUGGESTIONS = [
  "Summarise our billing dispute policy",
  "Look up the status of a customer request",
  "Draft an escalation for an unresolved refund",
]

export function WorkspaceChat() {
  const messages = useConsoleStore((s) => s.messages)
  const status = useConsoleStore((s) => s.status)
  const requestId = useConsoleStore((s) => s.requestId)
  const runAgent = useConsoleStore((s) => s.runAgent)
  const busy = busyStatuses.includes(status)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, busy, requestId])

  const send = (text: string) => void runAgent(text)

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 && !busy ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6">
          <EmptyState
            title="What should the agent work on?"
            subtitle="Describe a task. Any action that changes a customer record waits for your approval."
            suggestions={SUGGESTIONS}
            disabled={busy}
            onPick={send}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            {messages.map((m) => (
              <MessageRow key={m.id} role={m.role === "user" ? "user" : "assistant"} content={m.content} />
            ))}
            {requestId && !busy && (
              <div className="ml-10">
                <OpenRequestLink requestId={requestId} />
              </div>
            )}
            {busy && (
              <div className="ml-10">
                <AgentWorkingIndicator />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
      <div className="shrink-0 px-4 pt-2 pb-3">
        <div className="mx-auto max-w-3xl">
          <Composer
            onSend={send}
            busy={busy}
            placeholder="Ask the agent…"
            leading={<AttachDocument disabled={busy} />}
            trailing={<ModelPicker disabled={busy} />}
            footnote="Resolv-HQ can make mistakes. Check the activity panel for what it actually did."
          />
        </div>
      </div>
    </div>
  )
}
