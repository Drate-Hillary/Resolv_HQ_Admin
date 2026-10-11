import { Icon } from "@/components/ui/icon"
import { cn } from "cn"
import type { IconSvgElement } from "@hugeicons/react"

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string
  value: string
  icon: IconSvgElement
  tone?: "default" | "warn" | "danger"
}) {
  return (
    <div className="glass-panel flex flex-col gap-3 p-4 transition-colors hover:bg-black/[0.03]">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            tone === "default" && "bg-primary/10 text-primary",
            tone === "warn" && "bg-amber-500/15 text-amber-600",
            tone === "danger" && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon icon={icon} size={18} />
        </span>
      </div>
      <p className={cn("tabular truncate text-2xl font-semibold tracking-tight", tone === "danger" ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
    </div>
  )
}
