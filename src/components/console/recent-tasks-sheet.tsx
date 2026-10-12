import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RecentTasks } from "@/components/console/recent-tasks"
import { HistoryIcon } from "@hugeicons/core-free-icons"

/** Mobile stand-in for the Recent tasks column. */
export function RecentTasksSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Recent tasks" />}>
        <Icon icon={HistoryIcon} size={18} />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Recent tasks</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RecentTasks />
        </div>
      </SheetContent>
    </Sheet>
  )
}
