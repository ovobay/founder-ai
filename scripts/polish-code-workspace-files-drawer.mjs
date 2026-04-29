import fs from "node:fs";
import path from "node:path";

/**
 * Polishes the Code workspace and Files drawer.
 *
 * Goal:
 * - Make generated files feel organised.
 * - Make code view feel more editor-like.
 * - Improve selected/hover states.
 * - Improve scrolling and responsive behaviour.
 *
 * CSS-first. We are not touching JSX unless absolutely necessary because the
 * parser has already filed several complaints with management.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-code-workspace-files-polish-${Date.now()}.css`
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
  "FilesDrawer",
  "CodeWorkspace",
  "files-drawer",
  "code-workspace",
  "selectedFile",
  "projectFiles",
];

const foundHints = hints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found code/files hints: ${foundHints.join(", ")}`
    : "No code/files hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI code workspace and files drawer polish")) {
  css += `

/* Founder AI code workspace and files drawer polish */
.files-drawer {
  width: min(320px, 36vw);
  min-width: 260px;
  border-right: 1px solid rgba(226, 232, 240, 0.94);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.96));
  box-shadow: 10px 0 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.files-drawer,
.code-workspace,
.code-panel,
.code-editor,
.preview-frame textarea {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.72) transparent;
}

.files-drawer::-webkit-scrollbar,
.code-workspace::-webkit-scrollbar,
.code-panel::-webkit-scrollbar,
.code-editor::-webkit-scrollbar,
.preview-frame textarea::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.files-drawer::-webkit-scrollbar-track,
.code-workspace::-webkit-scrollbar-track,
.code-panel::-webkit-scrollbar-track,
.code-editor::-webkit-scrollbar-track,
.preview-frame textarea::-webkit-scrollbar-track {
  background: transparent;
}

.files-drawer::-webkit-scrollbar-thumb,
.code-workspace::-webkit-scrollbar-thumb,
.code-panel::-webkit-scrollbar-thumb,
.code-editor::-webkit-scrollbar-thumb,
.preview-frame textarea::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

/* Drawer headings and sections */
.files-drawer h2,
.files-drawer h3,
.files-drawer strong {
  color: #111827;
  letter-spacing: -0.025em;
}

.files-drawer p,
.files-drawer span {
  color: #6b7280;
}

/* Generic file buttons / rows */
.files-drawer button,
.files-drawer [role="button"] {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.files-drawer button:hover:not(:disabled),
.files-drawer [role="button"]:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.32) !important;
  background-color: rgba(239, 246, 255, 0.82) !important;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.files-drawer button:active:not(:disabled),
.files-drawer [role="button"]:active {
  transform: translateY(0) scale(0.99);
}

/* Selected/active file states */
.files-drawer .active,
.files-drawer .selected,
.files-drawer [aria-selected="true"],
.files-drawer [aria-current="true"],
.files-drawer button[aria-pressed="true"] {
  border-color: rgba(37, 99, 235, 0.56) !important;
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.98), rgba(255, 255, 255, 0.96)) !important;
  color: #1d4ed8 !important;
  box-shadow:
    0 0 0 1px rgba(37, 99, 235, 0.08),
    0 12px 24px rgba(37, 99, 235, 0.10);
}

/* Code workspace shell */
.code-workspace,
.code-panel {
  min-height: 100%;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #111827;
}

.code-workspace {
  padding: clamp(14px, 2vw, 22px);
}

.code-workspace h2,
.code-workspace h3,
.code-panel h2,
.code-panel h3 {
  color: #111827;
  font-weight: 900;
  letter-spacing: -0.045em;
}

/* Editor-like surfaces */
.code-workspace textarea,
.code-panel textarea,
.preview-frame textarea,
.code-editor,
pre.code-editor,
pre[class*="language-"] {
  width: 100%;
  min-height: 420px;
  border: 1px solid rgba(30, 41, 59, 0.12);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.98));
  color: #e5e7eb;
  box-shadow:
    0 22px 46px rgba(15, 23, 42, 0.16),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    "Courier New",
    monospace;
  font-size: 13px;
  line-height: 1.62;
  tab-size: 2;
}

.code-workspace textarea,
.code-panel textarea,
.preview-frame textarea {
  padding: 18px 20px;
  outline: none;
  resize: vertical;
}

.code-workspace textarea:focus,
.code-panel textarea:focus,
.preview-frame textarea:focus {
  border-color: rgba(96, 165, 250, 0.72);
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.12),
    0 22px 46px rgba(15, 23, 42, 0.16);
}

/* Code controls */
.code-workspace button,
.code-panel button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.code-workspace button:hover:not(:disabled),
.code-panel button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
}

.code-workspace button:active:not(:disabled),
.code-panel button:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.code-workspace button:disabled,
.code-panel button:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

/* File path chips / metadata */
.code-workspace code,
.code-panel code,
.files-drawer code {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.92);
  color: #374151;
  padding: 3px 8px;
  font-size: 12px;
}

/* Empty code/file states */
.files-drawer [data-empty="true"],
.code-workspace [data-empty="true"],
.code-panel [data-empty="true"] {
  border: 1px dashed rgba(148, 163, 184, 0.75);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  color: #6b7280;
  padding: 18px;
}

/* Make generated file lists feel less like a spreadsheet crime scene */
.files-drawer ul,
.files-drawer ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

.files-drawer li {
  margin: 0;
}

/* Mobile behaviour */
@media (max-width: 880px) {
  .files-drawer {
    width: 100%;
    min-width: 0;
    max-height: 240px;
    border-right: none;
    border-bottom: 1px solid rgba(226, 232, 240, 0.94);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
  }

  .code-workspace {
    padding: 12px;
  }

  .code-workspace textarea,
  .code-panel textarea,
  .preview-frame textarea,
  .code-editor,
  pre.code-editor,
  pre[class*="language-"] {
    min-height: 320px;
    border-radius: 18px;
    font-size: 12px;
    line-height: 1.56;
  }
}

@media (prefers-reduced-motion: reduce) {
  .files-drawer button,
  .files-drawer [role="button"],
  .code-workspace button,
  .code-panel button {
    transition: none;
  }

  .files-drawer button:hover:not(:disabled),
  .files-drawer [role="button"]:hover,
  .files-drawer button:active:not(:disabled),
  .files-drawer [role="button"]:active,
  .code-workspace button:hover:not(:disabled),
  .code-panel button:hover:not(:disabled),
  .code-workspace button:active:not(:disabled),
  .code-panel button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added code workspace and files drawer CSS polish.");
} else {
  console.log("Code workspace and files drawer CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Code workspace and Files drawer polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);