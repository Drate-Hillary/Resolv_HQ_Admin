import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { ConsoleHeader } from "@/components/console/console-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/backend/supabase/client"
import { apiClient } from "@/backend/api/client"
import { useConsoleStore } from "@/lib/stores/console-store"
import { useSchedulerEngine } from "@/hooks/use-scheduler-engine"

interface MeResponse {
  name: string
  email: string
}

export default function ConsoleLayout() {
  useSchedulerEngine()
  const [user, setUser] = useState({ name: "Staff", email: "", avatar: "" })

  // Task history is persisted in localStorage and shown in the sidebar on every page;
  // hydrate after mount to avoid an SSR mismatch.
  useEffect(() => {
    void useConsoleStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadUser() {
      const {
        data: { user: authUser },
      } = await createClient().auth.getUser()
      if (!authUser || cancelled) return

      // Note: the backend's /me response doesn't include an avatar image URL
      // (only avatarInitials, which NavUser computes client-side from `name`
      // anyway), so `avatar` is always empty here — a deliberate deviation,
      // not a bug: there's no equivalent endpoint to fetch a profile photo from.
      const profile = await apiClient
        .get<MeResponse>("/me")
        .then((res) => res.data)
        .catch(() => null)
      if (cancelled) return

      setUser({
        name: profile?.name || authUser.email?.split("@")[0] || "Staff",
        email: profile?.email ?? authUser.email ?? "",
        avatar: "",
      })
    }
    void loadUser()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SidebarProvider defaultOpen={false} className="h-svh overflow-hidden">
      <AppSidebar user={user} />
      <SidebarInset className="min-w-0">
        <ConsoleHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
