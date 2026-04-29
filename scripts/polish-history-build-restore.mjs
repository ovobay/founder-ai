import fs from "node:fs";
import path from "node:path";

/**
 * Polishes History and build restoration UI.
 *
 * Goal:
 * - Make build history feel recoverable and trustworthy.
 * - Improve card styling, restore actions, timestamps, and empty states.
 * - Keep the history workspace consistent with Preview, Code, Publish,
 *   Architecture, and Integrations.
 *
 * CSS-first. No JSX edits. The parser may continue its nap.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-history-restore-polish-${Date.now()}.css`
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
  "HistoryWorkspace",
  "buildHistory",
  "onRestoreBuild",
  "Restore",
  "history",
];

const foundHints = hints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found history hints: ${foundHints.join(", ")}`
    : "No history hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI history workspace polish")) {
  css += `

/* Founder AI history workspace polish */
.history-workspace,
.preview-frame [data-workspace="history"],
.preview-frame [class*="history"],
.preview-frame [class*="History"] {
  box-sizing: border-box;
}

.history-workspace,
.preview-frame [data-workspace="history"] {
  min-height: 100%;
  padding: clamp(18px, 3vw, 30px);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.07), transparent 30%),
    linear-gradient(180deg, #fffaf2 0%, #ffffff 46%, #f8fafc 100%);
  color: #111827;
}

.history-workspace h1,
.history-workspace h2,
.history-workspace h3,
.preview-frame [data-workspace="history"] h1,
.preview-frame [data-workspace="history"] h2,
.preview-frame [data-workspace="history"] h3 {
  color: #111827;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.history-workspace p,
.preview-frame [data-workspace="history"] p {
  color: #4b5563;
  line-height: 1.55;
}

/* History cards */
.history-workspace article,
.preview-frame [data-workspace="history"] article,
.preview-frame [class*="history"] article,
.preview-frame [class*="History"] article {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.065);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.history-workspace article:hover,
.preview-frame [data-workspace="history"] article:hover,
.preview-frame [class*="history"] article:hover,
.preview-frame [class*="History"] article:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.09);
}

/* Make timestamps, versions, and metadata easier to scan */
.history-workspace time,
.history-workspace small,
.history-workspace code,
.preview-frame [data-workspace="history"] time,
.preview-frame [data-workspace="history"] small,
.preview-frame [data-workspace="history"] code {
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.95);
  color: #4b5563;
  font-size: 12px;
  font-weight: 750;
}

.history-workspace code,
.preview-frame [data-workspace="history"] code {
  border: 1px solid rgba(226, 232, 240, 0.95);
  padding: 3px 8px;
}

/* Restore buttons */
.history-workspace button,
.preview-frame [data-workspace="history"] button,
.preview-frame [class*="history"] button,
.preview-frame [class*="History"] button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
}

.history-workspace button:hover:not(:disabled),
.preview-frame [data-workspace="history"] button:hover:not(:disabled),
.preview-frame [class*="history"] button:hover:not(:disabled),
.preview-frame [class*="History"] button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
  border-color: rgba(37, 99, 235, 0.34) !important;
}

.history-workspace button:active:not(:disabled),
.preview-frame [data-workspace="history"] button:active:not(:disabled),
.preview-frame [class*="history"] button:active:not(:disabled),
.preview-frame [class*="History"] button:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.history-workspace button:disabled,
.preview-frame [data-workspace="history"] button:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

/* Empty history state */
.history-workspace [data-empty="true"],
.preview-frame [data-workspace="history"] [data-empty="true"],
.history-empty-state,
.build-history-empty {
  border: 1px dashed rgba(148, 163, 184, 0.75);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.74);
  color: #6b7280;
  padding: 24px;
  text-align: center;
}

/* Lists */
.history-workspace ul,
.history-workspace ol,
.preview-frame [data-workspace="history"] ul,
.preview-frame [data-workspace="history"] ol {
  margin: 0;
  padding-left: 18px;
}

.history-workspace li,
.preview-frame [data-workspace="history"] li {
  color: #4b5563;
  font-size: 13px;
  line-height: 1.5;
  margin: 5px 0;
}

/* Scrollbars */
.history-workspace,
.preview-frame [data-workspace="history"] {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
}

.history-workspace::-webkit-scrollbar,
.preview-frame [data-workspace="history"]::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.history-workspace::-webkit-scrollbar-thumb,
.preview-frame [data-workspace="history"]::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

/* Mobile */
@media (max-width: 760px) {
  .history-workspace,
  .preview-frame [data-workspace="history"] {
    padding: 14px;
  }

  .history-workspace article,
  .preview-frame [data-workspace="history"] article,
  .preview-frame [class*="history"] article,
  .preview-frame [class*="History"] article {
    border-radius: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-workspace article,
  .preview-frame [data-workspace="history"] article,
  .preview-frame [class*="history"] article,
  .preview-frame [class*="History"] article,
  .history-workspace button,
  .preview-frame [data-workspace="history"] button,
  .preview-frame [class*="history"] button,
  .preview-frame [class*="History"] button {
    transition: none;
  }

  .history-workspace article:hover,
  .preview-frame [data-workspace="history"] article:hover,
  .preview-frame [class*="history"] article:hover,
  .preview-frame [class*="History"] article:hover,
  .history-workspace button:hover:not(:disabled),
  .preview-frame [data-workspace="history"] button:hover:not(:disabled),
  .preview-frame [class*="history"] button:hover:not(:disabled),
  .preview-frame [class*="History"] button:hover:not(:disabled),
  .history-workspace button:active:not(:disabled),
  .preview-frame [data-workspace="history"] button:active:not(:disabled),
  .preview-frame [class*="history"] button:active:not(:disabled),
  .preview-frame [class*="History"] button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added history workspace CSS polish.");
} else {
  console.log("History workspace CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ History and build restore polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);