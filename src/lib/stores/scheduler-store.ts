import { create } from "zustand"
import { deriveFlow } from "@/lib/agent-flow"
import { useConsoleStore } from "@/lib/stores/console-store"
import { apiClient } from "@/backend/api/client"
import {
  STEP_MS,
  toColumn,
  type CardState,
  type RouteStep,
  type SchedulerCard,
  type SchedulerFeed,
} from "@/lib/scheduler"

interface SchedulerState {
  /** Cards staff scheduled here. Customer-app tasks and tickets come from `feed`. */
  cards: SchedulerCard[]
  /** What the backend reports: customer tickets, agent tasks, and the message queue's state. */
  feed: SchedulerFeed | null
  feedError: string | null
  /** Customer tasks staff cleared from the board (hidden here only; the data stays in the system). */
  dismissed: string[]
  refresh: () => Promise<void>
  dismiss: (id: string) => void
  /** Queue a real task for the agent, `delayMs` from now. */
  schedule: (request: string, delayMs: number) => void
  clearFinished: () => void
  /** Delete a card and the console task(s) behind it. False for a live card still running. */
  removeCard: (id: string) => boolean
  /** Start a scheduled live card now instead of waiting for its time. */
  runNow: (id: string) => void
  /** Queue the same request again as a new card. */
  rerun: (id: string) => void
  /** Send a follow-up in the card's own conversation. Returns why it could not, or null when sent. */
  continueCard: (id: string, text: string) => string | null
  /** Put the card's conversation back in Chat. False if the agent is busy with something else. */
  openInChat: (id: string) => boolean
  /** One engine step: start due cards, move cards on, sync approvals. Called on a timer. */
  tick: (now: number) => void
}

const uid = () => crypto.randomUUID()
const isFinished = (s: CardState) => s === "done" || s === "failed"

/** Move a card to the next step of its route when it is due. */
function advance(card: SchedulerCard, now: number): SchedulerCard {
  if (card.state === "scheduled" || card.route.length === 0 || now < card.nextAt) return card
  const [step, ...rest] = card.route
  const drained = rest.length === 0
  return {
    ...card,
    column: step.column,
    route: rest,
    nextAt: now + (step.dwellMs ?? STEP_MS),
    log: [...card.log, { at: now, column: step.column, text: step.reason }],
    state: drained && card.finalState ? card.finalState : card.state,
  }
}

/** Turn the real run the backend returned into the moves the card replays. */
function realRoute(): { route: RouteStep[]; finalState: CardState; taskId: string | null } {
  const c = useConsoleStore.getState()
  const flow = deriveFlow(c.run, c.status === "failed")
  const steps: RouteStep[] = flow.path.map((node, i) => ({
    column: toColumn(node),
    reason: i === 0 ? "Request received" : flow.handoffs[i - 1]?.reason ?? "",
  }))

  // The card is already at Intake/Planner while the request is in flight.
  while (steps.length > 0 && steps[0].column === "intake") steps.shift()
  const route = steps.filter((s, i) => i === 0 || s.column !== steps[i - 1].column)

  let finalState: CardState
  if (c.status === "awaiting_approval") {
    finalState = "needs_approval"
    if (route.at(-1)?.column !== "approval") route.push({ column: "approval", reason: "Waiting for staff approval" })
  } else if (c.status === "failed") {
    finalState = "failed"
    route.push({ column: "done", reason: c.error ?? "The run failed" })
  } else {
    finalState = "done"
    if (route.at(-1)?.column !== "done") route.push({ column: "done", reason: "Answer delivered" })
  }
  return { route, finalState, taskId: c.currentTaskId }
}

export const useSchedulerStore = create<SchedulerState>()((set, get) => {
  const patch = (id: string, fn: (c: SchedulerCard) => SchedulerCard) =>
    set((s) => ({ cards: s.cards.map((c) => (c.id === id ? fn(c) : c)) }))

  /**
   * Hand a card to the real agent. The card sits at Intake, then Planner, until the run returns.
   * A first run starts a fresh Chat task; a follow-up restores the card's own conversation first.
   */
  const dispatch = (card: SchedulerCard, text: string, now: number, followUp: boolean) => {
    patch(card.id, (c) => ({
      ...c,
      state: "running",
      column: "intake",
      route: [],
      finalState: undefined,
      nextAt: now + 1400,
      messages: [...(followUp ? (c.messages ?? []) : []), { id: `m-${uid()}`, role: "user", content: text }],
      log: [...c.log, { at: now, column: "intake", text: followUp ? "Follow-up sent to the agent" : "Sent to the agent" }],
    }))
    const console_ = useConsoleStore.getState()
    if (followUp) {
      console_.loadConversation({
        taskId: card.taskId ?? null,
        conversationId: card.conversationId ?? null,
        messages: card.messages ?? [],
        run: card.run ?? [],
      })
    } else {
      // Each scheduled task is its own task in Chat, so conversations never mix.
      console_.newTask()
    }
    void useConsoleStore
      .getState()
      .runAgent(text)
      .then(() => {
        const { route, finalState, taskId } = realRoute()
        const after = useConsoleStore.getState()
        patch(card.id, (c) => ({
          ...c,
          route,
          finalState,
          taskId: taskId ?? c.taskId,
          taskIds: taskId && !c.taskIds?.includes(taskId) ? [...(c.taskIds ?? []), taskId] : c.taskIds,
          conversationId: after.conversationId ?? c.conversationId,
          messages: after.messages,
          run: after.run,
          nextAt: Math.max(c.nextAt, Date.now()),
        }))
      })
  }
  const startLive = (card: SchedulerCard, now: number) => dispatch(card, card.request, now, false)

  return {
    cards: [],
    feed: null,
    feedError: null,
    dismissed: [],

    refresh: async () => {
      try {
        const { data } = await apiClient.get<SchedulerFeed>("/admin/scheduler")
        set({ feed: data, feedError: null })
      } catch {
        set({ feedError: "Could not load tickets and customer tasks from the backend." })
      }
    },

    dismiss: (id) => set((s) => ({ dismissed: [...s.dismissed, id] })),

    schedule: (request, delayMs) => {
      const now = Date.now()
      set((s) => ({
        cards: [
          ...s.cards,
          {
            id: `card-${uid()}`,
            request: request.trim(),
            source: "live",
            column: "scheduled",
            state: "scheduled",
            runAt: now + delayMs,
            route: [],
            nextAt: now + delayMs,
            log: [{ at: now, column: "scheduled", text: delayMs > 0 ? "Scheduled" : "Queued" }],
            createdAt: now,
          },
        ],
      }))
    },

    clearFinished: () => set((s) => ({ cards: s.cards.filter((c) => !isFinished(c.state)) })),

    removeCard: (id) => {
      const card = get().cards.find((c) => c.id === id)
      if (!card) return true
      if (card.source === "live" && card.state === "running") return false
      // Also drop the Chat tasks, or they would reappear on the board as "Earlier" cards.
      for (const taskId of card.taskIds ?? []) useConsoleStore.getState().deleteTask(taskId)
      set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }))
      return true
    },

    runNow: (id) => {
      const now = Date.now()
      patch(id, (c) =>
        c.source === "live" && c.state === "scheduled"
          ? { ...c, runAt: now, nextAt: now, log: [...c.log, { at: now, column: "scheduled", text: "Started early by staff" }] }
          : c
      )
    },

    rerun: (id) => {
      const card = get().cards.find((c) => c.id === id)
      if (card?.source === "live") get().schedule(card.request, 0)
    },

    continueCard: (id, text) => {
      const card = get().cards.find((c) => c.id === id)
      const message = text.trim()
      if (!card || card.source !== "live" || !card.conversationId) return "This card has no conversation to continue."
      if (card.state === "scheduled" || card.state === "running") return "The agent has not finished this task yet."
      if (card.state === "needs_approval") return "Approve or reject the pending request first."
      const status = useConsoleStore.getState().status
      if (status === "thinking" || status === "awaiting_approval" || get().cards.some((c) => c.source === "live" && c.state === "running")) {
        return "The agent is busy with another task."
      }
      if (!message) return "Write a message first."
      dispatch(card, message, Date.now(), true)
      return null
    },

    openInChat: (id) => {
      const card = get().cards.find((c) => c.id === id)
      if (!card || card.source !== "live" || !card.conversationId) return false
      const console_ = useConsoleStore.getState()
      if (console_.currentTaskId === card.taskId) return true
      return console_.loadConversation({
        taskId: card.taskId ?? null,
        conversationId: card.conversationId,
        messages: card.messages ?? [],
        run: card.run ?? [],
      })
    },

    tick: (now) => {
      const { cards } = get()
      if (cards.length === 0) return

      // 1. Move cards on (live cards replaying their real run).
      let next = cards.map((card) => {
        // A live card in flight hops from Intake to Planner while it waits for the model.
        if (card.source === "live" && card.state === "running" && card.route.length === 0 && !card.finalState) {
          return card.column === "intake" && now >= card.nextAt
            ? {
                ...card,
                column: "planner" as const,
                log: [...card.log, { at: now, column: "planner" as const, text: "Model is deciding: answer now, or call a tool" }],
              }
            : card
        }
        return advance(card, now)
      })

      // 2. A live card waiting on staff approval follows what staff decide in Chat.
      const consoleNow = useConsoleStore.getState()
      const tasks = consoleNow.recentTasks
      next = next.map((card) => {
        if (card.source !== "live" || card.state !== "needs_approval" || card.route.length > 0 || !card.taskId) return card
        const status = tasks.find((t) => t.id === card.taskId)?.status
        // The decision adds a message in Chat; keep the card's transcript in step with it.
        const transcript = consoleNow.currentTaskId === card.taskId ? { messages: consoleNow.messages, run: consoleNow.run } : {}
        if (status === "completed") {
          return { ...card, ...transcript, route: [{ column: "done" as const, reason: "Approved by staff; ticket filed" }], finalState: "done" as const, nextAt: now }
        }
        if (status === "failed") {
          return { ...card, ...transcript, route: [{ column: "done" as const, reason: "Rejected by staff; nothing was filed" }], finalState: "failed" as const, nextAt: now }
        }
        return card
      })

      set({ cards: next })

      // 3. Start the next due live card, one at a time, and never over a pending approval
      //    (starting a task resets the approval card in Chat).
      const consoleStatus = useConsoleStore.getState().status
      const liveBusy = next.some((c) => c.source === "live" && c.state === "running")
      if (liveBusy || consoleStatus === "thinking" || consoleStatus === "awaiting_approval") return
      const due = next
        .filter((c) => c.source === "live" && c.state === "scheduled" && c.runAt <= now)
        .sort((a, b) => a.runAt - b.runAt)[0]
      if (due) startLive(due, now)
    },
  }
})
