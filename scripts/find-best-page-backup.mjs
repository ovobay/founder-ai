import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "app");

const backups = fs
  .readdirSync(appDir)
  .filter((file) => file.startsWith("page.backup-") && file.endsWith(".tsx"))
  .map((file) => path.join(appDir, file))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

const badMarkers = [
  "Emergency recovery page",
  "Founder AI page export restored",
  ": ToolButtonProps) {",
  ": PremiumWorkspaceToolbarProps) {",
  "export function PremiumWorkspaceToolbar",
];

const goodMarkers = [
  "export default",
  "feedItems",
  "previewState",
  "workspaceView",
  "PreviewToolbar",
  "PublishReadinessWorkspace",
  "Founder AI Workspace",
];

const results = backups.map((file) => {
  const source = fs.readFileSync(file, "utf8");

  const badScore = badMarkers.filter((marker) => source.includes(marker)).length;
  const goodScore = goodMarkers.filter((marker) => source.includes(marker)).length;

  return {
    file,
    modified: fs.statSync(file).mtime.toISOString(),
    lines: source.split("\n").length,
    goodScore,
    badScore,
    hasDefaultExport: /export\s+default/.test(source),
    hasPageFunction: /function\s+Page\s*\(|export\s+default\s+function/.test(source),
  };
});

console.log("");
console.log("BEST BACKUP CANDIDATES");
console.log("=".repeat(100));

results
  .filter((result) => result.badScore === 0)
  .sort((a, b) => b.goodScore - a.goodScore || b.lines - a.lines)
  .slice(0, 20)
  .forEach((result, index) => {
    console.log("");
    console.log(`#${index + 1}`);
    console.log(`file: ${result.file}`);
    console.log(`modified: ${result.modified}`);
    console.log(`lines: ${result.lines}`);
    console.log(`goodScore: ${result.goodScore}`);
    console.log(`badScore: ${result.badScore}`);
    console.log(`hasDefaultExport: ${result.hasDefaultExport}`);
    console.log(`hasPageFunction: ${result.hasPageFunction}`);
  });

console.log("");
console.log("BAD / DO NOT RESTORE CANDIDATES");
console.log("=".repeat(100));

results
  .filter((result) => result.badScore > 0)
  .slice(0, 20)
  .forEach((result) => {
    console.log(`${result.file} | badScore=${result.badScore} | goodScore=${result.goodScore}`);
  });
