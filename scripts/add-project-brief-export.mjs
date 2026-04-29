import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-project-brief-export-${Date.now()}.tsx`
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
 * 1. Add project brief markdown helper.
 */
const projectBriefHelper = `function createProjectBriefMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = integrations.filter(
    (integration) => integration.required
  );

  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const lines = [
    "# Project brief",
    "",
    \`Product: \${previewState.title}\`,
    "",
    \`Description: \${previewState.subtitle}\`,
    "",
    "## Classification",
    "",
    \`- Project type: \${previewState.projectType}\`,
    \`- Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`- Industry: \${previewState.classification?.industry ?? "General"}\`,
    \`- Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    \`- Platform targets: \${previewState.classification?.platformTargets.join(", ") || "web"}\`,
    "",
    "## Generated modules",
    "",
    ...(previewState.modules.length > 0
      ? previewState.modules.flatMap((module) => [
          \`### \${module.label}\`,
          "",
          module.description,
          "",
        ])
      : ["No modules generated.", ""]),
    "## Database architecture",
    "",
    ...(previewState.architecture.tables.length > 0
      ? previewState.architecture.tables.flatMap((table) => [
          \`### \${table.name}\`,
          "",
          table.purpose,
          "",
          "Fields:",
          "",
          ...table.fields.map((field) => \`- \${field}\`),
          "",
        ])
      : ["No database tables planned.", ""]),
    "## API routes",
    "",
    ...(previewState.architecture.endpoints.length > 0
      ? previewState.architecture.endpoints.flatMap((endpoint) => [
          \`### \${endpoint.method} \${endpoint.path}\`,
          "",
          endpoint.purpose,
          "",
        ])
      : ["No API routes planned.", ""]),
    "## Security rules",
    "",
    ...(previewState.architecture.securityRules.length > 0
      ? previewState.architecture.securityRules.flatMap((rule) => [
          \`### \${rule.label}\`,
          "",
          rule.description,
          "",
        ])
      : ["No security rules generated yet.", ""]),
    "## Generated files",
    "",
    ...(files.length > 0
      ? files.map(
          (file) =>
            \`- \${file.path} — \${file.description || "Generated project file."}\`
        )
      : ["No generated files yet."]),
    "",
    "## Required integrations",
    "",
    ...(requiredIntegrations.length > 0
      ? requiredIntegrations.flatMap((integration) => [
          \`### \${integration.label}\`,
          "",
          \`Provider: \${integration.provider}\`,
          "",
          integration.reason,
          "",
          "Checklist:",
          "",
          ...integration.checklist.map((item) => \`- [ ] \${item}\`),
          "",
        ])
      : ["No required integrations detected.", ""]),
    "## Required environment variables",
    "",
    ...(requiredEnvVars.length > 0
      ? requiredEnvVars.map(
          (variable) =>
            \`- \${variable.key} · \${variable.scope} · \${variable.label}\`
        )
      : ["No required environment variables detected."]),
    "",
    "## Deployment readiness",
    "",
    ...deployItems.flatMap((item) => [
      \`### \${item.label}\`,
      "",
      \`Status: \${item.status}\`,
      "",
      item.detail,
      "",
      ...item.checklist.map((check) => \`- [ ] \${check}\`),
      "",
    ]),
    "## Next implementation steps",
    "",
    "- [ ] Review generated files in Code view.",
    "- [ ] Export and review config/env.example.",
    "- [ ] Export and review generated SQL migration if database tables exist.",
    "- [ ] Run migrations in Supabase if required.",
    "- [ ] Configure production environment variables.",
    "- [ ] Commit generated files to GitHub.",
    "- [ ] Deploy to Vercel.",
    "- [ ] Run smoke tests after deployment.",
    "",
    "> Generated by Founder AI. Review everything before shipping, because production is where optimism goes to get audited.",
    "",
  ];

  return lines.join("\\n");
}

`;

if (!source.includes("function createProjectBriefMarkdown(")) {
  if (source.includes("function createDeployChecklistMarkdown(")) {
    insertBefore(
      "createProjectBriefMarkdown helper",
      "function createDeployChecklistMarkdown(",
      projectBriefHelper
    );
  } else if (source.includes("function DeployReadinessPanel(")) {
    insertBefore(
      "createProjectBriefMarkdown helper",
      "function DeployReadinessPanel(",
      projectBriefHelper
    );
  } else {
    insertBefore(
      "createProjectBriefMarkdown helper",
      "function PublishReadinessWorkspace(",
      projectBriefHelper
    );
  }

  console.log("Added createProjectBriefMarkdown helper.");
} else {
  console.log("createProjectBriefMarkdown helper already exists.");
}

/**
 * 2. Add export project brief action to DeployReadinessPanel.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("const [isExportingProjectBrief")) {
      updated = updated.replace(
        `  const [isExportingDeployChecklist, setIsExportingDeployChecklist] =
    useState(false);
  const [deployExportMessage, setDeployExportMessage] = useState("");`,
        `  const [isExportingDeployChecklist, setIsExportingDeployChecklist] =
    useState(false);
  const [deployExportMessage, setDeployExportMessage] = useState("");
  const [isExportingProjectBrief, setIsExportingProjectBrief] = useState(false);
  const [projectBriefExportMessage, setProjectBriefExportMessage] =
    useState("");`
      );

      console.log("Added project brief export state.");
    } else {
      console.log("Project brief export state already exists.");
    }

    if (!updated.includes("async function handleExportProjectBrief()")) {
      updated = updated.replace(
        `  async function handleExportDeployChecklist() {
    setIsExportingDeployChecklist(true);
    setDeployExportMessage("");
    setWorkspaceError("");

    const filePath = "config/deploy-checklist.md";
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export deployment checklist.";

      setDeployExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDeployChecklist(false);
    }
  }`,
        `  async function handleExportDeployChecklist() {
    setIsExportingDeployChecklist(true);
    setDeployExportMessage("");
    setWorkspaceError("");

    const filePath = "config/deploy-checklist.md";
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export deployment checklist.";

      setDeployExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDeployChecklist(false);
    }
  }

  async function handleExportProjectBrief() {
    setIsExportingProjectBrief(true);
    setProjectBriefExportMessage("");
    setWorkspaceError("");

    const filePath = "config/project-brief.md";
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export project brief.";

      setProjectBriefExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingProjectBrief(false);
    }
  }`
      );

      console.log("Added handleExportProjectBrief function.");
    } else {
      console.log("handleExportProjectBrief already exists.");
    }

    if (!updated.includes("Export project brief")) {
      updated = updated.replace(
        `            <span
              style={{
                color:
                  deployExportMessage.toLowerCase().includes("failed") ||
                  deployExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {deployExportMessage ||
                "Export launch steps into the project file tree."}
            </span>`,
        `            <span
              style={{
                color:
                  deployExportMessage.toLowerCase().includes("failed") ||
                  deployExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {deployExportMessage ||
                "Export launch steps into the project file tree."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportProjectBrief}
              disabled={isExportingProjectBrief}
            >
              {isExportingProjectBrief
                ? "Exporting..."
                : "Export project brief"}
            </button>

            <span
              style={{
                color:
                  projectBriefExportMessage.toLowerCase().includes("failed") ||
                  projectBriefExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {projectBriefExportMessage ||
                "Export a readable project summary."}
            </span>`
      );

      console.log("Added Export project brief UI.");
    } else {
      console.log("Export project brief UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Project brief export wiring complete.");
console.log(`Backup created at: ${backupPath}`);