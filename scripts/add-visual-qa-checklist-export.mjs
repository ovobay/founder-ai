import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Visual QA checklist export.
 *
 * It adds:
 * - createVisualQaChecklistMarkdown()
 * - Export Visual QA checklist button
 * - Copy Visual QA summary button
 * - config/visual-qa-checklist.md export/update behavior
 * - config/visual-qa-checklist.md into the Full build pack
 * - config/visual-qa-checklist.md into Build Pack contents tracking
 *
 * Why this matters:
 * Founder AI needs to compete with polished visual/prototype tools.
 * A generated UI should be reviewed systematically before anyone calls it good.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-visual-qa-checklist-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Source files deserve airbags too.
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
 * 1. Add Visual QA checklist Markdown helper.
 *
 * This helper creates a practical UI review checklist for generated projects.
 * It uses design quality and Claude competitiveness reports to contextualize the checklist.
 */
const visualQaChecklistHelper = `function createVisualQaChecklistMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const designReport = getDesignQualityReport({
    previewState,
    files,
  });

  const claudeReport = getClaudeDesignCompetitivenessReport({
    previewState,
    files,
  });

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const weakDesignFindings = designReport.findings.filter(
    (finding) => finding.status === "weak"
  );

  const designNeedsReview = designReport.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const behindClaudeFindings = claudeReport.findings.filter(
    (finding) => finding.status === "behind"
  );

  const promisingClaudeFindings = claudeReport.findings.filter(
    (finding) => finding.status === "promising"
  );

  const lines = [
    "# Visual QA checklist",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    "",
    "## Current design signals",
    "",
    \`- Design quality: \${designReport.label} · \${designReport.score}%\`,
    \`- Claude Design competitiveness: \${claudeReport.label} · \${claudeReport.score}%\`,
    \`- UI files detected: \${uiFiles.length}\`,
    "",
    "## Priority design concerns",
    "",
    ...(weakDesignFindings.length > 0
      ? weakDesignFindings.map(
          (finding) => \`- [ ] \${finding.label}: \${finding.detail}\`
        )
      : ["- [ ] No weak design findings detected."]),
    "",
    "## Areas needing visual review",
    "",
    ...(designNeedsReview.length > 0
      ? designNeedsReview.map(
          (finding) => \`- [ ] \${finding.label}: \${finding.detail}\`
        )
      : ["- [ ] No medium-risk design findings detected."]),
    "",
    "## Claude Design competitiveness gaps",
    "",
    ...(behindClaudeFindings.length > 0
      ? behindClaudeFindings.map(
          (finding) =>
            \`- [ ] \${finding.label}: \${finding.detail} Recommendation: \${finding.recommendation}\`
        )
      : ["- [ ] No behind-benchmark findings detected."]),
    "",
    "## Promising but incomplete competitive areas",
    "",
    ...(promisingClaudeFindings.length > 0
      ? promisingClaudeFindings.map(
          (finding) =>
            \`- [ ] \${finding.label}: \${finding.detail} Recommendation: \${finding.recommendation}\`
        )
      : ["- [ ] No promising-but-incomplete findings detected."]),
    "",
    "## First impression QA",
    "",
    "- [ ] The first screen explains what the product does within five seconds.",
    "- [ ] The value proposition is visible without scrolling.",
    "- [ ] The page has one obvious primary action.",
    "- [ ] The visual style matches the product category and target customer.",
    "- [ ] The preview feels like a real product, not a dressed-up wireframe.",
    "",
    "## Layout QA",
    "",
    "- [ ] Page sections have clear visual hierarchy.",
    "- [ ] Cards, panels, lists, and forms align consistently.",
    "- [ ] Important content is not cramped against borders.",
    "- [ ] There is enough breathing room without wasting space like a luxury hotel lobby.",
    "- [ ] Related elements are grouped logically.",
    "- [ ] Navigation and major actions are easy to locate.",
    "",
    "## Typography QA",
    "",
    "- [ ] Headings, subheadings, body text, metadata, and labels have clear hierarchy.",
    "- [ ] Font sizes are readable on desktop and mobile.",
    "- [ ] Font weights are consistent and not randomly dramatic.",
    "- [ ] Line height supports comfortable reading.",
    "- [ ] Text contrast is strong enough against backgrounds.",
    "",
    "## Spacing and polish QA",
    "",
    "- [ ] Spacing between elements is consistent.",
    "- [ ] Buttons and inputs have consistent height and padding.",
    "- [ ] Border radii feel intentional across components.",
    "- [ ] Shadows are subtle and consistent.",
    "- [ ] Dividers and borders are not visually noisy.",
    "- [ ] Hover and focus states do not shift layout unexpectedly.",
    "",
    "## Buttons and CTA QA",
    "",
    "- [ ] Primary button is visually dominant.",
    "- [ ] Secondary buttons do not compete with primary actions.",
    "- [ ] Button labels are action-oriented and clear.",
    "- [ ] Disabled buttons explain why they are disabled where necessary.",
    "- [ ] Loading states prevent accidental repeated actions.",
    "",
    "## Forms and inputs QA",
    "",
    "- [ ] Inputs have clear labels or accessible names.",
    "- [ ] Placeholder text is helpful but not required to understand the field.",
    "- [ ] Validation errors are specific and human-readable.",
    "- [ ] Required fields are obvious.",
    "- [ ] Form spacing remains readable on mobile.",
    "",
    "## Empty, loading, error, and success states",
    "",
    "- [ ] Empty states explain what the user should do next.",
    "- [ ] Loading states are visible and do not feel broken.",
    "- [ ] Error states explain what failed and how to recover.",
    "- [ ] Success states confirm what happened.",
    "- [ ] Expensive actions like AI generation or publishing show progress.",
    "",
    "## Responsiveness QA",
    "",
    "- [ ] Layout works at mobile width.",
    "- [ ] Layout works at tablet width.",
    "- [ ] Layout works at desktop width.",
    "- [ ] Navigation remains usable on small screens.",
    "- [ ] Cards and grids wrap cleanly.",
    "- [ ] Text does not overflow containers.",
    "- [ ] Sticky/fixed elements do not block content.",
    "",
    "## Accessibility QA",
    "",
    "- [ ] Buttons and interactive elements are keyboard accessible.",
    "- [ ] Focus-visible styles are clear.",
    "- [ ] Semantic HTML is used where possible.",
    "- [ ] ARIA labels are used for icon-only buttons.",
    "- [ ] Color is not the only way status is communicated.",
    "- [ ] Text contrast is acceptable.",
    "",
    "## Interaction QA",
    "",
    "- [ ] Hover states exist for clickable elements.",
    "- [ ] Focus states exist for keyboard users.",
    "- [ ] Disabled states are visually distinct.",
    "- [ ] Loading states are clear.",
    "- [ ] Click actions give feedback.",
    "- [ ] Animations are subtle and do not harm usability.",
    "",
    "## Realistic content QA",
    "",
    "- [ ] Demo content matches the target industry.",
    "- [ ] Metrics, cards, and labels feel believable.",
    "- [ ] No lorem ipsum or generic placeholder sludge remains.",
    "- [ ] Empty states use product-specific language.",
    "- [ ] Generated examples help users understand what the product can do.",
    "",
    "## UI files to inspect",
    "",
    ...(uiFiles.length > 0
      ? uiFiles.map((file) => \`- \${file.path}\`)
      : ["No UI files detected. Generate UI files before visual QA."]),
    "",
    "## Final visual sign-off",
    "",
    "- [ ] Product looks credible enough to show a customer.",
    "- [ ] Product looks polished enough to show an investor.",
    "- [ ] Product looks clear enough for a developer to continue.",
    "- [ ] Product does not visually collapse on mobile.",
    "- [ ] Product has no obvious placeholder content.",
    "- [ ] Product has a clear next action.",
    "",
    "> Generated by Founder AI. Visual QA exists because taste should not be left to vibes and caffeine.",
    "",
  ];

  return lines.join("\\\\n");
}

function createVisualQaSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const designReport = getDesignQualityReport({
    previewState,
    files,
  });

  const claudeReport = getClaudeDesignCompetitivenessReport({
    previewState,
    files,
  });

  const weakDesignFindings = designReport.findings.filter(
    (finding) => finding.status === "weak"
  );

  const behindClaudeFindings = claudeReport.findings.filter(
    (finding) => finding.status === "behind"
  );

  const lines = [
    "Founder AI Visual QA summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Scores:",
    "- Design quality: " + designReport.label + " · " + designReport.score + "%",
    "- Claude Design competitiveness: " +
      claudeReport.label +
      " · " +
      claudeReport.score +
      "%",
    "",
    "Weak design findings:",
    ...(weakDesignFindings.length > 0
      ? weakDesignFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"]),
    "",
    "Behind Claude Design benchmark:",
    ...(behindClaudeFindings.length > 0
      ? behindClaudeFindings.map(
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
    "Immediate visual QA actions:",
    "- Check first impression and product clarity.",
    "- Review layout hierarchy and spacing.",
    "- Review typography hierarchy and readability.",
    "- Check CTA clarity.",
    "- Test mobile, tablet, and desktop widths.",
    "- Check hover, focus, disabled, loading, error, empty, and success states.",
    "- Replace generic placeholder content with realistic product content.",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createVisualQaChecklistMarkdown(")) {
  if (source.includes("function createClaudeDesignCompetitivenessMarkdown(")) {
    insertBefore(
      "Visual QA checklist helper",
      "function createClaudeDesignCompetitivenessMarkdown(",
      visualQaChecklistHelper
    );
  } else if (source.includes("function createDesignReviewMarkdown(")) {
    insertBefore(
      "Visual QA checklist helper",
      "function createDesignReviewMarkdown(",
      visualQaChecklistHelper
    );
  } else {
    insertBefore(
      "Visual QA checklist helper",
      "function DeployReadinessPanel(",
      visualQaChecklistHelper
    );
  }

  console.log("Added Visual QA checklist helper.");
} else {
  console.log("Visual QA checklist helper already exists.");
}

/**
 * 2. Patch DeployReadinessPanel with Visual QA export/copy state, handlers, and buttons.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for Visual QA export and copy actions.
     */
    if (!updated.includes("const [isExportingVisualQa")) {
      updated = updated.replace(
        `  const [
    copyClaudeCompetitivenessMessage,
    setCopyClaudeCompetitivenessMessage,
  ] = useState("");`,
        `  const [
    copyClaudeCompetitivenessMessage,
    setCopyClaudeCompetitivenessMessage,
  ] = useState("");
  const [isExportingVisualQa, setIsExportingVisualQa] = useState(false);
  const [visualQaMessage, setVisualQaMessage] = useState("");
  const [copyVisualQaMessage, setCopyVisualQaMessage] = useState("");`
      );

      console.log("Added Visual QA state.");
    } else {
      console.log("Visual QA state already exists.");
    }

    /**
     * Add export handler for config/visual-qa-checklist.md.
     */
    if (!updated.includes("async function handleExportVisualQaChecklist()")) {
      const exportHandler = `

  async function handleExportVisualQaChecklist() {
    setIsExportingVisualQa(true);
    setVisualQaMessage("");
    setWorkspaceError("");

    const filePath = "config/visual-qa-checklist.md";
    const contents = createVisualQaChecklistMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setVisualQaMessage(\`config/visual-qa-checklist.md \${result}.\`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export Visual QA checklist.";

      setVisualQaMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingVisualQa(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportVisualQaChecklist function.");
    } else {
      console.log("handleExportVisualQaChecklist already exists.");
    }

    /**
     * Add copy handler for compact Visual QA summary.
     */
    if (!updated.includes("async function handleCopyVisualQaSummary()")) {
      const copyHandler = `

  async function handleCopyVisualQaSummary() {
    setCopyVisualQaMessage("");
    setWorkspaceError("");

    const summary = createVisualQaSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyVisualQaMessage("Visual QA summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy Visual QA summary.";

      setCopyVisualQaMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyVisualQaSummary function.");
    } else {
      console.log("handleCopyVisualQaSummary already exists.");
    }

    /**
     * Add Visual QA export/copy buttons beside Claude competitiveness controls.
     */
    if (!updated.includes("Export Visual QA")) {
      updated = updated.replace(
        `            <button
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
            </span>`,
        `            <button
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
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportVisualQaChecklist}
              disabled={isExportingVisualQa}
            >
              {isExportingVisualQa ? "Exporting..." : "Export Visual QA"}
            </button>

            <span
              style={{
                color:
                  visualQaMessage.toLowerCase().includes("failed") ||
                  visualQaMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {visualQaMessage || "Save visual QA checklist into the project tree."}
            </span>

            <button
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
            </span>`
      );

      console.log("Added Visual QA export/copy UI.");
    } else {
      console.log("Visual QA UI already exists.");
    }

    /**
     * Add Visual QA checklist to Full build pack.
     */
    if (!updated.includes('filePath: "config/visual-qa-checklist.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/claude-design-competitiveness.md",
        contents: createClaudeDesignCompetitivenessMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/claude-design-competitiveness.md",
        contents: createClaudeDesignCompetitivenessMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/visual-qa-checklist.md",
        contents: createVisualQaChecklistMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added Visual QA checklist to Full build pack.");
    } else {
      console.log("Visual QA checklist already included in Full build pack.");
    }

    /**
     * Update helper text for Full build pack.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, Claude competitiveness review, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, security rules, design review, Claude competitiveness review, Visual QA checklist, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, Claude competitiveness review, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, design review, Claude competitiveness review, Visual QA checklist, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/visual-qa-checklist.md to Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/visual-qa-checklist.md"')) {
      console.log("Build Pack contents already tracks Visual QA checklist.");
      return updated;
    }

    const claudeReviewBlock = `    {
      path: "config/claude-design-competitiveness.md",
      label: "Claude competitiveness review",
      purpose:
        "Competitive analysis for visual/prototype quality, builder differentiation, handoff quality, realistic content, responsive polish, and design-system maturity.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/claude-design-competitiveness.md",
      label: "Claude competitiveness review",
      purpose:
        "Competitive analysis for visual/prototype quality, builder differentiation, handoff quality, realistic content, responsive polish, and design-system maturity.",
    },
    {
      path: "config/visual-qa-checklist.md",
      label: "Visual QA checklist",
      purpose:
        "Systematic visual review checklist for first impression, layout, typography, spacing, CTAs, forms, responsiveness, accessibility, interaction states, and launch polish.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(claudeReviewBlock)) {
      updated = updated.replace(claudeReviewBlock, repairedBlock);
      console.log("Added Visual QA checklist to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the Claude review block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/visual-qa-checklist.md",
      label: "Visual QA checklist",
      purpose:
        "Systematic visual review checklist for first impression, layout, typography, spacing, CTAs, forms, responsiveness, accessibility, interaction states, and launch polish.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/visual-qa-checklist.md"')) {
      die("Could not add Visual QA checklist to Build Pack contents tracking.");
    }

    console.log("Added Visual QA checklist to Build Pack contents tracking using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Visual QA checklist export wiring complete.");
console.log(`Backup created at: ${backupPath}`);