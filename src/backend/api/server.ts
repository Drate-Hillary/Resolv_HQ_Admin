import { createClient as createServerSupabaseClient } from "@/backend/supabase/server"

// Server-only override for containerized deployments: the Next.js server
// runs inside the same Docker network as the backend, so it should address
// it by Docker Compose service name (e.g. http://backend:4000), while the
// browser (on the host, or elsewhere entirely) needs the publicly-reachable
// NEXT_PUBLIC_API_BASE_URL instead. Plain (non-NEXT_PUBLIC_) env vars are
// never inlined into the client bundle, so this is safe to read here and
// simply doesn't exist in the browser. Outside Docker both resolve to the
// same local URL, so nothing changes for plain `npm run dev`.
const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

/**
 * Server-side fetch helper for Server Components / route handlers. Reads
 * the session from the server Supabase client (cookie-based) and calls the
 * backend directly with `fetch`. Throws on a non-2xx response.
 *
 * Kept in its own module (separate from "@/backend/api/client") because it
 * imports the server Supabase client, which depends on "next/headers" and
 * must never end up in a Client Component bundle.
 */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    })
  } catch (cause) {
    throw new Error(
      `Could not reach resolv-hq-backend at ${API_BASE_URL} (request to ${path}). ` +
        `Is it running? (\`npm run dev\` in resolv-hq-backend, with a real .env — see .env.example)`,
      { cause }
    )
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API request to ${path} failed: ${res.status} ${text}`)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
