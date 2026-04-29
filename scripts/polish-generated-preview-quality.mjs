import fs from "node:fs";
import path from "node:path";

/**
 * Polishes generated preview quality.
 *
 * Goal:
 * - Make generated previews feel more premium and structured.
 * - Reduce oversized spacing and random card bloat.
 * - Improve responsive layout.
 * - Keep this CSS-first to avoid breaking JSX again, because apparently
 *   app/page.tsx is a haunted mansion with imports.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-generated-preview-polish-${Date.now()}.css`
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

const previewHints = [
  "PreviewWebsite",
  "preview-website",
  "preview-frame",
  "preview-frame-wrap",
  "preview-hero",
  "preview-section",
  "preview-card",
];

const foundHints = previewHints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found preview hints: ${foundHints.join(", ")}`
    : "No specific preview class hints found. Adding broad safe CSS polish."
);

if (!css.includes("Founder AI generated preview polish")) {
  css += `

/* Founder AI generated preview polish */
.preview-frame {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 34%),
    linear-gradient(180deg, #fffaf2 0%, #ffffff 42%, #f8fafc 100%);
}

.preview-frame * {
  box-sizing: border-box;
}

.preview-frame h1,
.preview-frame h2,
.preview-frame h3 {
  color: #111827;
  letter-spacing: -0.045em;
}

.preview-frame p {
  color: #4b5563;
}

/* Generic generated-preview shell support */
.preview-website,
.generated-preview,
.product-preview,
.preview-site {
  min-height: 100%;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 32%),
    linear-gradient(180deg, #fffaf2 0%, #ffffff 46%, #f8fafc 100%);
  color: #111827;
}

/* Hero polish */
.preview-hero,
.generated-preview-hero,
.product-preview-hero,
.preview-site-hero {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(42px, 7vw, 82px) clamp(18px, 4vw, 42px) clamp(28px, 5vw, 56px);
  display: grid;
  gap: clamp(18px, 3vw, 30px);
}

.preview-hero h1,
.generated-preview-hero h1,
.product-preview-hero h1,
.preview-site-hero h1 {
  max-width: 780px;
  margin: 0;
  color: #111827;
  font-size: clamp(38px, 7vw, 76px);
  line-height: 0.92;
  letter-spacing: -0.075em;
  font-weight: 900;
}

.preview-hero p,
.generated-preview-hero p,
.product-preview-hero p,
.preview-site-hero p {
  max-width: 660px;
  margin: 0;
  color: #4b5563;
  font-size: clamp(15px, 1.7vw, 19px);
  line-height: 1.58;
}

/* Section rhythm */
.preview-section,
.generated-preview-section,
.product-preview-section,
.preview-site-section {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(26px, 5vw, 54px) clamp(18px, 4vw, 42px);
}

.preview-section > h2,
.generated-preview-section > h2,
.product-preview-section > h2,
.preview-site-section > h2 {
  max-width: 760px;
  margin: 0 0 14px;
  color: #111827;
  font-size: clamp(26px, 4vw, 46px);
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.06em;
}

.preview-section > p,
.generated-preview-section > p,
.product-preview-section > p,
.preview-site-section > p {
  max-width: 700px;
  margin: 0 0 22px;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.58;
}

/* Card grids */
.preview-card-grid,
.generated-preview-grid,
.product-preview-grid,
.preview-site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(245px, 100%), 1fr));
  gap: clamp(12px, 2vw, 18px);
}

.preview-card,
.generated-preview-card,
.product-preview-card,
.preview-site-card,
.preview-frame article {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
}

.preview-card,
.generated-preview-card,
.product-preview-card,
.preview-site-card {
  padding: clamp(18px, 2.4vw, 26px);
}

.preview-card h3,
.generated-preview-card h3,
.product-preview-card h3,
.preview-site-card h3,
.preview-frame article h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #111827;
  font-size: clamp(17px, 2vw, 22px);
  line-height: 1.15;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.preview-card p,
.generated-preview-card p,
.product-preview-card p,
.preview-site-card p,
.preview-frame article p {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.56;
}

/* Generated buttons and CTAs */
.preview-frame a,
.preview-frame button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.preview-frame a:hover,
.preview-frame button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.preview-frame a:active,
.preview-frame button:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

/* Avoid common AI-output bloat */
.preview-frame section {
  scroll-margin-top: 90px;
}

.preview-frame img,
.preview-frame video {
  max-width: 100%;
  height: auto;
  border-radius: 22px;
}

/* Better empty/placeholder surfaces */
.preview-frame [data-empty="true"],
.preview-empty-state,
.generated-preview-empty {
  border: 1px dashed rgba(148, 163, 184, 0.75);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  color: #6b7280;
  padding: 24px;
}

/* Mobile tightening */
@media (max-width: 760px) {
  .preview-frame {
    background: linear-gradient(180deg, #fffaf2 0%, #ffffff 50%, #f8fafc 100%);
  }

  .preview-hero,
  .generated-preview-hero,
  .product-preview-hero,
  .preview-site-hero {
    padding: 34px 16px 24px;
  }

  .preview-section,
  .generated-preview-section,
  .product-preview-section,
  .preview-site-section {
    padding: 22px 16px;
  }

  .preview-card,
  .generated-preview-card,
  .product-preview-card,
  .preview-site-card {
    border-radius: 20px;
    padding: 17px;
  }

  .preview-card-grid,
  .generated-preview-grid,
  .product-preview-grid,
  .preview-site-grid {
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .preview-frame a,
  .preview-frame button {
    transition: none;
  }

  .preview-frame a:hover,
  .preview-frame button:hover:not(:disabled),
  .preview-frame a:active,
  .preview-frame button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added generated preview CSS polish.");
} else {
  console.log("Generated preview CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Generated preview polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);