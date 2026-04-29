import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to improve the Build Pack contents panel.
 *
 * It adds one-click actions for missing build pack files:
 * - If a file exists: "Open in Code"
 * - If a file is missing: "Export full pack"
 *
 * The missing-file button calls the existing full build pack export function
 * passed down from DeployReadinessPanel.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-build-pack-missing-actions-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because we have learned. Painfully.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function updateBetween(label, startMarker, endMarker, updater) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    die(`Could not find section: ${label}`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  source = before + updater(section) + after;
}

/**
 * 1. Pass the full build pack export function into BuildPackContentsPanel.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (
      updated.includes("<BuildPackContentsPanel") &&
      !updated.includes("onExportFullBuildPack={handleExportFullBuildPack}")
    ) {
      updated = updated.replace(
        `<BuildPackContentsPanel
          files={files}
          setSelectedFileId={setSelectedFileId}
          setWorkspaceView={setWorkspaceView}
        />`,
        `<BuildPackContentsPanel
          files={files}
          setSelectedFileId={setSelectedFileId}
          setWorkspaceView={setWorkspaceView}
          onExportFullBuildPack={handleExportFullBuildPack}
          isExportingFullBuildPack={isExportingFullBuildPack}
        />`
      );

      console.log("Passed full build pack export action into BuildPackContentsPanel.");
    } else {
      console.log("BuildPackContentsPanel already has export action or marker differs.");
    }

    return updated;
  }
);

/**
 * 2. Update BuildPackContentsPanel props to accept the export function.
 */
updateBetween(
  "BuildPackContentsPanel",
  "function BuildPackContentsPanel({",
  "function BuildPackFileCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("onExportFullBuildPack,")) {
      updated = updated.replace(
        `function BuildPackContentsPanel({
  files,
  setSelectedFileId,
  setWorkspaceView,
}: {
  files: ChangedFile[];
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
}) {`,
        `function BuildPackContentsPanel({
  files,
  setSelectedFileId,
  setWorkspaceView,
  onExportFullBuildPack,
  isExportingFullBuildPack,
}: {
  files: ChangedFile[];
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
  onExportFullBuildPack: () => Promise<void>;
  isExportingFullBuildPack: boolean;
}) {`
      );

      console.log("Updated BuildPackContentsPanel props.");
    } else {
      console.log("BuildPackContentsPanel props already include export action.");
    }

    /**
     * Pass the missing-file export action into every build pack file card.
     */
    if (!updated.includes("onExportMissing={onExportFullBuildPack}")) {
      updated = updated.replace(
        `<BuildPackFileCard
            key={file.path}
            file={file}
            onOpen={() => openBuildPackFile(file)}
          />`,
        `<BuildPackFileCard
            key={file.path}
            file={file}
            onOpen={() => openBuildPackFile(file)}
            onExportMissing={onExportFullBuildPack}
            isExportingFullBuildPack={isExportingFullBuildPack}
          />`
      );

      console.log("Passed missing-file export action into BuildPackFileCard.");
    } else {
      console.log("BuildPackFileCard already receives missing-file export action.");
    }

    return updated;
  }
);

/**
 * 3. Update BuildPackFileCard to show Export full pack when missing.
 */
updateBetween(
  "BuildPackFileCard",
  "function BuildPackFileCard({",
  "function DeployReadinessPanel(",
  (section) => {
    let updated = section;

    if (!updated.includes("onExportMissing,")) {
      updated = updated.replace(
        `function BuildPackFileCard({
  file,
  onOpen,
}: {
  file: BuildPackFileStatus;
  onOpen: () => void;
}) {`,
        `function BuildPackFileCard({
  file,
  onOpen,
  onExportMissing,
  isExportingFullBuildPack,
}: {
  file: BuildPackFileStatus;
  onOpen: () => void;
  onExportMissing: () => Promise<void>;
  isExportingFullBuildPack: boolean;
}) {`
      );

      console.log("Updated BuildPackFileCard props.");
    } else {
      console.log("BuildPackFileCard props already include missing-file export action.");
    }

    const oldButton = `      <button
        suppressHydrationWarning
        type="button"
        className="pill-button"
        onClick={onOpen}
        disabled={!file.exists}
      >
        {file.exists ? "Open in Code" : "Export first"}
      </button>`;

    const newButton = `      <button
        suppressHydrationWarning
        type="button"
        className="pill-button"
        onClick={file.exists ? onOpen : onExportMissing}
        disabled={!file.exists && isExportingFullBuildPack}
      >
        {file.exists
          ? "Open in Code"
          : isExportingFullBuildPack
            ? "Exporting..."
            : "Export full pack"}
      </button>`;

    if (updated.includes(oldButton)) {
      updated = updated.replace(oldButton, newButton);
      console.log("Updated BuildPackFileCard action button.");
    } else if (updated.includes("Export full pack")) {
      console.log("BuildPackFileCard action button already updated.");
    } else {
      console.log("Could not find old BuildPackFileCard button. It may differ.");
    }

    return updated;
  }
);

save();

console.log("✅ Build Pack missing-file actions wiring complete.");
console.log(`Backup created at: ${backupPath}`);