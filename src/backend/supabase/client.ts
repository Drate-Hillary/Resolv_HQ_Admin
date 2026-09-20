import { createBrowserClient } from '@supabase/ssr'

/**
 * Auth-only now: all data access goes through the resolv-hq-backend API
 * (see src/backend/api/client.ts). This client is for .auth.* calls and
 * reading the session's access token in Client Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
