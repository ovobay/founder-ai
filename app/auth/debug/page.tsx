import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Temporary auth debug page.
 *
 * Visit:
 * /auth/debug
 *
 * Use this to confirm whether the server can see the logged-in Supabase user.
 */
export default async function AuthDebugPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const cookieNames = cookieStore
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => {
      const lowerName = name.toLowerCase();
      return lowerName.includes("supabase") || lowerName.includes("sb-");
    });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fffaf2",
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
          borderRadius: "24px",
          background: "#ffffff",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          padding: "28px",
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
          Auth debug
        </p>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "34px",
            lineHeight: 1,
            letterSpacing: "-0.06em",
          }}
        >
          Server session check
        </h1>

        <p
          style={{
            margin: "0 0 22px",
            color: "#4b5563",
            lineHeight: 1.6,
          }}
        >
          This page shows whether the server can see your Supabase session after
          email verification.
        </p>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          <DebugRow label="Logged in" value={user ? "Yes" : "No"} />
          <DebugRow label="User email" value={user?.email ?? "No user found"} />
          <DebugRow label="User id" value={user?.id ?? "No user found"} />
          <DebugRow label="Auth error" value={userError?.message ?? "None"} />
          <DebugRow
            label="Supabase cookies"
            value={
              cookieNames.length > 0
                ? cookieNames.join(", ")
                : "No Supabase cookies found"
            }
          />
        </div>

        <div
          style={{
            marginTop: "24px",
            borderRadius: "18px",
            background: user ? "#ecfdf5" : "#fff7ed",
            border: user ? "1px solid #bbf7d0" : "1px solid #fed7aa",
            color: user ? "#166534" : "#9a3412",
            padding: "14px 16px",
            fontSize: "14px",
            fontWeight: 800,
            lineHeight: 1.45,
          }}
        >
          {user
            ? "The server can see your session. If you still get redirected, the issue is in the app route guard or login screen logic."
            : "The server cannot see a session. The callback, redirect URL, cookie setup, or email template still needs fixing."}
        </div>
      </section>
    </main>
  );
}

function DebugRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  // Simple label/value row for auth diagnostics.
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
