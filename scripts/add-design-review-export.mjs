import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a design review export.
 *
 * It adds:
 * - createDesignReviewMarkdown()
 * - Export design review button
 * - config/design-review.md export/update behavior
 * - config/design-review.md into the Full build pack
 * - config/design-review.md into Build Pack contents tracking
 *
 * The design review is meant to help Founder AI compete with visual builder tools
 * by generating a practical design critique and upgrade checklist for each build.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-design-review-export-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because "just one quick patch" is how ruins get discovered.
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
 * 1. Add design review markdown helper.
 *
 * This helper turns the Design Quality report into a practical design review file.
 * It focuses on what needs to improve for the generated product to compete with
 * polished visual builder output.
 */
const designReviewHelper = `function createDesignReviewMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getDesignQualityReport({
    previewState,
    files,
  });

  const weakFindings = report.findings.filter(
    (finding) => finding.status === "weak"
  );

  const reviewFindings = report.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const strongFindings = report.findings.filter(
    (finding) => finding.status === "strong"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const lines = [
    "# Design review",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    "",
    "## Design quality verdict",
    "",
    \`Status: \${report.label}\`,
    \`Score: \${report.score}%\`,
    "",
    report.summary,
    "",
    "## Strong design signals",
    "",
    ...(strongFindings.length > 0
      ? strongFindings.flatMap((finding) => [
          \`### \${finding.label}\`,
          "",
          finding.detail,
          "",
        ])
      : ["No strong design signals detected yet.", ""]),
    "## Needs review",
    "",
    ...(reviewFindings.length > 0
      ? reviewFindings.flatMap((finding) => [
          \`### \${finding.label}\`,
          "",
          finding.detail,
          "",
          "- [ ] Review this area visually.",
          "- [ ] Improve clarity, consistency, and production polish.",
          "",
        ])
      : ["No medium-risk design findings detected.", ""]),
    "## Weak design areas",
    "",
    ...(weakFindings.length > 0
      ? weakFindings.flatMap((finding) => [
          \`### \${finding.label}\`,
          "",
          finding.detail,
          "",
          "- [ ] Treat this as a design blocker before launch.",
          "- [ ] Add more complete UI structure and visual refinement.",
          "",
        ])
      : ["No weak design areas detected.", ""]),
    "## Claude Design competitiveness checklist",
    "",
    "- [ ] Preview should feel like a polished product, not a wireframe with ambition.",
    "- [ ] Hero/primary screen should communicate the product within five seconds.",
    "- [ ] Typography should have clear hierarchy: heading, subheading, body, metadata, CTA.",
    "- [ ] Spacing should feel intentional across panels, cards, lists, and forms.",
    "- [ ] Buttons should have clear priority: primary, secondary, quiet, destructive.",
    "- [ ] Empty states should explain what happens next.",
    "- [ ] Generated pages should be responsive across mobile, tablet, and desktop.",
    "- [ ] Visual style should match the product category and target customer.",
    "- [ ] Repeated components should use consistent spacing, border radius, shadows, and icon treatment.",
    "- [ ] Preview should show realistic content, not placeholder sludge.",
    "",
    "## UI files to review",
    "",
    ...(uiFiles.length > 0
      ? uiFiles.map((file) => \`- \${file.path}\`)
      : ["No UI files detected. Generate or add UI files before visual review."]),
    "",
    "## Recommended next design upgrades",
    "",
    "- [ ] Add a dedicated design system file or component map.",
    "- [ ] Add reusable Button, Card, Badge, Input, EmptyState, and PageHeader components.",
    "- [ ] Add responsive breakpoints and test preview on narrow widths.",
    "- [ ] Add polished loading, empty, error, and success states.",
    "- [ ] Add realistic demo data for previews.",
    "- [ ] Add a visual QA checklist before publish.",
    "- [ ] Add interaction polish: hover, focus-visible, disabled, loading, and pressed states.",
    "- [ ] Add accessibility pass: keyboard navigation, contrast, labels, and semantic structure.",
    "",
    "## Launch note",
    "",
    "This review is heuristic. A human still needs to look at the interface. Terrible burden, eyesight.",
    "",
    "> Generated by Founder AI. Use this file to improve visual quality before launch.",
    "",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createDesignReviewMarkdown(")) {
  if (source.includes("function getDesignQualityReport(")) {
    insertBefore(
      "createDesignReviewMarkdown helper",
      "function getDesignQualityReport(",
      designReviewHelper
    );
  } else if (source.includes("function createSecurityRulesScaffoldMarkdown(")) {
    insertBefore(
      "createDesignReviewMarkdown helper",
      "function createSecurityRulesScaffoldMarkdown(",
      designReviewHelper
    );
  } else {
    insertBefore(
      "createDesignReviewMarkdown helper",
      "function DeployReadinessPanel(",
      designReviewHelper
    );
  }

  console.log("Added createDesignReviewMarkdown helper.");
} else {
  console.log("createDesignReviewMarkdown helper already exists.");
}

/**
 * 2. Patch DeployReadinessPanel with design review export state, handler, and button.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for the Export design review button.
     */
    if (!updated.includes("const [isExportingDesignReview")) {
      updated = updated.replace(
        `  const [securityRulesMessage, setSecurityRulesMessage] = useState("");`,
        `  const [securityRulesMessage, setSecurityRulesMessage] = useState("");
  const [isExportingDesignReview, setIsExportingDesignReview] =
    useState(false);
  const [designReviewMessage, setDesignReviewMessage] = useState("");`
      );

      console.log("Added design review export state.");
    } else {
      console.log("Design review export state already exists.");
    }

    /**
     * Add handler that creates or updates config/design-review.md.
     */
    if (!updated.includes("async function handleExportDesignReview()")) {
      const exportHandler = `

  async function handleExportDesignReview() {
    setIsExportingDesignReview(true);
    setDesignReviewMessage("");
    setWorkspaceError("");

    const filePath = "config/design-review.md";
    const contents = createDesignReviewMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setDesignReviewMessage(\`config/design-review.md \${result}.\`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export design review.";

      setDesignReviewMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDesignReview(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportDesignReview function.");
    } else {
      console.log("handleExportDesignReview already exists.");
    }

    /**
     * Add Export design review button near the other export controls.
     */
    if (!updated.includes("Export design review")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportSecurityRules}
              disabled={isExportingSecurityRules}
            >
              {isExportingSecurityRules
                ? "Exporting..."
                : "Export security rules"}
            </button>

            <span
              style={{
                color:
                  securityRulesMessage.toLowerCase().includes("failed") ||
                  securityRulesMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {securityRulesMessage ||
                "Save security implementation rules into the project tree."}
            </span>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportSecurityRules}
              disabled={isExportingSecurityRules}
            >
              {isExportingSecurityRules
                ? "Exporting..."
                : "Export security rules"}
            </button>

            <span
              style={{
                color:
                  securityRulesMessage.toLowerCase().includes("failed") ||
                  securityRulesMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {securityRulesMessage ||
                "Save security implementation rules into the project tree."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportDesignReview}
              disabled={isExportingDesignReview}
            >
              {isExportingDesignReview
                ? "Exporting..."
                : "Export design review"}
            </button>

            <span
              style={{
                color:
                  designReviewMessage.toLowerCase().includes("failed") ||
                  designReviewMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {designReviewMessage ||
                "Save design critique and upgrade checklist."}
            </span>`
      );

      console.log("Added Export design review UI.");
    } else {
      console.log("Export design review UI already exists.");
    }

    /**
     * Add design review to Full build pack export.
     */
    if (!updated.includes('filePath: "config/design-review.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/security-rules.md",
        contents: createSecurityRulesScaffoldMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/security-rules.md",
        contents: createSecurityRulesScaffoldMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/design-review.md",
        contents: createDesignReviewMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added design review to Full build pack.");
    } else {
      console.log("Design review already included in Full build pack.");
    }

    /**
     * Update full build pack helper text.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, security review, security rules, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/design-review.md into Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/design-review.md"')) {
      console.log("Build Pack contents already tracks design review.");
      return updated;
    }

    const securityRulesBlock = `    {
      path: "config/security-rules.md",
      label: "Security rules",
      purpose:
        "Implementation checklist for authentication, authorization, API protection, database/RLS, secrets, integrations, deployment security, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/security-rules.md",
      label: "Security rules",
      purpose:
        "Implementation checklist for authentication, authorization, API protection, database/RLS, secrets, integrations, deployment security, and smoke tests.",
    },
    {
      path: "config/design-review.md",
      label: "Design review",
      purpose:
        "Design critique and upgrade checklist covering layout, typography, spacing, responsiveness, CTA clarity, visual polish, and Claude Design competitiveness.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(securityRulesBlock)) {
      updated = updated.replace(securityRulesBlock, repairedBlock);
      console.log("Added design review to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the security rules block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/design-review.md",
      label: "Design review",
      purpose:
        "Design critique and upgrade checklist covering layout, typography, spacing, responsiveness, CTA clarity, visual polish, and Claude Design competitiveness.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/design-review.md"')) {
      die("Could not add design review to Build Pack contents tracking.");
    }

    console.log("Added design review to Build Pack contents tracking using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Design review export wiring complete.");
console.log(`Backup created at: ${backupPath}`);