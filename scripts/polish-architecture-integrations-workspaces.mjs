import fs from "node:fs";
import path from "node:path";

/**
 * Polishes Architecture and Integrations workspaces.
 *
 * Goal:
 * - Make technical readiness pages feel like part of the same product.
 * - Improve cards, badges, checklists, hover states, and mobile behaviour.
 *
 * CSS-first. No JSX edits. The parser can remain asleep in its little cave.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-architecture-integrations-polish-${Date.now()}.css`
);

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let css = fs.readFileSync(cssPath, "utf8");
const pageSource = fs.readFileSync(pagePath, "utf8");

fs.writeFileSync(backupCssPath, css);

const hints = [
  "ArchitectureWorkspace",
  "IntegrationsWorkspace",
  "architecture",
  "integrations",
  "IntegrationReadiness",
  "LaunchReadiness",
];

const foundHints = hints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found architecture/integrations hints: ${foundHints.join(", ")}`
    : "No architecture/integrations hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI architecture integrations workspace polish")) {
  css += `

/* Founder AI architecture integrations workspace polish */
.preview-frame [class*="architecture"],
.preview-frame [class*="integration"],
.preview-frame [class*="readiness"],
.preview-frame [class*="Architecture"],
.preview-frame [class*="Integration"] {
  box-sizing: border-box;
}

/* Broad workspace surfaces */
.architecture-workspace,
.integrations-workspace,
.integration-workspace,
.readiness-workspace,
.preview-frame [data-workspace="architecture"],
.preview-frame [data-workspace="integrations"] {
  min-height: 100%;
  padding: clamp(18px, 3vw, 30px);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.07), transparent 30%),
    linear-gradient(180deg, #fffaf2 0%, #ffffff 46%, #f8fafc 100%);
  color: #111827;
}

/* Headings */
.architecture-workspace h1,
.architecture-workspace h2,
.architecture-workspace h3,
.integrations-workspace h1,
.integrations-workspace h2,
.integrations-workspace h3,
.integration-workspace h1,
.integration-workspace h2,
.integration-workspace h3,
.readiness-workspace h1,
.readiness-workspace h2,
.readiness-workspace h3 {
  color: #111827;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.architecture-workspace p,
.integrations-workspace p,
.integration-workspace p,
.readiness-workspace p {
  color: #4b5563;
  line-height: 1.55;
}

/* Cards */
.architecture-workspace article,
.integrations-workspace article,
.integration-workspace article,
.readiness-workspace article,
.preview-frame section article {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.065);
}

.architecture-workspace article,
.integrations-workspace article,
.integration-workspace article,
.readiness-workspace article {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.architecture-workspace article:hover,
.integrations-workspace article:hover,
.integration-workspace article:hover,
.readiness-workspace article:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.09);
}

/* Lists and checklists */
.architecture-workspace ul,
.integrations-workspace ul,
.integration-workspace ul,
.readiness-workspace ul {
  margin: 0;
  padding-left: 18px;
}

.architecture-workspace li,
.integrations-workspace li,
.integration-workspace li,
.readiness-workspace li {
  color: #4b5563;
  font-size: 13px;
  line-height: 1.5;
  margin: 5px 0;
}

/* Badges and status pills */
.architecture-workspace span,
.integrations-workspace span,
.integration-workspace span,
.readiness-workspace span {
  max-width: 100%;
}

.architecture-workspace [class*="badge"],
.integrations-workspace [class*="badge"],
.integration-workspace [class*="badge"],
.readiness-workspace [class*="badge"],
.architecture-workspace [class*="status"],
.integrations-workspace [class*="status"],
.integration-workspace [class*="status"],
.readiness-workspace [class*="status"] {
  border-radius: 999px;
  font-weight: 850;
  letter-spacing: 0.01em;
}

/* Buttons */
.architecture-workspace button,
.integrations-workspace button,
.integration-workspace button,
.readiness-workspace button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.architecture-workspace button:hover:not(:disabled),
.integrations-workspace button:hover:not(:disabled),
.integration-workspace button:hover:not(:disabled),
.readiness-workspace button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
  border-color: rgba(37, 99, 235, 0.34) !important;
}

.architecture-workspace button:active:not(:disabled),
.integrations-workspace button:active:not(:disabled),
.integration-workspace button:active:not(:disabled),
.readiness-workspace button:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

/* Tables if present */
.architecture-workspace table,
.integrations-workspace table,
.integration-workspace table,
.readiness-workspace table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 18px;
  background: #ffffff;
}

.architecture-workspace th,
.integrations-workspace th,
.integration-workspace th,
.readiness-workspace th {
  background: #f8fafc;
  color: #374151;
  font-size: 12px;
  font-weight: 850;
  text-align: left;
}

.architecture-workspace td,
.integrations-workspace td,
.integration-workspace td,
.readiness-workspace td,
.architecture-workspace th,
.integrations-workspace th,
.integration-workspace th,
.readiness-workspace th {
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 11px 12px;
}

/* Code/config snippets */
.architecture-workspace code,
.integrations-workspace code,
.integration-workspace code,
.readiness-workspace code {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.95);
  color: #374151;
  padding: 3px 8px;
  font-size: 12px;
}

.architecture-workspace pre,
.integrations-workspace pre,
.integration-workspace pre,
.readiness-workspace pre {
  border: 1px solid rgba(30, 41, 59, 0.12);
  border-radius: 20px;
  background: #111827;
  color: #e5e7eb;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.13);
  padding: 16px;
  overflow: auto;
}

/* Scrollbars */
.architecture-workspace,
.integrations-workspace,
.integration-workspace,
.readiness-workspace,
.architecture-workspace pre,
.integrations-workspace pre,
.integration-workspace pre,
.readiness-workspace pre {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
}

.architecture-workspace::-webkit-scrollbar,
.integrations-workspace::-webkit-scrollbar,
.integration-workspace::-webkit-scrollbar,
.readiness-workspace::-webkit-scrollbar,
.architecture-workspace pre::-webkit-scrollbar,
.integrations-workspace pre::-webkit-scrollbar,
.integration-workspace pre::-webkit-scrollbar,
.readiness-workspace pre::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.architecture-workspace::-webkit-scrollbar-thumb,
.integrations-workspace::-webkit-scrollbar-thumb,
.integration-workspace::-webkit-scrollbar-thumb,
.readiness-workspace::-webkit-scrollbar-thumb,
.architecture-workspace pre::-webkit-scrollbar-thumb,
.integrations-workspace pre::-webkit-scrollbar-thumb,
.integration-workspace pre::-webkit-scrollbar-thumb,
.readiness-workspace pre::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

/* Mobile tightening */
@media (max-width: 760px) {
  .architecture-workspace,
  .integrations-workspace,
  .integration-workspace,
  .readiness-workspace,
  .preview-frame [data-workspace="architecture"],
  .preview-frame [data-workspace="integrations"] {
    padding: 14px;
  }

  .architecture-workspace article,
  .integrations-workspace article,
  .integration-workspace article,
  .readiness-workspace article {
    border-radius: 18px;
  }

  .architecture-workspace table,
  .integrations-workspace table,
  .integration-workspace table,
  .readiness-workspace table {
    display: block;
    overflow-x: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .architecture-workspace article,
  .integrations-workspace article,
  .integration-workspace article,
  .readiness-workspace article,
  .architecture-workspace button,
  .integrations-workspace button,
  .integration-workspace button,
  .readiness-workspace button {
    transition: none;
  }

  .architecture-workspace article:hover,
  .integrations-workspace article:hover,
  .integration-workspace article:hover,
  .readiness-workspace article:hover,
  .architecture-workspace button:hover:not(:disabled),
  .integrations-workspace button:hover:not(:disabled),
  .integration-workspace button:hover:not(:disabled),
  .readiness-workspace button:hover:not(:disabled),
  .architecture-workspace button:active:not(:disabled),
  .integrations-workspace button:active:not(:disabled),
  .integration-workspace button:active:not(:disabled),
  .readiness-workspace button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added architecture/integrations workspace CSS polish.");
} else {
  console.log("Architecture/integrations workspace CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Architecture and Integrations workspace polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);