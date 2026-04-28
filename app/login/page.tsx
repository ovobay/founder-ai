"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FormEvent, useEffect, useMemo, useState } from "react";

type LoginStatus = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function redirectIfAlreadyLoggedIn() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (user) {
        window.location.assign("/");
      }
    }

    redirectIfAlreadyLoggedIn();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const currentUrl = new URL(window.location.href);
    const next = currentUrl.searchParams.get("next") ?? "/";
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the login link.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111827",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "440px",
          border: "1px solid #e5e7eb",
          borderRadius: "28px",
          background: "#ffffff",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.08)",
          padding: "28px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #ff4f9a 0%, #7c3cff 100%)",
            marginBottom: "22px",
          }}
          aria-hidden="true"
        />

        <h1
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "34px",
            lineHeight: 1,
            letterSpacing: "-0.05em",
            fontWeight: 900,
          }}
        >
          Login to Founder AI
        </h1>

        <p
          style={{
            margin: "14px 0 24px",
            color: "#4b5563",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          Enter your email and we’ll send you a magic login link.
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <label
            htmlFor="email"
            style={{
              color: "#111827",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "sending"}
            style={{
              width: "100%",
              height: "44px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              padding: "0 13px",
              color: "#111827",
              background: "#ffffff",
              fontSize: "15px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              height: "44px",
              border: "0",
              borderRadius: "12px",
              background: "#111111",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 850,
              cursor: status === "sending" ? "not-allowed" : "pointer",
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? "Sending..." : "Send login link"}
          </button>
        </form>

        {message ? (
          <div
            style={{
              marginTop: "16px",
              border:
                status === "error"
                  ? "1px solid #fecaca"
                  : "1px solid #bbf7d0",
              borderRadius: "14px",
              background: status === "error" ? "#fef2f2" : "#f0fdf4",
              color: status === "error" ? "#991b1b" : "#166534",
              padding: "12px 13px",
              fontSize: "13px",
              lineHeight: 1.5,
              fontWeight: 650,
            }}
          >
            {message}
          </div>
        ) : null}

        <p
          style={{
            margin: "18px 0 0",
            color: "#6b7280",
            fontSize: "12px",
            lineHeight: 1.55,
          }}
        >
          This uses Supabase Auth magic links and cookie-backed sessions. Real
          app behavior, not localStorage theatre.
        </p>
      </section>
    </main>
  );
}