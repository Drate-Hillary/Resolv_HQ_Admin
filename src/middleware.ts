import { type NextRequest } from "next/server";
import { updateSession } from "@/backend/supabase/session";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every route except:
     * - static assets (_next/static, _next/image, favicon.ico, images)
     * - /chat, which is the public customer-facing demo surface, not
     *   part of the staff console
     */
    "/((?!_next/static|_next/image|favicon.ico|chat|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
