import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "app/page.tsx",
  "components/workspace/PremiumWorkspaceToolbar.tsx",
  "components/workspace/PremiumWorkspaceToolbar.module.css",
];

const terms = [
  "PremiumWorkspaceToolbar",
  "Publish",
  "publish-button",
  "Open publish",
  "setWorkspaceView",
  "workspaceView",
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

  const matchedLines = new Set();

  for (const term of terms) {
    lines.forEach((line, index) => {
      if (line.includes(term)) {
        matchedLines.add(index + 1);
      }
    });
  }

  const lineNumbers = [...matchedLines].sort((a, b) => a - b);

  if (lineNumbers.length === 0) {
    output.push("No matches found.");
    continue;
  }

  const ranges = [];

  for (const lineNumber of lineNumbers) {
    const start = Math.max(1, lineNumber - 18);
    const end = Math.min(lines.length, lineNumber + 30);

    const previous = ranges[ranges.length - 1];

    if (previous && start <= previous.end + 5) {
      previous.end = Math.max(previous.end, end);
    } else {
      ranges.push({ start, end });
    }
  }

  for (const range of ranges) {
    output.push("");
    output.push(`LINES ${range.start}-${range.end}`);
    output.push("-".repeat(100));

    for (let i = range.start; i <= range.end; i += 1) {
      output.push(`${String(i).padStart(5, " ")} | ${lines[i - 1] ?? ""}`);
    }
  }
}

const outputPath = path.join(root, "tmp/toolbar-minimal-audit.txt");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output.join("\n"));

console.log(`Wrote ${outputPath}`);
