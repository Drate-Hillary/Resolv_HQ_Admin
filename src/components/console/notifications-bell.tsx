import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotificationsStore, type AppNotification, type NotificationType } from "@/lib/stores/notifications-store"
import { Notification01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

type Filter = "all" | "unread" | NotificationType

/** Every kind the backend can send, with how it's labelled and coloured in the list. */
const TYPE_META: Record<NotificationType, { label: string; className: string }> = {
  support: { label: "Support", className: "bg-primary/10 text-primary" },
  request_update: { label: "Request update", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  ai: { label: "AI", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  system: { label: "System", className: "bg-muted text-muted-foreground" },
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  ...(Object.keys(TYPE_META) as NotificationType[]).map((key) => ({ key, label: TYPE_META[key].label })),
]

function metaFor(type: string) {
  return TYPE_META[type as NotificationType] ?? TYPE_META.system
}

/** Where a notification leads: its request when it has one, otherwise the approval queue for AI escalations. */
function destination(n: AppNotification): string | null {
  if (n.requestId) return `/tickets/${n.requestId}`
  if (n.type === "ai") return "/admin"
  return null
}

export function NotificationsBell() {
  const navigate = useNavigate()
  const items = useNotificationsStore((s) => s.items)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  const startPolling = useNotificationsStore((s) => s.startPolling)

  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => startPolling(), [startPolling])

  const visible = items.filter((n) => (filter === "all" ? true : filter === "unread" ? !n.read : n.type === filter))
  const countFor = (key: Filter) =>
    key === "all" ? items.length : key === "unread" ? unreadCount : items.filter((n) => n.type === key).length

  function open(n: AppNotification) {
    if (!n.read) void markRead(n.id)
    const href = destination(n)
    if (href) navigate(href)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          />
        }
      >
        <Icon icon={Notification01Icon} size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-medium text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button onClick={() => void markAllRead()} className="text-xs text-muted-foreground hover:text-foreground">
              Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2" role="tablist" aria-label="Filter notifications">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {label} {countFor(key) > 0 && <span className="opacity-70">{countFor(key)}</span>}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {items.length === 0 ? "You're all caught up." : "No notifications in this view."}
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="flex flex-col">
              {visible.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => open(n)}
                    className={cn(
                      "flex w-full items-start gap-2.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide",
                            metaFor(n.type).className
                          )}
                        >
                          {metaFor(n.type).label}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[0.6875rem] text-muted-foreground/80">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
