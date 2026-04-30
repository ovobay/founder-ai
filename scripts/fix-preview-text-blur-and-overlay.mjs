import fs from "node:fs";
import path from "node:path";

/**
 * Fixes blurred / washed-out generated preview text.
 *
 * Removes visual effects that commonly cause preview text to look smudged:
 * - filter blur
 * - backdrop-filter
 * - opacity overlays
 * - pseudo-element chrome overlays
 * - transform/GPU smoothing on preview surfaces
 *
 * Adds crisp text rules for generated preview content.
 */

const root = process.cwd();
const cssPath = path.join(root, "app/globals.css");

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

let css = fs.readFileSync(cssPath, "utf8");

const backupPath = path.join(
  root,
  `app/globals.backup-before-preview-blur-fix-${Date.now()}.css`
);

fs.writeFileSync(backupPath, css);

function removeCssBlockByTitle(title) {
  const marker = `/* ${title} */`;
  const start = css.indexOf(marker);

  if (start === -1) {
    console.log(`Skipped missing CSS block: ${title}`);
    return;
  }

  const next = css.indexOf("\n/* ", start + marker.length);

  if (next === -1) {
    css = css.slice(0, start).trimEnd() + "\n";
  } else {
    css = css.slice(0, start).trimEnd() + "\n\n" + css.slice(next).trimStart();
  }

  console.log(`Removed CSS block: ${title}`);
}

[
  "Founder AI generated preview polish",
  "Founder AI preview frame shell polish",
  "Founder AI feed and preview clarity repair",
].forEach(removeCssBlockByTitle);

if (!css.includes("Founder AI preview blur hard fix")) {
  css += `

/* Founder AI preview blur hard fix */
.preview-frame,
.preview-frame-wrap,
.preview-content {
  filter: none !important;
  backdrop-filter: none !important;
  transform: none !important;
  will-change: auto !important;
}

.preview-frame *,
.preview-frame-wrap *,
.preview-content * {
  text-shadow: none !important;
  filter: none !important;
  backdrop-filter: none !important;
}

/* Remove fake chrome/overlay layers that can sit above generated output. */
.preview-frame::before,
.preview-frame::after,
.preview-frame-wrap::before,
.preview-frame-wrap::after {
  content: none !important;
  display: none !important;
}

/* Keep the preview container clean and crisp. */
.preview-frame-wrap {
  background: #fbf7ef !important;
  border-radius: 24px;
  padding: 12px;
}

.preview-frame {
  background: #ffffff !important;
  overflow: auto;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 22px;
  box-shadow: 0 20px 54px rgba(15, 23, 42, 0.08);
}

/* Text rendering clarity. */
.preview-frame,
.preview-frame * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: geometricPrecision;
}

/* Prevent generated hero text from being washed out. */
.preview-frame h1,
.preview-frame h2,
.preview-frame h3,
.preview-frame p,
.preview-frame span,
.preview-frame a,
.preview-frame button {
  opacity: 1 !important;
}

/* Dark generated sections need readable text. */
.preview-frame [style*="#020617"] h1,
.preview-frame [style*="#030712"] h1,
.preview-frame [style*="#0f172a"] h1,
.preview-frame [style*="rgb(2, 6, 23)"] h1,
.preview-frame [style*="rgb(3, 7, 18)"] h1,
.preview-frame [style*="rgb(15, 23, 42)"] h1,
.preview-frame [style*="#020617"] h2,
.preview-frame [style*="#030712"] h2,
.preview-frame [style*="#0f172a"] h2,
.preview-frame [style*="rgb(2, 6, 23)"] h2,
.preview-frame [style*="rgb(3, 7, 18)"] h2,
.preview-frame [style*="rgb(15, 23, 42)"] h2,
.preview-frame [style*="#020617"] h3,
.preview-frame [style*="#030712"] h3,
.preview-frame [style*="#0f172a"] h3,
.preview-frame [style*="rgb(2, 6, 23)"] h3,
.preview-frame [style*="rgb(3, 7, 18)"] h3,
.preview-frame [style*="rgb(15, 23, 42)"] h3 {
  color: #ffffff !important;
}

.preview-frame [style*="#020617"] p,
.preview-frame [style*="#030712"] p,
.preview-frame [style*="#0f172a"] p,
.preview-frame [style*="rgb(2, 6, 23)"] p,
.preview-frame [style*="rgb(3, 7, 18)"] p,
.preview-frame [style*="rgb(15, 23, 42)"] p,
.preview-frame [style*="#020617"] span,
.preview-frame [style*="#030712"] span,
.preview-frame [style*="#0f172a"] span,
.preview-frame [style*="rgb(2, 6, 23)"] span,
.preview-frame [style*="rgb(3, 7, 18)"] span,
.preview-frame [style*="rgb(15, 23, 42)"] span {
  color: rgba(255, 255, 255, 0.82) !important;
}

/* Generated preview images/videos should not cause layout blur by scaling weirdly. */
.preview-frame img,
.preview-frame video {
  max-width: 100%;
  height: auto;
}
`;

  console.log("Added preview blur hard fix CSS.");
} else {
  console.log("Preview blur hard fix already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Preview blur/overlay fix complete.");
console.log(`CSS backup created at: ${backupPath}`);