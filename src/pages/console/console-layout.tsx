import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { ConsoleHeader } from "@/components/console/console-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/backend/supabase/client"
import { apiClient } from "@/backend/api/client"

interface MeResponse {
  name: string
  email: string
}

export default function ConsoleLayout() {
  const [user, setUser] = useState({ name: "Staff", email: "", avatar: "" })

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
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar user={user} />
      <SidebarInset>
        <ConsoleHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
