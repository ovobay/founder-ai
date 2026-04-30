import fs from "node:fs";
import path from "node:path";

/**
 * Fixes Supabase server helper export mismatch.
 *
 * Problem:
 * app/auth/session/page.tsx imports:
 *   import { createClient } from "@/lib/supabase/server";
 *
 * But the existing project exports:
 *   createSupabaseServerClient
 *
 * Fix:
 * Add a compatibility alias:
 *   export const createClient = createSupabaseServerClient;
 *
 * If no usable server helper exists, write a safe @supabase/ssr version that exports both.
 */

const root = process.cwd();
const serverPath = path.join(root, "lib/supabase/server.ts");

if (!fs.existsSync(serverPath)) {
  throw new Error("Could not find lib/supabase/server.ts");
}

const backupPath = `${serverPath}.backup-before-create-client-export-${Date.now()}`;
fs.copyFileSync(serverPath, backupPath);

let source = fs.readFileSync(serverPath, "utf8");

if (source.includes("export function createClient") || source.includes("export async function createClient") || source.includes("export const createClient")) {
  console.log("createClient export already exists. Nothing to change.");
  console.log(`Backup created: ${backupPath}`);
  process.exit(0);
}

if (source.includes("createSupabaseServerClient")) {
  source = `${source.trim()}

/**
 * Compatibility alias used by auth route/page files.
 * Existing code can keep using createSupabaseServerClient.
 * New auth pages can import createClient.
 */
export const createClient = createSupabaseServerClient;
`;

  fs.writeFileSync(serverPath, source);

  console.log("");
  console.log("✅ Added createClient compatibility export to lib/supabase/server.ts");
  console.log(`Backup created: ${backupPath}`);
  process.exit(0);
}

/**
 * Fallback: if the server helper exists but has an unexpected shape,
 * replace it with a known-good implementation.
 */
const replacement = `import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a server-side Supabase client.
 *
 * Use this in Server Components, Route Handlers, and Server Actions.
 */
export async function createSupabaseServerClient() {
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
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /**
           * Server Components cannot mutate cookies.
           * Route Handlers can. This keeps the helper safe in both contexts.
           */
        }
      },
    },
  });
}

/**
 * Compatibility alias.
 */
export const createClient = createSupabaseServerClient;
`;

fs.writeFileSync(serverPath, replacement);

console.log("");
console.log("✅ Replaced lib/supabase/server.ts with compatible server helper.");
console.log(`Backup created: ${backupPath}`);