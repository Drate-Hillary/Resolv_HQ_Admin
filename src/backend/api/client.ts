import axios from "axios"
import { createClient as createBrowserSupabaseClient } from "@/backend/supabase/client"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"

/**
 * Browser-side Axios instance for the resolv-hq-backend service. Every
 * request picks up the caller's Supabase access token (when a session
 * exists) and attaches it as a bearer token — the backend verifies it and
 * resolves the caller's role itself (see its src/lib/auth.ts).
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use(async (config) => {
  const supabase = createBrowserSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

apiClient.interceptors.response.use(undefined, (error) => {
  if (!error?.response) {
    console.error(
      `Could not reach resolv-hq-backend at ${API_BASE_URL}. Is it running? (\`npm run dev\` in resolv-hq-backend, with a real .env — see .env.example)`
    )
  }
  return Promise.reject(error)
})
