"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { AgentFlowDiagram } from "@/components/console/agent-flow-diagram"
import { ProviderSankey } from "@/components/console/provider-sankey"
import { Icon } from "@/components/ui/icon"
import { deriveFlow, FLOW_NODES } from "@/lib/agent-flow"
import { useConsoleStore } from "@/lib/stores/console-store"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

export default function AgentFlowPage() {
  const run = useConsoleStore((s) => s.run)
  const status = useConsoleStore((s) => s.status)

  // History is persisted in localStorage; hydrate after mount to avoid an SSR mismatch.
  useEffect(() => {
    void useConsoleStore.persist.rehydrate()
  }, [])

  const flow = useMemo(() => deriveFlow(run, status === "failed"), [run, status])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Agent flow</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          How a request moves between stages, and where your latest run went. Highlighted stages were visited on that run.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section>
          <AgentFlowDiagram flow={flow} />
        </section>

        <section className="glass-panel h-fit p-4">
          <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Latest run</h3>
          {flow.handoffs.length === 0 && flow.path.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              No run yet.{" "}
              <Link href="/agent" className="text-foreground underline underline-offset-2">
                Start one in Agent Workspace
              </Link>{" "}
              and its path will show here.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              <li className="text-xs font-medium text-foreground">{FLOW_NODES[flow.path[0]].title}</li>
              {flow.handoffs.map((h, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon icon={ArrowRight01Icon} size={12} />
                    <span className="line-clamp-2 break-words">{h.reason}</span>
                  </span>
                  <span className="text-xs font-medium text-foreground">{FLOW_NODES[h.to].title}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <ProviderSankey />
    </div>
  )
}
