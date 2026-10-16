interface EmptyStateProps {
  title: string
  subtitle?: string
  suggestions: string[]
  onPick: (text: string) => void
  disabled?: boolean
}

/** Greeting plus a few starter prompts, shown before the first message. */
export function EmptyState({ title, subtitle, suggestions, onPick, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
      >
        R
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
        {title}
      </h1>
      {subtitle && <p className="mt-2 max-w-md text-sm text-pretty text-muted-foreground">{subtitle}</p>}
      <div className="mt-8 flex w-full max-w-xl flex-wrap justify-center gap-2">
        {suggestions.map((text) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onPick(text)}
            className="rounded-full border border-border bg-background px-4 py-2 text-left text-sm text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
