import fs from "node:fs";
import path from "node:path";

/**
 * Patches the inline feedItems.map renderer in app/page.tsx.
 *
 * The app currently renders feed items inline around:
 *   {feedItems.map((item) => (
 *
 * This script changes that map so running assistant build items render as:
 *   <BackgroundWorkingCard key={item.id} item={item} />
 *
 * Completed assistant items continue to show the normal detailed output.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-inline-background-working-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are editing a live JSX render path, not arranging throw pillows.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

/**
 * Finds the JSX expression:
 *   {feedItems.map((item) => (
 * and converts it into a block-body map:
 *   {feedItems.map((item) => {
 *     if (isAssistantBuildWorking(item)) return ...
 *     return (
 *       original JSX
 *     );
 *   })}
 *
 * It finds the matching closing "      ))}" by scanning parentheses from the
 * start of the map expression instead of relying on brittle line numbers.
 */
function patchFeedItemsMap() {
  const marker = "{feedItems.map((item) => (";
  const start = source.indexOf(marker);

  if (start === -1) {
    die("Could not find inline feedItems.map renderer.");
  }

  if (source.slice(start, start + 1200).includes("<BackgroundWorkingCard")) {
    console.log("Inline feedItems.map already uses BackgroundWorkingCard.");
    return;
  }

  const mapCallStart = source.indexOf("feedItems.map", start);
  const firstParen = source.indexOf("(", mapCallStart);

  if (mapCallStart === -1 || firstParen === -1) {
    die("Could not locate feedItems.map call structure.");
  }

  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let inTemplate = false;
  let escaped = false;
  let mapCallEnd = -1;

  for (let index = firstParen; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === stringQuote) {
        inString = false;
        stringQuote = "";
      }

      continue;
    }

    if (inTemplate) {
      if (char === "`") {
        inTemplate = false;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const lineEnd = source.indexOf("\n", index);
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 1;
      continue;
    }

    if (char === "(") {
      depth += 1;
    }

    if (char === ")") {
      depth -= 1;

      if (depth === 0) {
        mapCallEnd = index;
        break;
      }
    }
  }

  if (mapCallEnd === -1) {
    die("Could not find the end of feedItems.map call.");
  }

  /**
   * The full JSX expression starts with "{" and usually ends with "}" after the
   * map call. Preserve the trailing "}".
   */
  const trailingBraceIndex = source.indexOf("}", mapCallEnd);

  if (trailingBraceIndex === -1) {
    die("Could not find closing JSX brace for feedItems.map.");
  }

  const originalExpression = source.slice(start, trailingBraceIndex + 1);

  const originalInnerJsxStart = originalExpression.indexOf(marker) + marker.length;
  const originalInnerJsxEnd = originalExpression.lastIndexOf("))}");

  if (originalInnerJsxStart === -1 || originalInnerJsxEnd === -1) {
    die("Could not isolate original feed item JSX.");
  }

  const originalInnerJsx = originalExpression
    .slice(originalInnerJsxStart, originalInnerJsxEnd)
    .trim();

  const replacement = `{feedItems.map((item) => {
                  if (isAssistantBuildWorking(item)) {
                    return <BackgroundWorkingCard key={item.id} item={item} />;
                  }

                  return (
                    ${originalInnerJsx}
                  );
                })}`;

  source =
    source.slice(0, start) +
    replacement +
    source.slice(trailingBraceIndex + 1);

  console.log("Patched inline feedItems.map renderer.");
}

patchFeedItemsMap();
save();

console.log("");
console.log("✅ Inline background working renderer patch complete.");
console.log(`Backup created at: ${backupPath}`);