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
  `app/page.backup-before-preview-toolbar-premium-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, source);

const importLine =
  'import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";';

if (!source.includes(importLine)) {
  const importMatches = [...source.matchAll(/^import .+;$/gm)];

  if (importMatches.length > 0) {
    const lastImport = importMatches[importMatches.length - 1];
    const insertAt = (lastImport.index ?? 0) + lastImport[0].length;
    source =
      source.slice(0, insertAt) + "\n" + importLine + source.slice(insertAt);
  } else {
    source = importLine + "\n" + source;
  }
}

const startMarker = "function PreviewToolbar({";
const endMarker = "\nfunction isAssistantBuildWorking";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1) {
  throw new Error("Could not find PreviewToolbar start marker.");
}

if (end === -1) {
  throw new Error(
    "Could not find function isAssistantBuildWorking after PreviewToolbar."
  );
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
  const activeToolbarTool =
    workspaceView === "code"
      ? "code"
      : workspaceView === "architecture"
        ? "analytics"
        : workspaceView === "publish-readiness"
          ? "security"
          : workspaceView === "integrations"
            ? "cloud"
            : filesOpen
              ? "files"
              : "preview";

  return (
    <PremiumWorkspaceToolbar
      fileCountLabel={fileCountLabel}
      isPreviewSelected={activeToolbarTool === "preview"}
      isFilesSelected={activeToolbarTool === "files"}
      isCloudSelected={activeToolbarTool === "cloud"}
      isCodeSelected={activeToolbarTool === "code"}
      isAnalyticsSelected={activeToolbarTool === "analytics"}
      isSecuritySelected={activeToolbarTool === "security"}
      onSelectPreview={() => {
        setFilesOpen(false);
        setWorkspaceView("preview");
      }}
      onSelectFiles={() => {
        if (activeToolbarTool === "files") {
          setFilesOpen(false);
          return;
        }

        setFilesOpen(true);
      }}
      onSelectCloud={() => {
        setFilesOpen(false);
        setWorkspaceView("integrations");
      }}
      onSelectCode={() => {
        setFilesOpen(false);
        setWorkspaceView("code");
      }}
      onSelectAnalytics={() => {
        setFilesOpen(false);
        setWorkspaceView("architecture");
      }}
      onSelectSecurity={() => {
        setFilesOpen(false);
        setWorkspaceView("publish-readiness");
      }}
      onSelectMore={onOpenPublishCenter}
      onShare={() => {
        // wire later
      }}
      onGit={() => {
        // wire later
      }}
      onUpgrade={() => {
        setFilesOpen(false);
        setWorkspaceView("integrations");
      }}
      onPublish={onOpenPublishCenter}
      onToggleSidebar={() => {
        // wire later
      }}
    />
  );
}

`;

source = source.slice(0, start) + replacement + source.slice(end);

fs.writeFileSync(pagePath, source);

console.log("✅ Replaced PreviewToolbar with PremiumWorkspaceToolbar.");
console.log(`Backup created at: ${backupPath}`);
