import fs from "node:fs";
import path from "node:path";

/**
 * Polishes background-working feed cards.
 *
 * Goal:
 * - Assistant work should look like a compact in-progress card.
 * - It should not dump a long task list while running.
 * - Detailed steps should be visually quiet until completion.
 *
 * This is mostly CSS polish because the BackgroundWorkingCard component already
 * exists in app/page.tsx. We are not poking the JSX beast unless we must.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-background-working-polish-${Date.now()}.css`
);

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

const pageSource = fs.readFileSync(pagePath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync(backupCssPath, css);

const hasBackgroundWorkingCard =
  pageSource.includes("BackgroundWorkingCard") ||
  pageSource.includes("isAssistantBuildWorking");

if (!hasBackgroundWorkingCard) {
  console.log(
    "⚠️ BackgroundWorkingCard was not found in app/page.tsx. CSS will still be added safely."
  );
}

if (!css.includes("Founder AI background working card polish")) {
  css += `

/* Founder AI background working card polish */
.feed-list .assistant-build-card,
.feed-list .background-working-card,
.feed-list [data-background-working="true"] {
  max-width: min(760px, 100%);
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 247, 241, 0.94));
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.assistant-build-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  width: fit-content;
  border-radius: 999px;
  padding: 0 10px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.assistant-build-status::before {
  content: "";
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 999px;
  background: currentColor;
  animation: founderAiWorkingPulse 1100ms ease-in-out infinite;
}

.assistant-build-heading {
  margin-top: 10px;
  margin-bottom: 5px;
  color: #111827;
  font-size: clamp(16px, 1.4vw, 20px);
  font-weight: 850;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.assistant-build-summary {
  margin: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.5;
}

/* Keep running work compact. Nobody needs a novel while the machine is still chewing. */
.assistant-build-card ul,
.background-working-card ul,
[data-background-working="true"] ul {
  max-height: 96px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 64%, transparent 100%);
}

.assistant-build-card li,
.background-working-card li,
[data-background-working="true"] li {
  color: #4b5563;
  font-size: 12px;
  line-height: 1.45;
}

/* Subtle shimmer strip for active assistant work */
.assistant-build-card::after,
.background-working-card::after,
[data-background-working="true"]::after {
  content: "";
  display: block;
  height: 3px;
  background:
    linear-gradient(
      90deg,
      rgba(37, 99, 235, 0),
      rgba(37, 99, 235, 0.55),
      rgba(124, 58, 237, 0.55),
      rgba(37, 99, 235, 0)
    );
  background-size: 220% 100%;
  animation: founderAiWorkingShimmer 1500ms ease-in-out infinite;
}

@keyframes founderAiWorkingPulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.92);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes founderAiWorkingShimmer {
  0% {
    background-position: 220% 0;
  }

  100% {
    background-position: -220% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .assistant-build-status::before,
  .assistant-build-card::after,
  .background-working-card::after,
  [data-background-working="true"]::after {
    animation: none;
  }
}
`;

  console.log("✅ Added background working card CSS polish.");
} else {
  console.log("Background working card CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Background working card polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);