import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { RecentTasks } from "@/components/console/recent-tasks"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useConsoleStore } from "@/lib/stores/console-store"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardBrowsingIcon,
  Robot02Icon,
  Knowledge01Icon,
  Wrench01Icon,
  Activity03Icon,
  CpuIcon,
  Ticket01Icon,
  WorkflowSquare01Icon,
  SparklesIcon,
  AiBrain01Icon,
  PlugSocketIcon,
  BubbleChatAddIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

const consolePages = [
  { title: "Dashboard", url: "/dashboard", icon: <HugeiconsIcon icon={DashboardBrowsingIcon} strokeWidth={2} /> },
  { title: "Tickets", url: "/tickets", icon: <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} /> },
  { title: "Knowledge Base", url: "/knowledge", icon: <HugeiconsIcon icon={Knowledge01Icon} strokeWidth={2} /> },
  { title: "Tools", url: "/tools", icon: <HugeiconsIcon icon={Wrench01Icon} strokeWidth={2} /> },
  { title: "AI Models", url: "/providers", icon: <HugeiconsIcon icon={CpuIcon} strokeWidth={2} /> },
  { title: "Agent Flow", url: "/flow", icon: <HugeiconsIcon icon={WorkflowSquare01Icon} strokeWidth={2} /> },
  { title: "Traces & Logs", url: "/traces", icon: <HugeiconsIcon icon={Activity03Icon} strokeWidth={2} /> },
  { title: "Memory & MCP", url: "/memory", icon: <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} /> },
  { title: "MCP Tester", url: "/mcp", icon: <HugeiconsIcon icon={PlugSocketIcon} strokeWidth={2} /> },
]

/** Every admin page, tucked under one collapsible group; open when you are on one of them. */
function ConsolePages() {
  const { pathname } = useLocation()
  const onConsolePage = consolePages.some((p) => pathname === p.url || pathname.startsWith(`${p.url}/`))
  const [open, setOpen] = React.useState(onConsolePage)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup className="pb-0">
        <CollapsibleTrigger
          render={
            <SidebarGroupLabel className="group/trigger w-full cursor-pointer justify-between hover:text-sidebar-foreground" />
          }
        >
          Console
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3.5 transition-transform group-aria-expanded/trigger:rotate-90"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <NavMain items={consolePages} />
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const newTask = useConsoleStore((s) => s.newTask)
  const busy = useConsoleStore((s) => s.status === "thinking")

  const startNewTask = () => {
    newTask()
    navigate("/agent")
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/agent" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
              </div>
              <span className="truncate text-lg font-bold">Resolv-HQ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={startNewTask} disabled={busy} tooltip="New task">
              <HugeiconsIcon icon={BubbleChatAddIcon} strokeWidth={2} />
              <span>New task</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname === "/agent"} render={<Link to="/agent" />} tooltip="Chat">
              <HugeiconsIcon icon={Robot02Icon} strokeWidth={2} />
              <span>Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ConsolePages />
        <SidebarGroup className="min-h-0 flex-1 pb-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recent tasks</SidebarGroupLabel>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <RecentTasks />
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
