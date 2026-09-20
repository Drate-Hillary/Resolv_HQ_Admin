import { create } from "zustand"
import { createClient } from "@/backend/supabase/client"
import { apiClient } from "@/backend/api/client"
import type { ChatStreamItem, Citation } from "@/types"

interface ChatState {
  conversationId: string | null
  stream: ChatStreamItem[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
}

let nextId = 100

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
}

const FALLBACK_REPLY =
  "Got it — I've logged that and I'm keeping the request open with your manager's review. I'll message you here the moment there's an update."

/**
 * /chat is deliberately public (see src/middleware.ts) — it's the
 * customer-facing demo surface, not part of the staff console. The backend's
 * /chat/* routes require a bearer token same as everything else there, so:
 * try to persist for real (and use the backend's real answer-engine reply)
 * only when a Supabase session actually exists — e.g. staff previewing the
 * demo while signed in — and fall back to the local-only canned stream
 * otherwise. The UI never blocks on the network call either way.
 */
export const useChatStore = create<ChatState>((set, get) => ({
  conversationId: null,
  stream: [],
  isLoading: false,

  sendMessage: async (content) => {
    if (!content.trim() || get().isLoading) return

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
      } catch {
        conversationId = null
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

    let replyText = FALLBACK_REPLY
    let citations: Citation[] | undefined

    if (hasSession && conversationId) {
      try {
        const { data } = await apiClient.post<{
          assistantMessage: { content: string; sources: { id: string; label: string; excerpt: string | null }[] }
        }>(`/chat/conversations/${conversationId}/messages`, { content })

        replyText = data.assistantMessage.content
        if (data.assistantMessage.sources.length > 0) {
          citations = data.assistantMessage.sources.map((s, i) => ({
            id: s.id,
            number: i + 1,
            policyLabel: s.label,
            excerpt: s.excerpt ?? "",
          }))
        }
      } catch {
        // Fall back to the local canned reply below.
      }
    }

    const agentMessage: ChatStreamItem = {
      type: "message",
      id: `local-${nextId++}`,
      role: "assistant",
      content: replyText,
      timestamp: timestamp(),
      citations,
    }
    await wait(400)
    set((s) => ({ stream: [...s.stream, agentMessage], isLoading: false }))
  },
}))

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
