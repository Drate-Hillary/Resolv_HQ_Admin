"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
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
} from "@hugeicons/core-free-icons"

const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: <HugeiconsIcon icon={DashboardBrowsingIcon} strokeWidth={2} /> },
    { title: "Tickets", url: "/tickets", icon: <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} /> },
    { title: "Agent Workspace", url: "/agent", icon: <HugeiconsIcon icon={Robot02Icon} strokeWidth={2} /> },
    { title: "Knowledge Base", url: "/knowledge", icon: <HugeiconsIcon icon={Knowledge01Icon} strokeWidth={2} /> },
    { title: "Tools", url: "/tools", icon: <HugeiconsIcon icon={Wrench01Icon} strokeWidth={2} /> },
    { title: "AI Models", url: "/providers", icon: <HugeiconsIcon icon={CpuIcon} strokeWidth={2} /> },
  ],
  navGovernance: [
    { title: "Agent Flow", url: "/flow", icon: <HugeiconsIcon icon={WorkflowSquare01Icon} strokeWidth={2} /> },
    { title: "Traces & Logs", url: "/traces", icon: <HugeiconsIcon icon={Activity03Icon} strokeWidth={2} /> },
    { title: "Memory & MCP", url: "/memory", icon: <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} /> },
    { title: "MCP Tester", url: "/mcp", icon: <HugeiconsIcon icon={PlugSocketIcon} strokeWidth={2} /> },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
}) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex items-center justify-center rounded-full aspect-square size-8 bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
              </div>
              <div className="grid flex-1 text-sm leading-tight text-left">
                <span className="text-lg font-bold truncate">Resolv-HQ</span>
                <span className="text-xs truncate">Agent Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Operate" items={data.navMain} />
        <NavMain label="Governance" items={data.navGovernance} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
