import fs from "node:fs";
import path from "node:path";

/**
 * Polishes the preview toolbar / workspace switcher.
 *
 * Goal:
 * - Make toolbar buttons feel consistent.
 * - Improve active states.
 * - Improve hover/press behaviour.
 * - Keep Publish dropdown alignment sane.
 * - Make mobile wrapping less tragic.
 *
 * CSS-first. No JSX surgery. We have learned things. Painful things.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-preview-toolbar-polish-${Date.now()}.css`
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

const toolbarHints = [
  "preview-toolbar",
  "preview-button",
  "tool-button",
  "tool-button-active",
  "publish-button",
];

const foundToolbarHints = toolbarHints.filter((hint) => pageSource.includes(hint));

console.log(
  foundToolbarHints.length
    ? `Found toolbar hints: ${foundToolbarHints.join(", ")}`
    : "No toolbar class hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI preview toolbar polish")) {
  css += `

/* Founder AI preview toolbar polish */
.preview-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  backdrop-filter: blur(14px);
  z-index: 20;
}

.preview-toolbar::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 1px;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(37, 99, 235, 0.22),
      rgba(124, 58, 237, 0.18),
      transparent
    );
  pointer-events: none;
}

.preview-toolbar .preview-button,
.preview-toolbar .tool-button,
.preview-toolbar .publish-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(215, 219, 227, 0.95);
  background: rgba(255, 255, 255, 0.86);
  color: #374151;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
}

.preview-toolbar .preview-button {
  padding: 0 13px;
}

.preview-toolbar .tool-button {
  width: 38px;
  padding: 0;
}

.preview-toolbar .publish-button {
  min-width: 92px;
  padding: 0 16px;
  border-color: rgba(37, 99, 235, 0.32);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.98), rgba(29, 78, 216, 0.96));
  color: #ffffff;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22);
}

.preview-toolbar .preview-button:hover:not(:disabled),
.preview-toolbar .tool-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.34);
  background: #ffffff;
  color: #111827;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.09);
}

.preview-toolbar .publish-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.28);
}

.preview-toolbar .preview-button:active:not(:disabled),
.preview-toolbar .tool-button:active:not(:disabled),
.preview-toolbar .publish-button:active:not(:disabled) {
  transform: translateY(0) scale(0.985);
}

.preview-toolbar .tool-button-active,
.preview-toolbar .preview-button[aria-pressed="true"] {
  border-color: rgba(37, 99, 235, 0.54);
  background: #eff6ff;
  color: #1d4ed8;
  box-shadow:
    0 0 0 1px rgba(37, 99, 235, 0.08),
    0 10px 22px rgba(37, 99, 235, 0.10);
}

.preview-toolbar .tool-button-active .icon,
.preview-toolbar .preview-button[aria-pressed="true"] .icon {
  color: #1d4ed8;
}

.preview-toolbar .icon {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  stroke-width: 2.35;
}

.preview-toolbar .publish-button .icon {
  color: currentColor;
}

/* Keep dropdown wrapper aligned with toolbar rhythm */
.preview-toolbar > div[style*="inline-flex"] {
  display: inline-flex !important;
  align-items: center;
}

/* Prevent toolbar from becoming a horizontal punishment on small screens */
@media (max-width: 880px) {
  .preview-toolbar {
    flex-wrap: wrap;
    gap: 7px;
    min-height: auto;
    padding: 9px;
  }

  .preview-toolbar .preview-button,
  .preview-toolbar .tool-button,
  .preview-toolbar .publish-button {
    min-height: 36px;
    border-radius: 13px;
  }

  .preview-toolbar .tool-button {
    width: 36px;
  }

  .preview-toolbar .publish-button {
    min-width: 86px;
  }
}

@media (max-width: 520px) {
  .preview-toolbar {
    justify-content: flex-start;
  }

  .preview-toolbar .preview-button {
    flex: 1 1 auto;
    min-width: 116px;
  }

  .preview-toolbar > div[style*="inline-flex"] {
    flex: 1 1 100%;
  }

  .preview-toolbar > div[style*="inline-flex"] .publish-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .preview-toolbar .preview-button,
  .preview-toolbar .tool-button,
  .preview-toolbar .publish-button {
    transition: none;
  }

  .preview-toolbar .preview-button:hover:not(:disabled),
  .preview-toolbar .tool-button:hover:not(:disabled),
  .preview-toolbar .publish-button:hover:not(:disabled),
  .preview-toolbar .preview-button:active:not(:disabled),
  .preview-toolbar .tool-button:active:not(:disabled),
  .preview-toolbar .publish-button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added preview toolbar CSS polish.");
} else {
  console.log("Preview toolbar CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Preview toolbar polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);