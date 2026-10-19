import { Link } from "react-router-dom"
import { Icon } from "@/components/ui/icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Ticket01Icon } from "@hugeicons/core-free-icons"

/**
 * Icon that opens a request the agent created, in the ticket view where staff
 * can reply, assign it, change its status or close it.
 */
export function OpenRequestLink({ requestId }: { requestId: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={`/tickets/${requestId}`}
            aria-label="Open the request the agent created"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        }
      >
        <Icon icon={Ticket01Icon} size={16} />
        Open request
      </TooltipTrigger>
      <TooltipContent>View it, reply, assign or change its status</TooltipContent>
    </Tooltip>
  )
}
