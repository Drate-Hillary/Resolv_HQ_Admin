import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import {
  COL_GAP,
  NODE_H,
  NODE_W,
  PAD,
  ROW_GAP,
  edges,
  kindLabel,
  nodeById,
  nodes,
  walkthrough,
  type ArchEdge,
  type ArchKind,
  type ArchNode,
} from "@/lib/architecture"
import { cn } from "cn"
import { Cancel01Icon, PlayIcon, StopIcon } from "@hugeicons/core-free-icons"

const accent: Record<ArchKind, string> = {
  client: "border-l-foreground",
  service: "border-l-primary",
  ai: "border-l-signal",
  data: "border-l-approve",
  human: "border-l-priority-high",
}

const STEP_MS = 800

const pos = (n: ArchNode) => ({ x: PAD + n.col * COL_GAP, y: PAD + n.row * ROW_GAP })

/** n8n-style connector: leaves the right edge of a node and enters the left of the next. */
function edgeGeometry(a: ArchNode, b: ArchNode) {
  const pa = pos(a)
  const pb = pos(b)
  if (a.col === b.col) {
    const down = pb.y > pa.y
    const x1 = pa.x + NODE_W / 2
    const y1 = pa.y + (down ? NODE_H : 0)
    const y2 = pb.y + (down ? 0 : NODE_H)
    const dy = Math.max(30, Math.abs(y2 - y1) / 2)
    const sign = down ? 1 : -1
    return { d: `M ${x1} ${y1} C ${x1} ${y1 + sign * dy}, ${x1} ${y2 - sign * dy}, ${x1} ${y2}`, mx: x1, my: (y1 + y2) / 2 }
  }
  const forward = pb.x > pa.x
  const x1 = pa.x + (forward ? NODE_W : 0)
  const x2 = pb.x + (forward ? 0 : NODE_W)
  const y1 = pa.y + NODE_H / 2
  const y2 = pb.y + NODE_H / 2
  const dx = Math.max(60, Math.abs(x2 - x1) / 2) * (forward ? 1 : -1)
  return { d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 }
}

function Connector({ edge, lit, dim, index, still }: { edge: ArchEdge; lit: boolean; dim: boolean; index: number; still: boolean }) {
  const a = nodeById.get(edge.from)!
  const b = nodeById.get(edge.to)!
  const { d, mx, my } = edgeGeometry(a, b)
  return (
    <g className={cn("transition-opacity duration-200", dim && "opacity-20")}>
      <motion.path
        d={d}
        fill="none"
        strokeWidth={lit ? 2.5 : 1.5}
        className={lit ? "stroke-primary" : "stroke-border"}
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.3 + index * 0.04 }}
      />
      {lit && !still && (
        <motion.path
          d={d}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="2 14"
          className="stroke-primary"
          animate={{ strokeDashoffset: [0, -32] }}
          transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
        />
      )}
      {edge.label && (
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
          stroke="var(--background)"
          strokeWidth={4}
          paintOrder="stroke"
        >
          {edge.label}
        </text>
      )}
    </g>
  )
}

export default function ArchitecturePage() {
  const still = useReducedMotion() ?? false
  const [selected, setSelected] = useState<string | null>(null)
  // null = not playing; otherwise the index into `walkthrough` reached so far.
  const [step, setStep] = useState<number | null>(null)

  useEffect(() => {
    if (step === null) return
    if (step >= walkthrough.length - 1) {
      const done = window.setTimeout(() => setStep(null), STEP_MS * 2)
      return () => window.clearTimeout(done)
    }
    const next = window.setTimeout(() => setStep(step + 1), STEP_MS)
    return () => window.clearTimeout(next)
  }, [step])

  const reached = useMemo(() => new Set(step === null ? [] : walkthrough.slice(0, step + 1)), [step])
  const current = step === null ? null : walkthrough[step]
  const focus = current ?? selected
  const related = useMemo(() => {
    if (!focus) return null
    const ids = new Set<string>([focus])
    for (const e of edges) {
      if (e.from === focus) ids.add(e.to)
      if (e.to === focus) ids.add(e.from)
    }
    return ids
  }, [focus])

  const width = PAD * 2 + 5 * COL_GAP + NODE_W
  const height = PAD * 2 + 4 * ROW_GAP + NODE_H
  const detail = selected ? nodeById.get(selected) : null

  // Walkthrough: light every connection between nodes the message has reached.
  const edgeLit = (e: ArchEdge) =>
    step !== null ? reached.has(e.from) && reached.has(e.to) : focus !== null && (e.from === focus || e.to === focus)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">System architecture</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            How a message moves through Resolv-HQ, drawn as a workflow. Select a node to open its details, or trace one message from the customer to the console.
          </p>
        </div>
        {step === null ? (
          <Button onClick={() => { setSelected(null); setStep(0) }}>
            <Icon icon={PlayIcon} size={16} /> Trace a message
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setStep(null)}>
            <Icon icon={StopIcon} size={16} /> Stop
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(kindLabel) as ArchKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("h-3.5 w-1 rounded-full border-l-4", accent[k])} />
            {kindLabel[k]}
          </span>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-muted/30 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="relative" style={{ width, height }}>
          <svg className="absolute inset-0" width={width} height={height} aria-hidden>
            {edges.map((e, i) => (
              <Connector
                key={`${e.from}-${e.to}`}
                edge={e}
                index={i}
                still={still}
                lit={edgeLit(e)}
                dim={focus !== null && !(e.from === focus || e.to === focus) && !(step !== null && reached.has(e.from) && reached.has(e.to))}
              />
            ))}
          </svg>

          {nodes.map((n, i) => {
            const { x, y } = pos(n)
            const active = current === n.id
            const dim = related !== null && !related.has(n.id) && !reached.has(n.id)
            return (
              <motion.button
                key={n.id}
                type="button"
                onClick={() => { setStep(null); setSelected(selected === n.id ? null : n.id) }}
                initial={still ? false : { opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: dim ? 0.35 : 1, scale: active ? 1.05 : 1, y: 0 }}
                whileHover={still ? undefined : { scale: 1.04 }}
                transition={{ type: "spring", stiffness: 420, damping: 30, delay: still ? 0 : i * 0.04 }}
                style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
                className={cn(
                  "absolute flex items-center gap-3 rounded-xl border border-l-4 border-border bg-card px-3 text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  accent[n.kind],
                  (selected === n.id || active) && "border-primary shadow-md ring-2 ring-primary/20"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon icon={n.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.subtitle}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {step !== null && current && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm">
          <span className="font-medium">
            Step {step + 1} of {walkthrough.length}: {nodeById.get(current)!.title}.
          </span>{" "}
          {nodeById.get(current)!.description}
        </p>
      )}

      <Dialog open={detail != null} onOpenChange={(open) => !open && setSelected(null)}>
        {detail && (
          <DialogContent className="flex w-[min(34rem,calc(100vw-2rem))] flex-col gap-4 p-6">
            <header className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon icon={detail.icon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base">{detail.title}</DialogTitle>
                <DialogDescription className="mt-0.5 flex items-center gap-2">
                  {detail.subtitle}
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{kindLabel[detail.kind]}</span>
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)} aria-label="Close details">
                <Icon icon={Cancel01Icon} size={14} />
              </Button>
            </header>
            <p className="text-sm">{detail.description}</p>
            <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-2 text-xs">
              <dt className="font-medium">Receives from</dt>
              <dd className="text-muted-foreground">
                {edges.filter((e) => e.to === detail.id).map((e) => nodeById.get(e.from)!.title).join(", ") || "none"}
              </dd>
              <dt className="font-medium">Sends to</dt>
              <dd className="text-muted-foreground">
                {edges.filter((e) => e.from === detail.id).map((e) => nodeById.get(e.to)!.title).join(", ") || "none"}
              </dd>
              <dt className="font-medium">Code</dt>
              <dd className="text-muted-foreground">
                <code>{detail.source}</code>
              </dd>
            </dl>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
