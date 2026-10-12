import { Skeleton } from "@/components/ui/skeleton"

/** Loading / error placeholder for pages that fetch their data on mount. */
export function PageStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <p className="text-sm text-destructive">Could not load this page: {error}</p>
      </div>
    )
  }
  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  return null
}
