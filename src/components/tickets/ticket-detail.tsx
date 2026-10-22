import { useEffect, useRef, useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AttachmentList } from "@/components/ui/attachment-list"
import { useRequestsStore } from "@/lib/stores/requests-store"
import type { RequestPriority } from "@/types"

const priorityVariant: Record<RequestPriority, "priority-high" | "priority-medium" | "priority-low"> = {
  urgent: "priority-high",
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
}

/** Fixed, known set — matches resolv-hq-customer's hardcoded RequestStatus
 * union and STATUS_COPY map exactly; these names are not arbitrary. */
const STATUSES = ["submitted", "processing", "needs_info", "review", "completed"] as const

export function TicketDetail({ id }: { id: string }) {
  const ticket = useRequestsStore((s) => s.detailById[id])
  const isSubmitting = useRequestsStore((s) => s.isSubmitting)
  const error = useRequestsStore((s) => s.error)
  const fetchDetail = useRequestsStore((s) => s.fetchDetail)
  const changeStatus = useRequestsStore((s) => s.changeStatus)
  const assignToMe = useRequestsStore((s) => s.assignToMe)
  const close = useRequestsStore((s) => s.close)
  const reply = useRequestsStore((s) => s.reply)
  const typingLabel = useRequestsStore((s) => s.typingByRequest[id])
  const notifyTyping = useRequestsStore((s) => s.notifyTyping)
  const startRealtime = useRequestsStore((s) => s.startRealtime)

  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLLIElement>(null)
  const messageCount = ticket?.messages.length ?? 0

  useEffect(() => {
    void fetchDetail(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Live updates: new messages and typing indicators are pushed by the server.
  useEffect(() => startRealtime(), [startRealtime])

  // Say "stopped typing" when leaving the ticket so the other side's dots don't linger.
  useEffect(() => () => notifyTyping(id, false), [id, notifyTyping])

  // Keep the newest message (or the typing dots) in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messageCount, typingLabel])

  async function send() {
    const text = draft
    if (isSending || !text.trim()) return
    // Clear the box immediately so sending feels instant; put the text back if it fails.
    setDraft("")
    setIsSending(true)
    const ok = await reply(id, text)
    setIsSending(false)
    if (!ok) setDraft(text)
  }

  if (!ticket) {
    return <p className="px-1 text-xs text-muted-foreground">{error ?? "Loading ticket…"}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Ticket #{ticket.ticketNumber} · {ticket.category}
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{ticket.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
          {ticket.aiHandled && <Badge variant="outline">AI-assisted</Badge>}
          {ticket.closedAt ? (
            <Badge variant="secondary">Closed</Badge>
          ) : (
            <select
              aria-label="Change status"
              value={ticket.status}
              disabled={isSubmitting}
              onChange={(e) => void changeStatus(id, e.target.value)}
              className="h-8 rounded-md border border-border bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoCard label="Customer" value={ticket.customerName ?? "Unknown"} />
        <InfoCard
          label="Assigned to"
          value={ticket.assignedAgentName ?? "Unassigned"}
          action={
            !ticket.assignedAgentId && (
              <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => void assignToMe(id)}>
                Assign to me
              </Button>
            )
          }
        />
        <InfoCard
          label="Lifecycle"
          value={ticket.closedAt ? `Closed ${new Date(ticket.closedAt).toLocaleDateString()}` : "Open"}
          action={
            !ticket.closedAt && (
              <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => void close(id)}>
                Close ticket
              </Button>
            )
          }
        />
      </div>

      <div className="glass-panel p-4">
        <p className="text-sm font-medium text-muted-foreground">Description</p>
        <p className="mt-1.5 text-sm/relaxed text-foreground">{ticket.description}</p>
      </div>

      <div className="glass-panel p-4">
        <p className="text-sm font-medium text-muted-foreground">Timeline</p>
        <ul className="mt-2 flex flex-col gap-2">
          {ticket.timeline.map((step, i) => (
            <li key={`${step.key}-${i}`} className="flex items-center gap-2 text-xs text-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="font-medium">{step.label}</span>
              {step.timestamp && (
                <span className="text-muted-foreground">{new Date(step.timestamp).toLocaleString()}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-panel flex flex-col p-4">
        <p className="text-sm font-medium text-muted-foreground">Messages</p>
        <ul className="mt-2 flex flex-col gap-3">
          {ticket.messages.length === 0 && (
            <li className="text-xs text-muted-foreground">No messages yet.</li>
          )}
          {ticket.messages.map((message) => (
            <li key={message.id} className="rounded-md bg-accent/40 px-3 py-2">
              <p className="text-sm font-medium text-foreground capitalize">{message.sender}</p>
              {message.text && <p className="mt-0.5 text-sm/relaxed text-foreground">{message.text}</p>}
              {message.attachments && message.attachments.length > 0 && <AttachmentList attachments={message.attachments} />}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleString()}</p>
            </li>
          ))}
          {typingLabel && (
            <li className="flex items-center gap-2 px-1 text-xs text-muted-foreground" aria-live="polite">
              <TypingDots />
              <span>{typingLabel} is typing…</span>
            </li>
          )}
          <li ref={bottomRef} aria-hidden className="h-0" />
        </ul>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              notifyTyping(id, e.target.value.length > 0)
            }}
            onBlur={() => notifyTyping(id, false)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a newline.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Reply as support…"
            rows={2}
            className="flex-1"
          />
          <Button disabled={isSending || !draft.trim()} onClick={() => void send()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Three bouncing dots, staggered so they ripple — the classic "someone is typing" cue. */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2.5 py-1.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${delay}ms`, animationDuration: "1s" }}
        />
      ))}
    </span>
  )
}

function InfoCard({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="glass-panel flex items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
      {action}
    </div>
  )
}
