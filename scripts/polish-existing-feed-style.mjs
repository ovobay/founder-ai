import fs from "node:fs";
import path from "node:path";

/**
 * Polishes the existing builder feed style without changing its layout model.
 *
 * Reason:
 * The original feed style fits this product better than forced left/right
 * messenger bubbles. This pass keeps the soft builder feed from the screenshots
 * and improves only the visual quality.
 *
 * Adds:
 * - softer user prompt bubble polish
 * - better assistant paragraph rhythm
 * - cleaner build/update cards
 * - nicer Details / Preview buttons
 * - refined action icon spacing
 * - mobile tightening
 *
 * CSS-first. No JSX edits. Let the compiler sleep. It has earned absolutely
 * nothing, but we need peace.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-existing-feed-style-polish-${Date.now()}.css`
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
  "feed-list",
  "FeedMessage",
  "BuildUpdate",
  "Details",
  "Preview",
  "activity-feed",
  "feedItems",
];

const foundHints = hints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found existing feed hints: ${foundHints.join(", ")}`
    : "No exact feed hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI existing feed style polish")) {
  css += `

/* Founder AI existing feed style polish */
/* Keeps the current builder-style feed layout instead of forcing messenger bubbles. */
.activity-feed,
.feed-list,
.command-scroll-area {
  color: #111827;
}

.feed-list {
  display: grid;
  gap: 18px;
  align-content: start;
}

/* General feed cards */
.feed-list article,
.activity-feed article {
  border-color: rgba(226, 232, 240, 0.86);
}

/* User prompt bubble, matching the softer centered style from the reference */
.feed-list article[class*="user"],
.feed-list [data-role="user"],
.feed-list .user-message,
.feed-list .feed-message-user {
  max-width: min(720px, calc(100% - 48px));
  margin-left: auto;
  margin-right: auto;
  border: 1px solid rgba(238, 235, 228, 0.95);
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(250, 247, 241, 0.98), rgba(247, 244, 238, 0.96));
  color: #3f3f46;
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.045),
    0 1px 0 rgba(255, 255, 255, 0.78) inset;
}

/* Do not let earlier bubble rules overpower the reference layout */
.feed-list article[class*="user"] *,
.feed-list [data-role="user"] *,
.feed-list .user-message *,
.feed-list .feed-message-user * {
  color: inherit;
}

/* Assistant text should read like a builder transcript, not a cramped chat bubble */
.feed-list article[class*="assistant"],
.feed-list [data-role="assistant"],
.feed-list .assistant-message,
.feed-list .feed-message-assistant {
  max-width: min(820px, calc(100% - 32px));
  margin-left: 0;
  margin-right: auto;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  color: #3f3f46;
}

/* Assistant prose rhythm */
.feed-list article[class*="assistant"] p,
.feed-list [data-role="assistant"] p,
.feed-list .assistant-message p,
.feed-list .feed-message-assistant p,
.activity-feed p {
  color: #3f3f46;
  font-size: clamp(15px, 1.55vw, 18px);
  line-height: 1.72;
  letter-spacing: -0.015em;
}

.feed-list article[class*="assistant"] > p:first-child,
.feed-list [data-role="assistant"] > p:first-child {
  margin-top: 0;
}

/* Build/update cards, like the Enhanced homepage animations card */
.feed-list article:not([class*="user"]),
.activity-feed article:not([class*="user"]) {
  overflow-wrap: anywhere;
}

.feed-list article h1,
.feed-list article h2,
.feed-list article h3,
.feed-list article strong {
  color: #111827;
  letter-spacing: -0.035em;
}

.feed-list article h3,
.activity-feed article h3 {
  font-size: clamp(18px, 2vw, 24px);
  line-height: 1.15;
  font-weight: 850;
}

/* Common update/build card styling without hijacking plain assistant prose */
.feed-list article:has(button),
.activity-feed article:has(button) {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 248, 244, 0.94));
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.055),
    0 1px 0 rgba(255, 255, 255, 0.82) inset;
}

/* Build/update card header divider if present */
.feed-list article:has(button) > div,
.activity-feed article:has(button) > div {
  min-width: 0;
}

/* Details / Preview style buttons */
.feed-list article button,
.activity-feed article button {
  min-height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(215, 219, 227, 0.94);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.feed-list article button:hover:not(:disabled),
.activity-feed article button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.feed-list article button:active:not(:disabled),
.activity-feed article button:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

/* Icon/action row beneath messages */
.feed-list article svg,
.activity-feed article svg {
  stroke-width: 2.15;
}

.feed-list article small,
.feed-list article time,
.activity-feed article small,
.activity-feed article time {
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

/* Code chips like InboxViewSidebar should not look like a disease */
.feed-list article code,
.activity-feed article code {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 9px;
  background: rgba(248, 250, 252, 0.92);
  color: #374151;
  padding: 2px 7px;
  font-size: 0.88em;
}

/* Suggested prompt chips near the composer */
.activity-feed + div button,
.command-center button,
.command-panel button {
  white-space: nowrap;
}

/* Keep long assistant output readable */
.feed-list pre,
.activity-feed pre {
  max-width: 100%;
  overflow: auto;
  border: 1px solid rgba(30, 41, 59, 0.16);
  border-radius: 18px;
  background: #111827;
  color: #e5e7eb;
  padding: 14px;
  font-size: 12px;
  line-height: 1.55;
}

/* Fades like the screenshot, softer and less intrusive */
.activity-fade {
  pointer-events: none;
}

.activity-fade-top {
  background: linear-gradient(180deg, rgba(255, 250, 242, 0.96), transparent);
}

.activity-fade-bottom {
  background: linear-gradient(0deg, rgba(255, 250, 242, 0.96), transparent);
}

/* Scroll-to-bottom button polish */
.activity-feed button[aria-label*="bottom"],
.activity-feed button[aria-label*="scroll"],
.feed-list button[aria-label*="bottom"],
.feed-list button[aria-label*="scroll"] {
  border-radius: 999px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

/* Mobile tightening */
@media (max-width: 760px) {
  .feed-list {
    gap: 14px;
  }

  .feed-list article[class*="user"],
  .feed-list [data-role="user"],
  .feed-list .user-message,
  .feed-list .feed-message-user {
    max-width: calc(100% - 28px);
    border-radius: 22px;
  }

  .feed-list article[class*="assistant"],
  .feed-list [data-role="assistant"],
  .feed-list .assistant-message,
  .feed-list .feed-message-assistant {
    max-width: 100%;
  }

  .feed-list article[class*="assistant"] p,
  .feed-list [data-role="assistant"] p,
  .feed-list .assistant-message p,
  .feed-list .feed-message-assistant p,
  .activity-feed p {
    font-size: 15px;
    line-height: 1.62;
  }

  .feed-list article:has(button),
  .activity-feed article:has(button) {
    border-radius: 20px;
  }

  .feed-list article button,
  .activity-feed article button {
    min-height: 38px;
    border-radius: 13px;
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed-list article button,
  .activity-feed article button {
    transition: none;
  }

  .feed-list article button:hover:not(:disabled),
  .activity-feed article button:hover:not(:disabled),
  .feed-list article button:active:not(:disabled),
  .activity-feed article button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added existing feed style polish.");
} else {
  console.log("Existing feed style polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Existing feed style polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);