import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-exact-preview-toolbar-fix-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, source);

const startMarker = "function PreviewToolbar({";
const endMarker = "\nfunction isAssistantBuildWorking";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1) {
  throw new Error("Could not find PreviewToolbar start marker.");
}

if (end === -1) {
  throw new Error("Could not find function isAssistantBuildWorking after PreviewToolbar.");
}

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

source = source.slice(0, start) + replacement + source.slice(end + 1);

const importLine =
  'import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";';

if (!source.includes(importLine)) {
  const importMatches = [...source.matchAll(/^import .+;$/gm)];

  if (importMatches.length > 0) {
    const lastImport = importMatches[importMatches.length - 1];
    const insertAt = (lastImport.index ?? 0) + lastImport[0].length;
    source = source.slice(0, insertAt) + "\n" + importLine + source.slice(insertAt);
  } else {
    source = importLine + "\n" + source;
  }
}

fs.writeFileSync(pagePath, source);

console.log("✅ Exact PreviewToolbar block fixed.");
console.log(`Backup created at: ${backupPath}`);
