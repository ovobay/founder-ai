import fs from "node:fs";
import path from "node:path";

/**
 * Adds useful Supabase auth support routes/pages.
 *
 * Adds:
 * - app/auth/signout/route.ts
 * - app/auth/session/page.tsx
 *
 * Why:
 * - Users need a reliable way to sign out.
 * - Developers need a cleaner session status page than /auth/debug.
 *
 * This does not delete /auth/debug yet.
 * Keep /auth/debug while testing, then remove before production.
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
  "app/auth/signout/route.ts",
  `import { NextResponse } from "next/server";
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
`
);

writeFileWithBackup(
  "app/auth/session/page.tsx",
  `import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Clean session status page.
 *
 * This is safer and more user-friendly than /auth/debug.
 * Use it while testing auth state after login, refresh, and sign-out.
 */
export default async function AuthSessionPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 28%), linear-gradient(180deg, #fffaf2 0%, #ffffff 48%, #f8fafc 100%)",
        color: "#111827",
        padding: "48px 20px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          border: "1px solid #e5e7eb",
          borderRadius: "28px",
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.09)",
          padding: "30px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Auth session
        </p>

        <h1
          style={{
            margin: "0 0 12px",
            color: "#111827",
            fontSize: "38px",
            lineHeight: 1,
            letterSpacing: "-0.065em",
          }}
        >
          {isLoggedIn ? "You are signed in" : "You are signed out"}
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            color: "#4b5563",
            fontSize: "15px",
            lineHeight: 1.65,
          }}
        >
          {isLoggedIn
            ? "The server can read your Supabase session. Refresh the page to confirm it persists."
            : "No active Supabase session was found. Sign in again to create a session."}
        </p>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <SessionRow label="Status" value={isLoggedIn ? "Signed in" : "Signed out"} />
          <SessionRow label="Email" value={user?.email ?? "No user"} />
          <SessionRow label="User ID" value={user?.id ?? "No user"} />
          <SessionRow label="Error" value={error?.message ?? "None"} />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <Link
            href="/"
            style={{
              minHeight: "42px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              border: "1px solid #d7dbe3",
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              fontWeight: 850,
              padding: "0 16px",
              textDecoration: "none",
            }}
          >
            Go to app
          </Link>

          {isLoggedIn ? (
            <Link
              href="/auth/signout"
              style={{
                minHeight: "42px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: "14px",
                fontWeight: 850,
                padding: "0 16px",
                textDecoration: "none",
              }}
            >
              Sign out
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                minHeight: "42px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                border: "1px solid rgba(37, 99, 235, 0.34)",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 850,
                padding: "0 16px",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

function SessionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  // Small label/value row for displaying session data.
  return (
    <div
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "12px",
          fontWeight: 850,
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#111827",
          fontSize: "14px",
          fontWeight: 800,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
`
);

console.log("");
console.log("✅ Auth sign-out route and session page added.");
console.log("");
console.log("Next:");
console.log("1. Restart the dev server.");
console.log("2. Open /auth/session.");
console.log("3. Test /auth/signout.");