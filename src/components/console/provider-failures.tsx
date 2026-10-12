import { parseProviderFailures, type ProviderFailure } from "@/lib/provider-errors"

/** One provider's failure as a Provider / Error / Cause / Fix card. */
export function ProviderFailureCard({ failure }: { failure: ProviderFailure }) {
  return (
    <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 rounded-md border border-border bg-muted/30 p-3 text-xs">
      <dt className="text-muted-foreground">Provider</dt>
      <dd className="font-medium text-foreground">{failure.provider}</dd>
      <dt className="text-muted-foreground">Error</dt>
      <dd className="break-words text-destructive">{failure.error}</dd>
      <dt className="text-muted-foreground">Cause</dt>
      <dd className="text-foreground">{failure.cause}</dd>
      <dt className="text-muted-foreground">Fix</dt>
      <dd className="text-foreground">{failure.fix}</dd>
    </dl>
  )
}

/** Renders the gateway's "all providers failed" message as a card per provider. */
export function ProviderFailures({ message }: { message: string }) {
  const failures = parseProviderFailures(message)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-destructive">All registered providers failed.</p>
      {failures.map((failure, index) => (
        <ProviderFailureCard key={`${failure.provider}-${index}`} failure={failure} />
      ))}
    </div>
  )
}
