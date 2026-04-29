import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a "Copy design summary" button.
 *
 * The copied summary is shorter than config/design-review.md.
 * It is meant for quickly sharing the key design verdict, weak areas,
 * improvement priorities, and Claude Design competitiveness notes.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-copy-design-summary-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because one careless replacement and suddenly the app is modern art.
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
 * 1. Add helper that creates a compact plain-text design summary.
 *
 * This uses the existing getDesignQualityReport() helper and turns the findings
 * into a clipboard-friendly summary.
 */
const designSummaryHelper = `function createDesignImprovementSummary({
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

  const designReviewExists = files.some(
    (file) => file.path === "config/design-review.md"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const weakLines =
    weakFindings.length > 0
      ? weakFindings.map((finding) => "- " + finding.label + ": " + finding.detail)
      : ["- None detected"];

  const reviewLines =
    reviewFindings.length > 0
      ? reviewFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"];

  const strongLines =
    strongFindings.length > 0
      ? strongFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"];

  const uiFileLines =
    uiFiles.length > 0
      ? uiFiles.map((file) => "- " + file.path)
      : ["- No UI files detected"];

  const lines = [
    "Founder AI design improvement summary",
    "",
    "Product: " + previewState.title,
    "Description: " + previewState.subtitle,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "Complexity: " + (previewState.classification?.complexity ?? "standard"),
    "Design review file: " + (designReviewExists ? "present" : "missing"),
    "",
    "Design verdict:",
    "- Status: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Weak design areas:",
    ...weakLines,
    "",
    "Needs review:",
    ...reviewLines,
    "",
    "Strong signals:",
    ...strongLines,
    "",
    "UI files to inspect:",
    ...uiFileLines,
    "",
    "Claude Design competitiveness notes:",
    "- The preview should feel polished, not like a wireframe that discovered confidence.",
    "- The first screen should explain the product in seconds.",
    "- Typography needs clear hierarchy across heading, body, metadata, and CTA text.",
    "- Spacing should be consistent across cards, panels, lists, forms, and buttons.",
    "- The generated UI should include realistic preview content, not placeholder sludge.",
    "- Responsive behavior must be checked on mobile, tablet, and desktop widths.",
    "- Interaction states should exist: hover, focus-visible, disabled, loading, and success.",
    "",
    "Recommended next design upgrades:",
    "- Add or improve reusable UI primitives: Button, Card, Badge, Input, EmptyState, PageHeader.",
    "- Add a design system map for spacing, radius, typography, shadows, and component variants.",
    "- Add polished loading, empty, error, and success states.",
    "- Add realistic demo data in previews.",
    "- Add visual QA checks before publish.",
    "- Run an accessibility pass for labels, keyboard navigation, contrast, and semantics.",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createDesignImprovementSummary(")) {
  if (source.includes("function createDesignReviewMarkdown(")) {
    insertBefore(
      "createDesignImprovementSummary helper",
      "function createDesignReviewMarkdown(",
      designSummaryHelper
    );
  } else if (source.includes("function getDesignQualityReport(")) {
    insertBefore(
      "createDesignImprovementSummary helper",
      "function getDesignQualityReport(",
      designSummaryHelper
    );
  } else {
    insertBefore(
      "createDesignImprovementSummary helper",
      "function DeployReadinessPanel(",
      designSummaryHelper
    );
  }

  console.log("Added createDesignImprovementSummary helper.");
} else {
  console.log("createDesignImprovementSummary helper already exists.");
}

/**
 * 2. Patch DeployReadinessPanel with design-summary copy state, handler, and button.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state used by the Copy design summary button.
     */
    if (!updated.includes("const [copyDesignSummaryMessage")) {
      updated = updated.replace(
        `  const [designReviewMessage, setDesignReviewMessage] = useState("");`,
        `  const [designReviewMessage, setDesignReviewMessage] = useState("");
  const [copyDesignSummaryMessage, setCopyDesignSummaryMessage] =
    useState("");`
      );

      console.log("Added copy design summary state.");
    } else {
      console.log("Copy design summary state already exists.");
    }

    /**
     * Add clipboard handler.
     */
    if (!updated.includes("async function handleCopyDesignSummary()")) {
      const copyHandler = `

  async function handleCopyDesignSummary() {
    setCopyDesignSummaryMessage("");
    setWorkspaceError("");

    const designSummary = createDesignImprovementSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(designSummary);
      setCopyDesignSummaryMessage("Design summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy design summary.";

      setCopyDesignSummaryMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyDesignSummary function.");
    } else {
      console.log("handleCopyDesignSummary already exists.");
    }

    /**
     * Add Copy design summary button beside Export design review.
     */
    if (!updated.includes("Copy design summary")) {
      updated = updated.replace(
        `            <button
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
            </span>`,
        `            <button
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
            </span>

            <button
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
            </span>`
      );

      console.log("Added Copy design summary UI.");
    } else {
      console.log("Copy design summary UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Copy design improvement summary wiring complete.");
console.log(`Backup created at: ${backupPath}`);