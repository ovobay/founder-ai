"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { createClient } from "@/lib/supabase/client";

type FileItem = {
  path: string;
  content: string;
};

type PreviewDiagnostics = {
  error?: string | null;
  reason?: string | null;
  url?: string | null;
  status?: number | null;
  htmlSnippet?: string | null;
  logs?: string | null;
  pageFile?: string | null;
  layoutFile?: string | null;
  packageFile?: string | null;
  container?: string | null;
  worker_status?: number | null;
  warning?: string | null;
};

function parseFiles(text?: string): FileItem[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  const files: FileItem[] = [];
  const parts = text.split("FILE:");

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    const firstLineEnd = part.indexOf("\n");

    if (firstLineEnd === -1) {
      continue;
    }

    const filePath = part.substring(0, firstLineEnd).trim();
    const content = part.substring(firstLineEnd + 1).trim();

    if (!filePath || !content) {
      continue;
    }

    files.push({ path: filePath, content });
  }

  return files;
}

function rebuildProject(files: FileItem[]) {
  return files.map((file) => `FILE: ${file.path}\n${file.content}`).join("\n\n");
}

function getLanguage(path: string) {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".sql")) return "sql";
  return "plaintext";
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selected, setSelected] = useState(0);

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewDiagnostics, setPreviewDiagnostics] =
    useState<PreviewDiagnostics | null>(null);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [remaining, setRemaining] = useState<number | string>(5);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");

  useEffect(() => {
    loadAccount();
  }, []);

  async function getSession() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  }

  async function getAuthHeaders() {
    const session = await getSession();

    if (!session?.access_token) {
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function loadAccount() {
    const session = await getSession();

    if (!session?.user) {
      setUserEmail("");
      setPlan("free");
      setRemaining(5);
      setSubscriptionStatus("inactive");
      return;
    }

    setUserEmail(session.user.email || "");
    await loadUsage();
  }

  async function loadUsage() {
    try {
      const headers = await getAuthHeaders();

      if (!headers) return;

      const res = await fetch("/api/usage", {
        method: "GET",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Usage load failed:", data);
        return;
      }

      setPlan(data.plan || "free");
      setRemaining(data.remaining ?? 5);
      setSubscriptionStatus(data.subscription_status || "inactive");
    } catch (error) {
      console.error("Usage load error:", error);
    }
  }

  async function generate() {
    if (!idea.trim() || loading || previewLoading || fixing) return;

    const headers = await getAuthHeaders();

    if (!headers) {
      alert("Login required.");
      return;
    }

    setLoading(true);
    setFiles([]);
    setPreviewUrl("");
    setPreviewStatus("");
    setPreviewError("");
    setPreviewDiagnostics(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          idea,
          mode: "app",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgrade) {
          alert("You’ve hit the free limit. Upgrade to continue.");
          await loadUsage();
          return;
        }

        alert(data.error || "Generation failed.");
        return;
      }

      if (!data.result) {
        alert("Generation failed: API did not return a result.");
        console.error("Generate response:", data);
        return;
      }

      const parsed = parseFiles(data.result);

      if (parsed.length === 0) {
        alert("Generation failed: AI did not return valid FILE: output.");
        console.error("Raw AI result:", data.result);
        return;
      }

      setFiles(parsed);
      setSelected(0);
      setPreviewStatus(
        data.project_kind
          ? `Generated project type: ${data.project_kind}. Click Run App to preview.`
          : "Project generated. Click Run App to preview."
      );
      await loadUsage();
    } catch (error) {
      alert(`Generate error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function updateFileContent(value: string | undefined) {
    if (value === undefined) return;

    const updated = [...files];

    if (!updated[selected]) return;

    updated[selected].content = value;
    setFiles(updated);
    setPreviewUrl("");
    setPreviewStatus("Files changed. Run App again to refresh preview.");
    setPreviewError("");
    setPreviewDiagnostics(null);
  }

  async function regenerateFile() {
    const file = files[selected];

    if (!file || loading || previewLoading || fixing) return;

    const headers = await getAuthHeaders();

    if (!headers) {
      alert("Login required.");
      return;
    }

    setLoading(true);
    setPreviewUrl("");
    setPreviewStatus("");
    setPreviewError("");
    setPreviewDiagnostics(null);

    try {
      const projectContext = rebuildProject(files);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          idea: `
You are editing an existing generated project.

PROJECT:
${projectContext}

Regenerate ONLY this file:
${file.path}

Return ONLY this format:

FILE: ${file.path}
<updated code>
`,
          mode: "app",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgrade) {
          alert("You’ve hit the free limit. Upgrade to continue.");
          await loadUsage();
          return;
        }

        alert(data.error || "Regeneration failed.");
        return;
      }

      const parsed = parseFiles(data.result);

      if (parsed.length === 0) {
        alert("Regeneration failed: AI did not return valid FILE output.");
        return;
      }

      const updatedFiles = [...files];
      updatedFiles[selected] = parsed[0];

      setFiles(updatedFiles);
      setPreviewStatus("File regenerated. Run App to preview the updated project.");
      await loadUsage();
    } catch (error) {
      alert(`Regenerate error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function fixPreviewError() {
    if (files.length === 0) {
      alert("Generate a project first.");
      return;
    }

    if (!previewDiagnostics && !previewError) {
      alert("No preview error diagnostics available.");
      return;
    }

    const headers = await getAuthHeaders();

    if (!headers) {
      alert("Login required.");
      return;
    }

    setFixing(true);
    setPreviewStatus("Repairing preview error with Founder AI...");
    setPreviewError("");

    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers,
        body: JSON.stringify({
          files,
          diagnostics: {
            error: previewError || previewDiagnostics?.error || null,
            reason: previewDiagnostics?.reason || null,
            logs: previewDiagnostics?.logs || null,
            htmlSnippet: previewDiagnostics?.htmlSnippet || null,
            pageFile: previewDiagnostics?.pageFile || null,
            layoutFile: previewDiagnostics?.layoutFile || null,
            packageFile: previewDiagnostics?.packageFile || null,
            container: previewDiagnostics?.container || null,
            status: previewDiagnostics?.status || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPreviewError(data.error || "Fix failed.");
        setPreviewDiagnostics(data);
        setPreviewStatus("");
        return;
      }

      let repairedFiles: FileItem[] = [];

      if (Array.isArray(data.files) && data.files.length > 0) {
        repairedFiles = data.files;
      } else if (data.result) {
        repairedFiles = parseFiles(data.result);
      }

      if (repairedFiles.length === 0) {
        setPreviewError("Fix failed: no repaired files returned.");
        setPreviewDiagnostics(data);
        setPreviewStatus("");
        return;
      }

      setFiles(repairedFiles);
      setSelected(0);
      setPreviewUrl("");
      setPreviewError("");
      setPreviewDiagnostics(null);
      setPreviewStatus("Preview error repaired. Click Run App again.");
    } catch (error) {
      setPreviewError(`Fix error: ${String(error)}`);
      setPreviewStatus("");
    } finally {
      setFixing(false);
    }
  }

  async function downloadProject() {
    if (files.length === 0) {
      alert("Generate a project first.");
      return;
    }

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Download failed.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "founder-ai-project.zip";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Download error: ${String(error)}`);
    }
  }

  async function runPreview() {
    if (files.length === 0) {
      alert("Generate a project first.");
      return;
    }

    setPreviewLoading(true);
    setPreviewUrl("");
    setPreviewError("");
    setPreviewDiagnostics(null);
    setPreviewStatus("Sending files to preview worker...");

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPreviewError(data.error || "Preview failed.");
        setPreviewDiagnostics(data);
        setPreviewStatus("");
        return;
      }

      if (!data.url) {
        setPreviewError("Preview failed: no preview URL returned.");
        setPreviewDiagnostics(data);
        setPreviewStatus("");
        return;
      }

      setPreviewUrl(data.url);
      setPreviewDiagnostics(data);
      setPreviewStatus(
        `Preview running at ${data.url}. It may take a few seconds to load.`
      );
    } catch (error) {
      setPreviewError(`Preview error: ${String(error)}`);
      setPreviewStatus("");
      setPreviewDiagnostics(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function upgrade() {
    const headers = await getAuthHeaders();

    if (!headers) {
      alert("Login required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upgrade failed.");
        return;
      }

      if (!data.url) {
        alert("Stripe did not return a URL.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      alert(`Upgrade error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    const headers = await getAuthHeaders();

    if (!headers) {
      alert("Login required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to open billing portal.");
        return;
      }

      if (!data.url) {
        alert("Stripe did not return a billing portal URL.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      alert(`Portal error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setUserEmail("");
    setPlan("free");
    setRemaining(5);
    setSubscriptionStatus("inactive");
    setFiles([]);
    setPreviewUrl("");
    setPreviewStatus("");
    setPreviewError("");
    setPreviewDiagnostics(null);
    setIdea("");

    alert("Logged out.");
  }

  function diagnosticBlock(title: string, value?: string | null) {
    if (!value) return null;

    return (
      <details className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-gray-800">
          {value}
        </pre>
      </details>
    );
  }

  const selectedFile = files[selected];

  const isPro = plan === "pro";
  const isCancelling = subscriptionStatus === "cancelling";

  const remainingNum = typeof remaining === "number" ? remaining : null;

  const isFreeOut = plan === "free" && remainingNum !== null && remainingNum <= 0;
  const isFreeLow =
    plan === "free" &&
    remainingNum !== null &&
    remainingNum > 0 &&
    remainingNum <= 3;

  const busy = loading || previewLoading || fixing;
  const canFixPreview = files.length > 0 && (!!previewError || !!previewDiagnostics);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="border-b bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Founder AI Builder</h1>

            <p className="mt-2 text-sm text-gray-600">
              Generate, edit, preview, repair, and download full-stack project files.
            </p>

            {userEmail ? (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="text-gray-600">Logged in as {userEmail}</p>

                <p className="mt-1">
                  Plan:{" "}
                  <span className={isPro ? "font-semibold text-green-700" : "font-semibold"}>
                    {isPro ? "Pro" : "Free"}
                  </span>
                </p>

                <p className="mt-1">
                  Subscription status:{" "}
                  <span className={isCancelling ? "text-orange-700" : ""}>
                    {subscriptionStatus}
                  </span>
                </p>

                <p className="mt-1">
                  Remaining generations:{" "}
                  <span className={isFreeOut ? "font-semibold text-red-700" : ""}>
                    {remaining === "unlimited" ? "Unlimited" : remaining}
                  </span>
                </p>

                {isFreeLow && !isFreeOut && (
                  <p className="mt-2 text-orange-700">
                    ⚠ You’re running low on free generations. Upgrade before the meter starts judging you.
                  </p>
                )}

                {isFreeOut && (
                  <p className="mt-2 font-medium text-red-700">
                    You’ve hit the free limit. Upgrade to keep building.
                  </p>
                )}

                {isCancelling && (
                  <p className="mt-2 text-orange-700">
                    Your subscription is cancelling. You keep Pro access until the billing period ends.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-red-600">
                Not logged in. Go to /login before using the builder.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isPro && (
              <button
                onClick={upgrade}
                disabled={busy}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Upgrade to Pro
              </button>
            )}

            {isPro && (
              <button
                onClick={openBillingPortal}
                disabled={busy}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Manage Subscription
              </button>
            )}

            {userEmail && (
              <button
                onClick={logout}
                disabled={busy}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Log out
              </button>
            )}
          </div>
        </div>

        <textarea
          className="mt-4 min-h-28 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-black"
          placeholder="Describe what you want to build. Example: Build a Shopify app that tracks abandoned carts and sends WhatsApp recovery campaigns."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={generate}
            disabled={busy || isFreeOut}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Working..." : "Generate Project"}
          </button>

          {isFreeOut && (
            <button
              onClick={upgrade}
              disabled={busy}
              className="rounded-xl bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              Upgrade to Continue
            </button>
          )}

          {files.length > 0 && (
            <>
              <button
                onClick={regenerateFile}
                disabled={busy || isFreeOut}
                className="rounded-xl border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Regenerate File
              </button>

              <button
                onClick={runPreview}
                disabled={busy}
                className="rounded-xl bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {previewLoading ? "Starting Preview..." : "Run App"}
              </button>

              {canFixPreview && (
                <button
                  onClick={fixPreviewError}
                  disabled={busy}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {fixing ? "Fixing..." : "Fix Preview Error"}
                </button>
              )}

              <button
                onClick={downloadProject}
                disabled={busy}
                className="rounded-xl border border-gray-300 px-4 py-2 disabled:opacity-50"
              >
                Download ZIP
              </button>
            </>
          )}
        </div>

        {(previewStatus || previewError || previewUrl || previewDiagnostics) && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            {previewStatus && <p className="text-gray-700">{previewStatus}</p>}

            {previewError && (
              <p className="font-medium text-red-700">{previewError}</p>
            )}

            {previewDiagnostics?.reason && (
              <p className="mt-1 text-gray-700">
                Reason: {previewDiagnostics.reason}
              </p>
            )}

            {previewDiagnostics?.container && (
              <p className="mt-1 text-gray-700">
                Container: {previewDiagnostics.container}
              </p>
            )}

            {previewDiagnostics?.warning && (
              <p className="mt-1 text-orange-700">
                Warning: {previewDiagnostics.warning}
              </p>
            )}

            {previewUrl && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-gray-600">Preview URL:</span>

                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 underline"
                >
                  {previewUrl}
                </a>

                <button
                  onClick={() => window.open(previewUrl, "_blank")}
                  className="rounded-lg border border-gray-300 px-3 py-1"
                >
                  Open Preview
                </button>
              </div>
            )}

            {diagnosticBlock("Docker logs", previewDiagnostics?.logs)}
            {diagnosticBlock("Generated package.json", previewDiagnostics?.packageFile)}
            {diagnosticBlock("Generated app/page.tsx", previewDiagnostics?.pageFile)}
            {diagnosticBlock("Generated app/layout.tsx", previewDiagnostics?.layoutFile)}
            {diagnosticBlock("HTML snippet", previewDiagnostics?.htmlSnippet)}
          </div>
        )}
      </div>

      {files.length > 0 ? (
        <div className="flex h-[calc(100vh-300px)] min-h-[520px]">
          <aside className="w-1/5 overflow-auto border-r bg-gray-50 text-sm">
            <div className="border-b px-3 py-2 font-semibold">Files</div>

            {files.map((file, index) => (
              <button
                key={`${file.path}-${index}`}
                onClick={() => setSelected(index)}
                className={`block w-full border-b px-3 py-2 text-left ${
                  selected === index ? "bg-white font-medium" : "bg-gray-50"
                }`}
              >
                {file.path}
              </button>
            ))}
          </aside>

          <section className="w-2/5">
            <div className="border-b px-3 py-2 text-sm font-semibold">
              {selectedFile?.path || "No file selected"}
            </div>

            <div className="h-[calc(100%-37px)]">
              <Editor
                height="100%"
                language={getLanguage(selectedFile?.path || "")}
                value={selectedFile?.content || ""}
                onChange={updateFileContent}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
          </section>

          <section className="w-2/5 border-l">
            <div className="border-b px-3 py-2 text-sm font-semibold">Preview</div>

            <div className="h-[calc(100%-37px)]">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="h-full w-full"
                  title="Generated app preview"
                />
              ) : (
                <div className="p-4 text-sm text-gray-500">
                  Click <strong>Run App</strong> to preview the generated project.
                  {canFixPreview && (
                    <span>
                      {" "}
                      If preview failed, click <strong>Fix Preview Error</strong>.
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="p-6 text-sm text-gray-500">
          No files generated yet. Describe an app, website, Shopify store, or Shopify app and click Generate Project.
        </div>
      )}
    </main>
  );
}