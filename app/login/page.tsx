"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  // Stores the email typed by the user
  const [email, setEmail] = useState("");

  // Shows loading state while sending login email
  const [loading, setLoading] = useState(false);

  // Shows success or error message
  const [message, setMessage] = useState("");

  async function login() {
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    // Sends magic login link to the user's email
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">Login to Founder AI</h1>

        <p className="mt-3 text-gray-600">
          Enter your email and we’ll send you a magic login link.
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          className="mt-8 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={login}
          className="mt-4 w-full rounded-xl bg-black px-5 py-3 font-medium text-white"
        >
          {loading ? "Sending..." : "Send login link"}
        </button>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>
    </main>
  );
}