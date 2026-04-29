import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Claude Design competitiveness review export.
 *
 * It adds:
 * - createClaudeDesignCompetitivenessMarkdown()
 * - Export Claude competitiveness review button
 * - Copy Claude competitiveness summary button
 * - config/claude-design-competitiveness.md export/update behavior
 * - config/claude-design-competitiveness.md into the Full build pack
 * - config/claude-design-competitiveness.md into Build Pack contents tracking
 *
 * The goal is to help Founder AI evaluate whether generated products can compete
 * with polished AI visual/prototype tools while keeping Founder AI's own edge:
 * real product structure, backend readiness, security, env vars, deploy prep, and handoff.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-claude-competitiveness-review-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because "surely this replacement is harmless" is how bugs get citizenship.
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
 * 1. Add Claude Design competitiveness Markdown helper.
 *
 * This creates the full review file that gets exported into:
 * config/claude-design-competitiveness.md
 */
const claudeCompetitivenessMarkdownHelper = `function createClaudeDesignCompetitivenessMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getClaudeDesignCompetitivenessReport({
    previewState,
    files,
  });

  const competitiveFindings = report.findings.filter(
    (finding) => finding.status === "competitive"
  );

  const promisingFindings = report.findings.filter(
    (finding) => finding.status === "promising"
  );

  const behindFindings = report.findings.filter(
    (finding) => finding.status === "behind"
  );

  const buildPackHealth = getBuildPackHealth(files);

  const designReviewExists = files.some(
    (file) => file.path === "config/design-review.md"
  );

  const developerInstructionsExist = files.some(
    (file) => file.path === "config/developer-instructions.md"
  );

  const securityReviewExists = files.some(
    (file) => file.path === "config/security-review.md"
  );

  const envExampleExists = files.some(
    (file) => file.path === "config/env.example"
  );

  const deployChecklistExists = files.some(
    (file) => file.path === "config/deploy-checklist.md"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const lines = [
    "# Claude Design competitiveness review",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Industry: \${previewState.classification?.industry ?? "General"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    \`Platform targets: \${previewState.classification?.platformTargets.join(", ") || "web"}\`,
    "",
    "## Competitive verdict",
    "",
    \`Status: \${report.label}\`,
    \`Score: \${report.score}%\`,
    "",
    report.summary,
    "",
    "## Why this matters",
    "",
    "Founder AI should not compete only as a visual design toy. It should compete as a real product builder: design, frontend, backend, database, integrations, security, deployment, and handoff.",
    "",
    "The goal is not merely to match polished visual output. The goal is to produce a build that looks polished and can actually move toward production without becoming a cursed folder of screenshots and regret.",
    "",
    "## Competitive findings",
    "",
    ...(competitiveFindings.length > 0
      ? competitiveFindings.flatMap((finding) => [
          \`### \${finding.label}\`,
          "",
          \`Status: \${finding.status}\`,
          "",
          finding.detail,
          "",
          "Recommendation:",
          finding.recommendation,
          "",
        ])
      : ["No fully competitive findings detected yet.", ""]),
    "## Promising but needs work",
    "",
    ...(promisingFindings.length > 0
      ? promisingFindings.flatMap((finding) => [
          \`### \${finding.label}\`,
          "",
          \`Status: \${finding.status}\`,
          "",
          finding.detail,
          "",
          "Recommendation:",
          finding.recommendation,
          "",
          "- [ ] Improve this area before treating the build as launch-grade.",
          "",
        ])
      : ["No promising-but-incomplete findings detected.", ""]),
    "## Behind the benchmark",
    "",
    ...(behindFindings.length > 0
      ? behindFindings.flatMap((finding) => [
          \`### \${finding.label}\`,
          "",
          \`Status: \${finding.status}\`,
          "",
          finding.detail,
          "",
          "Recommendation:",
          finding.recommendation,
          "",
          "- [ ] Treat this as a competitive gap.",
          "- [ ] Upgrade this before presenting the output as polished design-builder quality.",
          "",
        ])
      : ["No behind-benchmark findings detected.", ""]),
    "## Founder AI differentiation",
    "",
    \`- Build pack health: \${buildPackHealth.label} · \${buildPackHealth.score}%\`,
    \`- Project brief: \${files.some((file) => file.path === "config/project-brief.md") ? "present" : "missing"}\`,
    \`- Design review: \${designReviewExists ? "present" : "missing"}\`,
    \`- Developer instructions: \${developerInstructionsExist ? "present" : "missing"}\`,
    \`- Security review: \${securityReviewExists ? "present" : "missing"}\`,
    \`- Environment example: \${envExampleExists ? "present" : "missing"}\`,
    \`- Deployment checklist: \${deployChecklistExists ? "present" : "missing"}\`,
    \`- API routes planned: \${previewState.architecture.endpoints.length}\`,
    \`- Database tables planned: \${previewState.architecture.tables.length}\`,
    \`- Security rules planned: \${previewState.architecture.securityRules.length}\`,
    "",
    "Founder AI's strongest competitive angle is full-product readiness. Claude-style visual polish matters, but Founder AI should win by combining polished UI with real implementation planning.",
    "",
    "## UI files to inspect",
    "",
    ...(uiFiles.length > 0
      ? uiFiles.map((file) => \`- \${file.path}\`)
      : ["No UI files detected. Generate UI files before visual competitiveness review."]),
    "",
    "## Design-builder gap checklist",
    "",
    "- [ ] Generated preview looks polished enough to show a customer.",
    "- [ ] First screen explains the product in under five seconds.",
    "- [ ] Layout has clear hierarchy and intentional spacing.",
    "- [ ] UI uses reusable primitives instead of one-off messy components.",
    "- [ ] Realistic content is used instead of placeholders.",
    "- [ ] Responsive behavior is defined and tested.",
    "- [ ] Interactive states exist: hover, focus, disabled, loading, success, and error.",
    "- [ ] Empty states explain what happens next.",
    "- [ ] Generated code supports real data and backend workflows.",
    "- [ ] Handoff files explain what was built and what remains.",
    "- [ ] Security and deployment readiness are visible before launch.",
    "",
    "## Product-builder advantage checklist",
    "",
    "- [ ] Environment variables are listed and exportable.",
    "- [ ] Supabase migration is generated when tables exist.",
    "- [ ] Deployment checklist is generated.",
    "- [ ] Security review is generated.",
    "- [ ] Developer instructions are generated.",
    "- [ ] Design review is generated.",
    "- [ ] Build pack health is complete.",
    "- [ ] Publish readiness gives a practical launch verdict.",
    "",
    "## Recommended next upgrades",
    "",
    "- [ ] Add a dedicated visual QA mode.",
    "- [ ] Add screenshot-style preview scoring.",
    "- [ ] Add generated design system tokens.",
    "- [ ] Add component inventory export.",
    "- [ ] Add responsive preview breakpoints.",
    "- [ ] Add a live edit mode for spacing, typography, colors, and component variants.",
    "- [ ] Add production-readiness gates before publish.",
    "- [ ] Add richer realistic demo data for each generated product category.",
    "",
    "> Generated by Founder AI. Competing with polished visual builders requires taste, structure, and fewer decorative lies.",
    "",
  ];

  return lines.join("\\\\n");
}

function createClaudeDesignCompetitivenessSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getClaudeDesignCompetitivenessReport({
    previewState,
    files,
  });

  const behindFindings = report.findings.filter(
    (finding) => finding.status === "behind"
  );

  const promisingFindings = report.findings.filter(
    (finding) => finding.status === "promising"
  );

  const competitiveFindings = report.findings.filter(
    (finding) => finding.status === "competitive"
  );

  const lines = [
    "Founder AI Claude Design competitiveness summary",
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
    "Competitive areas:",
    ...(competitiveFindings.length > 0
      ? competitiveFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"]),
    "",
    "Promising areas:",
    ...(promisingFindings.length > 0
      ? promisingFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"]),
    "",
    "Behind benchmark:",
    ...(behindFindings.length > 0
      ? behindFindings.map(
          (finding) =>
            "- " +
            finding.label +
            ": " +
            finding.detail +
            " Recommendation: " +
            finding.recommendation
        )
      : ["- None detected"]),
    "",
    "Founder AI advantage:",
    "- Compete beyond visual design by bundling frontend, backend planning, database migrations, env vars, security review, deployment checklist, and developer handoff.",
    "- Keep visual polish high while making the generated build actually useful for production planning.",
    "",
    "Next upgrades:",
    "- Improve visual preview polish.",
    "- Add realistic content.",
    "- Strengthen reusable design system output.",
    "- Add responsive preview checks.",
    "- Add stronger interaction states.",
    "- Keep full build pack complete.",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createClaudeDesignCompetitivenessMarkdown(")) {
  if (source.includes("function createDesignImprovementSummary(")) {
    insertBefore(
      "Claude competitiveness markdown helper",
      "function createDesignImprovementSummary(",
      claudeCompetitivenessMarkdownHelper
    );
  } else if (source.includes("function createDesignReviewMarkdown(")) {
    insertBefore(
      "Claude competitiveness markdown helper",
      "function createDesignReviewMarkdown(",
      claudeCompetitivenessMarkdownHelper
    );
  } else {
    insertBefore(
      "Claude competitiveness markdown helper",
      "function DeployReadinessPanel(",
      claudeCompetitivenessMarkdownHelper
    );
  }

  console.log("Added Claude competitiveness markdown and summary helpers.");
} else {
  console.log("Claude competitiveness helpers already exist.");
}

/**
 * 2. Patch DeployReadinessPanel with export/copy state, handlers, and buttons.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for export and copy actions.
     */
    if (!updated.includes("const [isExportingClaudeCompetitiveness")) {
      updated = updated.replace(
        `  const [copyDesignSummaryMessage, setCopyDesignSummaryMessage] =
    useState("");`,
        `  const [copyDesignSummaryMessage, setCopyDesignSummaryMessage] =
    useState("");
  const [
    isExportingClaudeCompetitiveness,
    setIsExportingClaudeCompetitiveness,
  ] = useState(false);
  const [claudeCompetitivenessMessage, setClaudeCompetitivenessMessage] =
    useState("");
  const [
    copyClaudeCompetitivenessMessage,
    setCopyClaudeCompetitivenessMessage,
  ] = useState("");`
      );

      console.log("Added Claude competitiveness state.");
    } else {
      console.log("Claude competitiveness state already exists.");
    }

    /**
     * Add export handler.
     */
    if (!updated.includes("async function handleExportClaudeCompetitivenessReview()")) {
      const exportHandler = `

  async function handleExportClaudeCompetitivenessReview() {
    setIsExportingClaudeCompetitiveness(true);
    setClaudeCompetitivenessMessage("");
    setWorkspaceError("");

    const filePath = "config/claude-design-competitiveness.md";
    const contents = createClaudeDesignCompetitivenessMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setClaudeCompetitivenessMessage(
        \`config/claude-design-competitiveness.md \${result}.\`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export Claude competitiveness review.";

      setClaudeCompetitivenessMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingClaudeCompetitiveness(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportClaudeCompetitivenessReview function.");
    } else {
      console.log("handleExportClaudeCompetitivenessReview already exists.");
    }

    /**
     * Add copy handler.
     */
    if (!updated.includes("async function handleCopyClaudeCompetitivenessSummary()")) {
      const copyHandler = `

  async function handleCopyClaudeCompetitivenessSummary() {
    setCopyClaudeCompetitivenessMessage("");
    setWorkspaceError("");

    const summary = createClaudeDesignCompetitivenessSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyClaudeCompetitivenessMessage("Claude competitiveness summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy Claude competitiveness summary.";

      setCopyClaudeCompetitivenessMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyClaudeCompetitivenessSummary function.");
    } else {
      console.log("handleCopyClaudeCompetitivenessSummary already exists.");
    }

    /**
     * Add UI buttons beside Copy design summary.
     */
    if (!updated.includes("Export Claude competitiveness")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyDesignSummary}
            >
              Copy design summary
            </button>

            <span
              style={{
                color:
                  copyDesignSummaryMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyDesignSummaryMessage ||
                "Copy the key design improvement notes."}
            </span>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyDesignSummary}
            >
              Copy design summary
            </button>

            <span
              style={{
                color:
                  copyDesignSummaryMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyDesignSummaryMessage ||
                "Copy the key design improvement notes."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportClaudeCompetitivenessReview}
              disabled={isExportingClaudeCompetitiveness}
            >
              {isExportingClaudeCompetitiveness
                ? "Exporting..."
                : "Export Claude competitiveness"}
            </button>

            <span
              style={{
                color:
                  claudeCompetitivenessMessage.toLowerCase().includes("failed") ||
                  claudeCompetitivenessMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {claudeCompetitivenessMessage ||
                "Save Claude Design competitiveness review."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleCopyClaudeCompetitivenessSummary}
            >
              Copy Claude summary
            </button>

            <span
              style={{
                color:
                  copyClaudeCompetitivenessMessage
                    .toLowerCase()
                    .includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyClaudeCompetitivenessMessage ||
                "Copy the competitive design summary."}
            </span>`
      );

      console.log("Added Claude competitiveness export/copy UI.");
    } else {
      console.log("Claude competitiveness UI already exists.");
    }

    /**
     * Add Claude competitiveness review to Full build pack.
     */
    if (!updated.includes('filePath: "config/claude-design-competitiveness.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/design-review.md",
        contents: createDesignReviewMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/design-review.md",
        contents: createDesignReviewMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/claude-design-competitiveness.md",
        contents: createClaudeDesignCompetitivenessMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added Claude competitiveness review to Full build pack.");
    } else {
      console.log("Claude competitiveness review already included in Full build pack.");
    }

    /**
     * Update the full build pack helper text.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, Claude competitiveness review, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, Claude competitiveness review, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/claude-design-competitiveness.md to Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/claude-design-competitiveness.md"')) {
      console.log("Build Pack contents already tracks Claude competitiveness review.");
      return updated;
    }

    const designReviewBlock = `    {
      path: "config/design-review.md",
      label: "Design review",
      purpose:
        "Design critique and upgrade checklist covering layout, typography, spacing, responsiveness, CTA clarity, visual polish, and Claude Design competitiveness.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/design-review.md",
      label: "Design review",
      purpose:
        "Design critique and upgrade checklist covering layout, typography, spacing, responsiveness, CTA clarity, visual polish, and Claude Design competitiveness.",
    },
    {
      path: "config/claude-design-competitiveness.md",
      label: "Claude competitiveness review",
      purpose:
        "Competitive analysis for visual/prototype quality, builder differentiation, handoff quality, realistic content, responsive polish, and design-system maturity.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(designReviewBlock)) {
      updated = updated.replace(designReviewBlock, repairedBlock);
      console.log("Added Claude competitiveness review to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the design review block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/claude-design-competitiveness.md",
      label: "Claude competitiveness review",
      purpose:
        "Competitive analysis for visual/prototype quality, builder differentiation, handoff quality, realistic content, responsive polish, and design-system maturity.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/claude-design-competitiveness.md"')) {
      die("Could not add Claude competitiveness review to Build Pack contents tracking.");
    }

    console.log("Added Claude competitiveness review to Build Pack contents tracking using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Claude competitiveness review export wiring complete.");
console.log(`Backup created at: ${backupPath}`);