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

  useEffect(() => {
    loadUserAndProjects();
  }, []);

  async function getUser() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  }

  async function loadUserAndProjects() {
    const user = await getUser();

    if (!user) {
      setUserEmail("");
      setProjects([]);
      setPlan("free");
      setRemaining(5);
      return;
    }

    setUserEmail(user.email || "");

    await loadProjects(user.id);
    await loadUsage(user.id);
  }

  async function loadUsage(userId: string) {
    try {
      const res = await fetch(`/api/usage?user_id=${userId}`);
      const data = await res.json();

      setPlan(data.plan || "free");
      setRemaining(data.remaining ?? 5);
    } catch (error) {
      console.error("Failed to load usage:", error);
    }
  }

  function splitSections(text: string) {
    return text.split(/\n(?=# )/g).map((section) => {
      const lines = section.split("\n");

      return {
        title: lines[0] || "Untitled Section",
        content: lines.slice(1).join("\n"),
      };
    });
  }

  function joinSections(updatedSections: any[]) {
    return updatedSections.map((s) => `${s.title}\n${s.content}`).join("\n\n");
  }

  async function generate() {
    const user = await getUser();

    if (!user) {
      alert("Login required.");
      return;
    }

    if (!idea.trim() || loading) return;

    setLoading(true);
    setResult("");
    setSections([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          mode,
          user_id: user.id,
        }),
      });

      const text = await res.text();

      if (!text) {
        alert("Generate failed: API returned an empty response.");
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok) {
        alert(data.error || "Generation failed.");
        return;
      }

      setResult(data.result);
      setSections(splitSections(data.result));

      await loadUsage(user.id);
    } catch (error) {
      alert(`Generate error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveProject() {
    const user = await getUser();

    if (!user) {
      alert("Login required.");
      return;
    }

    if (!idea.trim() || !result.trim()) {
      alert("Generate a result before saving.");
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          mode,
          result,
          user_id: user.id,
        }),
      });

      const text = await res.text();

      if (!text) {
        alert("Save failed: API returned an empty response.");
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok) {
        alert(data.error || "Save failed.");
        return;
      }

      alert("Project saved.");
      await loadProjects(user.id);
    } catch (error) {
      alert(`Save error: ${String(error)}`);
    }
  }

  async function upgrade() {
    const user = await getUser();

    if (!user) {
      alert("Login required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      const text = await res.text();

      if (!text) {
        alert("Upgrade failed: API returned an empty response.");
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok) {
        alert(data.error || "Upgrade failed.");
        return;
      }

      if (!data.url) {
        alert("Stripe did not return a checkout URL.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      alert(`Upgrade error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects(userId: string) {
    try {
      const res = await fetch(`/api/projects?user_id=${userId}`);
      const text = await res.text();

      if (!text) {
        setProjects([]);
        return;
      }

      const data = JSON.parse(text);
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project?")) return;

    const user = await getUser();

    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const text = await res.text();

      if (!res.ok) {
        alert(`Delete failed: ${text}`);
        return;
      }

      if (user) {
        await loadProjects(user.id);
      }

      alert("Project deleted.");
    } catch (error) {
      alert(`Delete error: ${String(error)}`);
    }
  }

  async function updateTitle(id: string, title: string) {
    const user = await getUser();

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, title }),
      });

      if (!res.ok) {
        alert("Title update failed.");
        return;
      }

      if (user) {
        await loadProjects(user.id);
      }
    } catch (error) {
      alert(`Title update error: ${String(error)}`);
    }
  }

  async function regenerateSection(index: number, title: string) {
    const user = await getUser();

    if (!user) {
      alert("Login required.");
      return;
    }

    if (!idea.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: `Regenerate ONLY this section: ${title}\n\nOriginal idea: ${idea}`,
          mode,
          user_id: user.id,
        }),
      });

      const text = await res.text();

      if (!text) {
        alert("Regenerate failed: API returned empty response.");
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok) {
        alert(data.error || "Regenerate failed.");
        return;
      }

      const newSections = [...sections];

      newSections[index] = {
        title,
        content: data.result,
      };

      setSections(newSections);
      setResult(joinSections(newSections));

      await loadUsage(user.id);
    } catch (error) {
      alert(`Regenerate error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/project/${id}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied.");
  }

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setUserEmail("");
    setProjects([]);
    setIdea("");
    setResult("");
    setSections([]);
    setPlan("free");
    setRemaining(5);

    alert("Logged out.");
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Founder AI</h1>

            <p className="mt-3 text-gray-600">
              Generate, edit, save, and share SaaS plans.
            </p>

            {userEmail ? (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="text-gray-600">Logged in as {userEmail}</p>

                <p className="mt-1 font-medium">
                  Plan:{" "}
                  <span className={plan === "pro" ? "text-green-700" : "text-gray-900"}>
                    {plan === "pro" ? "Pro" : "Free"}
                  </span>
                </p>

                <p className="mt-1 text-gray-600">
                  Remaining generations:{" "}
                  {remaining === "unlimited" ? "Unlimited" : remaining}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-red-600">
                Not logged in. Go to /login before using the app.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {plan !== "pro" && (
              <button
                onClick={upgrade}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
              >
                Upgrade to Pro
              </button>
            )}

            {userEmail && (
              <button
                onClick={logout}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                Log out
              </button>
            )}
          </div>
        </div>

        <select
          className="mt-8 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-black"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {modes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <textarea
          className="mt-4 min-h-40 w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-black"
          placeholder="Example: Build a helpdesk SaaS for small IT teams"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={generate}
            className="rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            {loading ? "Working..." : "Generate"}
          </button>

          {result && (
            <button
              onClick={saveProject}
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-black"
            >
              Save Project
            </button>
          )}
        </div>

        {sections.length > 0 && (
          <section className="mt-8 space-y-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>

                <textarea
                  value={section.content}
                  onChange={(e) => {
                    const newSections = [...sections];
                    newSections[index].content = e.target.value;

                    setSections(newSections);
                    setResult(joinSections(newSections));
                  }}
                  className="mt-3 min-h-[140px] w-full resize-none bg-transparent text-sm leading-6 outline-none"
                />

                <button
                  onClick={() => regenerateSection(index, section.title)}
                  className="mt-3 text-sm font-medium text-blue-600"
                >
                  Regenerate section
                </button>
              </div>
            ))}
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Saved Projects</h2>

          {!userEmail && (
            <p className="mt-3 text-sm text-gray-500">
              Log in to save and view your projects.
            </p>
          )}

          {userEmail && projects.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              No saved projects yet.
            </p>
          )}

          {projects.length > 0 && (
            <div className="mt-4 space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <input
                    value={project.title || ""}
                    onChange={(e) => updateTitle(project.id, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm font-medium"
                    placeholder="Project title"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Mode: {project.mode}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setIdea(project.idea);
                        setMode(project.mode);
                        setResult(project.result);
                        setSections(splitSections(project.result));
                      }}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Load
                    </button>

                    <button
                      onClick={() => copyLink(project.id)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Copy Share Link
                    </button>

                    <button
                      onClick={() => deleteProject(project.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}