import { Settings02Icon } from "@hugeicons/core-free-icons"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { MemorySettings } from "@/components/chat/memory-settings"

/** "Saved information" lives in a dialog so the conversation stays the page. */
export function MemoryDialog({ compact = false }: { compact?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="Saved information"
        className={
          compact
            ? "flex size-9 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
            : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
        }
      >
        <Icon icon={Settings02Icon} size={compact ? 18 : 16} />
        {!compact && "Saved information"}
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Saved information</DialogTitle>
        <MemorySettings />
      </DialogContent>
    </Dialog>
  )
}
