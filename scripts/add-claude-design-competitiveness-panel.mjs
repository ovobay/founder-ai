import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Claude Design competitiveness panel.
 *
 * This panel is more specific than the generic Design Quality panel.
 *
 * It evaluates whether the generated product output feels competitive with
 * polished AI design/prototype tools by checking:
 * - visual ambition
 * - prototype completeness
 * - interaction readiness
 * - design system maturity
 * - realistic content
 * - responsive polish
 * - handoff quality
 * - builder differentiation
 *
 * The goal is to help Founder AI compete as a real product builder, not just
 * a chat box that spits out files and hopes nobody asks for polish.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-claude-design-competitiveness-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because optimism is adorable, but backups pay rent.
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
 * 1. Add Claude Design competitiveness types.
 *
 * These types describe the score, findings, and overall competitive status.
 */
const claudeDesignTypes = `type ClaudeDesignCompetitiveStatus =
  | "competitive"
  | "promising"
  | "behind";

type ClaudeDesignFinding = {
  id: string;
  label: string;
  status: ClaudeDesignCompetitiveStatus;
  detail: string;
  recommendation: string;
};

type ClaudeDesignCompetitivenessReport = {
  status: ClaudeDesignCompetitiveStatus;
  label: string;
  score: number;
  summary: string;
  findings: ClaudeDesignFinding[];
};

`;

if (!source.includes("type ClaudeDesignCompetitiveStatus =")) {
  if (source.includes("type DesignQualityStatus =")) {
    insertBefore(
      "Claude Design competitiveness types",
      "type DesignQualityStatus =",
      claudeDesignTypes
    );
  } else if (source.includes("type SecurityHealthStatus =")) {
    insertBefore(
      "Claude Design competitiveness types",
      "type SecurityHealthStatus =",
      claudeDesignTypes
    );
  } else {
    insertBefore(
      "Claude Design competitiveness types",
      "type DetectedModule =",
      claudeDesignTypes
    );
  }

  console.log("Added Claude Design competitiveness types.");
} else {
  console.log("Claude Design competitiveness types already exist.");
}

/**
 * 2. Add scoring helper.
 *
 * This is a heuristic. It looks at generated files, preview state, architecture,
 * and handoff files to decide whether the output is visually competitive.
 */
const claudeDesignHelper = `function getClaudeDesignCompetitivenessReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): ClaudeDesignCompetitivenessReport {
  const fileText = files
    .map((file) => \`\${file.path}\\n\${file.contents}\\n\${file.description}\`)
    .join("\\n")
    .toLowerCase();

  const hasUiFiles = files.some(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const hasPreviewOrPrototypeSignals =
    fileText.includes("preview") ||
    fileText.includes("prototype") ||
    fileText.includes("hero") ||
    fileText.includes("landing") ||
    fileText.includes("dashboard") ||
    fileText.includes("mockup");

  const hasInteractionSignals =
    fileText.includes("hover") ||
    fileText.includes("focus-visible") ||
    fileText.includes("disabled") ||
    fileText.includes("loading") ||
    fileText.includes("onClick") ||
    fileText.includes("aria-") ||
    fileText.includes("transition");

  const hasDesignSystemSignals =
    fileText.includes("button") &&
    fileText.includes("card") &&
    (fileText.includes("badge") ||
      fileText.includes("input") ||
      fileText.includes("empty") ||
      fileText.includes("pageheader") ||
      fileText.includes("page-header"));

  const hasResponsiveSignals =
    fileText.includes("responsive") ||
    fileText.includes("grid") ||
    fileText.includes("minmax") ||
    fileText.includes("clamp(") ||
    fileText.includes("@media") ||
    fileText.includes("md:") ||
    fileText.includes("lg:");

  const hasRealisticContentSignals =
    !fileText.includes("lorem ipsum") &&
    !fileText.includes("todo placeholder") &&
    !fileText.includes("placeholder text") &&
    (previewState.modules.length >= 3 || files.length >= 5);

  const hasHandoffFiles =
    files.some((file) => file.path === "config/project-brief.md") &&
    files.some((file) => file.path === "config/design-review.md") &&
    files.some((file) => file.path === "config/developer-instructions.md");

  const hasBuilderDifferentiation =
    files.some((file) => file.path === "config/env.example") &&
    files.some((file) => file.path === "config/deploy-checklist.md") &&
    files.some((file) => file.path === "config/security-review.md") &&
    previewState.architecture.endpoints.length > 0;

  const findings: ClaudeDesignFinding[] = [
    {
      id: "visual-ambition",
      label: "Visual ambition",
      status:
        hasUiFiles && hasPreviewOrPrototypeSignals ? "competitive" : "behind",
      detail:
        hasUiFiles && hasPreviewOrPrototypeSignals
          ? "The build includes UI files and clear visual/prototype structure signals."
          : "The build does not yet show enough visual ambition through UI/prototype structure.",
      recommendation:
        "Generate stronger landing, dashboard, preview, hero, and component sections with realistic content.",
    },
    {
      id: "prototype-completeness",
      label: "Prototype completeness",
      status:
        files.length >= 6 && previewState.modules.length >= 4
          ? "competitive"
          : files.length >= 3
            ? "promising"
            : "behind",
      detail:
        files.length >= 6 && previewState.modules.length >= 4
          ? "The build has enough files and modules to feel product-shaped."
          : "The prototype still needs more complete screens, flows, and module coverage.",
      recommendation:
        "Expand generated output with real screens, connected flows, and module-specific UI states.",
    },
    {
      id: "interaction-readiness",
      label: "Interaction readiness",
      status: hasInteractionSignals ? "competitive" : "promising",
      detail: hasInteractionSignals
        ? "Interaction and accessibility signals were detected."
        : "The UI needs clearer interaction states and accessible controls.",
      recommendation:
        "Add hover, focus-visible, loading, disabled, empty, error, success, and pressed states.",
    },
    {
      id: "design-system",
      label: "Design system maturity",
      status: hasDesignSystemSignals ? "competitive" : "promising",
      detail: hasDesignSystemSignals
        ? "Reusable design system signals were detected."
        : "The build needs stronger reusable UI primitives and component consistency.",
      recommendation:
        "Add reusable Button, Card, Badge, Input, EmptyState, PageHeader, Modal, and Toast components.",
    },
    {
      id: "responsive-polish",
      label: "Responsive polish",
      status: hasResponsiveSignals ? "competitive" : "behind",
      detail: hasResponsiveSignals
        ? "Responsive layout signals were detected."
        : "Responsive design signals are weak or missing.",
      recommendation:
        "Add mobile, tablet, and desktop layout behavior with tested breakpoints.",
    },
    {
      id: "content-realism",
      label: "Content realism",
      status: hasRealisticContentSignals ? "competitive" : "behind",
      detail: hasRealisticContentSignals
        ? "The generated output avoids obvious placeholder content and has enough product context."
        : "The output still risks feeling like placeholder/demo content.",
      recommendation:
        "Use realistic industry-specific demo data, labels, product names, metrics, and empty states.",
    },
    {
      id: "handoff-quality",
      label: "Handoff quality",
      status: hasHandoffFiles ? "competitive" : "promising",
      detail: hasHandoffFiles
        ? "Design, project, and developer handoff files are present."
        : "Handoff documentation is incomplete or missing.",
      recommendation:
        "Export the full build pack so project brief, design review, and developer instructions are included.",
    },
    {
      id: "builder-differentiation",
      label: "Builder differentiation",
      status: hasBuilderDifferentiation ? "competitive" : "promising",
      detail: hasBuilderDifferentiation
        ? "The build includes product-builder assets beyond design: env, deploy, security, and API planning."
        : "The build needs stronger full-product readiness signals beyond visual output.",
      recommendation:
        "Keep emphasizing backend, integrations, security, environment variables, deployment, and handoff pack generation.",
    },
  ];

  const competitiveCount = findings.filter(
    (finding) => finding.status === "competitive"
  ).length;

  const behindCount = findings.filter(
    (finding) => finding.status === "behind"
  ).length;

  const score = Math.round((competitiveCount / findings.length) * 100);

  if (behindCount >= 3 || score < 45) {
    return {
      status: "behind",
      label: "Behind",
      score,
      summary:
        "This build is not yet competitive with polished AI visual-builder output. It needs stronger visual structure, realistic content, responsive polish, and interaction quality.",
      findings,
    };
  }

  if (score < 85) {
    return {
      status: "promising",
      label: "Promising",
      score,
      summary:
        "This build has a competitive direction, but it needs stronger polish, richer prototype coverage, and more consistent design-system output.",
      findings,
    };
  }

  return {
    status: "competitive",
    label: "Competitive",
    score,
    summary:
      "This build has strong signs of competing with polished AI design/prototype output while also keeping Founder AI's product-builder edge.",
    findings,
  };
}

`;

if (!source.includes("function getClaudeDesignCompetitivenessReport(")) {
  if (source.includes("function getDesignQualityReport(")) {
    insertBefore(
      "Claude Design competitiveness helper",
      "function getDesignQualityReport(",
      claudeDesignHelper
    );
  } else if (source.includes("function getSecurityHealthReport(")) {
    insertBefore(
      "Claude Design competitiveness helper",
      "function getSecurityHealthReport(",
      claudeDesignHelper
    );
  } else {
    insertBefore(
      "Claude Design competitiveness helper",
      "function DeployReadinessPanel(",
      claudeDesignHelper
    );
  }

  console.log("Added Claude Design competitiveness helper.");
} else {
  console.log("Claude Design competitiveness helper already exists.");
}

/**
 * 3. Add ClaudeDesignCompetitivenessPanel component.
 *
 * This renders the competitive score and the individual findings.
 */
const claudeDesignPanel = `function ClaudeDesignCompetitivenessPanel({
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

  const tone =
    report.status === "competitive"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "behind"
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
              Claude Design competitiveness
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
          <ClaudeDesignFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function ClaudeDesignFindingCard({
  finding,
}: {
  finding: ClaudeDesignFinding;
}) {
  const tone =
    finding.status === "competitive"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "behind"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "competitive"
      ? "Competitive"
      : finding.status === "behind"
        ? "Behind"
        : "Promising";

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
          margin: "0 0 10px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {finding.detail}
      </p>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: "9px",
          color: "#374151",
          fontSize: "12px",
          lineHeight: 1.5,
          fontWeight: 700,
        }}
      >
        {finding.recommendation}
      </div>
    </article>
  );
}

`;

if (!source.includes("function ClaudeDesignCompetitivenessPanel(")) {
  if (source.includes("function DesignQualityPanel(")) {
    insertBefore(
      "Claude Design competitiveness panel",
      "function DesignQualityPanel(",
      claudeDesignPanel
    );
  } else if (source.includes("function SecurityHealthPanel(")) {
    insertBefore(
      "Claude Design competitiveness panel",
      "function SecurityHealthPanel(",
      claudeDesignPanel
    );
  } else {
    insertBefore(
      "Claude Design competitiveness panel",
      "function PublishReadinessWorkspace(",
      claudeDesignPanel
    );
  }

  console.log("Added Claude Design competitiveness panel.");
} else {
  console.log("Claude Design competitiveness panel already exists.");
}

/**
 * 4. Render ClaudeDesignCompetitivenessPanel in PublishReadinessWorkspace.
 *
 * It appears before DesignQualityPanel, because it is the sharper benchmark.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<ClaudeDesignCompetitivenessPanel")) {
      console.log("PublishReadinessWorkspace already renders Claude Design competitiveness panel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DesignQualityPanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <ClaudeDesignCompetitivenessPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Rendered Claude Design competitiveness panel before DesignQualityPanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <SecurityHealthPanel`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <ClaudeDesignCompetitivenessPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered Claude Design competitiveness panel before SecurityHealthPanel.");
      return updated;
    }

    console.log("Could not find insertion marker for Claude Design competitiveness panel.");
    return updated;
  }
);

save();

console.log("✅ Claude Design competitiveness panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);