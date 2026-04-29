import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-project-handoff-pack-${Date.now()}.tsx`
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
 * Add export/update helper inside DeployReadinessPanel.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("const [isExportingHandoffPack")) {
      updated = updated.replace(
        `  const [isExportingProjectBrief, setIsExportingProjectBrief] = useState(false);
  const [projectBriefExportMessage, setProjectBriefExportMessage] =
    useState("");`,
        `  const [isExportingProjectBrief, setIsExportingProjectBrief] = useState(false);
  const [projectBriefExportMessage, setProjectBriefExportMessage] =
    useState("");
  const [isExportingHandoffPack, setIsExportingHandoffPack] = useState(false);
  const [handoffPackMessage, setHandoffPackMessage] = useState("");`
      );

      console.log("Added handoff pack export state.");
    } else {
      console.log("Handoff pack export state already exists.");
    }

    if (!updated.includes("async function upsertGeneratedProjectFile(")) {
      const helper = `  async function upsertGeneratedProjectFile({
    filePath,
    contents,
  }: {
    filePath: string;
    contents: string;
  }) {
    const existingFile = files.find((file) => file.path === filePath);

    if (existingFile) {
      await onSaveFile(existingFile.id, filePath, contents);
      return "updated";
    }

    await onCreateFile(filePath, contents);
    return "exported";
  }

`;

      updated = updated.replace(
        `  async function handleExportDeployChecklist() {`,
        `${helper}  async function handleExportDeployChecklist() {`
      );

      console.log("Added upsertGeneratedProjectFile helper.");
    } else {
      console.log("upsertGeneratedProjectFile helper already exists.");
    }

    const deployOld = `    const filePath = "config/deploy-checklist.md";
    const contents = createDeployChecklistMarkdown({
      previewState,
      files,
    });
    const existingFile = files.find((file) => file.path === filePath);

    try {
      if (existingFile) {
        await onSaveFile(existingFile.id, filePath, contents);
        setDeployExportMessage("config/deploy-checklist.md updated.");
      } else {
        await onCreateFile(filePath, contents);
        setDeployExportMessage("config/deploy-checklist.md exported.");
      }
    } catch (error) {`;

    const deployNew = `    const filePath = "config/deploy-checklist.md";
    const contents = createDeployChecklistMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setDeployExportMessage(\`config/deploy-checklist.md \${result}.\`);
    } catch (error) {`;

    if (updated.includes(deployOld)) {
      updated = updated.replace(deployOld, deployNew);
      console.log("Refactored deployment checklist export to shared upsert helper.");
    } else {
      console.log("Deployment checklist export may already be refactored.");
    }

    const briefOld = `    const filePath = "config/project-brief.md";
    const contents = createProjectBriefMarkdown({
      previewState,
      files,
    });
    const existingFile = files.find((file) => file.path === filePath);

    try {
      if (existingFile) {
        await onSaveFile(existingFile.id, filePath, contents);
        setProjectBriefExportMessage("config/project-brief.md updated.");
      } else {
        await onCreateFile(filePath, contents);
        setProjectBriefExportMessage("config/project-brief.md exported.");
      }
    } catch (error) {`;

    const briefNew = `    const filePath = "config/project-brief.md";
    const contents = createProjectBriefMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setProjectBriefExportMessage(\`config/project-brief.md \${result}.\`);
    } catch (error) {`;

    if (updated.includes(briefOld)) {
      updated = updated.replace(briefOld, briefNew);
      console.log("Refactored project brief export to shared upsert helper.");
    } else {
      console.log("Project brief export may already be refactored.");
    }

    if (!updated.includes("async function handleExportHandoffPack()")) {
      const handoffFunction = `

  async function handleExportHandoffPack() {
    setIsExportingHandoffPack(true);
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

    const handoffFiles = [
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
    ];

    try {
      const results = await Promise.all(
        handoffFiles.map((file) => upsertGeneratedProjectFile(file))
      );

      const exportedCount = results.filter((result) => result === "exported").length;
      const updatedCount = results.filter((result) => result === "updated").length;

      setHandoffPackMessage(
        \`Handoff pack complete: \${exportedCount} exported, \${updatedCount} updated.\`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export project handoff pack.";

      setHandoffPackMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingHandoffPack(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${handoffFunction}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportHandoffPack function.");
    } else {
      console.log("handleExportHandoffPack already exists.");
    }

    if (!updated.includes("Export handoff pack")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportDeployChecklist}
              disabled={isExportingDeployChecklist}
            >
              {isExportingDeployChecklist
                ? "Exporting..."
                : "Export deployment checklist"}
            </button>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportHandoffPack}
              disabled={isExportingHandoffPack}
            >
              {isExportingHandoffPack ? "Exporting..." : "Export handoff pack"}
            </button>

            <span
              style={{
                color:
                  handoffPackMessage.toLowerCase().includes("failed") ||
                  handoffPackMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {handoffPackMessage ||
                "Export brief, deployment checklist, and env example together."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportDeployChecklist}
              disabled={isExportingDeployChecklist}
            >
              {isExportingDeployChecklist
                ? "Exporting..."
                : "Export deployment checklist"}
            </button>`
      );

      console.log("Added Export handoff pack UI.");
    } else {
      console.log("Export handoff pack UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Project handoff pack export wiring complete.");
console.log(`Backup created at: ${backupPath}`);