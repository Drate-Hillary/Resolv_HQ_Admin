"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRequestsStore } from "@/lib/stores/requests-store"
import type { RequestPriority, Ticket } from "@/types"

const priorityVariant: Record<RequestPriority, "priority-high" | "priority-medium" | "priority-low"> = {
  urgent: "priority-high",
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
}

const statusVariant: Record<string, "approve" | "default" | "secondary"> = {
  completed: "approve",
  processing: "default",
}

export function TicketTable() {
  const tickets = useRequestsStore((s) => s.tickets)
  const isLoading = useRequestsStore((s) => s.isLoading)
  const error = useRequestsStore((s) => s.error)
  const fetchTickets = useRequestsStore((s) => s.fetchTickets)

  useEffect(() => {
    void fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading tickets">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (error && tickets.length === 0) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
      >
        <p className="text-sm font-medium text-foreground">We couldn&apos;t load your tickets</p>
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" onClick={() => void fetchTickets()}>
          Try again
        </Button>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No open tickets right now</p>
        <p className="text-xs text-muted-foreground">New customer requests will appear here as they come in.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-accent/40 text-sm text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Customer</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Priority</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Assigned</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <tr className="transition-colors hover:bg-accent/30">
      <td className="px-3 py-2.5 align-top">
        <Link href={`/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">
          #{ticket.ticketNumber}
        </Link>
      </td>
      <td className="max-w-64 truncate px-3 py-2.5 align-top text-foreground">
        <Link href={`/tickets/${ticket.id}`} className="hover:underline">
          {ticket.title}
        </Link>
      </td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">{ticket.customerName ?? "Unknown"}</td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">{ticket.category}</td>
      <td className="px-3 py-2.5 align-top">
        <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
      </td>
      <td className="px-3 py-2.5 align-top">
        <Badge variant={statusVariant[ticket.status] ?? "secondary"}>{ticket.status}</Badge>
        {ticket.aiHandled && (
          <Badge variant="outline" className="ml-1">
            AI
          </Badge>
        )}
      </td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">{ticket.assignedAgentName ?? "Unassigned"}</td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">
        {new Date(ticket.updatedAt).toLocaleString()}
      </td>
    </tr>
  )
}
