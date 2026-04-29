import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-env-example-export-${Date.now()}.tsx`
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
 * 1. Add env example generator helper.
 */
const envExampleHelper = `function createEnvExampleContents(variables: EnvironmentVariableReadiness[]) {
  const required = variables.filter((variable) => variable.required);
  const optional = variables.filter((variable) => !variable.required);

  const lines = [
    "# Founder AI generated environment example",
    "# Copy values into .env.local for local development and into your deployment provider for production.",
    "# Server-only secrets must never be exposed to the browser. Yes, that includes the shiny ones.",
    "",
    "# Required",
    ...required.flatMap((variable) => [
      \`# \${variable.label}\`,
      \`# Scope: \${variable.scope}\`,
      \`# \${variable.reason}\`,
      \`\${variable.key}=\${variable.example}\`,
      "",
    ]),
    "# Optional",
    ...optional.flatMap((variable) => [
      \`# \${variable.label}\`,
      \`# Scope: \${variable.scope}\`,
      \`# \${variable.reason}\`,
      \`\${variable.key}=\${variable.example}\`,
      "",
    ]),
  ];

  return lines.join("\\n");
}

`;

if (!source.includes("function createEnvExampleContents(")) {
  if (source.includes("function EnvironmentVariablesPanel(")) {
    insertBefore(
      "createEnvExampleContents helper",
      "function EnvironmentVariablesPanel(",
      envExampleHelper
    );
  } else if (source.includes("function PublishReadinessWorkspace(")) {
    insertBefore(
      "createEnvExampleContents helper",
      "function PublishReadinessWorkspace(",
      envExampleHelper
    );
  } else {
    insertBefore(
      "createEnvExampleContents helper",
      "function HistoryWorkspace(",
      envExampleHelper
    );
  }

  console.log("Added createEnvExampleContents helper.");
} else {
  console.log("createEnvExampleContents helper already exists.");
}

/**
 * 2. Pass onCreateFile into PublishReadinessWorkspace render.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (!updated.includes("onCreateFile={onCreateFile}") && updated.includes("<PublishReadinessWorkspace")) {
      updated = updated.replace(
        `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
            />`,
        `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              setWorkspaceError={setWorkspaceError}
            />`
      );
      console.log("Passed onCreateFile to PublishReadinessWorkspace.");
    } else {
      console.log("PublishReadinessWorkspace already has onCreateFile or is missing.");
    }

    return updated;
  }
);

/**
 * 3. Update PublishReadinessWorkspace props and pass export handler to EnvironmentVariablesPanel.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("onCreateFile,")) {
      updated = updated.replace(
        `function PublishReadinessWorkspace({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {`,
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
}) {`
      );

      console.log("Updated PublishReadinessWorkspace props.");
    } else {
      console.log("PublishReadinessWorkspace props already include onCreateFile.");
    }

    if (!updated.includes("onCreateFile={onCreateFile}") && updated.includes("<EnvironmentVariablesPanel")) {
      updated = updated.replace(
        `<EnvironmentVariablesPanel previewState={previewState} />`,
        `<EnvironmentVariablesPanel
          previewState={previewState}
          onCreateFile={onCreateFile}
          setWorkspaceError={setWorkspaceError}
        />`
      );

      console.log("Passed onCreateFile to EnvironmentVariablesPanel.");
    } else {
      console.log("EnvironmentVariablesPanel already has onCreateFile or is missing.");
    }

    return updated;
  }
);

/**
 * 4. Update EnvironmentVariablesPanel props and add export action.
 */
updateBetween(
  "EnvironmentVariablesPanel",
  "function EnvironmentVariablesPanel({",
  "function EnvironmentVariableGroup(",
  (section) => {
    let updated = section;

    if (!updated.includes("onCreateFile,")) {
      updated = updated.replace(
        `function EnvironmentVariablesPanel({
  previewState,
}: {
  previewState: PreviewState;
}) {`,
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
}) {`
      );

      console.log("Updated EnvironmentVariablesPanel props.");
    } else {
      console.log("EnvironmentVariablesPanel props already include onCreateFile.");
    }

    if (!updated.includes("const [isExportingEnvExample")) {
      updated = updated.replace(
        `  const required = variables.filter((variable) => variable.required);
  const optional = variables.filter((variable) => !variable.required);`,
        `  const required = variables.filter((variable) => variable.required);
  const optional = variables.filter((variable) => !variable.required);
  const [isExportingEnvExample, setIsExportingEnvExample] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  async function handleExportEnvExample() {
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
  }`
      );

      console.log("Added export state and handler to EnvironmentVariablesPanel.");
    } else {
      console.log("EnvironmentVariablesPanel export handler already exists.");
    }

    if (!updated.includes("Export config/env.example")) {
      updated = updated.replace(
        `      <p
        style={{
          margin: "0 0 14px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {required.length} required key{required.length === 1 ? "" : "s"} and{" "}
        {optional.length} optional key{optional.length === 1 ? "" : "s"} were
        inferred from this build.
      </p>`,
        `      <p
        style={{
          margin: "0 0 14px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {required.length} required key{required.length === 1 ? "" : "s"} and{" "}
        {optional.length} optional key{optional.length === 1 ? "" : "s"} were
        inferred from this build.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color:
              exportMessage.toLowerCase().includes("failed") ||
              exportMessage.toLowerCase().includes("already")
                ? "#991b1b"
                : "#4b5563",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {exportMessage ||
            "Export a project-ready environment example file."}
        </span>

        <button
          type="button"
          className="pill-button"
          onClick={handleExportEnvExample}
          disabled={isExportingEnvExample}
        >
          {isExportingEnvExample
            ? "Exporting..."
            : "Export config/env.example"}
        </button>
      </div>`
      );

      console.log("Added export button UI.");
    } else {
      console.log("Export button UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Environment example export wiring complete.");
console.log(`Backup created at: ${backupPath}`);