"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("free");
  const [remaining, setRemaining] = useState<number | string>(5);

  async function getSession() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async function getAuthHeaders() {
    const session = await getSession();
    if (!session?.access_token) return null;

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  useEffect(() => {
    loadUsage();
  }, []);

  async function loadUsage() {
    const headers = await getAuthHeaders();
    if (!headers) return;

    const res = await fetch("/api/usage", { headers });
    const data = await res.json();

    setPlan(data.plan);
    setRemaining(data.remaining);
  }

  async function generate() {
    if (!idea.trim()) return;

    const headers = await getAuthHeaders();
    if (!headers) return alert("Login required");

    setLoading(true);
    setResult("");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ idea, mode: "app" }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.upgrade) {
        alert("Free limit reached. Upgrade.");
        return;
      }
      return alert(data.error);
    }

    setResult(data.result);
    await loadUsage();
    setLoading(false);
  }

  async function downloadProject() {
    if (!result) return alert("Generate first");

    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, result }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "founder-ai-project.zip";
    a.click();
  }

  async function upgrade() {
    const headers = await getAuthHeaders();
    if (!headers) return;

    const res = await fetch("/api/stripe", {
      method: "POST",
      headers,
    });

    const data = await res.json();
    window.location.href = data.url;
  }

  const remainingNum =
    typeof remaining === "number" ? remaining : null;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Founder AI</h1>

      <p className="mt-2 text-sm">
        Plan: {plan} | Remaining: {remaining}
      </p>

      {/* 🔥 Upgrade pressure */}
      {plan === "free" && remainingNum === 2 && (
        <p className="text-orange-600 mt-2">2 generations left</p>
      )}

      {plan === "free" && remainingNum === 1 && (
        <p className="text-red-600 mt-2">Last one</p>
      )}

      {plan === "free" && remainingNum === 0 && (
        <p className="text-red-700 mt-2">
          Out of generations. Upgrade now.
        </p>
      )}

      <textarea
        className="mt-6 w-full border p-4 rounded"
        placeholder="Describe what you want to build..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={generate}
          disabled={plan === "free" && remainingNum === 0}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {result && (
          <button
            onClick={downloadProject}
            className="border px-4 py-2 rounded"
          >
            Download Project
          </button>
        )}

        {plan === "free" && (
          <button
            onClick={upgrade}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Upgrade
          </button>
        )}
      </div>

      {result && (
        <pre className="mt-6 whitespace-pre-wrap border p-4 rounded">
          {result}
        </pre>
      )}
    </main>
  );
}