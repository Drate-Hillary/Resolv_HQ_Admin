import { toast } from "sonner"

interface ApiErrorShape {
  code?: string
  message?: string
  response?: { status?: number; data?: { error?: string; message?: string } }
}

/**
 * Turns whatever a request threw into a message safe to show an operator:
 * the backend's own `error` text when it sent one, otherwise a plain-language
 * line for the common failure classes (offline, session expired, rate limit, 5xx).
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = (err ?? {}) as ApiErrorShape
  const status = e.response?.status

  if (!e.response && (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED" || /network|timeout/i.test(e.message ?? ""))) {
    return "Can't reach the server. Check your connection and try again."
  }
  const serverMessage = e.response?.data?.error ?? e.response?.data?.message
  if (serverMessage && status !== 500) return serverMessage
  if (status === 401) return "Your session has expired. Please sign in again."
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return "That item no longer exists."
  if (status === 429) return "Too many requests — please wait a moment and try again."
  if (status && status >= 500) return "The server hit a problem. Please try again shortly."
  return fallback
}

/** Shows an error toast with a friendly message. `id` de-duplicates repeated failures (e.g. polling). */
export function toastError(err: unknown, fallback?: string, id?: string): string {
  const message = getErrorMessage(err, fallback)
  toast.error(message, id ? { id } : undefined)
  return message
}
