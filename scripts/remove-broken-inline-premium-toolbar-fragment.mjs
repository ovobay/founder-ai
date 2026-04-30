import fs from "node:fs";
import path from "node:path";

/**
 * Removes the broken inline PremiumWorkspaceToolbar fragment from app/page.tsx.
 *
 * Your app/page.tsx currently contains invalid top-level fragments like:
 *
 *   : ToolButtonProps) {
 *   : PremiumWorkspaceToolbarProps) {
 *
 * Those came from pasting component internals into app/page.tsx.
 *
 * The real toolbar component should live in:
 *   components/workspace/PremiumWorkspaceToolbar.tsx
 *
 * This script:
 * - removes the broken ToolButton fragment
 * - removes the broken PremiumWorkspaceToolbar fragment
 * - keeps the correct import for PremiumWorkspaceToolbar
 * - does not touch the real external toolbar component file
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-remove-broken-inline-toolbar-${Date.now()}.tsx`
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

function removeBrokenFragment(marker) {
  const start = source.indexOf(marker);

  if (start === -1) {
    console.log(`Fragment not found, skipped: ${marker}`);
    return false;
  }

  const openBraceIndex = source.indexOf("{", start);

  if (openBraceIndex === -1) {
    throw new Error(`Could not find opening brace for fragment: ${marker}`);
  }

  const closeBraceIndex = findMatchingBrace(source, openBraceIndex);

  if (closeBraceIndex === -1) {
    throw new Error(`Could not find closing brace for fragment: ${marker}`);
  }

  source =
    source.slice(0, start).trimEnd() +
    "\n\n" +
    source.slice(closeBraceIndex + 1).trimStart();

  console.log(`Removed broken fragment: ${marker}`);
  return true;
}

removeBrokenFragment(": ToolButtonProps) {");
removeBrokenFragment(": PremiumWorkspaceToolbarProps) {");

/**
 * Remove any local CSS module import that belongs to the broken pasted toolbar.
 * app/page.tsx should not import the toolbar CSS module directly.
 */
source = source.replace(
  /^\s*import\s+styles\s+from\s+["']\.\/PremiumWorkspaceToolbar\.module\.css["'];\s*$/gm,
  ""
);

source = source.replace(
  /^\s*import\s+styles\s+from\s+["']@\/components\/workspace\/PremiumWorkspaceToolbar\.module\.css["'];\s*$/gm,
  ""
);

/**
 * Ensure the correct toolbar import exists once.
 */
const correctImport =
  'import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";';

const lines = source.split("\n");
let seenToolbarImport = false;

source = lines
  .filter((line) => {
    const trimmed = line.trim();

    if (trimmed === correctImport) {
      if (seenToolbarImport) return false;
      seenToolbarImport = true;
      return true;
    }

    if (
      trimmed.startsWith("import { PremiumWorkspaceToolbar }") &&
      trimmed !== correctImport
    ) {
      return false;
    }

    return true;
  })
  .join("\n");

if (!source.includes(correctImport)) {
  const importMatches = [...source.matchAll(/^import .+;$/gm)];

  if (importMatches.length > 0) {
    const lastImport = importMatches[importMatches.length - 1];
    const insertAt = (lastImport.index ?? 0) + lastImport[0].length;

    source =
      source.slice(0, insertAt) +
      "\n" +
      correctImport +
      source.slice(insertAt);
  } else {
    source = correctImport + "\n\n" + source;
  }

  console.log("Added correct PremiumWorkspaceToolbar import.");
} else {
  console.log("Correct PremiumWorkspaceToolbar import exists.");
}

/**
 * Clean excessive blank lines.
 */
source = source.replace(/\n{4,}/g, "\n\n\n");

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Removed broken inline PremiumWorkspaceToolbar fragments.");
console.log(`Backup created at: ${backupPath}`);
console.log("");
console.log("Now run:");
console.log("npm run dev");