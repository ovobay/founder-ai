import fs from "node:fs";
import path from "node:path";

/**
 * Force-replaces corrupted PreviewToolbar from:
 *   function PreviewToolbar
 *
 * until the next known top-level function after it.
 *
 * This fixes orphaned TypeScript fragments like:
 *   }: {
 *     filesOpen: boolean;
 *   ...
 */

const root = process.cwd();

const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let page = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-force-preview-toolbar-replace-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, page);

const startMarker = "function PreviewToolbar";
const start = page.indexOf(startMarker);

if (start === -1) {
  throw new Error("Could not find function PreviewToolbar.");
}

/**
 * Find the next top-level function after PreviewToolbar.
 * Add more markers here only if your file proves it uses another immediate
 * function name after PreviewToolbar.
 */
const nextFunctionMarkers = [
  "\nfunction isAssistantBuildWorking",
  "\nfunction getBackgroundBuildPhase",
  "\nfunction BackgroundWorkingCard",
  "\nfunction FeedMessage",
  "\nfunction PublishDropdownPopover",
  "\nfunction PreviewContent",
  "\nfunction LoadingWorkspace",
  "\nfunction FilesDrawer",
  "\nfunction CodeWorkspace",
  "\nfunction ArchitectureWorkspace",
  "\nfunction IntegrationsWorkspace",
  "\nfunction PublishReadinessWorkspace",
];

const candidates = nextFunctionMarkers
  .map((marker) => ({
    marker,
    index: page.indexOf(marker, start + startMarker.length),
  }))
  .filter((candidate) => candidate.index !== -1)
  .sort((a, b) => a.index - b.index);

if (candidates.length === 0) {
  console.log("");
  console.log("Could not find next function marker.");
  console.log("Run this and paste the output:");
  console.log('grep -n "^function " app/page.tsx | sed -n "1,260p"');
  throw new Error("No next function marker found after PreviewToolbar.");
}

const end = candidates[0].index;

const replacement = `function PreviewToolbar({
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
  return (
    <PremiumWorkspaceToolbar
      fileCountLabel={fileCountLabel}
      isPreviewSelected={workspaceView === "preview"}
      isFilesSelected={filesOpen}
      isCloudSelected={workspaceView === "integrations"}
      isCodeSelected={workspaceView === "code"}
      isAnalyticsSelected={workspaceView === "architecture"}
      isSecuritySelected={workspaceView === "publish-readiness"}
      onSelectPreview={() => setWorkspaceView("preview")}
      onSelectFiles={() => setFilesOpen(!filesOpen)}
      onSelectCloud={() => setWorkspaceView("integrations")}
      onSelectCode={() => setWorkspaceView("code")}
      onSelectAnalytics={() => setWorkspaceView("architecture")}
      onSelectSecurity={() => setWorkspaceView("publish-readiness")}
      onSelectMore={onOpenPublishCenter}
      onShare={() => {
        // Share modal can be wired later.
      }}
      onGit={() => {
        // Git controls can be wired later.
      }}
      onUpgrade={() => setWorkspaceView("integrations")}
      onPublish={onOpenPublishCenter}
      onToggleSidebar={() => {
        // Sidebar toggle can be wired later.
      }}
    />
  );
}

`;

page = page.slice(0, start) + replacement + page.slice(end).trimStart();

/**
 * Ensure import exists once.
 */
const correctImport =
  'import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";';

const lines = page.split("\n");
let seen = false;

page = lines
  .filter((line) => {
    const trimmed = line.trim();

    if (trimmed === correctImport) {
      if (seen) return false;
      seen = true;
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

if (!page.includes(correctImport)) {
  const importMatches = [...page.matchAll(/^import .+;$/gm)];

  if (importMatches.length > 0) {
    const lastImport = importMatches[importMatches.length - 1];
    const insertAt = (lastImport.index ?? 0) + lastImport[0].length;

    page =
      page.slice(0, insertAt) +
      "\n" +
      correctImport +
      page.slice(insertAt);
  } else {
    page = correctImport + "\n\n" + page;
  }
}

/**
 * Last-resort cleanup: remove orphaned prop annotations directly after toolbar
 * if anything survived.
 */
page = page.replace(
  /\n\}: \{\n\s*filesOpen: boolean;[\s\S]*?\n\}\) \{\n/,
  "\n"
);

fs.writeFileSync(pagePath, page);

console.log("");
console.log("✅ Force-replaced corrupted PreviewToolbar block.");
console.log(`Backup created at: ${backupPath}`);
console.log(`Cut until next marker: ${candidates[0].marker.trim()}`);