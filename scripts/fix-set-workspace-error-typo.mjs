import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-set-workspace-error-fix-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

const replacements = [
  ["setWorkspaceError1", "setWorkspaceError"],
  ["setWorkspaceError2", "setWorkspaceError"],
  ["setWorkspaceError3", "setWorkspaceError"],
  ["setWorkspaceError4", "setWorkspaceError"],
  ["setWorkspaceError5", "setWorkspaceError"],
  ["setWorkspaceError6", "setWorkspaceError"],
  ["setWorkspaceError7", "setWorkspaceError"],
  ["setWorkspaceError8", "setWorkspaceError"],
  ["setWorkspaceError9", "setWorkspaceError"],
];

let changed = false;

for (const [badName, goodName] of replacements) {
  if (source.includes(badName)) {
    source = source.split(badName).join(goodName);
    console.log(`✅ Replaced ${badName} with ${goodName}`);
    changed = true;
  }
}

if (!changed) {
  console.log("No numbered setWorkspaceError typo found.");
}

fs.writeFileSync(pagePath, source);

console.log("✅ Workspace error setter typo repair complete.");
console.log(`Backup created at: ${backupPath}`);