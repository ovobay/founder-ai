import fs from "node:fs";
import path from "node:path";

/**
 * Fixes PreviewToolbar when its TypeScript props signature was accidentally removed.
 *
 * Broken shape:
 *   function PreviewToolbar({
 *     filesOpen,
 *     ...
 *     onOpenPublishCenter,
 *     return (
 *
 * Fixed shape:
 *   function PreviewToolbar({
 *     ...
 *   }: {
 *     ...
 *   }) {
 *     return (
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-fix-preview-toolbar-signature-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, source);

const brokenPattern = /function PreviewToolbar\(\{\s*filesOpen,\s*setFilesOpen,\s*fileCountLabel,\s*workspaceView,\s*setWorkspaceView,\s*onOpenPublishCenter,\s*return\s*\(/m;

const fixedHeader = `function PreviewToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
}: {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  fileCountLabel: string;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
  onOpenPublishCenter: () => void;
  previewState?: PreviewState;
  files?: ChangedFile[];
}) {
  return (`;

if (!brokenPattern.test(source)) {
  console.log("");
  console.log("⚠️ Did not find the exact broken PreviewToolbar signature.");
  console.log("Writing nearby diagnostic instead.");
  console.log("");
  console.log("Run:");
  console.log("sed -n '6370,6425p' app/page.tsx");
  console.log("");
  console.log(`Backup created at: ${backupPath}`);
  process.exit(1);
}

source = source.replace(brokenPattern, fixedHeader);

/**
 * Safety cleanup:
 * remove any immediate orphan props block that may still exist after this function.
 */
source = source.replace(
  /\n\}: \{\n\s*filesOpen: boolean;\n\s*setFilesOpen: \(value: boolean\) => void;\n\s*fileCountLabel: string;\n\s*workspaceView: WorkspaceView;\n\s*setWorkspaceView: \(view: WorkspaceView\) => void;\n\s*onOpenPublishCenter: \(\) => void;\n\s*previewState\?: PreviewState;\n\s*files\?: ChangedFile\[\];\n\}\) \{/g,
  "\n"
);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Fixed PreviewToolbar missing props signature.");
console.log(`Backup created at: ${backupPath}`);