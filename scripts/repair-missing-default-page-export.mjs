import fs from "node:fs";
import path from "node:path";

/**
 * Repairs app/page.tsx when Next.js says:
 * "The default export is not a React Component in /page"
 *
 * This script does NOT invent a full new app.
 * It checks whether a default export exists.
 *
 * If the page already has a likely main component named Page/Home/App,
 * it appends/repairs:
 *
 *   export default Page;
 *
 * If no valid component is found, it writes a safe emergency page so the app
 * compiles again. Yes, humiliating, but less humiliating than a dead route.
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-default-export-repair-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, source);

function hasValidDefaultExport(text) {
  return (
    /export\s+default\s+function\s+[A-Za-z0-9_]*\s*\(/.test(text) ||
    /export\s+default\s+[A-Za-z0-9_]+;?/.test(text) ||
    /export\s*\{\s*[A-Za-z0-9_]+\s+as\s+default\s*\}/.test(text)
  );
}

function findCandidateComponent(text) {
  const candidates = [
    "Page",
    "Home",
    "App",
    "FounderAIPage",
    "FounderPage",
  ];

  for (const name of candidates) {
    const functionRegex = new RegExp(`function\\s+${name}\\s*\\(`);
    const constRegex = new RegExp(`const\\s+${name}\\s*=\\s*\\(`);
    const arrowRegex = new RegExp(`const\\s+${name}\\s*=\\s*async\\s*\\(`);

    if (
      functionRegex.test(text) ||
      constRegex.test(text) ||
      arrowRegex.test(text)
    ) {
      return name;
    }
  }

  return null;
}

if (hasValidDefaultExport(source)) {
  console.log("app/page.tsx already appears to have a default export.");
  console.log(`Backup created at: ${backupPath}`);
  process.exit(0);
}

const candidate = findCandidateComponent(source);

if (candidate) {
  source = `${source.trim()}

export default ${candidate};
`;

  fs.writeFileSync(pagePath, source);

  console.log("");
  console.log(`✅ Added missing default export: export default ${candidate};`);
  console.log(`Backup created at: ${backupPath}`);
  process.exit(0);
}

/**
 * Emergency fallback if the page is too corrupted to find a component.
 */
const emergencyPage = `"use client";

import { useEffect, useState } from "react";
import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";

type WorkspaceView =
  | "preview"
  | "code"
  | "architecture"
  | "integrations"
  | "publish-readiness"
  | "history";

export default function Page() {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("preview");
  const [filesOpen, setFilesOpen] = useState(false);

  useEffect(() => {
    console.warn(
      "Emergency Page fallback is active. Restore the previous app/page.tsx backup after fixing the broken default export."
    );
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fffaf2",
        color: "#111827",
        padding: "18px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          border: "1px solid #e5e7eb",
          borderRadius: "28px",
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px",
            borderBottom: "1px solid #eef0f3",
          }}
        >
          <PremiumWorkspaceToolbar
            fileCountLabel="0 files"
            isPreviewSelected={workspaceView === "preview"}
            isFilesSelected={filesOpen}
            isCloudSelected={workspaceView === "integrations"}
            isCodeSelected={workspaceView === "code"}
            isAnalyticsSelected={workspaceView === "architecture"}
            isSecuritySelected={workspaceView === "publish-readiness"}
            onSelectPreview={() => setWorkspaceView("preview")}
            onSelectFiles={() => setFilesOpen((value) => !value)}
            onSelectCloud={() => setWorkspaceView("integrations")}
            onSelectCode={() => setWorkspaceView("code")}
            onSelectAnalytics={() => setWorkspaceView("architecture")}
            onSelectSecurity={() => setWorkspaceView("publish-readiness")}
            onSelectMore={() => setWorkspaceView("history")}
          />
        </div>

        <div
          style={{
            padding: "34px",
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
            Emergency recovery page
          </p>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "42px",
              lineHeight: 1,
              letterSpacing: "-0.07em",
            }}
          >
            Founder AI page export restored
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "720px",
              color: "#4b5563",
              fontSize: "16px",
              lineHeight: 1.65,
            }}
          >
            The original app/page.tsx was too corrupted to detect a valid React
            component. This fallback keeps the app compiling while you restore
            the latest backup and reapply the toolbar fix properly.
          </p>
        </div>
      </section>
    </main>
  );
}
`;

fs.writeFileSync(pagePath, emergencyPage);

console.log("");
console.log("⚠️ No valid Page/Home/App component was found.");
console.log("✅ Wrote emergency fallback app/page.tsx so the app can compile.");
console.log(`Backup created at: ${backupPath}`);
console.log("");
console.log("Important:");
console.log("Restore the latest app/page.tsx backup after this if you need the full app UI back.");