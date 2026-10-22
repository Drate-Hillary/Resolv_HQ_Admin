import { createClient as createBrowserSupabaseClient } from "@/backend/supabase/client"
import type { AppNotification } from "@/lib/stores/notifications-store"
import type { TicketAttachment, TicketMessage } from "@/types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"

export type RealtimeEvent =
  | { type: "notification"; notification: AppNotification }
  | { type: "message"; requestId: string; message: TicketMessage }
  | { type: "attachment"; requestId: string; messageId: string | null; attachment: TicketAttachment }
  | { type: "scheduler"; topic: string; event: unknown }
  | { type: "usage"; conversationId: string; inputTokens: number; outputTokens: number }
  | { type: "typing"; requestId: string; userId: string; senderType: "customer" | "admin" | "agent"; typing: boolean }

type Listener = (event: RealtimeEvent) => void

const listeners = new Set<Listener>()
const RECONNECT_MIN_MS = 1_000
const RECONNECT_MAX_MS = 15_000

let holders = 0
let abort: AbortController | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let attempts = 0
/** Sockets that closed before the server said "ready"; after a few, fall back to SSE. */
let socketFailures = 0
const MAX_SOCKET_FAILURES = 3
const CLOSE_UNAUTHORIZED = 4401
const PING_MS = 25_000

/** Subscribe to every pushed event. Returns an unsubscribe function. */
export function onRealtimeEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Keeps one server-push connection open while anything on screen needs it.
 * Several components can call this; the stream stays up until the last one
 * releases it. It uses fetch (not EventSource) because the backend needs the
 * Authorization header, which EventSource cannot send.
 */
export function retainRealtime(): () => void {
  holders += 1
  if (holders === 1) void connect()
  return () => {
    holders -= 1
    if (holders === 0) disconnect()
  }
}

function disconnect() {
  closeSocket()
  socketFailures = 0
  abort?.abort()
  abort = null
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  attempts = 0
}

function scheduleReconnect() {
  if (holders === 0) return
  const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_MIN_MS * 2 ** attempts)
  attempts += 1
  reconnectTimer = setTimeout(() => void connect(), delay)
}

let socket: WebSocket | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null

function closeSocket() {
  if (pingTimer) clearInterval(pingTimer)
  pingTimer = null
  const s = socket
  socket = null
  if (s && s.readyState <= WebSocket.OPEN) s.close()
}

/** Primary transport: one WebSocket to the backend's /ws, authenticated by its first message. */
async function connectSocket() {
  const {
    data: { session },
  } = await createBrowserSupabaseClient().auth.getSession()
  if (holders === 0) return
  if (!session?.access_token) throw new Error("not signed in")

  const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, "ws")}/ws`)
  socket = ws
  let ready = false
  ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token: session.access_token }))
  ws.onmessage = (e) => {
    if (typeof e.data !== "string") return
    if (!ready) {
      ready = true
      attempts = 0
      socketFailures = 0
      pingTimer = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "ping" })), PING_MS)
    }
    if (e.data === '{"type":"ready"}' || e.data === '{"type":"pong"}') return
    dispatch(`data: ${e.data}`)
  }
  ws.onclose = (e) => {
    if (socket !== ws) return // closed on purpose
    closeSocket()
    if (!ready && e.code !== CLOSE_UNAUTHORIZED) socketFailures += 1
    scheduleReconnect()
  }
  ws.onerror = () => ws.close()
}

async function connect() {
  if (socketFailures < MAX_SOCKET_FAILURES) {
    try {
      await connectSocket()
    } catch {
      scheduleReconnect()
    }
    return
  }
  const controller = new AbortController()
  abort = controller
  try {
    // A fresh token each attempt, so a long-lived tab survives token expiry.
    const {
      data: { session },
    } = await createBrowserSupabaseClient().auth.getSession()
    if (!session?.access_token) throw new Error("not signed in")

    const response = await fetch(`${API_BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${session.access_token}`, Accept: "text/event-stream" },
      signal: controller.signal,
    })
    if (!response.ok || !response.body) throw new Error(`events stream returned ${response.status}`)
    attempts = 0

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ""
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += value
      let boundary: number
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        dispatch(frame)
      }
    }
  } catch {
    // Aborted on purpose, or the network dropped: either way, fall through to reconnect.
  }
  if (!controller.signal.aborted) scheduleReconnect()
}

function dispatch(frame: string) {
  const data = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("")
  if (!data || data === "{}") return
  try {
    const event = JSON.parse(data) as RealtimeEvent
    listeners.forEach((listener) => listener(event))
  } catch {
    // A malformed frame is skipped; the next one is unaffected.
  }
}
