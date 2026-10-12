import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { createClient } from "@/backend/supabase/client"

/**
 * Route guard replacing the former server middleware: renders the nested routes
 * only while a Supabase session exists, and tracks sign-in/out afterwards.
 * Unauthenticated visitors are sent to the login page.
 */
export function RequireAuth() {
  const location = useLocation()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setAuthed(!!session))
    return () => subscription.unsubscribe()
  }, [])

  if (authed === null) return null
  if (!authed) {
    const next = location.pathname + location.search
    const search = next === "/" ? "" : `?next=${encodeURIComponent(next)}`
    return <Navigate to={`/auth/login${search}`} replace />
  }
  return <Outlet />
}
