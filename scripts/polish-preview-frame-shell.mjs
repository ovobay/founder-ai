import fs from "node:fs";
import path from "node:path";

/**
 * Polishes the preview frame shell.
 *
 * This improves the visual container around generated previews:
 * - softer frame background
 * - better preview surface
 * - cleaner scrollbars
 * - nicer loading state
 * - tighter mobile behaviour
 *
 * This is CSS-first and intentionally avoids JSX edits.
 * We are not inviting the parser goblin back for tea.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-preview-frame-shell-polish-${Date.now()}.css`
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

const frameHints = [
  "preview-frame-wrap",
  "preview-frame",
  "LoadingWorkspace",
  "PreviewContent",
];

const foundFrameHints = frameHints.filter((hint) => pageSource.includes(hint));

console.log(
  foundFrameHints.length
    ? `Found preview frame hints: ${foundFrameHints.join(", ")}`
    : "No preview frame hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI preview frame shell polish")) {
  css += `

/* Founder AI preview frame shell polish */
.preview-frame-wrap {
  background:
    radial-gradient(circle at 18% 12%, rgba(37, 99, 235, 0.08), transparent 28%),
    radial-gradient(circle at 88% 22%, rgba(124, 58, 237, 0.07), transparent 26%),
    linear-gradient(180deg, #fbf7ef 0%, #f8fafc 100%);
  border-radius: 28px;
  padding: clamp(10px, 1.5vw, 18px);
  min-width: 0;
}

.preview-frame {
  position: relative;
  min-width: 0;
  border: 1px solid rgba(226, 232, 240, 0.98);
  border-radius: 26px;
  background: #ffffff;
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.10),
    0 1px 0 rgba(255, 255, 255, 0.86) inset;
  overflow: hidden;
}

/* Subtle browser-like top edge without adding markup */
.preview-frame::before {
  content: "";
  display: block;
  height: 12px;
  background:
    linear-gradient(90deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.98));
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

/* Avoid double chrome on full-screen-like generated content */
.preview-frame > * {
  min-width: 0;
}

/* Cleaner internal scrolling */
.preview-frame,
.preview-content,
.preview-frame-wrap {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
}

.preview-frame::-webkit-scrollbar,
.preview-content::-webkit-scrollbar,
.preview-frame-wrap::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.preview-frame::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track,
.preview-frame-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.preview-frame::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb,
.preview-frame-wrap::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

/* Loading workspace polish */
.preview-frame .loading-workspace,
.loading-workspace {
  min-height: 360px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.08), transparent 34%),
    linear-gradient(180deg, #fffaf2, #ffffff);
  color: #4b5563;
}

.loading-workspace::after {
  content: "Preparing workspace";
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #374151;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  padding: 0 14px;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.02em;
  animation: founderAiPreviewLoadingFloat 1100ms ease-in-out infinite;
}

/* Keep file drawer and frame from visually fighting each other */
.preview-content {
  background:
    linear-gradient(180deg, rgba(255, 250, 242, 0.82), rgba(248, 250, 252, 0.98));
}

.files-drawer + .preview-frame-wrap,
.preview-frame-wrap:has(+ .files-drawer) {
  min-width: 0;
}

/* Toolbar-to-frame rhythm */
.preview-toolbar + .preview-content,
.preview-toolbar + * {
  border-top-color: rgba(226, 232, 240, 0.78);
}

/* Generated preview should not touch the frame chrome */
.preview-frame .preview-website,
.preview-frame .generated-preview,
.preview-frame .product-preview,
.preview-frame .preview-site {
  min-height: calc(100% - 12px);
}

/* Mobile preview shell */
@media (max-width: 760px) {
  .preview-frame-wrap {
    border-radius: 20px;
    padding: 8px;
  }

  .preview-frame {
    border-radius: 20px;
  }

  .preview-frame::before {
    height: 8px;
  }

  .loading-workspace {
    min-height: 260px;
  }
}

@keyframes founderAiPreviewLoadingFloat {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.78;
  }

  50% {
    transform: translateY(-2px);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-workspace::after {
    animation: none;
  }
}
`;

  console.log("✅ Added preview frame shell CSS polish.");
} else {
  console.log("Preview frame shell CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Preview frame shell polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);