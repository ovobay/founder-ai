import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Visual QA health panel.
 *
 * The panel appears inside Publish readiness and evaluates whether the generated
 * build has enough visual QA readiness to be reviewed or shown.
 *
 * It checks:
 * - Whether config/visual-qa-checklist.md exists
 * - Design Quality score/status
 * - Claude Design competitiveness score/status
 * - UI files detected
 * - Weak design findings
 * - Behind-benchmark competitive findings
 *
 * This does not replace human design review. It exists because "looks fine"
 * is not a QA process, it is a cry for supervision.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-visual-qa-health-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. This file has earned hazard pay.
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
 * 1. Add Visual QA health types.
 *
 * These types describe the overall QA health status and individual findings.
 */
const visualQaHealthTypes = `type VisualQaHealthStatus = "ready" | "needs-review" | "missing";

type VisualQaHealthFinding = {
  id: string;
  label: string;
  status: VisualQaHealthStatus;
  detail: string;
};

type VisualQaHealthReport = {
  status: VisualQaHealthStatus;
  label: string;
  score: number;
  summary: string;
  findings: VisualQaHealthFinding[];
};

`;

if (!source.includes("type VisualQaHealthStatus =")) {
  if (source.includes("type ClaudeDesignCompetitiveStatus =")) {
    insertBefore(
      "Visual QA health types",
      "type ClaudeDesignCompetitiveStatus =",
      visualQaHealthTypes
    );
  } else if (source.includes("type DesignQualityStatus =")) {
    insertBefore(
      "Visual QA health types",
      "type DesignQualityStatus =",
      visualQaHealthTypes
    );
  } else {
    insertBefore(
      "Visual QA health types",
      "type DetectedModule =",
      visualQaHealthTypes
    );
  }

  console.log("Added Visual QA health types.");
} else {
  console.log("Visual QA health types already exist.");
}

/**
 * 2. Add Visual QA health scoring helper.
 *
 * The scoring is intentionally strict:
 * - Missing checklist is a missing state.
 * - Weak design or behind-benchmark findings require review.
 * - Strong design + checklist present gets ready.
 */
const visualQaHealthHelper = `function getVisualQaHealthReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): VisualQaHealthReport {
  const designReport = getDesignQualityReport({
    previewState,
    files,
  });

  const claudeReport = getClaudeDesignCompetitivenessReport({
    previewState,
    files,
  });

  const hasVisualQaChecklist = files.some(
    (file) => file.path === "config/visual-qa-checklist.md"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const weakDesignFindings = designReport.findings.filter(
    (finding) => finding.status === "weak"
  );

  const designReviewFindings = designReport.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const behindClaudeFindings = claudeReport.findings.filter(
    (finding) => finding.status === "behind"
  );

  const promisingClaudeFindings = claudeReport.findings.filter(
    (finding) => finding.status === "promising"
  );

  const findings: VisualQaHealthFinding[] = [
    {
      id: "visual-qa-checklist",
      label: "Visual QA checklist",
      status: hasVisualQaChecklist ? "ready" : "missing",
      detail: hasVisualQaChecklist
        ? "config/visual-qa-checklist.md exists in the build pack."
        : "config/visual-qa-checklist.md is missing. Export Visual QA or the full build pack.",
    },
    {
      id: "ui-files",
      label: "UI files",
      status: uiFiles.length > 0 ? "ready" : "missing",
      detail:
        uiFiles.length > 0
          ? \`\${uiFiles.length} UI file\${uiFiles.length === 1 ? "" : "s"} detected for visual inspection.\`
          : "No UI files were detected. Visual QA needs something visual to inspect, tragically.",
    },
    {
      id: "design-quality",
      label: "Design quality",
      status:
        designReport.status === "strong"
          ? "ready"
          : designReport.status === "weak"
            ? "missing"
            : "needs-review",
      detail: \`Design quality is \${designReport.label} at \${designReport.score}%.\`,
    },
    {
      id: "claude-competitiveness",
      label: "Claude Design competitiveness",
      status:
        claudeReport.status === "competitive"
          ? "ready"
          : claudeReport.status === "behind"
            ? "missing"
            : "needs-review",
      detail: \`Claude Design competitiveness is \${claudeReport.label} at \${claudeReport.score}%.\`,
    },
    {
      id: "weak-design-findings",
      label: "Weak design findings",
      status: weakDesignFindings.length === 0 ? "ready" : "needs-review",
      detail:
        weakDesignFindings.length === 0
          ? "No weak design findings detected."
          : \`\${weakDesignFindings.length} weak design finding\${weakDesignFindings.length === 1 ? "" : "s"} need review.\`,
    },
    {
      id: "behind-benchmark-findings",
      label: "Behind-benchmark findings",
      status: behindClaudeFindings.length === 0 ? "ready" : "needs-review",
      detail:
        behindClaudeFindings.length === 0
          ? "No behind-benchmark Claude Design findings detected."
          : \`\${behindClaudeFindings.length} Claude Design benchmark gap\${behindClaudeFindings.length === 1 ? "" : "s"} need improvement.\`,
    },
    {
      id: "review-backlog",
      label: "Review backlog",
      status:
        designReviewFindings.length + promisingClaudeFindings.length === 0
          ? "ready"
          : "needs-review",
      detail:
        designReviewFindings.length + promisingClaudeFindings.length === 0
          ? "No design review backlog detected."
          : \`\${designReviewFindings.length + promisingClaudeFindings.length} design item\${designReviewFindings.length + promisingClaudeFindings.length === 1 ? "" : "s"} need review.\`,
    },
  ];

  const missingCount = findings.filter((finding) => finding.status === "missing").length;
  const needsReviewCount = findings.filter(
    (finding) => finding.status === "needs-review"
  ).length;
  const readyCount = findings.filter((finding) => finding.status === "ready").length;

  const score = Math.round((readyCount / findings.length) * 100);

  if (missingCount > 0) {
    return {
      status: "missing",
      label: "Missing",
      score,
      summary:
        "Visual QA is missing key pieces. Export the Visual QA checklist and improve weak design/competitive gaps before calling this polished.",
      findings,
    };
  }

  if (needsReviewCount > 0) {
    return {
      status: "needs-review",
      label: "Needs review",
      score,
      summary:
        "Visual QA is available, but design and competitiveness findings still need human review.",
      findings,
    };
  }

  return {
    status: "ready",
    label: "Ready",
    score,
    summary:
      "Visual QA looks ready for manual inspection. Still review the UI like a sane person with working eyes.",
    findings,
  };
}

`;

if (!source.includes("function getVisualQaHealthReport(")) {
  if (source.includes("function createVisualQaChecklistMarkdown(")) {
    insertBefore(
      "Visual QA health helper",
      "function createVisualQaChecklistMarkdown(",
      visualQaHealthHelper
    );
  } else if (source.includes("function getClaudeDesignCompetitivenessReport(")) {
    insertBefore(
      "Visual QA health helper",
      "function getClaudeDesignCompetitivenessReport(",
      visualQaHealthHelper
    );
  } else if (source.includes("function getDesignQualityReport(")) {
    insertBefore(
      "Visual QA health helper",
      "function getDesignQualityReport(",
      visualQaHealthHelper
    );
  } else {
    insertBefore(
      "Visual QA health helper",
      "function DeployReadinessPanel(",
      visualQaHealthHelper
    );
  }

  console.log("Added Visual QA health helper.");
} else {
  console.log("Visual QA health helper already exists.");
}

/**
 * 3. Add VisualQaHealthPanel component.
 *
 * This renders the overall Visual QA status and the individual QA findings.
 */
const visualQaHealthPanel = `function VisualQaHealthPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getVisualQaHealthReport({
    previewState,
    files,
  });

  const tone =
    report.status === "ready"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "missing"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <div
        style={{
          border: \`1px solid \${tone.border}\`,
          borderRadius: "18px",
          background: tone.background,
          padding: "15px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Visual QA health
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {report.findings.map((finding) => (
          <VisualQaFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function VisualQaFindingCard({
  finding,
}: {
  finding: VisualQaHealthFinding;
}) {
  const tone =
    finding.status === "ready"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "missing"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "ready"
      ? "Ready"
      : finding.status === "missing"
        ? "Missing"
        : "Needs review";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {finding.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.text,
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {finding.detail}
      </p>
    </article>
  );
}

`;

if (!source.includes("function VisualQaHealthPanel(")) {
  if (source.includes("function ClaudeDesignCompetitivenessPanel(")) {
    insertBefore(
      "Visual QA health panel",
      "function ClaudeDesignCompetitivenessPanel(",
      visualQaHealthPanel
    );
  } else if (source.includes("function DesignQualityPanel(")) {
    insertBefore(
      "Visual QA health panel",
      "function DesignQualityPanel(",
      visualQaHealthPanel
    );
  } else {
    insertBefore(
      "Visual QA health panel",
      "function PublishReadinessWorkspace(",
      visualQaHealthPanel
    );
  }

  console.log("Added Visual QA health panel.");
} else {
  console.log("Visual QA health panel already exists.");
}

/**
 * 4. Render VisualQaHealthPanel in PublishReadinessWorkspace.
 *
 * It appears before Claude Design competitiveness, because QA health is the
 * wrapper around design quality and visual-builder competitiveness.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<VisualQaHealthPanel")) {
      console.log("PublishReadinessWorkspace already renders VisualQaHealthPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <ClaudeDesignCompetitivenessPanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <VisualQaHealthPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Rendered VisualQaHealthPanel before ClaudeDesignCompetitivenessPanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DesignQualityPanel`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <VisualQaHealthPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered VisualQaHealthPanel before DesignQualityPanel.");
      return updated;
    }

    console.log("Could not find insertion marker for VisualQaHealthPanel.");
    return updated;
  }
);

save();

console.log("✅ Visual QA health panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);