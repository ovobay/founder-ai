import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a "Copy handoff summary" button.
 *
 * The button copies a compact launch/build summary to the clipboard from
 * the Publish readiness / Deploy readiness area.
 *
 * It includes:
 * - Product name and classification
 * - Build pack health
 * - Generated file/module/database/API/security counts
 * - Required integrations
 * - Required environment variables
 * - Missing build pack files
 * - Next steps
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-copy-handoff-summary-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Always back up before patching, because one missing comma and TypeScript starts writing poetry.
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
 * 1. Add helper to create the plain-text handoff summary.
 *
 * This produces a compact message that can be copied to clipboard and sent
 * to another developer/client without needing screenshots or interpretive dance.
 */
const handoffSummaryHelper = `function createCompactHandoffSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const buildPackHealth = getBuildPackHealth(files);
  const buildPackFiles = getBuildPackFileStatuses(files);
  const missingBuildPackFiles = buildPackFiles
    .filter((file) => !file.exists)
    .map((file) => file.path);

  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const lines = [
    "Founder AI handoff summary",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Industry: \${previewState.classification?.industry ?? "General"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    \`Platform targets: \${previewState.classification?.platformTargets.join(", ") || "web"}\`,
    "",
    "Build pack:",
    \`- Health: \${buildPackHealth.label} · \${buildPackHealth.score}%\`,
    \`- Missing files: \${missingBuildPackFiles.length > 0 ? missingBuildPackFiles.join(", ") : "None"}\`,
    "",
    "Generated scope:",
    \`- Files: \${files.length}\`,
    \`- Modules: \${previewState.modules.length}\`,
    \`- Database tables: \${previewState.architecture.tables.length}\`,
    \`- API routes: \${previewState.architecture.endpoints.length}\`,
    \`- Security rules: \${previewState.architecture.securityRules.length}\`,
    "",
    "Required integrations:",
    ...(integrations.length > 0
      ? integrations.map((integration) => \`- \${integration.label} · \${integration.provider}\`)
      : ["- None detected"]),
    "",
    "Required environment variables:",
    ...(requiredEnvVars.length > 0
      ? requiredEnvVars.map((variable) => \`- \${variable.key} · \${variable.scope}\`)
      : ["- None detected"]),
    "",
    "Next steps:",
    "- Review generated files in Code view.",
    "- Export full build pack if not complete.",
    "- Review config/env.example.",
    "- Review and run generated SQL migration if database tables exist.",
    "- Configure production environment variables.",
    "- Commit generated files to GitHub.",
    "- Deploy to Vercel.",
    "- Run smoke tests after deployment.",
  ];

  return lines.join("\\n");
}

`;

if (!source.includes("function createCompactHandoffSummary(")) {
  if (source.includes("function createProjectBriefMarkdown(")) {
    insertBefore(
      "createCompactHandoffSummary helper",
      "function createProjectBriefMarkdown(",
      handoffSummaryHelper
    );
  } else if (source.includes("function DeployReadinessPanel(")) {
    insertBefore(
      "createCompactHandoffSummary helper",
      "function DeployReadinessPanel(",
      handoffSummaryHelper
    );
  } else {
    insertBefore(
      "createCompactHandoffSummary helper",
      "function PublishReadinessWorkspace(",
      handoffSummaryHelper
    );
  }

  console.log("Added createCompactHandoffSummary helper.");
} else {
  console.log("createCompactHandoffSummary helper already exists.");
}

/**
 * 2. Add clipboard state + handler inside DeployReadinessPanel.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("const [copyHandoffMessage")) {
      updated = updated.replace(
        `  const [fullBuildPackMessage, setFullBuildPackMessage] = useState("");`,
        `  const [fullBuildPackMessage, setFullBuildPackMessage] = useState("");
  const [copyHandoffMessage, setCopyHandoffMessage] = useState("");`
      );

      console.log("Added copy handoff message state.");
    } else {
      console.log("Copy handoff message state already exists.");
    }

    if (!updated.includes("async function handleCopyHandoffSummary()")) {
      const copyHandler = `

  async function handleCopyHandoffSummary() {
    setCopyHandoffMessage("");
    setWorkspaceError("");

    const summary = createCompactHandoffSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyHandoffMessage("Handoff summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy handoff summary.";

      setCopyHandoffMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyHandoffSummary function.");
    } else {
      console.log("handleCopyHandoffSummary already exists.");
    }

    /**
     * 3. Add Copy button beside the export buttons.
     */
    if (!updated.includes("Copy handoff summary")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportFullBuildPack}
              disabled={isExportingFullBuildPack}
            >
              {isExportingFullBuildPack
                ? "Exporting..."
                : "Export full build pack"}
            </button>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyHandoffSummary}
            >
              Copy handoff summary
            </button>

            <span
              style={{
                color:
                  copyHandoffMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyHandoffMessage || "Copy a compact build summary."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportFullBuildPack}
              disabled={isExportingFullBuildPack}
            >
              {isExportingFullBuildPack
                ? "Exporting..."
                : "Export full build pack"}
            </button>`
      );

      console.log("Added Copy handoff summary UI.");
    } else {
      console.log("Copy handoff summary UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Copy handoff summary wiring complete.");
console.log(`Backup created at: ${backupPath}`);