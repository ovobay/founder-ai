import fs from "node:fs";
import path from "node:path";

/**
 * Adds CSS polish to PublishDropdownPopover without destructively rewriting
 * the full component.
 *
 * Adds:
 * - publish-dropdown-shell class on the root dropdown
 * - smoother button hover/active states
 * - input focus ring
 * - cleaner code blocks
 * - subtle scrollbar styling
 * - disabled button behaviour
 *
 * This is intentionally incremental. Fully extracting every inline style from
 * app/page.tsx should be done in smaller passes, unless we want the compiler
 * to start speaking in tongues again.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const cssPath = path.join(process.cwd(), "app/globals.css");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-dropdown-css-polish-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

const startMarker = "function PublishDropdownPopover({";
const endMarker = "function PreviewToolbar({";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1) {
  fail("Could not find function PublishDropdownPopover.");
}

if (end === -1) {
  fail("Could not find function PreviewToolbar after PublishDropdownPopover.");
}

let section = source.slice(start, end);

/**
 * Add className to the root dropdown panel.
 */
if (!section.includes('className="publish-dropdown-shell"')) {
  const marker = `      aria-label="Publish options"
      style={{`;

  if (!section.includes(marker)) {
    fail("Could not find root Publish dropdown aria-label marker.");
  }

  section = section.replace(
    marker,
    `      aria-label="Publish options"
      className="publish-dropdown-shell"
      style={{`
  );

  console.log("Added publish-dropdown-shell class.");
} else {
  console.log("publish-dropdown-shell class already exists.");
}

/**
 * Replace patched section.
 */
source = source.slice(0, start) + section + source.slice(end);

/**
 * Add CSS polish.
 */
if (!css.includes("Founder AI publish dropdown polish")) {
  css += `

/* Founder AI publish dropdown polish */
.publish-dropdown-shell {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
}

.publish-dropdown-shell::-webkit-scrollbar {
  width: 9px;
}

.publish-dropdown-shell::-webkit-scrollbar-track {
  background: transparent;
}

.publish-dropdown-shell::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

.publish-dropdown-shell button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
}

.publish-dropdown-shell button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);
  border-color: rgba(37, 99, 235, 0.38) !important;
}

.publish-dropdown-shell button:active:not(:disabled) {
  transform: translateY(0) scale(0.985);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.10);
}

.publish-dropdown-shell button:disabled {
  cursor: wait !important;
  opacity: 0.78;
}

.publish-dropdown-shell input {
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background-color 140ms ease;
}

.publish-dropdown-shell input:focus {
  border-color: rgba(37, 99, 235, 0.72) !important;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
}

.publish-dropdown-shell code {
  user-select: all;
}

.publish-dropdown-shell .publish-button {
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
}

.publish-dropdown-shell .publish-button:hover:not(:disabled) {
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
}

@media (prefers-reduced-motion: reduce) {
  .publish-dropdown-shell button,
  .publish-dropdown-shell input {
    transition: none;
  }

  .publish-dropdown-shell button:hover:not(:disabled),
  .publish-dropdown-shell button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("Added publish dropdown CSS polish.");
} else {
  console.log("Publish dropdown CSS polish already exists.");
}

fs.writeFileSync(pagePath, source);
fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Publish dropdown CSS polish added.");
console.log(`Backup created at: ${backupPath}`);