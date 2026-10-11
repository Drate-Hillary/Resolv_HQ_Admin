import { create } from "zustand"
import { createClient } from "@/backend/supabase/client"
import { toast } from "sonner"
import { apiClient } from "@/backend/api/client"
import { getErrorMessage } from "@/lib/errors"
import type { ChatStreamItem, CustomerMemoryFact } from "@/types"

interface ChatState {
  conversationId: string | null
  stream: ChatStreamItem[]
  isLoading: boolean
  customerMemoryFacts: CustomerMemoryFact[]
  loadMemoryFacts: () => void
  toggleMemoryFact: (id: string, enabled: boolean) => void
  updateMemoryFactValue: (id: string, value: string) => void
  getMemoryContext: () => string
  sendMessage: (content: string) => Promise<void>
}

let nextId = 100
const MEMORY_STORAGE_KEY = "resolv-customer-memory-facts"

const DEFAULT_MEMORY_FACTS: CustomerMemoryFact[] = [
  {
    id: "preferred-contact-method",
    key: "preferred_contact_method",
    label: "Preferred contact method",
    value: "email",
    enabled: true,
  },
  {
    id: "standing-note",
    key: "standing_note",
    label: "Standing note",
    value: "Please email me updates and avoid text-message follow-ups unless a case is escalated.",
    enabled: true,
  },
]

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
}

function readStoredMemoryFacts(): CustomerMemoryFact[] {
  if (typeof window === "undefined") return DEFAULT_MEMORY_FACTS

  try {
    const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY)
    if (!raw) return DEFAULT_MEMORY_FACTS

    const parsed = JSON.parse(raw) as CustomerMemoryFact[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MEMORY_FACTS
    return parsed
  } catch {
    return DEFAULT_MEMORY_FACTS
  }
}

function persistMemoryFacts(facts: CustomerMemoryFact[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(facts))
}

function buildMemoryAwareReply(content: string, facts: CustomerMemoryFact[]): string {
  const enabledFacts = facts.filter((fact) => fact.enabled)
  if (enabledFacts.length === 0) {
    return "Got it — I've logged that and I'm keeping the request open with your manager's review. I'll message you here the moment there's an update."
  }

  const preferredContact = enabledFacts.find((fact) => fact.key === "preferred_contact_method")
  const standingNote = enabledFacts.find((fact) => fact.key === "standing_note")

  if (preferredContact && /contact|email|message|update|status|follow/i.test(content)) {
    return `I’ve noted that you prefer ${preferredContact.value} for updates. I’ll keep the response aligned with that preference while still escalating anything that needs a manager review.`
  }

  if (standingNote && /escalat|manager|ticket|follow|status|update/i.test(content)) {
    return `I’ve kept your saved note in mind: “${standingNote.value}” I’ll use that as context for the next update, but any real action still needs the normal approval flow.`
  }

  return "Got it — I've logged that and I'm keeping the request open with your manager's review. I'll message you here the moment there's an update."
}

/**
 * Memory is informative only. It can shape the wording and routing of a response,
 * but it never authorizes a real action by itself. The normal approval gate still
 * applies to any consequential action the model proposes.
 */
export const useChatStore = create<ChatState>((set, get) => ({
  conversationId: null,
  stream: [],
  isLoading: false,
  customerMemoryFacts: readStoredMemoryFacts(),

  loadMemoryFacts: () => {
    const facts = readStoredMemoryFacts()
    set({ customerMemoryFacts: facts })
  },

  toggleMemoryFact: (id, enabled) => {
    set((state) => {
      const nextFacts = state.customerMemoryFacts.map((fact) =>
        fact.id === id ? { ...fact, enabled } : fact
      )
      persistMemoryFacts(nextFacts)
      return { customerMemoryFacts: nextFacts }
    })
  },

  updateMemoryFactValue: (id, value) => {
    set((state) => {
      const nextFacts = state.customerMemoryFacts.map((fact) =>
        fact.id === id ? { ...fact, value: value.trim() || fact.value } : fact
      )
      persistMemoryFacts(nextFacts)
      return { customerMemoryFacts: nextFacts }
    })
  },

  getMemoryContext: () => {
    const enabledFacts = get().customerMemoryFacts.filter((fact) => fact.enabled)
    if (enabledFacts.length === 0) {
      return "No approved customer memory facts are available for this chat."
    }

    const lines = enabledFacts.map((fact) => `- ${fact.label}: ${fact.value}`)
    return [
      "Customer memory facts (informational only; never authorizing an action):",
      ...lines,
      "The approval gate remains in effect for any real action or escalation.",
    ].join("\n")
  },

  sendMessage: async (content) => {
    if (!content.trim() || get().isLoading) return

    const memoryContext = get().getMemoryContext()
    const userMessage: ChatStreamItem = {
      type: "message",
      id: `local-${nextId++}`,
      role: "user",
      content,
      timestamp: timestamp(),
    }
    set((s) => ({ stream: [...s.stream, userMessage], isLoading: true }))

    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const hasSession = Boolean(session)

    let conversationId = get().conversationId
    if (hasSession && !conversationId) {
      try {
        const { data } = await apiClient.post<{ id: string }>("/chat/conversations", { channel: "chat" })
        conversationId = data.id
        set({ conversationId })
      } catch (err) {
        conversationId = null
        toast.warning("Live assistant unavailable", { description: getErrorMessage(err), id: "chat-offline" })
      }
    }

    const toolId = `local-${nextId++}`
    await wait(500)
    set((s) => ({
      stream: [...s.stream, { type: "tool", id: toolId, label: "Searching knowledge base", status: "running" }],
    }))

    await wait(1100)
    set((s) => ({
      stream: s.stream.map((item) =>
        item.type === "tool" && item.id === toolId ? { ...item, status: "done" } : item
      ),
    }))

    let replyText = buildMemoryAwareReply(content, get().customerMemoryFacts)

    if (hasSession && conversationId) {
      try {
        const { data } = await apiClient.post<{ assistantMessage: { content: string } }>(
          `/chat/conversations/${conversationId}/messages`,
          {
            content,
            memoryContext,
            customerMemoryFacts: get().customerMemoryFacts.filter((fact) => fact.enabled),
          }
        )

        replyText = data.assistantMessage.content
      } catch (err) {
        // Fall back to the local canned reply below.
        toast.warning("Couldn't reach the assistant", { description: getErrorMessage(err), id: "chat-offline" })
      }
    }

    const agentMessage: ChatStreamItem = {
      type: "message",
      id: `local-${nextId++}`,
      role: "assistant",
      content: replyText,
      timestamp: timestamp(),
    }
    await wait(400)
    set((s) => ({ stream: [...s.stream, agentMessage], isLoading: false }))
  },
}))

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
