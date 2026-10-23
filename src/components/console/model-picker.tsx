import { useEffect, useState } from "react"
import { ArrowDown01Icon, CpuIcon, SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { apiClient } from "@/backend/api/client"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useConsoleStore } from "@/lib/stores/console-store"
import { cn } from "cn"

interface ModelOption {
  id: string
  name: string
  provider: string
  model: string | null
}

/** Lets the user choose which registered, active model answers; "Automatic" leaves the choice to the backend. */
export function ModelPicker({ disabled }: { disabled?: boolean }) {
  const selected = useConsoleStore((s) => s.selectedProviderId)
  const setSelected = useConsoleStore((s) => s.setSelectedProvider)
  const [models, setModels] = useState<ModelOption[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<ModelOption[]>("/chat/models")
      .then(({ data }) => {
        if (cancelled) return
        setModels(data)
        // A model that was disabled or removed since last time can't be used any more.
        if (selected && !data.some((m) => m.id === selected)) setSelected(null)
      })
      .catch(() => {
        if (!cancelled) setModels([])
      })
    return () => {
      cancelled = true
    }
    // Only the first load: re-running on every selection would refetch for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (models.length === 0) return null

  const current = models.find((m) => m.id === selected)
  const choose = (id: string | null) => {
    setSelected(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="Choose model"
            className="h-9 max-w-48 gap-1.5 rounded-full px-3 text-muted-foreground"
          />
        }
      >
        <Icon icon={current ? CpuIcon : SparklesIcon} size={15} className="shrink-0" />
        <span className="truncate text-foreground">{current ? current.name : "Automatic"}</span>
        <Icon icon={ArrowDown01Icon} size={14} className="shrink-0" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-80 p-1.5">
        <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Model</p>
        <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto" role="listbox" aria-label="Models">
          <Option
            active={!current}
            onClick={() => choose(null)}
            avatar={<Icon icon={SparklesIcon} size={14} />}
            title="Automatic"
            hint="The system picks, and falls back if one fails"
          />
          {models.map((m) => (
            <Option
              key={m.id}
              active={m.id === selected}
              onClick={() => choose(m.id)}
              avatar={<span className="text-xs font-semibold uppercase">{m.provider.charAt(0)}</span>}
              title={m.name}
              hint={[m.model ?? "default model", m.provider].join(" · ")}
            />
          ))}
        </ul>
        <p className="px-2 pt-2 pb-1 text-xs text-muted-foreground">Applies to your next message. If it is unavailable, another model answers.</p>
      </PopoverContent>
    </Popover>
  )
}

function Option({
  active,
  onClick,
  avatar,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  avatar: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none hover:bg-accent focus-visible:bg-accent",
          active && "bg-accent/60"
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">{avatar}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-foreground">{title}</span>
          <span className="truncate text-muted-foreground">{hint}</span>
        </span>
        {active && <Icon icon={Tick02Icon} size={16} className="shrink-0 text-primary" />}
      </button>
    </li>
  )
}
