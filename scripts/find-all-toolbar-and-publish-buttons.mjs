import fs from "node:fs";
import path from "node:path";

/**
 * Finds current toolbar/action/button render locations.
 *
 * The previous toolbar markers are gone, so this searches broader:
 * - Publish buttons
 * - PremiumWorkspaceToolbar usage/import
 * - workspaceView setters
 * - top action buttons
 * - toolbar CSS/classes
 */

const root = process.cwd();

const files = [
  "app/page.tsx",
  "components/workspace/PremiumWorkspaceToolbar.tsx",
  "components/workspace/PremiumWorkspaceToolbar.module.css",
  "app/globals.css",
];

const terms = [
  "PremiumWorkspaceToolbar",
  "Publish",
  "publish-button",
  "Open publish",
  "setWorkspaceView",
  "workspaceView",
  "Preview",
  "Files",
  "Cloud",
  "Code",
  "Security",
  "toolbar",
  "Toolbar",
  "Account",
  "Sign out",
  "auth/signout",
  "auth/session",
];

const output = [];

for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);

  output.push("");
  output.push("=".repeat(100));
  output.push(relativePath);
  output.push("=".repeat(100));

  if (!fs.existsSync(absolutePath)) {
    output.push("MISSING");
    continue;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const lines = source.split("\n");

  const matches = [];

  for (const term of terms) {
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

  if (matches.length === 0) {
    output.push("No matches found.");
    continue;
  }

  const uniqueLineNumbers = [
    ...new Set(matches.map((match) => match.lineNumber)),
  ].sort((a, b) => a - b);

  for (const lineNumber of uniqueLineNumbers) {
    const start = Math.max(1, lineNumber - 35);
    const end = Math.min(lines.length, lineNumber + 55);

    output.push("");
    output.push(`CONTEXT AROUND LINE ${lineNumber}`);
    output.push("-".repeat(100));

    for (let lineIndex = start; lineIndex <= end; lineIndex += 1) {
      const line = lines[lineIndex - 1] ?? "";
      output.push(`${String(lineIndex).padStart(5, " ")} | ${line}`);
    }
  }
}

const outputPath = path.join(root, "tmp/all-toolbar-publish-audit.txt");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output.join("\n"));

console.log("");
console.log("✅ Broad toolbar/publish audit written.");
console.log(`Open: ${outputPath}`);
console.log("");
console.log('code tmp/all-toolbar-publish-audit.txt || open -a "Visual Studio Code" tmp/all-toolbar-publish-audit.txt');