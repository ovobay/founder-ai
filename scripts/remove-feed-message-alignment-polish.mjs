import fs from "node:fs";
import path from "node:path";

/**
 * Removes the feed message alignment CSS polish.
 *
 * Reason:
 * The original builder-style chat/feed layout looks better for this product
 * than forcing messenger-style left/right bubbles.
 *
 * This only removes the CSS block titled:
 * "Founder AI feed message alignment polish"
 *
 * It does not touch JSX, publish dropdown work, preview polish, toolbar polish,
 * code workspace polish, or command center polish.
 */

const cssPath = path.join(process.cwd(), "app/globals.css");
const backupCssPath = path.join(
  process.cwd(),
  `app/globals.backup-before-remove-feed-message-alignment-${Date.now()}.css`
);

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

let css = fs.readFileSync(cssPath, "utf8");
fs.writeFileSync(backupCssPath, css);

const blockStart = "/* Founder AI feed message alignment polish */";
const startIndex = css.indexOf(blockStart);

if (startIndex === -1) {
  console.log("Feed message alignment polish block was not found. Nothing to remove.");
  console.log(`CSS backup created at: ${backupCssPath}`);
  process.exit(0);
}

const nextBlockIndex = css.indexOf("\n/* ", startIndex + blockStart.length);

if (nextBlockIndex === -1) {
  css = css.slice(0, startIndex).trimEnd() + "\n";
} else {
  css = css.slice(0, startIndex).trimEnd() + "\n\n" + css.slice(nextBlockIndex).trimStart();
}

fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Removed feed message alignment polish.");
console.log("Chat/feed layout will fall back to the previous builder-style layout.");
console.log(`CSS backup created at: ${backupCssPath}`);