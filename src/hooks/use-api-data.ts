import { useEffect, useState } from "react"
import { apiClient } from "@/backend/api/client"

interface ApiData<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/** GET a backend path once on mount, exposing loading/error state. */
export function useApiData<T>(path: string): ApiData<T> {
  const [state, setState] = useState<{ path: string; data: T | null; error: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<T>(path)
      .then((res) => {
        if (!cancelled) setState({ path, data: res.data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ path, data: null, error: err instanceof Error ? err.message : "Request failed" })
        }
      })
    return () => {
      cancelled = true
    }
  }, [path])

  const current = state?.path === path ? state : null
  return { data: current?.data ?? null, error: current?.error ?? null, loading: current === null }
}
