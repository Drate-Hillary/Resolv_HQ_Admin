"use client"

import { useParams } from "next/navigation"
import { TicketDetail } from "@/components/tickets/ticket-detail"

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <TicketDetail id={params.id} />
    </div>
  )
}
