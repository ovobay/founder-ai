import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add Publish Gate report export.
 *
 * It adds:
 * - createPublishGateReportMarkdown()
 * - createPublishGateSummary()
 * - Export publish gate report button
 * - Copy publish gate summary button
 * - config/publish-gate-report.md export/update behavior
 * - config/publish-gate-report.md into the Full build pack
 * - config/publish-gate-report.md into Build Pack contents tracking
 *
 * The publish gate is the simple decision layer:
 * - Blocked
 * - Can preview
 * - Can stage
 * - Can publish
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-gate-report-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before patching. Launch gates are useful. Rollbacks are survival.
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
 * 1. Add Publish Gate report helpers.
 *
 * These convert the Publish Gate decision into:
 * - a full markdown report saved to config/publish-gate-report.md
 * - a compact clipboard summary
 */
const publishGateReportHelper = `function createPublishGateReportMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getPublishGateReport({
    previewState,
    files,
  });

  const launchReport = getLaunchReadinessReport({
    previewState,
    files,
  });

  const buildPackHealth = getBuildPackHealth(files);

  const lines = [
    "# Publish gate report",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Industry: \${previewState.classification?.industry ?? "General"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    \`Platform targets: \${previewState.classification?.platformTargets.join(", ") || "web"}\`,
    "",
    "## Gate decision",
    "",
    \`Decision: \${report.label}\`,
    \`Score: \${report.score}%\`,
    "",
    report.summary,
    "",
    "## What this decision means",
    "",
    report.decision === "blocked"
      ? "The build should not move forward until blockers are fixed."
      : report.decision === "can-preview"
        ? "The build can be previewed internally, but should not be staged or published."
        : report.decision === "can-stage"
          ? "The build can move to staging for controlled review and testing, but should not go to production."
          : "The build can move toward production after final manual review and smoke testing.",
    "",
    "## Gate requirements",
    "",
    ...report.requirements.flatMap((requirement) => [
      \`### \${requirement.label}\`,
      "",
      \`Status: \${requirement.passed ? "passed" : "needs work"}\`,
      "",
      requirement.detail,
      "",
      requirement.passed
        ? "- [x] Requirement passed."
        : "- [ ] Resolve this requirement before moving to the next launch stage.",
      "",
    ]),
    "## Gate actions",
    "",
    ...(report.nextActions.length > 0
      ? report.nextActions.map((action) => \`- [ ] \${action}\`)
      : ["- [ ] Run final manual review and smoke tests."]),
    "",
    "## Related launch readiness",
    "",
    \`Launch readiness: \${launchReport.label} · \${launchReport.score}%\`,
    \`Build pack health: \${buildPackHealth.label} · \${buildPackHealth.score}%\`,
    "",
    "## Launch readiness signals",
    "",
    ...launchReport.signals.flatMap((signal) => [
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
    ...(launchReport.blockers.length > 0
      ? launchReport.blockers.map((blocker) => \`- [ ] \${blocker}\`)
      : ["No launch readiness blockers detected from generated signals."]),
    "",
    "## Final manual checks",
    "",
    "- [ ] Review generated code.",
    "- [ ] Review environment variables.",
    "- [ ] Review database migration if present.",
    "- [ ] Review security review and security rules.",
    "- [ ] Review visual QA and design review.",
    "- [ ] Run production build.",
    "- [ ] Deploy to staging first.",
    "- [ ] Test sign-in/sign-up.",
    "- [ ] Test primary workflow.",
    "- [ ] Check browser console.",
    "- [ ] Check server logs.",
    "- [ ] Confirm no secrets are exposed client-side.",
    "",
    "> Generated by Founder AI. A publish gate is not permission to skip judgment, it is a warning label with manners.",
    "",
  ];

  return lines.join("\\\\n");
}

function createPublishGateSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getPublishGateReport({
    previewState,
    files,
  });

  const lines = [
    "Founder AI publish gate summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Gate decision:",
    "- Decision: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Requirements:",
    ...report.requirements.map(
      (requirement) =>
        "- " +
        requirement.label +
        ": " +
        (requirement.passed ? "passed" : "needs work") +
        " · " +
        requirement.detail
    ),
    "",
    "Next actions:",
    ...(report.nextActions.length > 0
      ? report.nextActions.map((action) => "- " + action)
      : ["- Run final manual review and smoke tests."]),
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createPublishGateReportMarkdown(")) {
  if (source.includes("function getPublishGateReport(")) {
    insertBefore(
      "Publish Gate report helper",
      "function getPublishGateReport(",
      publishGateReportHelper
    );
  } else if (source.includes("function createLaunchReadinessReportMarkdown(")) {
    insertBefore(
      "Publish Gate report helper",
      "function createLaunchReadinessReportMarkdown(",
      publishGateReportHelper
    );
  } else {
    insertBefore(
      "Publish Gate report helper",
      "function DeployReadinessPanel(",
      publishGateReportHelper
    );
  }

  console.log("Added Publish Gate report helpers.");
} else {
  console.log("Publish Gate report helpers already exist.");
}

/**
 * 2. Patch DeployReadinessPanel with publish gate export/copy state,
 * handlers, UI buttons, and full build pack inclusion.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for publish gate report export/copy actions.
     */
    if (!updated.includes("const [isExportingPublishGateReport")) {
      updated = updated.replace(
        `  const [copyLaunchReadinessMessage, setCopyLaunchReadinessMessage] =
    useState("");`,
        `  const [copyLaunchReadinessMessage, setCopyLaunchReadinessMessage] =
    useState("");
  const [isExportingPublishGateReport, setIsExportingPublishGateReport] =
    useState(false);
  const [publishGateReportMessage, setPublishGateReportMessage] =
    useState("");
  const [copyPublishGateMessage, setCopyPublishGateMessage] = useState("");`
      );

      console.log("Added publish gate report state.");
    } else {
      console.log("Publish gate report state already exists.");
    }

    /**
     * Add export handler for config/publish-gate-report.md.
     */
    if (!updated.includes("async function handleExportPublishGateReport()")) {
      const exportHandler = `

  async function handleExportPublishGateReport() {
    setIsExportingPublishGateReport(true);
    setPublishGateReportMessage("");
    setWorkspaceError("");

    const filePath = "config/publish-gate-report.md";
    const contents = createPublishGateReportMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setPublishGateReportMessage(
        \`config/publish-gate-report.md \${result}.\`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export publish gate report.";

      setPublishGateReportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingPublishGateReport(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportPublishGateReport function.");
    } else {
      console.log("handleExportPublishGateReport already exists.");
    }

    /**
     * Add copy handler for compact publish gate summary.
     */
    if (!updated.includes("async function handleCopyPublishGateSummary()")) {
      const copyHandler = `

  async function handleCopyPublishGateSummary() {
    setCopyPublishGateMessage("");
    setWorkspaceError("");

    const summary = createPublishGateSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyPublishGateMessage("Publish gate summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy publish gate summary.";

      setCopyPublishGateMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyPublishGateSummary function.");
    } else {
      console.log("handleCopyPublishGateSummary already exists.");
    }

    /**
     * Add Publish Gate report buttons beside Launch report controls.
     */
    if (!updated.includes("Export publish gate")) {
      updated = updated.replace(
        `            <button
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
            </span>`,
        `            <button
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
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportPublishGateReport}
              disabled={isExportingPublishGateReport}
            >
              {isExportingPublishGateReport
                ? "Exporting..."
                : "Export publish gate"}
            </button>

            <span
              style={{
                color:
                  publishGateReportMessage.toLowerCase().includes("failed") ||
                  publishGateReportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {publishGateReportMessage ||
                "Save the publish decision into the project tree."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleCopyPublishGateSummary}
            >
              Copy gate summary
            </button>

            <span
              style={{
                color:
                  copyPublishGateMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyPublishGateMessage ||
                "Copy compact publish gate summary."}
            </span>`
      );

      console.log("Added publish gate export/copy UI.");
    } else {
      console.log("Publish gate UI already exists.");
    }

    /**
     * Add publish gate report to Full build pack.
     */
    if (!updated.includes('filePath: "config/publish-gate-report.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/launch-readiness-report.md",
        contents: createLaunchReadinessReportMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/launch-readiness-report.md",
        contents: createLaunchReadinessReportMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/publish-gate-report.md",
        contents: createPublishGateReportMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added publish gate report to Full build pack.");
    } else {
      console.log("Publish gate report already included in Full build pack.");
    }

    /**
     * Update Full build pack helper text.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, launch readiness report, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, launch readiness report, publish gate report, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, launch readiness report, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, visual builder competitiveness review, Visual QA checklist, launch readiness report, publish gate report, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/publish-gate-report.md to Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/publish-gate-report.md"')) {
      console.log("Build Pack contents already tracks publish gate report.");
      return updated;
    }

    const launchReportBlock = `    {
      path: "config/launch-readiness-report.md",
      label: "Launch readiness report",
      purpose:
        "Overall launch verdict combining build pack, deployment, security, design quality, visual builder competitiveness, Visual QA, blockers, and next actions.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/launch-readiness-report.md",
      label: "Launch readiness report",
      purpose:
        "Overall launch verdict combining build pack, deployment, security, design quality, visual builder competitiveness, Visual QA, blockers, and next actions.",
    },
    {
      path: "config/publish-gate-report.md",
      label: "Publish gate report",
      purpose:
        "Simple publish decision report showing whether the build is blocked, preview-ready, staging-ready, or publish-ready.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(launchReportBlock)) {
      updated = updated.replace(launchReportBlock, repairedBlock);
      console.log("Added publish gate report to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the Launch report block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/publish-gate-report.md",
      label: "Publish gate report",
      purpose:
        "Simple publish decision report showing whether the build is blocked, preview-ready, staging-ready, or publish-ready.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/publish-gate-report.md"')) {
      die("Could not add publish gate report to Build Pack contents tracking.");
    }

    console.log("Added publish gate report using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Publish gate report export wiring complete.");
console.log(`Backup created at: ${backupPath}`);