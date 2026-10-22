import { useEffect, useState } from "react"
import { apiClient } from "@/backend/api/client"

export type CallerRole = "admin" | "agent" | "customer"

let cached: Promise<CallerRole | null> | null = null

/** The signed-in user's role from GET /me (fetched once); null while loading or when signed out. */
export function useCallerRole(): CallerRole | null {
  const [role, setRole] = useState<CallerRole | null>(null)
  useEffect(() => {
    cached ??= apiClient
      .get<{ role: CallerRole }>("/me")
      .then(({ data }) => data.role)
      .catch(() => {
        cached = null
        return null
      })
    let live = true
    void cached.then((r) => live && setRole(r))
    return () => {
      live = false
    }
  }, [])
  return role
}
