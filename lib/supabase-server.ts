/**
 * Server-side Supabase client — for use inside Server Actions only.
 *
 * Ye client `cookies()` se session read karta hai — client se koi bhi
 * identity value trust nahi karta. Yahi single source of truth hai.
 *
 * Usage:
 *   import { getServerSession } from "../lib/supabase-server";
 *   const { user, error } = await getServerSession();
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseServerConfigured = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "placeholder-url.supabase.co" &&
  SUPABASE_ANON_KEY !== "placeholder-anon-key"
);

/**
 * Create a server-side Supabase client that reads cookies from the
 * incoming request. Safe to call inside Server Actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        // Server Actions can set cookies through the response
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll may be called from a Server Component where cookies are read-only.
          // This is safe to ignore — the middleware will refresh the session.
        }
      },
    },
  });
}

/**
 * Get the authenticated user from the server-side session.
 *
 * Returns:
 *   { user, email, error } — user is null if not authenticated.
 *
 * SECURITY NOTE:
 * - Uses `getUser()` (not `getSession()`) — getUser() re-validates with
 *   Supabase Auth server every time, preventing stale/forged tokens.
 * - Client-provided email is IGNORED. Only server cookie session is trusted.
 */
export async function getServerSession(): Promise<
  | { user: { id: string; email: string }; email: string; error: null }
  | { user: null; email: null; error: string }
> {
  if (!isSupabaseServerConfigured) {
    // Supabase not configured — dev/test mode fallback
    // In this state, Server Actions must use a safe fallback or be blocked
    return { user: null, email: null, error: "SUPABASE_NOT_CONFIGURED" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return { user: null, email: null, error: "UNAUTHENTICATED" };
    }

    const email = data.user.email;
    if (!email) {
      return { user: null, email: null, error: "NO_EMAIL_IN_SESSION" };
    }

    return {
      user: { id: data.user.id, email },
      email,
      error: null,
    };
  } catch (err) {
    console.error("[getServerSession] Unexpected error:", err);
    return { user: null, email: null, error: "SESSION_ERROR" };
  }
}

/**
 * Require authentication — throws a typed error if not logged in.
 * Use this at the top of every protected Server Action.
 *
 * Returns the authenticated user's email (server-verified).
 */
export async function requireAuth(): Promise<{ email: string; userId: string }> {
  const session = await getServerSession();

  if (session.error !== null) {
    // Log security failure
    console.warn(`[requireAuth] Unauthorized Server Action access — reason: ${session.error}`);
    throw new Error("UNAUTHORIZED");
  }

  return { email: session.email!, userId: session.user!.id };
}
