import fs from "node:fs";
import path from "node:path";

/**
 * Polishes feed message alignment and chat-style bubbles.
 *
 * Goal:
 * - User messages align right.
 * - Assistant / generated output align left.
 * - Background working cards align left.
 * - Message bubbles feel deliberate and readable.
 * - Long text wraps correctly.
 *
 * CSS-first. No JSX edits yet, because the component tree has already proven
 * it enjoys surprise litigation.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-feed-message-alignment-${Date.now()}.css`
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
  "FeedMessage",
  "feedItems",
  "feed-list",
  "role === \"user\"",
  "role === \"assistant\"",
  "BackgroundWorkingCard",
  "assistant-build-card",
];

const foundHints = hints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found feed/message hints: ${foundHints.join(", ")}`
    : "No feed/message hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI feed message alignment polish")) {
  css += `

/* Founder AI feed message alignment polish */
.feed-list {
  display: grid;
  gap: 12px;
  align-content: start;
}

/* Let any feed item behave like a chat row when role classes/data attrs exist */
.feed-list [data-role="user"],
.feed-list .feed-message-user,
.feed-list .message-user,
.feed-list .user-message,
.feed-list article[class*="user"] {
  justify-self: end;
  margin-left: auto;
  margin-right: 0;
  max-width: min(78%, 720px);
}

.feed-list [data-role="assistant"],
.feed-list .feed-message-assistant,
.feed-list .message-assistant,
.feed-list .assistant-message,
.feed-list article[class*="assistant"],
.feed-list .assistant-build-card,
.feed-list .background-working-card,
.feed-list [data-background-working="true"] {
  justify-self: start;
  margin-left: 0;
  margin-right: auto;
  max-width: min(82%, 780px);
}

/* Generic feed article bubble shape */
.feed-list article {
  overflow-wrap: anywhere;
  word-break: normal;
}

/* User bubble styling */
.feed-list [data-role="user"],
.feed-list .feed-message-user,
.feed-list .message-user,
.feed-list .user-message,
.feed-list article[class*="user"] {
  border: 1px solid rgba(37, 99, 235, 0.22);
  border-radius: 22px 22px 8px 22px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.98), rgba(29, 78, 216, 0.96));
  color: #ffffff;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.18);
}

/* Assistant bubble styling */
.feed-list [data-role="assistant"],
.feed-list .feed-message-assistant,
.feed-list .message-assistant,
.feed-list .assistant-message,
.feed-list article[class*="assistant"] {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 22px 22px 22px 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
  color: #111827;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
}

/* Preserve special assistant build card styling while still aligning left */
.feed-list .assistant-build-card,
.feed-list .background-working-card,
.feed-list [data-background-working="true"] {
  border-radius: 22px;
}

/* Text colour inside user bubbles */
.feed-list [data-role="user"] *,
.feed-list .feed-message-user *,
.feed-list .message-user *,
.feed-list .user-message *,
.feed-list article[class*="user"] * {
  color: inherit;
}

.feed-list [data-role="user"] p,
.feed-list .feed-message-user p,
.feed-list .message-user p,
.feed-list .user-message p,
.feed-list article[class*="user"] p {
  color: rgba(255, 255, 255, 0.92);
}

/* Text rhythm inside assistant bubbles */
.feed-list [data-role="assistant"] p,
.feed-list .feed-message-assistant p,
.feed-list .message-assistant p,
.feed-list .assistant-message p,
.feed-list article[class*="assistant"] p {
  color: #4b5563;
  line-height: 1.55;
}

/* Keep headings inside generated assistant cards crisp */
.feed-list article h1,
.feed-list article h2,
.feed-list article h3,
.feed-list article strong {
  letter-spacing: -0.025em;
}

/* Message metadata and small labels */
.feed-list article small,
.feed-list article time,
.feed-list article code {
  font-size: 12px;
  font-weight: 750;
}

.feed-list article code {
  border-radius: 999px;
  padding: 3px 8px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.86);
  color: #374151;
}

.feed-list article[class*="user"] code,
.feed-list [data-role="user"] code {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

/* Actions inside feed cards */
.feed-list article button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
}

.feed-list article button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
  border-color: rgba(37, 99, 235, 0.34) !important;
}

.feed-list article button:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

/* Generated output cards should stay assistant-side, not drift right */
.feed-list .generated-output,
.feed-list .build-output,
.feed-list .preview-output,
.feed-list .file-output,
.feed-list .assistant-output {
  justify-self: start;
  margin-left: 0;
  margin-right: auto;
  max-width: min(82%, 780px);
}

/* If messages lack role classes, use common structural fallbacks.
   This is intentionally soft so it does not bulldoze existing layout. */
.feed-list > article:not([class*="user"]):not([class*="assistant"]) {
  max-width: min(82%, 780px);
}

/* Long generated content */
.feed-list pre {
  max-width: 100%;
  overflow: auto;
  border-radius: 18px;
  background: #111827;
  color: #e5e7eb;
  padding: 14px;
  font-size: 12px;
  line-height: 1.55;
}

.feed-list ul,
.feed-list ol {
  margin-top: 8px;
  margin-bottom: 8px;
}

.feed-list li {
  line-height: 1.5;
}

/* Mobile message widths */
@media (max-width: 760px) {
  .feed-list [data-role="user"],
  .feed-list .feed-message-user,
  .feed-list .message-user,
  .feed-list .user-message,
  .feed-list article[class*="user"],
  .feed-list [data-role="assistant"],
  .feed-list .feed-message-assistant,
  .feed-list .message-assistant,
  .feed-list .assistant-message,
  .feed-list article[class*="assistant"],
  .feed-list .assistant-build-card,
  .feed-list .background-working-card,
  .feed-list [data-background-working="true"],
  .feed-list .generated-output,
  .feed-list .build-output,
  .feed-list .preview-output,
  .feed-list .file-output,
  .feed-list .assistant-output {
    max-width: 94%;
  }

  .feed-list [data-role="user"],
  .feed-list .feed-message-user,
  .feed-list .message-user,
  .feed-list .user-message,
  .feed-list article[class*="user"] {
    border-radius: 20px 20px 8px 20px;
  }

  .feed-list [data-role="assistant"],
  .feed-list .feed-message-assistant,
  .feed-list .message-assistant,
  .feed-list .assistant-message,
  .feed-list article[class*="assistant"] {
    border-radius: 20px 20px 20px 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed-list article button {
    transition: none;
  }

  .feed-list article button:hover:not(:disabled),
  .feed-list article button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added feed message alignment CSS polish.");
} else {
  console.log("Feed message alignment CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Feed message alignment polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);