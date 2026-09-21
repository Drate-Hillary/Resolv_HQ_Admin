"use client"

import { useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAdminStore } from "@/lib/stores/admin-store"
import type { AdminTicket } from "@/types"

const priorityVariant = {
  urgent: "priority-high",
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
} as const

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AdminHeader({ ticket }: { ticket: AdminTicket }) {
  const admins = useAdminStore((s) => s.admins)
  const fetchAdmins = useAdminStore((s) => s.fetchAdmins)
  const assignAdmin = useAdminStore((s) => s.assignAdmin)

  useEffect(() => {
    if (admins.length === 0) void fetchAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority} priority</Badge>
        <p className="truncate text-sm font-medium text-foreground">{ticket.subject}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {ticket.requestId && (
          <select
            aria-label="Assign to admin"
            value={ticket.assignedAgentId ?? ""}
            onChange={(e) => {
              if (ticket.requestId) void assignAdmin(ticket.requestId, e.target.value || null)
            }}
            className="h-7 rounded-md border border-border bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="">Unassigned</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <Avatar className="size-6">
          <AvatarFallback>{initials(ticket.customerName)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
