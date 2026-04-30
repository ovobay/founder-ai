import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes Supabase auth cookies on every request.
 *
 * Important:
 * - This middleware does not enforce route protection.
 * - It does not redirect users to login.
 * - It only keeps the auth session readable by Server Components,
 *   Route Handlers, and protected pages.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * If env vars are missing, continue instead of crashing middleware.
   * The actual Supabase client helpers will throw clearer errors later.
   */
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        /**
         * Supabase may refresh auth cookies here.
         * We apply them to both the request and response so the current request
         * and the browser both see the latest session state.
         */
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  /**
   * Calling getUser() refreshes the session when needed.
   * Do not remove this unless you enjoy auth loops. Nobody enjoys auth loops.
   */
  await supabase.auth.getUser();

  return response;
}

/**
 * Run middleware everywhere except static assets and images.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
