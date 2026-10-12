"use client"

import { TicketTable } from "@/components/tickets/ticket-table"

export default function TicketsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Tickets</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Every open customer request — assign, respond, and track through resolution.
        </p>
      </div>
      <TicketTable />
    </div>
  )
}
