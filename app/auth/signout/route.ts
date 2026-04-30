import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Signs the current user out of Supabase.
 *
 * This route clears the Supabase session cookies and returns the user to login.
 * Use it from links/buttons like:
 *
 * <a href="/auth/signout">Sign out</a>
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/login";

  const supabase = await createClient();

  /**
   * signOut clears the auth session.
   * If Supabase returns an error, we still redirect to login because the user
   * intentionally requested logout and should not be trapped in auth purgatory.
   */
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
