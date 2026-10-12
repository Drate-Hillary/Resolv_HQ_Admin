import { Icon } from "@/components/ui/icon"
import { cn } from "cn"
import { FLOW_NODES, type DerivedFlow, type FlowNodeId } from "@/lib/agent-flow"
import { ArrowDown01Icon, RefreshIcon } from "@hugeicons/core-free-icons"

function NodeCard({ id, flow }: { id: FlowNodeId; flow: DerivedFlow }) {
  const node = FLOW_NODES[id]
  const visits = flow.visits[id] ?? 0
  const blocked = flow.blockedAt === id
  return (
    <div
      className={cn(
        "glass-panel flex-1 p-3 transition-colors",
        visits > 0 && "border-primary/60 bg-primary/[0.04]",
        blocked && "border-destructive/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-xs font-medium", visits > 0 ? "text-foreground" : "text-muted-foreground")}>{node.title}</p>
        {visits > 0 && (
          <span className="tabular rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
            {visits > 1 ? `${visits}×` : "visited"}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{node.role}</p>
      {blocked && <p className="mt-1.5 text-xs font-medium text-destructive">Run stopped here</p>}
    </div>
  )
}

function Down({ taken, label }: { taken: boolean; label: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-1 text-xs", taken ? "text-foreground" : "text-muted-foreground/60")}>
      <Icon icon={ArrowDown01Icon} size={14} />
      <span>{label}</span>
    </div>
  )
}

export function AgentFlowDiagram({ flow }: { flow: DerivedFlow }) {
  const e = (from: FlowNodeId, to: FlowNodeId) => (flow.edges[`${from}>${to}`] ?? 0) > 0
  return (
    <div className="flex flex-col">
      <NodeCard id="intake" flow={flow} />
      <Down taken={e("intake", "planner")} label="Enough context → plan" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <NodeCard id="planner" flow={flow} />
        <div
          className={cn(
            "flex flex-row items-center justify-center gap-1 text-xs sm:flex-col",
            e("planner", "tools") || e("tools", "planner") ? "text-foreground" : "text-muted-foreground/60"
          )}
        >
          <Icon icon={RefreshIcon} size={14} />
          <span className="whitespace-nowrap">tool call ⇄ result</span>
        </div>
        <NodeCard id="tools" flow={flow} />
      </div>

      <Down taken={e("planner", "guard")} label="Draft answer → check" />
      <NodeCard id="guard" flow={flow} />
      <Down taken={e("guard", "approval") || e("guard", "response")} label="Clean answer → respond · escalation drafted → human" />

      <div className="flex flex-col gap-2 sm:flex-row">
        <NodeCard id="approval" flow={flow} />
        <NodeCard id="response" flow={flow} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        If intake finds the request too vague, it skips straight to Response with a clarifying question.
      </p>
    </div>
  )
}
