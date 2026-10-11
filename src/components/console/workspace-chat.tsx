"use client"

import { useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"
import { useConsoleStore } from "@/lib/stores/console-store"
import { AgentThinkingOrb } from "@/components/console/agent-thinking-orb"

const busyStatuses = ["thinking"]

export function WorkspaceChat() {
  const [draft, setDraft] = useState("")
  const messages = useConsoleStore((s) => s.messages)
  const status = useConsoleStore((s) => s.status)
  const runAgent = useConsoleStore((s) => s.runAgent)
  const busy = busyStatuses.includes(status)

  const submit = () => {
    if (!draft.trim() || busy) return
    runAgent(draft)
    setDraft("")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-xs/relaxed",
              m.role === "user"
                ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm border border-border bg-card text-card-foreground"
            )}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1 text-sm text-primary">
            <AgentThinkingOrb />
            Working&hellip;
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            placeholder={busy ? "Agent is working…" : "Ask the agent…"}
            rows={1}
            className="min-h-9 py-2"
          />
          <Button onClick={submit} disabled={busy || !draft.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
