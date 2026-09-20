"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "cn"
import { useAdminStore } from "@/lib/stores/admin-store"
import type { AdminTicket } from "@/types"
import type { RequestPriority } from "@/types"

const priorityOrder: RequestPriority[] = ["high", "medium", "low"]
const priorityLabel: Record<RequestPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}
const priorityDot: Record<RequestPriority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
}

export function TicketList() {
  const tickets = useAdminStore((s) => s.tickets)
  const selectedApprovalId = useAdminStore((s) => s.selectedApprovalId)
  const selectTicket = useAdminStore((s) => s.selectTicket)
  const isLoading = useAdminStore((s) => s.isLoading)

  return (
    <aside className="flex w-full shrink-0 flex-col border-border bg-sidebar text-sidebar-foreground lg:h-screen lg:w-64 lg:border-r">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
          R
        </span>
        <span className="text-sm font-semibold tracking-tight">Approvals</span>
      </div>

      <ScrollArea className="lg:flex-1">
        <div className="flex gap-4 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
          {isLoading && tickets.length === 0 && (
            <p className="px-1.5 text-xs text-sidebar-foreground/50">Loading approvals…</p>
          )}
          {!isLoading && tickets.length === 0 && (
            <p className="px-1.5 text-xs text-sidebar-foreground/50">No approvals yet.</p>
          )}
          {priorityOrder.map((priority) => {
            const group = tickets.filter((t) => t.priority === priority)
            if (group.length === 0) return null
            return (
              <div key={priority} className="shrink-0 lg:shrink">
                <div className="flex items-center gap-1.5 px-1.5 pb-1.5 text-sm font-medium text-sidebar-foreground/60">
                  <span className={cn("size-1.5 rounded-full", priorityDot[priority])} />
                  {priorityLabel[priority]} · {group.length}
                </div>
                <div className="flex gap-1.5 lg:flex-col">
                  {group.map((ticket) => (
                    <TicketRow
                      key={ticket.approvalId}
                      ticket={ticket}
                      selected={ticket.approvalId === selectedApprovalId}
                      decided={ticket.status === "approved" || ticket.status === "rejected"}
                      onSelect={() => selectTicket(ticket.approvalId)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}

function TicketRow({
  ticket,
  selected,
  decided,
  onSelect,
}: {
  ticket: AdminTicket
  selected: boolean
  decided: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-44 shrink-0 rounded-md px-2.5 py-2 text-left transition-colors lg:w-full",
        selected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-sidebar-accent-foreground">
          {ticket.customerName}
        </span>
        {decided && (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              ticket.status === "approved" ? "bg-approve" : "bg-destructive"
            )}
          />
        )}
      </div>
      <p className="mt-0.5 line-clamp-2 text-sm text-sidebar-foreground/55">
        {ticket.subject}
      </p>
      <p className="mt-1 text-xs text-sidebar-foreground/40">
        Waiting {ticket.waitingSince}
      </p>
    </button>
  )
}
