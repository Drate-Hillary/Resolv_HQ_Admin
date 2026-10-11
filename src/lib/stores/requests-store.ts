import { create } from "zustand"
import { toast } from "sonner"
import { apiClient } from "@/backend/api/client"
import { getErrorMessage, toastError } from "@/lib/errors"
import { createClient as createBrowserSupabaseClient } from "@/backend/supabase/client"
import { onRealtimeEvent, retainRealtime } from "@/lib/realtime"
import type { Ticket, TicketDetail, TicketMessage } from "@/types"

/** How long a "typing…" indicator lingers without a fresh ping from the other side. */
const TYPING_TTL_MS = 4_000
/** At most one "I'm typing" ping per this interval while the user keeps typing. */
const TYPING_PING_MS = 2_500

interface RequestsState {
  tickets: Ticket[]
  detailById: Record<string, TicketDetail>
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  /** requestId -> who is typing right now ("Support" / "Customer"). Cleared automatically. */
  typingByRequest: Record<string, string>
  fetchTickets: () => Promise<void>
  fetchDetail: (id: string) => Promise<void>
  changeStatus: (id: string, status: string) => Promise<void>
  assignToMe: (id: string) => Promise<void>
  close: (id: string) => Promise<void>
  /** Returns true if the message was sent, so the caller can restore the draft on failure. */
  reply: (id: string, text: string) => Promise<boolean>
  /** Throttled "I'm typing" signal; pass false to say typing stopped. */
  notifyTyping: (id: string, typing: boolean) => void
  /** Opens the live connection for ticket threads; returns a stop function. */
  startRealtime: () => () => void
}

let myUserId: string | null = null
const typingTimers: Record<string, ReturnType<typeof setTimeout>> = {}
let lastPing = 0
let lastPingState = false
let realtimeHolders = 0
let releaseRealtime: (() => void) | null = null
let stopListening: (() => void) | null = null

function hasMessage(messages: TicketMessage[], id: string) {
  return messages.some((m) => m.id === id)
}

function without(map: Record<string, string>, key: string) {
  return Object.fromEntries(Object.entries(map).filter(([k]) => k !== key))
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  tickets: [],
  detailById: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  typingByRequest: {},

  fetchTickets: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await apiClient.get<Ticket[]>("/requests")
      set({ tickets: data, isLoading: false })
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load tickets")
      set({ isLoading: false, error: message })
      toast.error(message, { id: "requests-load" })
    }
  },

  fetchDetail: async (id) => {
    set({ error: null })
    try {
      const { data } = await apiClient.get<TicketDetail>(`/requests/${id}`)
      set((s) => ({ detailById: { ...s.detailById, [id]: data } }))
    } catch (err) {
      set({ error: toastError(err, "Failed to load ticket", "request-detail") })
    }
  },

  changeStatus: async (id, status) => {
    if (get().isSubmitting) return
    set({ isSubmitting: true })
    try {
      const { data } = await apiClient.patch<TicketDetail>(`/requests/${id}/status`, { status })
      set((s) => ({
        isSubmitting: false,
        detailById: { ...s.detailById, [id]: data },
        tickets: s.tickets.map((t) => (t.id === id ? { ...t, status: data.status } : t)),
      }))
    } catch (err) {
      set({ isSubmitting: false, error: toastError(err, "Failed to update status") })
    }
  },

  assignToMe: async (id) => {
    if (get().isSubmitting) return
    set({ isSubmitting: true })
    try {
      const { data } = await apiClient.patch<TicketDetail>(`/requests/${id}/assign`)
      set((s) => ({
        isSubmitting: false,
        detailById: { ...s.detailById, [id]: data },
        tickets: s.tickets.map((t) =>
          t.id === id ? { ...t, assignedAgentId: data.assignedAgentId, assignedAgentName: data.assignedAgentName } : t
        ),
      }))
    } catch (err) {
      set({ isSubmitting: false, error: toastError(err, "Failed to assign the ticket") })
    }
  },

  close: async (id) => {
    if (get().isSubmitting) return
    set({ isSubmitting: true })
    try {
      const { data } = await apiClient.patch<TicketDetail>(`/requests/${id}/close`)
      set((s) => ({
        isSubmitting: false,
        detailById: { ...s.detailById, [id]: data },
        tickets: s.tickets.map((t) => (t.id === id ? { ...t, closedAt: data.closedAt } : t)),
      }))
    } catch (err) {
      set({ isSubmitting: false, error: toastError(err, "Failed to close the ticket") })
    }
  },

  reply: async (id, text) => {
    if (!text.trim()) return false
    // No global isSubmitting lock and no re-fetch: the server returns the saved
    // message, which is appended straight away, so a send costs one round trip.
    get().notifyTyping(id, false)
    try {
      const { data } = await apiClient.post<TicketMessage>(`/requests/${id}/messages`, { text })
      set((s) => {
        const detail = s.detailById[id]
        if (!detail || hasMessage(detail.messages, data.id)) return s
        return { detailById: { ...s.detailById, [id]: { ...detail, messages: [...detail.messages, data] } } }
      })
      return true
    } catch (err) {
      set({ error: toastError(err, "Your reply could not be sent. It was kept so you can retry.") })
      return false
    }
  },

  notifyTyping: (id, typing) => {
    const now = Date.now()
    // While typing, ping every few seconds; always send the one "stopped" ping.
    if (typing && lastPingState && now - lastPing < TYPING_PING_MS) return
    if (!typing && !lastPingState) return
    lastPing = now
    lastPingState = typing
    // Best effort: a lost typing ping must never surface as an error.
    void apiClient.post(`/requests/${id}/typing`, { typing }).catch(() => {})
  },

  startRealtime: () => {
    realtimeHolders += 1
    if (realtimeHolders === 1) {
      releaseRealtime = retainRealtime()
      void createBrowserSupabaseClient()
        .auth.getSession()
        .then(({ data }) => {
          myUserId = data.session?.user.id ?? null
        })
      stopListening = onRealtimeEvent((event) => {
        if (event.type === "message") {
          set((s) => {
            const detail = s.detailById[event.requestId]
            if (!detail || hasMessage(detail.messages, event.message.id)) return s
            return {
              detailById: {
                ...s.detailById,
                [event.requestId]: { ...detail, messages: [...detail.messages, event.message] },
              },
              // A message arriving means they stopped typing.
              typingByRequest: without(s.typingByRequest, event.requestId),
            }
          })
        } else if (event.type === "typing") {
          if (event.userId === myUserId) return
          clearTimeout(typingTimers[event.requestId])
          if (!event.typing) {
            set((s) => ({ typingByRequest: without(s.typingByRequest, event.requestId) }))
            return
          }
          const label = event.senderType === "customer" ? "Customer" : "Support"
          set((s) => ({ typingByRequest: { ...s.typingByRequest, [event.requestId]: label } }))
          // Expire on our own if the "stopped" ping never arrives (closed tab, lost connection).
          typingTimers[event.requestId] = setTimeout(() => {
            set((s) => ({ typingByRequest: without(s.typingByRequest, event.requestId) }))
          }, TYPING_TTL_MS)
        }
      })
    }
    return () => {
      realtimeHolders -= 1
      if (realtimeHolders === 0) {
        stopListening?.()
        releaseRealtime?.()
        stopListening = null
        releaseRealtime = null
      }
    }
  },
}))
