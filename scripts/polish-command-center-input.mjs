import fs from "node:fs";
import path from "node:path";

/**
 * Polishes the main command center and chat input area.
 *
 * Goal:
 * - Make the core prompt/input surface feel compact and premium.
 * - Improve focus, buttons, queued/security cards, and mobile behaviour.
 * - Avoid JSX edits. CSS-first because the compiler has been dramatic enough.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const pagePath = path.join(process.cwd(), "app/page.tsx");

const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-command-center-input-polish-${Date.now()}.css`
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
  "command-center",
  "composer",
  "prompt",
  "QueueCard",
  "SecurityCard",
  "activity-feed",
  "feed-list",
  "textarea",
];

const foundHints = hints.filter((hint) => pageSource.includes(hint));

console.log(
  foundHints.length
    ? `Found command center hints: ${foundHints.join(", ")}`
    : "No command center hints found. CSS will still be added safely."
);

if (!css.includes("Founder AI command center input polish")) {
  css += `

/* Founder AI command center input polish */
.command-center,
.command-panel,
.activity-panel,
.builder-command-center {
  background:
    radial-gradient(circle at 16% 0%, rgba(37, 99, 235, 0.07), transparent 26%),
    linear-gradient(180deg, #fffaf2 0%, #ffffff 44%, #f8fafc 100%);
}

.activity-feed,
.feed-list,
.command-scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
}

.activity-feed::-webkit-scrollbar,
.feed-list::-webkit-scrollbar,
.command-scroll-area::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.activity-feed::-webkit-scrollbar-thumb,
.feed-list::-webkit-scrollbar-thumb,
.command-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

/* Feed rhythm */
.feed-list {
  display: grid;
  gap: 12px;
}

.feed-list article,
.activity-feed article {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.feed-list article:hover,
.activity-feed article:hover {
  border-color: rgba(37, 99, 235, 0.24);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.075);
}

/* Composer/input surfaces */
.command-composer,
.prompt-composer,
.chat-composer,
.composer,
.input-composer,
.command-input-wrap {
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
  box-shadow:
    0 18px 46px rgba(15, 23, 42, 0.09),
    0 1px 0 rgba(255, 255, 255, 0.85) inset;
}

.command-composer:focus-within,
.prompt-composer:focus-within,
.chat-composer:focus-within,
.composer:focus-within,
.input-composer:focus-within,
.command-input-wrap:focus-within {
  border-color: rgba(37, 99, 235, 0.48);
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.10),
    0 22px 52px rgba(15, 23, 42, 0.12);
}

/* General prompt textareas/inputs inside command area */
.command-center textarea,
.command-panel textarea,
.activity-panel textarea,
.builder-command-center textarea,
.command-center input[type="text"],
.command-panel input[type="text"],
.activity-panel input[type="text"],
.builder-command-center input[type="text"] {
  color: #111827;
  caret-color: #2563eb;
}

.command-center textarea::placeholder,
.command-panel textarea::placeholder,
.activity-panel textarea::placeholder,
.builder-command-center textarea::placeholder,
.command-center input::placeholder,
.command-panel input::placeholder,
.activity-panel input::placeholder,
.builder-command-center input::placeholder {
  color: #9ca3af;
}

/* Keep text from touching borders like it owes them money */
.command-center textarea,
.command-panel textarea,
.activity-panel textarea,
.builder-command-center textarea {
  line-height: 1.5;
  padding: 14px 16px;
}

/* Action buttons */
.command-center button,
.command-panel button,
.activity-panel button,
.builder-command-center button,
.command-composer button,
.prompt-composer button,
.chat-composer button,
.composer button,
.input-composer button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
}

.command-center button:hover:not(:disabled),
.command-panel button:hover:not(:disabled),
.activity-panel button:hover:not(:disabled),
.builder-command-center button:hover:not(:disabled),
.command-composer button:hover:not(:disabled),
.prompt-composer button:hover:not(:disabled),
.chat-composer button:hover:not(:disabled),
.composer button:hover:not(:disabled),
.input-composer button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
  border-color: rgba(37, 99, 235, 0.32) !important;
}

.command-center button:active:not(:disabled),
.command-panel button:active:not(:disabled),
.activity-panel button:active:not(:disabled),
.builder-command-center button:active:not(:disabled),
.command-composer button:active:not(:disabled),
.prompt-composer button:active:not(:disabled),
.chat-composer button:active:not(:disabled),
.composer button:active:not(:disabled),
.input-composer button:active:not(:disabled) {
  transform: translateY(0) scale(0.985);
}

.command-center button:disabled,
.command-panel button:disabled,
.activity-panel button:disabled,
.builder-command-center button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

/* Queue/security cards should be compact unless needed */
.queue-card,
.security-card,
.assistant-queue-card,
.assistant-security-card {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.queue-card:empty,
.security-card:empty,
.assistant-queue-card:empty,
.assistant-security-card:empty {
  display: none;
}

/* Warning/error surfaces */
.workspace-error,
.command-error,
.build-error {
  border: 1px solid rgba(252, 165, 165, 0.78);
  border-radius: 18px;
  background: #fef2f2;
  color: #991b1b;
  box-shadow: 0 14px 32px rgba(153, 27, 27, 0.08);
}

/* Floating fade polish */
.activity-fade {
  pointer-events: none;
}

.activity-fade-top {
  background: linear-gradient(180deg, rgba(255, 250, 242, 0.96), transparent);
}

.activity-fade-bottom {
  background: linear-gradient(0deg, rgba(248, 250, 252, 0.96), transparent);
}

/* Mobile tightening */
@media (max-width: 760px) {
  .command-composer,
  .prompt-composer,
  .chat-composer,
  .composer,
  .input-composer,
  .command-input-wrap {
    border-radius: 20px;
  }

  .command-center textarea,
  .command-panel textarea,
  .activity-panel textarea,
  .builder-command-center textarea {
    padding: 12px 13px;
    font-size: 14px;
  }

  .feed-list {
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed-list article,
  .activity-feed article,
  .command-center button,
  .command-panel button,
  .activity-panel button,
  .builder-command-center button,
  .command-composer button,
  .prompt-composer button,
  .chat-composer button,
  .composer button,
  .input-composer button {
    transition: none;
  }

  .feed-list article:hover,
  .activity-feed article:hover,
  .command-center button:hover:not(:disabled),
  .command-panel button:hover:not(:disabled),
  .activity-panel button:hover:not(:disabled),
  .builder-command-center button:hover:not(:disabled),
  .command-composer button:hover:not(:disabled),
  .prompt-composer button:hover:not(:disabled),
  .chat-composer button:hover:not(:disabled),
  .composer button:hover:not(:disabled),
  .input-composer button:hover:not(:disabled),
  .command-center button:active:not(:disabled),
  .command-panel button:active:not(:disabled),
  .activity-panel button:active:not(:disabled),
  .builder-command-center button:active:not(:disabled),
  .command-composer button:active:not(:disabled),
  .prompt-composer button:active:not(:disabled),
  .chat-composer button:active:not(:disabled),
  .composer button:active:not(:disabled),
  .input-composer button:active:not(:disabled) {
    transform: none;
  }
}
`;

  console.log("✅ Added command center input CSS polish.");
} else {
  console.log("Command center input CSS polish already exists.");
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Command center input polish complete.");
console.log(`CSS backup created at: ${backupCssPath}`);