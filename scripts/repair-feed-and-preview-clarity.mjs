import fs from "node:fs";
import path from "node:path";

/**
 * Repairs the feed/chat visual style and preview text clarity.
 *
 * This script intentionally avoids JSX edits.
 *
 * It removes previous CSS polish blocks that caused:
 * - forced messenger-style chat bubbles
 * - oversized blue user bubble
 * - bulky background working card
 * - preview text blur/softness
 *
 * Then it adds safer CSS that:
 * - keeps the reference builder-style feed layout
 * - uses a soft neutral user prompt bubble
 * - lets assistant text flow naturally
 * - makes the working card compact and calm
 * - removes blur/filter/backdrop issues from the preview area
 * - forces dark preview hero text to be crisp and readable
 *
 * Frontend lesson for today:
 * CSS is powerful, which is why it keeps ruining lives quietly.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const cssBackupPath = path.join(
  process.cwd(),
  `app/globals.backup-before-feed-preview-clarity-repair-${Date.now()}.css`
);

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let css = fs.readFileSync(cssPath, "utf8");
const pageSource = fs.readFileSync(pagePath, "utf8");

fs.writeFileSync(cssBackupPath, css);

function removeCssBlockByTitle(source, title) {
  /**
   * Removes a CSS block that begins with a named comment.
   *
   * It removes from:
   *   /* title *\/
   *
   * Until the next top-level comment that starts with:
   *   /* 
   *
   * This is intentionally simple and scoped to our appended CSS sections.
   */
  const startComment = `/* ${title} */`;
  const startIndex = source.indexOf(startComment);

  if (startIndex === -1) {
    return {
      css: source,
      removed: false,
    };
  }

  const nextCommentIndex = source.indexOf("\n/* ", startIndex + startComment.length);

  if (nextCommentIndex === -1) {
    return {
      css: source.slice(0, startIndex).trimEnd() + "\n",
      removed: true,
    };
  }

  return {
    css:
      source.slice(0, startIndex).trimEnd() +
      "\n\n" +
      source.slice(nextCommentIndex).trimStart(),
    removed: true,
  };
}

const blocksToRemove = [
  "Founder AI feed message alignment polish",
  "Founder AI existing feed style polish",
  "Founder AI background working card polish",
  "Founder AI generated preview polish",
  "Founder AI preview frame shell polish",
];

for (const blockTitle of blocksToRemove) {
  const result = removeCssBlockByTitle(css, blockTitle);
  css = result.css;

  if (result.removed) {
    console.log(`Removed CSS block: ${blockTitle}`);
  } else {
    console.log(`CSS block not found, skipped: ${blockTitle}`);
  }
}

const foundHints = [
  "feed-list",
  "FeedMessage",
  "BackgroundWorkingCard",
  "assistant-build-card",
  "preview-frame",
  "PreviewWebsite",
].filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found relevant source hints: ${foundHints.join(", ")}`
    : "No exact source hints found. Applying safe repair CSS anyway."
);

if (!css.includes("Founder AI feed and preview clarity repair")) {
  css += `

/* Founder AI feed and preview clarity repair */

/* -------------------------------------------------------
   1. Preview clarity repair
   ------------------------------------------------------- */

/* Remove accidental blur/softening from preview surfaces. */
.preview-frame,
.preview-frame *,
.preview-website,
.preview-website *,
.generated-preview,
.generated-preview *,
.product-preview,
.product-preview *,
.preview-site,
.preview-site * {
  filter: none !important;
  text-shadow: none !important;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

/* Keep the preview frame clean without fake blur chrome sitting over the content. */
.preview-frame {
  background: #ffffff !important;
  overflow: auto;
}

/* Remove pseudo chrome that may visually overlay content. */
.preview-frame::before,
.preview-frame::after {
  content: none !important;
  display: none !important;
}

/* Prevent parent overlays from washing out generated content. */
.preview-frame-wrap {
  background:
    linear-gradient(180deg, #fbf7ef 0%, #f8fafc 100%) !important;
  border-radius: 24px;
  padding: 12px;
}

/* Make generated dark hero sections readable and crisp.
   The generated preview often uses inline dark backgrounds, so we use !important.
 */
.preview-frame [style*="background"] h1,
.preview-frame [style*="background"] h2,
.preview-frame [style*="background"] h3 {
  opacity: 1 !important;
}

/* If a hero/card is dark, force the major text to be light and readable. */
.preview-frame [style*="#020617"] h1,
.preview-frame [style*="#020617"] h2,
.preview-frame [style*="#020617"] h3,
.preview-frame [style*="#030712"] h1,
.preview-frame [style*="#030712"] h2,
.preview-frame [style*="#030712"] h3,
.preview-frame [style*="#0f172a"] h1,
.preview-frame [style*="#0f172a"] h2,
.preview-frame [style*="#0f172a"] h3,
.preview-frame [style*="rgb(2, 6, 23)"] h1,
.preview-frame [style*="rgb(2, 6, 23)"] h2,
.preview-frame [style*="rgb(2, 6, 23)"] h3,
.preview-frame [style*="rgb(3, 7, 18)"] h1,
.preview-frame [style*="rgb(3, 7, 18)"] h2,
.preview-frame [style*="rgb(3, 7, 18)"] h3,
.preview-frame [style*="rgb(15, 23, 42)"] h1,
.preview-frame [style*="rgb(15, 23, 42)"] h2,
.preview-frame [style*="rgb(15, 23, 42)"] h3 {
  color: #ffffff !important;
  opacity: 1 !important;
}

/* Dark hero body text should not look like smoke. */
.preview-frame [style*="#020617"] p,
.preview-frame [style*="#030712"] p,
.preview-frame [style*="#0f172a"] p,
.preview-frame [style*="rgb(2, 6, 23)"] p,
.preview-frame [style*="rgb(3, 7, 18)"] p,
.preview-frame [style*="rgb(15, 23, 42)"] p {
  color: rgba(255, 255, 255, 0.78) !important;
  opacity: 1 !important;
}

/* Keep preview content sharp when transforms were added elsewhere. */
.preview-frame,
.preview-frame-wrap,
.preview-content {
  transform: none !important;
  will-change: auto !important;
}

/* Keep generated preview spacing premium but not oversized. */
.preview-frame section {
  scroll-margin-top: 88px;
}

.preview-frame img,
.preview-frame video {
  max-width: 100%;
  height: auto;
}

/* -------------------------------------------------------
   2. Feed layout repair
   ------------------------------------------------------- */

/* Keep the builder feed layout from the reference. */
.feed-list {
  display: grid;
  gap: 18px;
  align-content: start;
}

/* Neutralise the previous forced messenger layout. */
.feed-list article,
.activity-feed article {
  max-width: none;
  word-break: normal;
  overflow-wrap: anywhere;
}

/* User prompt bubble: soft, wide, calm, reference-style.
   This overrides the accidental oversized blue bubble.
 */
.feed-list [data-role="user"],
.feed-list article[class*="user"],
.feed-list .user-message,
.feed-list .feed-message-user,
.activity-feed [data-role="user"],
.activity-feed article[class*="user"],
.activity-feed .user-message,
.activity-feed .feed-message-user {
  width: fit-content !important;
  max-width: min(720px, calc(100% - 56px)) !important;
  margin-left: auto !important;
  margin-right: auto !important;
  border: 1px solid rgba(238, 235, 228, 0.96) !important;
  border-radius: 26px !important;
  background:
    linear-gradient(180deg, rgba(250, 247, 241, 0.98), rgba(247, 244, 238, 0.96)) !important;
  color: #3f3f46 !important;
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.045),
    0 1px 0 rgba(255, 255, 255, 0.78) inset !important;
}

/* User prompt text should not inherit the blue bubble white text. */
.feed-list [data-role="user"] *,
.feed-list article[class*="user"] *,
.feed-list .user-message *,
.feed-list .feed-message-user *,
.activity-feed [data-role="user"] *,
.activity-feed article[class*="user"] *,
.activity-feed .user-message *,
.activity-feed .feed-message-user * {
  color: #3f3f46 !important;
}

/* Assistant prose: natural transcript layout, not a chat bubble. */
.feed-list [data-role="assistant"],
.feed-list article[class*="assistant"],
.feed-list .assistant-message,
.feed-list .feed-message-assistant,
.activity-feed [data-role="assistant"],
.activity-feed article[class*="assistant"],
.activity-feed .assistant-message,
.activity-feed .feed-message-assistant {
  max-width: min(820px, calc(100% - 32px)) !important;
  margin-left: 0 !important;
  margin-right: auto !important;
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
  color: #3f3f46 !important;
}

/* Assistant paragraph rhythm like the reference. */
.feed-list [data-role="assistant"] p,
.feed-list article[class*="assistant"] p,
.feed-list .assistant-message p,
.feed-list .feed-message-assistant p,
.activity-feed [data-role="assistant"] p,
.activity-feed article[class*="assistant"] p,
.activity-feed .assistant-message p,
.activity-feed .feed-message-assistant p {
  color: #3f3f46 !important;
  font-size: clamp(15px, 1.48vw, 17px);
  line-height: 1.72;
  letter-spacing: -0.012em;
}

/* -------------------------------------------------------
   3. Compact background working card
   ------------------------------------------------------- */

/* The running build card should be compact, not a giant blue billboard. */
.assistant-build-card,
.background-working-card,
[data-background-working="true"] {
  max-width: min(560px, calc(100% - 36px)) !important;
  margin-left: 0 !important;
  margin-right: auto !important;
  border: 1px solid rgba(226, 232, 240, 0.95) !important;
  border-radius: 22px !important;
  background:
    radial-gradient(circle at 82% 18%, rgba(37, 99, 235, 0.08), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 248, 244, 0.94)) !important;
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.82) inset !important;
  overflow: hidden;
}

/* Remove the oversized blue/bright treatment from running card internals. */
.assistant-build-card *,
.background-working-card *,
[data-background-working="true"] * {
  text-shadow: none !important;
}

/* Small uppercase status. */
.assistant-build-status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  border-radius: 999px;
  padding: 0 10px;
  background: rgba(37, 99, 235, 0.09) !important;
  color: #1d4ed8 !important;
  font-size: 11px !important;
  font-weight: 900 !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase;
}

/* Pulse dot, subtle enough not to beg for attention. */
.assistant-build-status::before {
  content: "";
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 999px;
  background: currentColor;
  animation: founderAiRepairWorkingPulse 1100ms ease-in-out infinite;
}

/* Working card heading and copy. */
.assistant-build-heading {
  margin: 10px 0 6px !important;
  color: #111827 !important;
  font-size: clamp(17px, 1.5vw, 21px) !important;
  font-weight: 850 !important;
  line-height: 1.15 !important;
  letter-spacing: -0.035em !important;
}

.assistant-build-summary {
  margin: 0 !important;
  color: #4b5563 !important;
  font-size: 14px !important;
  line-height: 1.56 !important;
}

/* Progress area should be compact. */
.assistant-build-card ul,
.background-working-card ul,
[data-background-working="true"] ul {
  max-height: 90px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 68%, transparent 100%);
}

.assistant-build-card li,
.background-working-card li,
[data-background-working="true"] li {
  color: #4b5563 !important;
  font-size: 12px;
  line-height: 1.45;
}

/* -------------------------------------------------------
   4. Build/update cards
   ------------------------------------------------------- */

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

/* Keep fades soft like the reference. */
.activity-fade-top {
  background: linear-gradient(180deg, rgba(255, 250, 242, 0.96), transparent) !important;
}

.activity-fade-bottom {
  background: linear-gradient(0deg, rgba(255, 250, 242, 0.96), transparent) !important;
}

/* Mobile tightening. */
@media (max-width: 760px) {
  .feed-list {
    gap: 14px;
  }

  .feed-list [data-role="user"],
  .feed-list article[class*="user"],
  .feed-list .user-message,
  .feed-list .feed-message-user,
  .activity-feed [data-role="user"],
  .activity-feed article[class*="user"],
  .activity-feed .user-message,
  .activity-feed .feed-message-user {
    max-width: calc(100% - 28px) !important;
    border-radius: 22px !important;
  }

  .assistant-build-card,
  .background-working-card,
  [data-background-working="true"] {
    max-width: calc(100% - 24px) !important;
    border-radius: 20px !important;
  }

  .feed-list [data-role="assistant"] p,
  .feed-list article[class*="assistant"] p,
  .feed-list .assistant-message p,
  .feed-list .feed-message-assistant p,
  .activity-feed [data-role="assistant"] p,
  .activity-feed article[class*="assistant"] p,
  .activity-feed .assistant-message p,
  .activity-feed .feed-message-assistant p {
    font-size: 15px;
    line-height: 1.62;
  }
}

@keyframes founderAiRepairWorkingPulse {
  0%,
  100% {
    opacity: 0.34;
    transform: scale(0.92);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .assistant-build-status::before {
    animation: none;
  }

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
  console.log("Added repaired feed/preview clarity CSS.");
} else {
  console.log("Feed and preview clarity repair CSS already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Feed and preview clarity repair complete.");
console.log(`CSS backup created at: ${cssBackupPath}`);