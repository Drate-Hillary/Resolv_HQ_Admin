import { Navigate, Route, Routes } from "react-router-dom"
import { RequireAuth } from "@/components/require-auth"
import { Toaster } from "@/components/ui/sonner"
import LoginPage from "@/pages/auth/login/page"
import ChatPage from "@/pages/chat/page"
import AdminPage from "@/pages/admin/page"
import ConsoleLayout from "@/pages/console/console-layout"
import DashboardPage from "@/pages/console/dashboard/page"
import AgentWorkspacePage from "@/pages/console/agent/page"
import SchedulerPage from "@/pages/console/scheduler/page"
import TracesPage from "@/pages/console/traces/page"
import TicketsPage from "@/pages/console/tickets/page"
import TicketDetailPage from "@/pages/console/tickets/ticket-detail-page"
import KnowledgeBasePage from "@/pages/console/knowledge/page"
import ToolsPage from "@/pages/console/tools/page"
import ProvidersPage from "@/pages/console/providers/page"
import MemoryMcpPage from "@/pages/console/memory/page"
import McpTesterPage from "@/pages/console/mcp/page"

export default function App() {
  return (
    <>
      <Routes>
        {/* Public: login, and the customer-facing chat demo surface. */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route element={<ConsoleLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/agent" element={<AgentWorkspacePage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/flow" element={<Navigate to="/scheduler" replace />} />
            <Route path="/traces" element={<TracesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/memory" element={<MemoryMcpPage />} />
            <Route path="/mcp" element={<McpTesterPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/agent" replace />} />
        <Route path="*" element={<Navigate to="/agent" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
