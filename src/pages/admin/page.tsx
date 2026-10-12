"use client"

import { useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { TicketList } from "@/components/admin/ticket-list"
import { TranscriptView } from "@/components/admin/transcript-view"
import { ActionPanel } from "@/components/admin/action-panel"
import { useAdminStore } from "@/lib/stores/admin-store"

export default function AdminPage() {
  const tickets = useAdminStore((s) => s.tickets)
  const selectedApprovalId = useAdminStore((s) => s.selectedApprovalId)
  const fetchTickets = useAdminStore((s) => s.fetchTickets)
  const selectedTicket = tickets.find((t) => t.approvalId === selectedApprovalId)

  useEffect(() => {
    void fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
      <TicketList />
      <div className="flex min-h-0 flex-1 flex-col">
        {selectedTicket && <AdminHeader ticket={selectedTicket} />}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div className="border-b border-border lg:border-b-0">
            <TranscriptView />
          </div>
          <ActionPanel />
        </div>
      </div>
    </div>
  )
}
