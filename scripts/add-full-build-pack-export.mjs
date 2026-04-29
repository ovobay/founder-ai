import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-full-build-pack-${Date.now()}.tsx`
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

updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("const [isExportingFullBuildPack")) {
      updated = updated.replace(
        `  const [isExportingHandoffPack, setIsExportingHandoffPack] = useState(false);
  const [handoffPackMessage, setHandoffPackMessage] = useState("");`,
        `  const [isExportingHandoffPack, setIsExportingHandoffPack] = useState(false);
  const [handoffPackMessage, setHandoffPackMessage] = useState("");
  const [isExportingFullBuildPack, setIsExportingFullBuildPack] =
    useState(false);
  const [fullBuildPackMessage, setFullBuildPackMessage] = useState("");`
      );

      console.log("Added full build pack export state.");
    } else {
      console.log("Full build pack export state already exists.");
    }

    if (!updated.includes("async function handleExportFullBuildPack()")) {
      const fullBuildPackFunction = `

  async function handleExportFullBuildPack() {
    setIsExportingFullBuildPack(true);
    setFullBuildPackMessage("");
    setHandoffPackMessage("");
    setDeployExportMessage("");
    setProjectBriefExportMessage("");
    setWorkspaceError("");

    const variables = getEnvironmentVariableReadiness({
      projectType: previewState.projectType,
      modules: previewState.modules,
      architecture: previewState.architecture,
      classification: previewState.classification,
    });

    const fullBuildFiles = [
      {
        filePath: "config/project-brief.md",
        contents: createProjectBriefMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/deploy-checklist.md",
        contents: createDeployChecklistMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/env.example",
        contents: createEnvExampleContents(variables),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },
    ];

    try {
      const results = await Promise.all(
        fullBuildFiles.map((file) => upsertGeneratedProjectFile(file))
      );

      const exportedCount = results.filter((result) => result === "exported").length;
      const updatedCount = results.filter((result) => result === "updated").length;

      setFullBuildPackMessage(
        \`Full build pack complete: \${exportedCount} exported, \${updatedCount} updated.\`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export full build pack.";

      setFullBuildPackMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingFullBuildPack(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${fullBuildPackFunction}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportFullBuildPack function.");
    } else {
      console.log("handleExportFullBuildPack already exists.");
    }

    if (!updated.includes("Export full build pack")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportHandoffPack}
              disabled={isExportingHandoffPack}
            >
              {isExportingHandoffPack ? "Exporting..." : "Export handoff pack"}
            </button>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportFullBuildPack}
              disabled={isExportingFullBuildPack}
            >
              {isExportingFullBuildPack
                ? "Exporting..."
                : "Export full build pack"}
            </button>

            <span
              style={{
                color:
                  fullBuildPackMessage.toLowerCase().includes("failed") ||
                  fullBuildPackMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {fullBuildPackMessage ||
                "Export brief, checklist, env example, and SQL migration."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportHandoffPack}
              disabled={isExportingHandoffPack}
            >
              {isExportingHandoffPack ? "Exporting..." : "Export handoff pack"}
            </button>`
      );

      console.log("Added Export full build pack UI.");
    } else {
      console.log("Export full build pack UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Full build pack export wiring complete.");
console.log(`Backup created at: ${backupPath}`);