import { create } from "zustand"
import { apiClient } from "@/backend/api/client"
import type { AdminTicket, Escalation, TranscriptEntry } from "@/types"

interface AdminOption {
  id: string
  name: string
}

interface EscalationResponse extends Escalation {
  transcript: TranscriptEntry[]
}

interface AdminState {
  tickets: AdminTicket[]
  escalationsById: Record<string, Escalation>
  transcriptsByRequest: Record<string, TranscriptEntry[]>
  admins: AdminOption[]
  selectedApprovalId: string
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  fetchTickets: () => Promise<void>
  fetchAdmins: () => Promise<void>
  selectTicket: (approvalId: string) => void
  loadDetail: (approvalId: string) => Promise<void>
  approve: (approvalId: string, note?: string) => Promise<void>
  reject: (approvalId: string, note?: string) => Promise<void>
  assignAdmin: (requestId: string, adminId: string | null) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  tickets: [],
  escalationsById: {},
  transcriptsByRequest: {},
  admins: [],
  selectedApprovalId: "",
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: tickets } = await apiClient.get<AdminTicket[]>("/admin/approvals")
      set({
        tickets,
        isLoading: false,
        selectedApprovalId: get().selectedApprovalId || tickets[0]?.approvalId || "",
      })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "Failed to load tickets" })
    }
  },

  fetchAdmins: async () => {
    try {
      const { data } = await apiClient.get<AdminOption[]>("/admin/approvals/available-admins")
      set({ admins: data })
    } catch {
      set({ admins: [] })
    }
  },

  selectTicket: (approvalId) => {
    set({ selectedApprovalId: approvalId })
    void get().loadDetail(approvalId)
  },

  loadDetail: async (approvalId) => {
    if (get().escalationsById[approvalId]) return

    try {
      const { data } = await apiClient.get<EscalationResponse>(`/admin/approvals/${approvalId}`)
      const { transcript, ...escalation } = data
      set((s) => ({
        escalationsById: { ...s.escalationsById, [approvalId]: escalation },
        transcriptsByRequest: escalation.requestId
          ? { ...s.transcriptsByRequest, [escalation.requestId]: transcript }
          : s.transcriptsByRequest,
      }))
    } catch {
      // Leave unloaded; the panel stays empty until the ticket is re-selected.
    }
  },

  approve: async (approvalId, note) => {
    if (get().isSubmitting) return
    set({ isSubmitting: true })

    try {
      await apiClient.patch(`/admin/approvals/${approvalId}/approve`, note ? { note } : {})
      set((s) => ({
        isSubmitting: false,
        tickets: s.tickets.map((t) => (t.approvalId === approvalId ? { ...t, status: "approved" } : t)),
        escalationsById: s.escalationsById[approvalId]
          ? {
              ...s.escalationsById,
              [approvalId]: {
                ...s.escalationsById[approvalId],
                status: "approved",
                decisionNote: note ?? s.escalationsById[approvalId].decisionNote,
                aiSummary: note ?? s.escalationsById[approvalId].aiSummary,
              },
            }
          : s.escalationsById,
      }))
    } catch {
      set({ isSubmitting: false })
    }
  },

  reject: async (approvalId, note) => {
    if (get().isSubmitting) return
    set({ isSubmitting: true })

    try {
      await apiClient.patch(`/admin/approvals/${approvalId}/reject`, note ? { note } : {})
      set((s) => ({
        isSubmitting: false,
        tickets: s.tickets.map((t) => (t.approvalId === approvalId ? { ...t, status: "rejected" } : t)),
        escalationsById: s.escalationsById[approvalId]
          ? {
              ...s.escalationsById,
              [approvalId]: {
                ...s.escalationsById[approvalId],
                status: "rejected",
                decisionNote: note ?? s.escalationsById[approvalId].decisionNote,
              },
            }
          : s.escalationsById,
      }))
    } catch {
      set({ isSubmitting: false })
    }
  },

  assignAdmin: async (requestId, adminId) => {
    try {
      await apiClient.patch(`/admin/approvals/requests/${requestId}/assign`, { adminId })
      set((s) => ({
        tickets: s.tickets.map((t) => (t.requestId === requestId ? { ...t, assignedAdminId: adminId } : t)),
      }))
    } catch {
      // Leave the assignment as-is on failure.
    }
  },
}))
