import { useEffect } from "react"
import { onRealtimeEvent, retainRealtime } from "@/lib/realtime"
import { useSchedulerStore } from "@/lib/stores/scheduler-store"

/** Safety net for a dropped push connection; pushes normally refresh the feed within a second. */
const FEED_POLL_MS = 30_000

/**
 * Runs the scheduler. Mounted once in the console layout so scheduled tasks still fire, and customer
 * tickets and tasks still arrive, while you are on another page. Staff-scheduled cards are persisted in
 * the browser; the customer feed is read from the backend.
 */
export function useSchedulerEngine() {
  useEffect(() => {
    const store = useSchedulerStore.getState
    const tick = window.setInterval(() => store().tick(Date.now()), 500)
    const poll = window.setInterval(() => void store().refresh(), FEED_POLL_MS)
    void store().refresh()

    // Events come through the message queue (RabbitMQ) and land here as a push.
    const release = retainRealtime()
    let pending: number | undefined
    const stop = onRealtimeEvent((event) => {
      if (event.type !== "scheduler") return
      window.clearTimeout(pending)
      pending = window.setTimeout(() => void store().refresh(), 300)
    })

    return () => {
      window.clearInterval(tick)
      window.clearInterval(poll)
      window.clearTimeout(pending)
      stop()
      release()
    }
  }, [])
}
