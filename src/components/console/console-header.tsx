"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AgentStatusPill } from "@/components/console/agent-status-pill"

const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agent": "Agent Workspace",
  "/knowledge": "Knowledge Base",
  "/tools": "Tools",
  "/traces": "Traces & Logs",
}

export function ConsoleHeader() {
  const pathname = usePathname()
  const label = pageLabels[pathname] ?? "Resolv-HQ"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Resolv-HQ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <AgentStatusPill />
    </header>
  )
}
