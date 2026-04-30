import fs from "node:fs";
import path from "node:path";

/**
 * Removes the duplicate emergency fallback Page component from app/page.tsx.
 *
 * Current problem:
 * - app/page.tsx contains two `export default function Page()` declarations.
 * - The earlier one is the emergency fallback page.
 * - The later one is likely the real Founder AI app page.
 *
 * This script:
 * - finds every `export default function Page(...) { ... }`
 * - removes the one containing emergency fallback markers
 * - if no emergency marker is found, keeps the largest/last Page function
 * - verifies only one default Page remains
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-remove-duplicate-emergency-page-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, source);

function findMatchingBrace(text, openBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quote) {
      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function findAllDefaultPageFunctions(text) {
  const marker = "export default function Page";
  const ranges = [];
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const start = text.indexOf(marker, searchIndex);

    if (start === -1) break;

    const openBraceIndex = text.indexOf("{", start);

    if (openBraceIndex === -1) {
      throw new Error(`Could not find opening brace for Page at index ${start}`);
    }

    const closeBraceIndex = findMatchingBrace(text, openBraceIndex);

    if (closeBraceIndex === -1) {
      throw new Error(`Could not find closing brace for Page at index ${start}`);
    }

    ranges.push({
      start,
      end: closeBraceIndex + 1,
      text: text.slice(start, closeBraceIndex + 1),
    });

    searchIndex = closeBraceIndex + 1;
  }

  return ranges;
}

const ranges = findAllDefaultPageFunctions(source);

console.log(`Found export default function Page blocks: ${ranges.length}`);

if (ranges.length <= 1) {
  console.log("No duplicate default Page function found. Nothing removed.");
  console.log(`Backup created at: ${backupPath}`);
  process.exit(0);
}

const emergencyMarkers = [
  "Emergency recovery page",
  "Founder AI page export restored",
  "original app/page.tsx was too corrupted",
  "Emergency Page fallback is active",
  "fallback keeps the app compiling",
];

let removeRange = ranges.find((range) =>
  emergencyMarkers.some((marker) => range.text.includes(marker))
);

if (!removeRange) {
  /**
   * Fallback strategy:
   * Keep the last/largest Page block because the real app is usually later
   * and contains most of the generated UI.
   */
  const sortedByStart = [...ranges].sort((a, b) => a.start - b.start);
  removeRange = sortedByStart[0];

  console.log(
    "No emergency marker found. Removing the first Page block and keeping the later Page block."
  );
} else {
  console.log("Emergency fallback Page block found and selected for removal.");
}

source =
  source.slice(0, removeRange.start).trimEnd() +
  "\n\n" +
  source.slice(removeRange.end).trimStart();

/**
 * If the removed fallback left the PremiumWorkspaceToolbar import unused,
 * we leave it alone for now. The next build will tell us if cleanup is needed.
 */

const remaining = findAllDefaultPageFunctions(source);

if (remaining.length !== 1) {
  throw new Error(
    `Expected exactly one default Page after cleanup, found ${remaining.length}.`
  );
}

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Removed duplicate emergency Page component.");
console.log(`Backup created at: ${backupPath}`);
console.log(`Remaining default Page blocks: ${remaining.length}`);