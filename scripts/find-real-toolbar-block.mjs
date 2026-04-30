import fs from "node:fs";
import path from "node:path";

/**
 * Finds the real toolbar area inside app/page.tsx.
 *
 * Use this when "function PreviewToolbar" is missing or renamed.
 * It searches for:
 * - preview-toolbar
 * - repaired-preview-toolbar
 * - Preview
 * - Publish
 *
 * Then writes a readable extraction to tmp/toolbar-block-audit.txt.
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");
const outputPath = path.join(root, "tmp/toolbar-block-audit.txt");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

const source = fs.readFileSync(pagePath, "utf8");
const lines = source.split("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const searchTerms = [
  "function PreviewToolbar",
  "const PreviewToolbar",
  "PreviewToolbar =",
  "preview-toolbar",
  "repaired-preview-toolbar",
  "toolbar-route-display",
  "Open publish menu",
  ">Publish<",
  "Publish</button>",
];

const matches = [];

for (const term of searchTerms) {
  lines.forEach((line, index) => {
    if (line.includes(term)) {
      matches.push({
        term,
        lineNumber: index + 1,
        line,
      });
    }
  });
}

const output = [];

output.push("TOOLBAR SEARCH RESULTS");
output.push("=".repeat(100));
output.push("");

if (matches.length === 0) {
  output.push("No toolbar markers found.");
} else {
  for (const match of matches) {
    output.push(`TERM: ${match.term}`);
    output.push(`LINE: ${match.lineNumber}`);
    output.push(match.line);
    output.push("-".repeat(100));
  }
}

output.push("");
output.push("");
output.push("CONTEXT BLOCKS");
output.push("=".repeat(100));

const uniqueLineNumbers = [...new Set(matches.map((match) => match.lineNumber))];

for (const lineNumber of uniqueLineNumbers) {
  const start = Math.max(1, lineNumber - 80);
  const end = Math.min(lines.length, lineNumber + 180);

  output.push("");
  output.push(`CONTEXT AROUND LINE ${lineNumber}`);
  output.push("-".repeat(100));

  for (let lineIndex = start; lineIndex <= end; lineIndex += 1) {
    const line = lines[lineIndex - 1] ?? "";
    output.push(`${String(lineIndex).padStart(5, " ")} | ${line}`);
  }
}

fs.writeFileSync(outputPath, output.join("\n"));

console.log("");
console.log("✅ Toolbar audit written.");
console.log(`Open this file: ${outputPath}`);
console.log("");
console.log("Run:");
console.log('code tmp/toolbar-block-audit.txt || open -a "Visual Studio Code" tmp/toolbar-block-audit.txt');