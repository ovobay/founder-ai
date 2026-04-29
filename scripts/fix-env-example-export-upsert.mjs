import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-env-example-upsert-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
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
 * 1. Pass files and onSaveFile into PublishReadinessWorkspace.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (
      updated.includes("<PublishReadinessWorkspace") &&
      !updated.includes("onSaveFile={onSaveFile}")
    ) {
      updated = updated.replace(
        `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              setWorkspaceError={setWorkspaceError}
            />`,
        `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setWorkspaceError={setWorkspaceError}
            />`
      );

      console.log("Passed onSaveFile into PublishReadinessWorkspace.");
    } else {
      console.log("PublishReadinessWorkspace already has onSaveFile or marker was different.");
    }

    return updated;
  }
);

/**
 * 2. Add onSaveFile prop to PublishReadinessWorkspace and pass files/onSaveFile into EnvironmentVariablesPanel.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("onSaveFile,")) {
      updated = updated.replace(
        `function PublishReadinessWorkspace({
  previewState,
  files,
  onCreateFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
}) {`,
        `function PublishReadinessWorkspace({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setWorkspaceError: (value: string) => void;
}) {`
      );

      console.log("Added onSaveFile to PublishReadinessWorkspace props.");
    } else {
      console.log("PublishReadinessWorkspace already has onSaveFile prop.");
    }

    if (
      updated.includes("<EnvironmentVariablesPanel") &&
      !updated.includes("files={files}") &&
      !updated.includes("onSaveFile={onSaveFile}")
    ) {
      updated = updated.replace(
        `<EnvironmentVariablesPanel
          previewState={previewState}
          onCreateFile={onCreateFile}
          setWorkspaceError={setWorkspaceError}
        />`,
        `<EnvironmentVariablesPanel
          previewState={previewState}
          files={files}
          onCreateFile={onCreateFile}
          onSaveFile={onSaveFile}
          setWorkspaceError={setWorkspaceError}
        />`
      );

      console.log("Passed files and onSaveFile into EnvironmentVariablesPanel.");
    } else {
      console.log("EnvironmentVariablesPanel already has files/onSaveFile or marker was different.");
    }

    return updated;
  }
);

/**
 * 3. Add files and onSaveFile props to EnvironmentVariablesPanel.
 */
updateBetween(
  "EnvironmentVariablesPanel",
  "function EnvironmentVariablesPanel({",
  "function EnvironmentVariableGroup(",
  (section) => {
    let updated = section;

    if (!updated.includes("files,")) {
      updated = updated.replace(
        `function EnvironmentVariablesPanel({
  previewState,
  onCreateFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
}) {`,
        `function EnvironmentVariablesPanel({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setWorkspaceError: (value: string) => void;
}) {`
      );

      console.log("Added files and onSaveFile props to EnvironmentVariablesPanel.");
    } else {
      console.log("EnvironmentVariablesPanel already has files prop.");
    }

    /**
     * Replace create-only export with upsert export.
     */
    const oldHandler = `  async function handleExportEnvExample() {
    setIsExportingEnvExample(true);
    setExportMessage("");
    setWorkspaceError("");

    try {
      await onCreateFile(
        "config/env.example",
        createEnvExampleContents(variables)
      );

      setExportMessage("config/env.example exported.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export config/env.example.";

      setExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingEnvExample(false);
    }
  }`;

    const newHandler = `  async function handleExportEnvExample() {
    setIsExportingEnvExample(true);
    setExportMessage("");
    setWorkspaceError("");

    const filePath = "config/env.example";
    const contents = createEnvExampleContents(variables);
    const existingFile = files.find((file) => file.path === filePath);

    try {
      if (existingFile) {
        await onSaveFile(existingFile.id, filePath, contents);
        setExportMessage("config/env.example updated.");
      } else {
        await onCreateFile(filePath, contents);
        setExportMessage("config/env.example exported.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export config/env.example.";

      setExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingEnvExample(false);
    }
  }`;

    if (updated.includes(oldHandler)) {
      updated = updated.replace(oldHandler, newHandler);
      console.log("Replaced create-only env export with upsert export.");
    } else if (updated.includes("const existingFile = files.find((file) => file.path === filePath);")) {
      console.log("Env export already uses upsert logic.");
    } else {
      console.log("Could not find old env export handler. It may differ already.");
    }

    /**
     * Update button text to reflect export/update.
     */
    if (!updated.includes("Export or update config/env.example")) {
      updated = updated.replace(
        `"Export config/env.example"`,
        `"Export or update config/env.example"`
      );

      console.log("Updated export button label.");
    } else {
      console.log("Export button label already updated.");
    }

    return updated;
  }
);

save();

console.log("✅ config/env.example export now updates existing file if present.");
console.log(`Backup created at: ${backupPath}`);