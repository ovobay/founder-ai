"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const modes = [
  { label: "Full SaaS Plan", value: "full" },
  { label: "Pricing", value: "pricing" },
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Marketing", value: "marketing" },
  { label: "Sales", value: "sales" },
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState("full");
  const [result, setResult] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [remaining, setRemaining] = useState<number | string>(5);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");

  useEffect(() => {
    loadUserAndProjects();
  }, []);

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

  async function loadUserAndProjects() {
    const session = await getSession();

    if (!session?.user) {
      setUserEmail("");
      setProjects([]);
      setPlan("free");
      setRemaining(5);
      setSubscriptionStatus("inactive");
      return;
    }

    setUserEmail(session.user.email || "");
    await loadProjects();
    await loadUsage();
  }

  async function loadUsage() {
    const headers = await getAuthHeaders();
    if (!headers) return;

    const res = await fetch("/api/usage", { headers });
    const data = await res.json();

    setPlan(data.plan);
    setRemaining(data.remaining);
    setSubscriptionStatus(data.subscription_status);
  }

  async function loadProjects() {
    const headers = await getAuthHeaders();
    if (!headers) return;

    const res = await fetch("/api/projects", { headers });
    const data = await res.json();
    setProjects(data.projects || []);
  }

  async function generate() {
    if (!idea.trim() || loading) return;

    const headers = await getAuthHeaders();
    if (!headers) return alert("Login required");

    setLoading(true);
    setResult("");
    setSections([]);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ idea, mode }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.upgrade) {
        alert("You've hit the free limit. Upgrade to continue.");
        return;
      }
      return alert(data.error);
    }

    setResult(data.result);
    await loadUsage();
    setLoading(false);
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

  async function openBillingPortal() {
    const headers = await getAuthHeaders();
    if (!headers) return;

    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers,
    });

    const data = await res.json();
    window.location.href = data.url;
  }

  const isPro = plan === "pro";
  const isCancelling = subscriptionStatus === "cancelling";

  const remainingNum =
    typeof remaining === "number" ? remaining : null;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">Founder AI</h1>

      <div className="mt-4 text-sm">
        <p>Logged in as {userEmail}</p>
        <p>Plan: {plan}</p>
        <p>Status: {subscriptionStatus}</p>
        <p>Remaining: {remaining}</p>

        {/* 🔥 SMART UPGRADE PRESSURE */}
        {plan === "free" && remainingNum === 3 && (
          <p className="text-yellow-600">You’re getting close 👀</p>
        )}

        {plan === "free" && remainingNum === 2 && (
          <p className="text-orange-600">Only 2 generations left</p>
        )}

        {plan === "free" && remainingNum === 1 && (
          <p className="text-red-600">Last one. Choose wisely.</p>
        )}

        {plan === "free" && remainingNum === 0 && (
          <p className="text-red-700 font-bold">
            You’re out. Upgrade to continue.
          </p>
        )}

        {/* 🔁 RESUME BUTTON */}
        {isCancelling && (
          <div className="mt-2 flex gap-2">
            <p className="text-orange-600">
              Cancelling... still active until billing ends.
            </p>
            <button onClick={openBillingPortal} className="border px-2">
              Resume
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {!isPro && (
          <button onClick={upgrade} className="bg-green-600 text-white px-3 py-2">
            Upgrade
          </button>
        )}

        {isPro && (
          <button onClick={openBillingPortal} className="border px-3 py-2">
            Manage Subscription
          </button>
        )}
      </div>

      <textarea
        className="mt-6 w-full border p-3"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Your SaaS idea..."
      />

      <button
        onClick={generate}
        disabled={plan === "free" && remainingNum === 0}
        className="mt-3 bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Generate"}
      </button>

      {result && (
        <pre className="mt-6 whitespace-pre-wrap border p-4">
          {result}
        </pre>
      )}
    </main>
  );
}