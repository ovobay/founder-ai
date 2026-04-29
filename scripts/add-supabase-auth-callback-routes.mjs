import fs from "node:fs";
import path from "node:path";

/**
 * Adds robust Supabase auth callback routes for a Next.js App Router project.
 *
 * Fixes common issue:
 * - User verifies email.
 * - Supabase redirects back to the app.
 * - App does not exchange auth code/token into a session.
 * - User gets sent back to "enter your email" login screen.
 *
 * Adds:
 * - lib/supabase/client.ts
 * - lib/supabase/server.ts
 * - app/auth/callback/route.ts
 * - app/auth/confirm/route.ts
 *
 * Also creates backups if files already exist.
 */

const root = process.cwd();

function writeFileWithBackup(relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  const directory = path.dirname(absolutePath);

  fs.mkdirSync(directory, { recursive: true });

  if (fs.existsSync(absolutePath)) {
    const backupPath = `${absolutePath}.backup-${Date.now()}`;
    fs.copyFileSync(absolutePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
  }

  fs.writeFileSync(absolutePath, contents);
  console.log(`Wrote: ${relativePath}`);
}

writeFileWithBackup(
  "lib/supabase/client.ts",
  `import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client.
 *
 * Use this in Client Components only.
 * It reads/writes the browser auth cookies needed for logged-in state.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
`
);

writeFileWithBackup(
  "lib/supabase/server.ts",
  `import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a server-side Supabase client.
 *
 * Use this in Server Components, Route Handlers, and Server Actions.
 * It connects Supabase auth to Next.js cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet) {
        /**
         * Route Handlers can set cookies.
         * Server Components cannot, so this is wrapped safely.
         */
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore cookie writes from contexts where Next.js does not allow mutation.
        }
      },
    },
  });
}
`
);

writeFileWithBackup(
  "app/auth/callback/route.ts",
  `import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase auth redirects that include a ?code=...
 *
 * This route is required for magic links, email verification redirects,
 * OAuth redirects, and any PKCE-style Supabase auth flow.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  /**
   * Always redirect to the same origin that handled the callback.
   * This avoids localhost/production domain mismatch chaos.
   */
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "missing_auth_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(redirectUrl);
}
`
);

writeFileWithBackup(
  "app/auth/confirm/route.ts",
  `import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase email confirmation links that include:
 * - token_hash
 * - type
 *
 * Some Supabase templates use this route style instead of ?code=...
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/";

  const redirectUrl = new URL(next, requestUrl.origin);

  if (!tokenHash || !type) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "missing_confirmation_token");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
  });

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(redirectUrl);
}
`
);

console.log("");
console.log("✅ Supabase auth callback routes added.");
console.log("");
console.log("Next steps:");
console.log("1. Confirm Supabase redirect URLs include /auth/callback and /auth/confirm.");
console.log("2. Restart the dev server.");
console.log("3. Test email verification again.");
`
);