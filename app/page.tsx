"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!idea.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, mode: "app" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Generation failed");
        return;
      }

      setResult(data.result);
    } catch (err) {
      alert("Something broke.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadProject() {
    if (!result) return alert("Generate something first");

    const res = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea, result }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "founder-ai-project.zip";
    a.click();
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold">Founder AI</h1>

      <textarea
        className="mt-6 w-full border p-4 rounded"
        placeholder="Describe the app you want to build..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={generate}
          className="bg-black text-white px-4 py-2 rounded"
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
      </div>

      {result && (
        <pre className="mt-6 whitespace-pre-wrap border p-4 rounded">
          {result}
        </pre>
      )}
    </main>
  );
}