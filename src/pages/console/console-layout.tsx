import { AppSidebar } from "@/components/app-sidebar"
import { ConsoleHeader } from "@/components/console/console-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/backend/supabase/server"
import { apiFetch } from "@/backend/api/server"

interface MeResponse {
  name: string
  email: string
}

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Note: the backend's /me response doesn't include an avatar image URL
  // (only avatarInitials, which NavUser computes client-side from `name`
  // anyway), so `avatar` is always empty here — a deliberate deviation,
  // not a bug: there's no equivalent endpoint to fetch a profile photo from.
  const profile = authUser ? await apiFetch<MeResponse>("/me").catch(() => null) : null

  const user = {
    name: profile?.name || authUser?.email?.split("@")[0] || "Staff",
    email: profile?.email ?? authUser?.email ?? "",
    avatar: "",
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar user={user} />
      <SidebarInset>
        <ConsoleHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
