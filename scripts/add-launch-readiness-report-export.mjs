import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add Launch Readiness Report export.
 *
 * It adds:
 * - createLaunchReadinessReportMarkdown()
 * - Export launch readiness report button
 * - Copy launch readiness summary button
 * - config/launch-readiness-report.md export/update behavior
 * - config/launch-readiness-report.md into the Full build pack
 * - config/launch-readiness-report.md into Build Pack contents tracking
 *
 * The goal is to turn the overall readiness score into a shareable, saved report.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-launch-readiness-report-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before patching. Hope is not a rollback strategy.
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
 * 1. Add Launch Readiness Report markdown and summary helpers.
 *
 * These helpers convert the in-app readiness score into:
 * - a full markdown report
 * - a compact clipboard summary
 */
const launchReadinessReportHelper = `function createLaunchReadinessReportMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getLaunchReadinessReport({
    previewState,
    files,
  });

  const buildPackHealth = getBuildPackHealth(files);
  const securityHealth = getSecurityHealthReport({
    previewState,
    files,
  });
  const designQuality = getDesignQualityReport({
    previewState,
    files,
  });
  const visualBuilderReport = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });
  const visualQaHealth = getVisualQaHealthReport({
    previewState,
    files,
  });

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const blockedDeployItems = deployItems.filter(
    (item) => item.status === "blocked"
  );

  const setupDeployItems = deployItems.filter(
    (item) => item.status === "needs-setup"
  );

  const readyDeployItems = deployItems.filter(
    (item) => item.status === "ready"
  );

  const generatedFileList =
    files.length > 0
      ? files.map((file) => \`- \${file.path}\`)
      : ["- No generated files found."];

  const lines = [
    "# Launch readiness report",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Industry: \${previewState.classification?.industry ?? "General"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    \`Platform targets: \${previewState.classification?.platformTargets.join(", ") || "web"}\`,
    "",
    "## Overall verdict",
    "",
    \`Status: \${report.label}\`,
    \`Score: \${report.score}%\`,
    "",
    report.summary,
    "",
    "## Readiness signals",
    "",
    ...report.signals.flatMap((signal) => [
      \`### \${signal.label}\`,
      "",
      \`Status: \${signal.status}\`,
      \`Score: \${signal.score}%\`,
      "",
      signal.detail,
      "",
    ]),
    "## Blockers",
    "",
    ...(report.blockers.length > 0
      ? report.blockers.map((blocker) => \`- [ ] \${blocker}\`)
      : ["No launch blockers detected from generated readiness signals."]),
    "",
    "## Next actions",
    "",
    ...report.nextActions.map((action) => \`- [ ] \${action}\`),
    "",
    "## Build pack health",
    "",
    \`Status: \${buildPackHealth.label}\`,
    \`Score: \${buildPackHealth.score}%\`,
    "",
    buildPackHealth.summary,
    "",
    ...(buildPackHealth.missingFiles.length > 0
      ? [
          "Missing build pack files:",
          "",
          ...buildPackHealth.missingFiles.map((filePath) => \`- \${filePath}\`),
          "",
        ]
      : ["No build pack files missing.", ""]),
    "## Deployment readiness",
    "",
    \`Ready items: \${readyDeployItems.length}\`,
    \`Needs setup: \${setupDeployItems.length}\`,
    \`Blocked: \${blockedDeployItems.length}\`,
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
    "## Security health",
    "",
    \`Status: \${securityHealth.label}\`,
    \`Score: \${securityHealth.score}%\`,
    "",
    securityHealth.summary,
    "",
    ...securityHealth.findings.flatMap((finding) => [
      \`### \${finding.label}\`,
      "",
      \`Status: \${finding.status}\`,
      "",
      finding.detail,
      "",
    ]),
    "## Design quality",
    "",
    \`Status: \${designQuality.label}\`,
    \`Score: \${designQuality.score}%\`,
    "",
    designQuality.summary,
    "",
    ...designQuality.findings.flatMap((finding) => [
      \`### \${finding.label}\`,
      "",
      \`Status: \${finding.status}\`,
      "",
      finding.detail,
      "",
    ]),
    "## Visual builder competitiveness",
    "",
    \`Status: \${visualBuilderReport.label}\`,
    \`Score: \${visualBuilderReport.score}%\`,
    "",
    visualBuilderReport.summary,
    "",
    ...visualBuilderReport.findings.flatMap((finding) => [
      \`### \${finding.label}\`,
      "",
      \`Status: \${finding.status}\`,
      "",
      finding.detail,
      "",
      "Recommendation:",
      finding.recommendation,
      "",
    ]),
    "## Visual QA health",
    "",
    \`Status: \${visualQaHealth.label}\`,
    \`Score: \${visualQaHealth.score}%\`,
    "",
    visualQaHealth.summary,
    "",
    ...visualQaHealth.findings.flatMap((finding) => [
      \`### \${finding.label}\`,
      "",
      \`Status: \${finding.status}\`,
      "",
      finding.detail,
      "",
    ]),
    "## Generated files",
    "",
    ...generatedFileList,
    "",
    "## Final launch checklist",
    "",
    "- [ ] Export full build pack.",
    "- [ ] Review launch readiness report.",
    "- [ ] Review security review and security rules.",
    "- [ ] Review design review and Visual QA checklist.",
    "- [ ] Configure production environment variables.",
    "- [ ] Run database migrations if required.",
    "- [ ] Push to GitHub.",
    "- [ ] Deploy to Vercel.",
    "- [ ] Run post-deploy smoke tests.",
    "- [ ] Test with at least two users where permissions matter.",
    "",
    "> Generated by Founder AI. Launch readiness is a signal, not a permission slip from the gods.",
    "",
  ];

  return lines.join("\\\\n");
}

function createLaunchReadinessSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getLaunchReadinessReport({
    previewState,
    files,
  });

  const lines = [
    "Founder AI launch readiness summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Verdict:",
    "- Status: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Signals:",
    ...report.signals.map(
      (signal) =>
        "- " +
        signal.label +
        ": " +
        signal.status +
        " · " +
        signal.score +
        "% · " +
        signal.detail
    ),
    "",
    "Blockers:",
    ...(report.blockers.length > 0
      ? report.blockers.map((blocker) => "- " + blocker)
      : ["- None detected"]),
    "",
    "Next actions:",
    ...report.nextActions.map((action) => "- " + action),
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createLaunchReadinessReportMarkdown(")) {
  if (source.includes("function getLaunchReadinessReport(")) {
    insertBefore(
      "Launch readiness report helper",
      "function getLaunchReadinessReport(",
      launchReadinessReportHelper
    );
  } else if (source.includes("function createVisualQaChecklistMarkdown(")) {
    insertBefore(
      "Launch readiness report helper",
      "function createVisualQaChecklistMarkdown(",
      launchReadinessReportHelper
    );
  } else {
    insertBefore(
      "Launch readiness report helper",
      "function DeployReadinessPanel(",
      launchReadinessReportHelper
    );
  }

  console.log("Added launch readiness report helpers.");
} else {
  console.log("Launch readiness report helpers already exist.");
}

/**
 * 2. Patch DeployReadinessPanel with launch report export/copy state,
 * handlers, UI buttons, and full build pack inclusion.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for launch report export/copy actions.
     */
    if (!updated.includes("const [isExportingLaunchReadinessReport")) {
      updated = updated.replace(
        `  const [copyVisualQaMessage, setCopyVisualQaMessage] = useState("");`,
        `  const [copyVisualQaMessage, setCopyVisualQaMessage] = useState("");
  const [
    isExportingLaunchReadinessReport,
    setIsExportingLaunchReadinessReport,
  ] = useState(false);
  const [launchReadinessReportMessage, setLaunchReadinessReportMessage] =
    useState("");
  const [copyLaunchReadinessMessage, setCopyLaunchReadinessMessage] =
    useState("");`
      );

      console.log("Added launch readiness report state.");
    } else {
      console.log("Launch readiness report state already exists.");
    }

    /**
     * Add export handler for config/launch-readiness-report.md.
     */
    if (!updated.includes("async function handleExportLaunchReadinessReport()")) {
      const exportHandler = `

  async function handleExportLaunchReadinessReport() {
    setIsExportingLaunchReadinessReport(true);
    setLaunchReadinessReportMessage("");
    setWorkspaceError("");

    const filePath = "config/launch-readiness-report.md";
    const contents = createLaunchReadinessReportMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setLaunchReadinessReportMessage(
        \`config/launch-readiness-report.md \${result}.\`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export launch readiness report.";

      setLaunchReadinessReportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingLaunchReadinessReport(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportLaunchReadinessReport function.");
    } else {
      console.log("handleExportLaunchReadinessReport already exists.");
    }

    /**
     * Add copy handler for compact launch readiness summary.
     */
    if (!updated.includes("async function handleCopyLaunchReadinessSummary()")) {
      const copyHandler = `

  async function handleCopyLaunchReadinessSummary() {
    setCopyLaunchReadinessMessage("");
    setWorkspaceError("");

    const summary = createLaunchReadinessSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyLaunchReadinessMessage("Launch readiness summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy launch readiness summary.";

      setCopyLaunchReadinessMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyLaunchReadinessSummary function.");
    } else {
      console.log("handleCopyLaunchReadinessSummary already exists.");
    }

    /**
     * Add Launch Readiness export/copy buttons beside Visual QA controls.
     */
    if (!updated.includes("Export launch report")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyVisualQaSummary}
            >
              Copy Visual QA summary
            </button>

            <span
              style={{
                color:
                  copyVisualQaMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyVisualQaMessage || "Copy compact visual QA notes."}
            </span>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyVisualQaSummary}
            >
              Copy Visual QA summary
            </button>

            <span
              style={{
                color:
                  copyVisualQaMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyVisualQaMessage || "Copy compact visual QA notes."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportLaunchReadinessReport}
              disabled={isExportingLaunchReadinessReport}
            >
              {isExportingLaunchReadinessReport
                ? "Exporting..."
                : "Export launch report"}
            </button>

            <span
              style={{
                color:
                  launchReadinessReportMessage
                    .toLowerCase()
                    .includes("failed") ||
                  launchReadinessReportMessage
                    .toLowerCase()
                    .includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {launchReadinessReportMessage ||
                "Save launch readiness verdict into the project tree."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleCopyLaunchReadinessSummary}
            >
              Copy launch summary
            </button>

            <span
              style={{
                color:
                  copyLaunchReadinessMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyLaunchReadinessMessage ||
                "Copy compact launch readiness summary."}
            </span>`
      );

      console.log("Added launch report export/copy UI.");
    } else {
      console.log("Launch report UI already exists.");
    }

    /**
     * Add launch readiness report to Full build pack.
     */
    if (!updated.includes('filePath: "config/launch-readiness-report.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/visual-qa-checklist.md",
        contents: createVisualQaChecklistMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/visual-qa-checklist.md",
        contents: createVisualQaChecklistMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/launch-readiness-report.md",
        contents: createLaunchReadinessReportMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added launch readiness report to Full build pack.");
    } else {
      console.log("Launch readiness report already included in Full build pack.");
    }

    /**
     * Update the Full build pack helper text.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, launch readiness report, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, launch readiness report, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/launch-readiness-report.md to Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/launch-readiness-report.md"')) {
      console.log("Build Pack contents already tracks launch readiness report.");
      return updated;
    }

    const visualQaBlock = `    {
      path: "config/visual-qa-checklist.md",
      label: "Visual QA checklist",
      purpose:
        "Systematic visual review checklist for first impression, layout, typography, spacing, CTAs, forms, responsiveness, accessibility, interaction states, and launch polish.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/visual-qa-checklist.md",
      label: "Visual QA checklist",
      purpose:
        "Systematic visual review checklist for first impression, layout, typography, spacing, CTAs, forms, responsiveness, accessibility, interaction states, and launch polish.",
    },
    {
      path: "config/launch-readiness-report.md",
      label: "Launch readiness report",
      purpose:
        "Overall launch verdict combining build pack, deployment, security, design quality, visual builder competitiveness, Visual QA, blockers, and next actions.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(visualQaBlock)) {
      updated = updated.replace(visualQaBlock, repairedBlock);
      console.log("Added launch readiness report to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the Visual QA block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/launch-readiness-report.md",
      label: "Launch readiness report",
      purpose:
        "Overall launch verdict combining build pack, deployment, security, design quality, visual builder competitiveness, Visual QA, blockers, and next actions.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/launch-readiness-report.md"')) {
      die("Could not add launch readiness report to Build Pack contents tracking.");
    }

    console.log("Added launch readiness report using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Launch readiness report export wiring complete.");
console.log(`Backup created at: ${backupPath}`);