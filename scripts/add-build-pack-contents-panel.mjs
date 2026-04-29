import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Build Pack contents panel.
 *
 * The panel appears inside Publish readiness and shows whether the key generated
 * build pack files exist:
 * - config/project-brief.md
 * - config/deploy-checklist.md
 * - config/env.example
 * - supabase/migrations/generated_architecture.sql
 *
 * It also lets the user open an existing generated file directly in Code view.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-build-pack-contents-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Always create a backup before doing surgery on the increasingly dramatic page file.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function insertBefore(label, marker, insertion) {
  if (source.includes(insertion.trim())) {
    console.log(`Skipping ${label}: already exists.`);
    return;
  }

  if (!source.includes(marker)) {
    die(`Missing marker: ${label}`);
  }

  source = source.replace(marker, `${insertion}${marker}`);
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
 * 1. Add BuildPackFileStatus type.
 *
 * This type describes one generated build pack file and whether it exists
 * in the current project file tree.
 */
const buildPackTypes = `type BuildPackFileStatus = {
  path: string;
  label: string;
  purpose: string;
  exists: boolean;
  fileId: string | null;
};

`;

if (!source.includes("type BuildPackFileStatus = {")) {
  if (source.includes("type DeployReadinessItem = {")) {
    insertBefore(
      "BuildPackFileStatus type",
      "type DeployReadinessItem =",
      buildPackTypes
    );
  } else if (source.includes("type PublishReadinessStatus =")) {
    insertBefore(
      "BuildPackFileStatus type",
      "type PublishReadinessStatus =",
      buildPackTypes
    );
  } else {
    insertBefore(
      "BuildPackFileStatus type",
      "type DetectedModule =",
      buildPackTypes
    );
  }

  console.log("Added BuildPackFileStatus type.");
} else {
  console.log("BuildPackFileStatus type already exists.");
}

/**
 * 2. Add getBuildPackFileStatuses helper.
 *
 * This helper compares the expected build pack files with the actual generated files.
 * It returns existence status and file IDs so the UI can open files in Code view.
 */
const buildPackHelper = `function getBuildPackFileStatuses(files: ChangedFile[]): BuildPackFileStatus[] {
  const expectedFiles = [
    {
      path: "config/project-brief.md",
      label: "Project brief",
      purpose:
        "Readable summary of the generated product, architecture, modules, integrations, and next implementation steps.",
    },
    {
      path: "config/deploy-checklist.md",
      label: "Deployment checklist",
      purpose:
        "Launch checklist covering GitHub, Vercel, environment variables, migrations, security, and post-deploy tests.",
    },
    {
      path: "config/env.example",
      label: "Environment example",
      purpose:
        "Template for local and production environment variables. Real secrets do not belong here, because we are not animals.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",
      purpose:
        "Starter Supabase migration generated from planned database tables and Row Level Security scaffolding.",
    },
  ];

  return expectedFiles.map((expectedFile) => {
    const matchingFile = files.find((file) => file.path === expectedFile.path);

    return {
      ...expectedFile,
      exists: Boolean(matchingFile),
      fileId: matchingFile?.id ?? null,
    };
  });
}

`;

if (!source.includes("function getBuildPackFileStatuses(")) {
  if (source.includes("function getDeployReadinessItems(")) {
    insertBefore(
      "getBuildPackFileStatuses helper",
      "function getDeployReadinessItems(",
      buildPackHelper
    );
  } else if (source.includes("function getPublishReadinessReport(")) {
    insertBefore(
      "getBuildPackFileStatuses helper",
      "function getPublishReadinessReport(",
      buildPackHelper
    );
  } else {
    insertBefore(
      "getBuildPackFileStatuses helper",
      "function PublishReadinessWorkspace(",
      buildPackHelper
    );
  }

  console.log("Added getBuildPackFileStatuses helper.");
} else {
  console.log("getBuildPackFileStatuses helper already exists.");
}

/**
 * 3. Add BuildPackContentsPanel component.
 *
 * This panel shows which generated handoff/build files exist and lets the user
 * open each existing file directly in Code view.
 */
const buildPackPanel = `function BuildPackContentsPanel({
  files,
  setSelectedFileId,
  setWorkspaceView,
}: {
  files: ChangedFile[];
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
}) {
  const buildPackFiles = getBuildPackFileStatuses(files);
  const existingCount = buildPackFiles.filter((file) => file.exists).length;

  function openBuildPackFile(file: BuildPackFileStatus) {
    if (!file.fileId) return;

    // Selecting the file and switching to Code view gives the user the exact file immediately.
    setSelectedFileId(file.fileId);
    setWorkspaceView("code");
  }

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 6px",
              color: "#111827",
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Build pack contents
          </h3>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {existingCount} of {buildPackFiles.length} core build pack files
            exist in this project. Export the full build pack if anything is
            missing.
          </p>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "26px",
            padding: "0 10px",
            borderRadius: "999px",
            background:
              existingCount === buildPackFiles.length ? "#ecfdf5" : "#fff7ed",
            color:
              existingCount === buildPackFiles.length ? "#166534" : "#9a3412",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {existingCount === buildPackFiles.length
            ? "Complete"
            : "Missing files"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {buildPackFiles.map((file) => (
          <BuildPackFileCard
            key={file.path}
            file={file}
            onOpen={() => openBuildPackFile(file)}
          />
        ))}
      </div>
    </section>
  );
}

function BuildPackFileCard({
  file,
  onOpen,
}: {
  file: BuildPackFileStatus;
  onOpen: () => void;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "14px",
              lineHeight: 1.25,
              marginBottom: "5px",
            }}
          >
            {file.label}
          </strong>

          <code
            style={{
              display: "block",
              color: "#374151",
              fontSize: "12px",
              lineHeight: 1.35,
              overflowWrap: "anywhere",
            }}
          >
            {file.path}
          </code>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: file.exists ? "#ecfdf5" : "#fef2f2",
            color: file.exists ? "#166534" : "#991b1b",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {file.exists ? "Exists" : "Missing"}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {file.purpose}
      </p>

      <button
        suppressHydrationWarning
        type="button"
        className="pill-button"
        onClick={onOpen}
        disabled={!file.exists}
      >
        {file.exists ? "Open in Code" : "Export first"}
      </button>
    </article>
  );
}

`;

if (!source.includes("function BuildPackContentsPanel(")) {
  if (source.includes("function DeployReadinessPanel(")) {
    insertBefore(
      "BuildPackContentsPanel component",
      "function DeployReadinessPanel(",
      buildPackPanel
    );
  } else if (source.includes("function PublishReadinessWorkspace(")) {
    insertBefore(
      "BuildPackContentsPanel component",
      "function PublishReadinessWorkspace(",
      buildPackPanel
    );
  } else {
    insertBefore(
      "BuildPackContentsPanel component",
      "function PublishReadinessCard(",
      buildPackPanel
    );
  }

  console.log("Added BuildPackContentsPanel component.");
} else {
  console.log("BuildPackContentsPanel component already exists.");
}

/**
 * 4. Pass setSelectedFileId and setWorkspaceView into PublishReadinessWorkspace.
 *
 * Publish readiness needs these setters so the Build Pack panel can open files
 * directly in Code view.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (
      updated.includes("<PublishReadinessWorkspace") &&
      !updated.includes("setSelectedFileId={setSelectedFileId}") &&
      !updated.includes("setWorkspaceView={setWorkspaceView}")
    ) {
      updated = updated.replace(
        `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setWorkspaceError={setWorkspaceError}
            />`,
        `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setSelectedFileId={setSelectedFileId}
              setWorkspaceView={setWorkspaceView}
              setWorkspaceError={setWorkspaceError}
            />`
      );

      console.log("Passed setSelectedFileId and setWorkspaceView into PublishReadinessWorkspace.");
    } else {
      console.log("PublishReadinessWorkspace already has setters or marker differs.");
    }

    return updated;
  }
);

/**
 * 5. Update PublishReadinessWorkspace props and render BuildPackContentsPanel.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("setSelectedFileId,")) {
      updated = updated.replace(
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
}) {`,
        `function PublishReadinessWorkspace({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setSelectedFileId,
  setWorkspaceView,
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
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
  setWorkspaceError: (value: string) => void;
}) {`
      );

      console.log("Updated PublishReadinessWorkspace props with file opening setters.");
    } else {
      console.log("PublishReadinessWorkspace props already include file opening setters.");
    }

    if (!updated.includes("<BuildPackContentsPanel")) {
      const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DeployReadinessPanel`;

      if (updated.includes(marker)) {
        updated = updated.replace(
          marker,
          `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <BuildPackContentsPanel
          files={files}
          setSelectedFileId={setSelectedFileId}
          setWorkspaceView={setWorkspaceView}
        />
      </div>

${marker}`
        );

        console.log("Rendered BuildPackContentsPanel before DeployReadinessPanel.");
      } else {
        console.log("Could not find DeployReadinessPanel marker. BuildPackContentsPanel render skipped.");
      }
    } else {
      console.log("BuildPackContentsPanel already rendered.");
    }

    return updated;
  }
);

save();

console.log("✅ Build Pack contents panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);