import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Design Quality panel.
 *
 * The panel evaluates whether the generated build has enough design maturity
 * to compete with visual builder tools like Claude Design:
 * - visual structure
 * - typography
 * - spacing
 * - preview readiness
 * - responsiveness
 * - CTA clarity
 * - product polish
 *
 * This is a heuristic score, not magic. Sadly, computers still need rules.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-design-quality-panel-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before modifying the file. Drama belongs in UI, not source control.
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
 * 1. Add DesignQuality types.
 */
const designQualityTypes = `type DesignQualityStatus = "strong" | "needs-review" | "weak";

type DesignQualityFinding = {
  id: string;
  label: string;
  status: DesignQualityStatus;
  detail: string;
};

type DesignQualityReport = {
  status: DesignQualityStatus;
  label: string;
  score: number;
  summary: string;
  findings: DesignQualityFinding[];
};

`;

if (!source.includes("type DesignQualityStatus =")) {
  if (source.includes("type SecurityHealthStatus =")) {
    insertBefore(
      "Design quality types",
      "type SecurityHealthStatus =",
      designQualityTypes
    );
  } else if (source.includes("type BuildPackHealth =")) {
    insertBefore(
      "Design quality types",
      "type BuildPackHealth =",
      designQualityTypes
    );
  } else {
    insertBefore(
      "Design quality types",
      "type DetectedModule =",
      designQualityTypes
    );
  }

  console.log("Added DesignQuality types.");
} else {
  console.log("DesignQuality types already exist.");
}

/**
 * 2. Add design quality scoring helper.
 */
const designQualityHelper = `function getDesignQualityReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): DesignQualityReport {
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

  const hasLandingOrPreview =
    fileText.includes("hero") ||
    fileText.includes("landing") ||
    fileText.includes("preview") ||
    fileText.includes("dashboard");

  const hasResponsiveHints =
    fileText.includes("grid") ||
    fileText.includes("flex") ||
    fileText.includes("responsive") ||
    fileText.includes("minmax") ||
    fileText.includes("clamp(");

  const hasTypographyHints =
    fileText.includes("font") ||
    fileText.includes("letter-spacing") ||
    fileText.includes("text-") ||
    fileText.includes("leading") ||
    fileText.includes("font-weight");

  const hasSpacingHints =
    fileText.includes("gap") ||
    fileText.includes("padding") ||
    fileText.includes("margin") ||
    fileText.includes("rounded") ||
    fileText.includes("border-radius");

  const hasCtaHints =
    fileText.includes("button") ||
    fileText.includes("cta") ||
    fileText.includes("get started") ||
    fileText.includes("start") ||
    fileText.includes("publish");

  const hasProductStructure =
    previewState.modules.length >= 3 &&
    files.length >= 4 &&
    previewState.title.trim().length > 0;

  const findings: DesignQualityFinding[] = [
    {
      id: "ui-files",
      label: "UI files",
      status: hasUiFiles ? "strong" : "weak",
      detail: hasUiFiles
        ? "UI files were detected in the generated output."
        : "No obvious UI files were detected. A visual builder needs actual interface files, tragic as that sounds.",
    },
    {
      id: "visual-structure",
      label: "Visual structure",
      status: hasLandingOrPreview ? "strong" : "needs-review",
      detail: hasLandingOrPreview
        ? "The generated files mention landing, hero, preview, or dashboard structures."
        : "No strong visual structure signal was detected. Add clearer hero, sections, dashboard, or preview composition.",
    },
    {
      id: "responsiveness",
      label: "Responsiveness",
      status: hasResponsiveHints ? "strong" : "needs-review",
      detail: hasResponsiveHints
        ? "Responsive layout hints were detected."
        : "No strong responsive layout hints detected. Add mobile/tablet/desktop layout handling.",
    },
    {
      id: "typography",
      label: "Typography",
      status: hasTypographyHints ? "strong" : "needs-review",
      detail: hasTypographyHints
        ? "Typography styling hints were detected."
        : "Typography needs review. Strong design needs hierarchy, readable sizes, weights, and spacing.",
    },
    {
      id: "spacing",
      label: "Spacing and layout polish",
      status: hasSpacingHints ? "strong" : "needs-review",
      detail: hasSpacingHints
        ? "Spacing and layout styling hints were detected."
        : "Spacing needs review. Bad spacing is how decent products start looking like tax software.",
    },
    {
      id: "cta",
      label: "CTA clarity",
      status: hasCtaHints ? "strong" : "needs-review",
      detail: hasCtaHints
        ? "Button or call-to-action hints were detected."
        : "CTA clarity needs review. Users need obvious next actions.",
    },
    {
      id: "product-structure",
      label: "Product structure",
      status: hasProductStructure ? "strong" : "weak",
      detail: hasProductStructure
        ? "The build has enough modules, files, and naming structure to feel product-shaped."
        : "The build is still structurally thin. Generate more complete modules/files before judging design polish.",
    },
  ];

  const strongCount = findings.filter((finding) => finding.status === "strong").length;
  const weakCount = findings.filter((finding) => finding.status === "weak").length;
  const score = Math.round((strongCount / findings.length) * 100);

  if (weakCount >= 2 || score < 45) {
    return {
      status: "weak",
      label: "Weak",
      score,
      summary:
        "Design quality is weak. The build needs stronger UI structure, visual hierarchy, and responsive polish before competing with serious visual builders.",
      findings,
    };
  }

  if (score < 85) {
    return {
      status: "needs-review",
      label: "Needs review",
      score,
      summary:
        "Design quality has a foundation, but it needs visual refinement before it can compete with Claude Design-level output.",
      findings,
    };
  }

  return {
    status: "strong",
    label: "Strong",
    score,
    summary:
      "Design quality signals are strong. Review visually, but the generated output has a solid interface foundation.",
    findings,
  };
}

`;

if (!source.includes("function getDesignQualityReport(")) {
  if (source.includes("function getSecurityHealthReport(")) {
    insertBefore(
      "getDesignQualityReport helper",
      "function getSecurityHealthReport(",
      designQualityHelper
    );
  } else if (source.includes("function getBuildPackHealth(")) {
    insertBefore(
      "getDesignQualityReport helper",
      "function getBuildPackHealth(",
      designQualityHelper
    );
  } else {
    insertBefore(
      "getDesignQualityReport helper",
      "function DeployReadinessPanel(",
      designQualityHelper
    );
  }

  console.log("Added getDesignQualityReport helper.");
} else {
  console.log("Design quality helper already exists.");
}

/**
 * 3. Add DesignQualityPanel component.
 */
const designQualityPanel = `function DesignQualityPanel({
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

  const tone =
    report.status === "strong"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "weak"
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
              Design quality
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
          <DesignFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function DesignFindingCard({
  finding,
}: {
  finding: DesignQualityFinding;
}) {
  const tone =
    finding.status === "strong"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "weak"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "strong"
      ? "Strong"
      : finding.status === "weak"
        ? "Weak"
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

if (!source.includes("function DesignQualityPanel(")) {
  if (source.includes("function SecurityHealthPanel(")) {
    insertBefore(
      "DesignQualityPanel component",
      "function SecurityHealthPanel(",
      designQualityPanel
    );
  } else if (source.includes("function BuildPackContentsPanel(")) {
    insertBefore(
      "DesignQualityPanel component",
      "function BuildPackContentsPanel(",
      designQualityPanel
    );
  } else {
    insertBefore(
      "DesignQualityPanel component",
      "function DeployReadinessPanel(",
      designQualityPanel
    );
  }

  console.log("Added DesignQualityPanel component.");
} else {
  console.log("DesignQualityPanel already exists.");
}

/**
 * 4. Render DesignQualityPanel inside PublishReadinessWorkspace.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<DesignQualityPanel")) {
      console.log("PublishReadinessWorkspace already renders DesignQualityPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <SecurityHealthPanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DesignQualityPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Rendered DesignQualityPanel before SecurityHealthPanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DeployReadinessPanel`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DesignQualityPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered DesignQualityPanel before DeployReadinessPanel.");
      return updated;
    }

    console.log("Could not find insertion marker for DesignQualityPanel.");
    return updated;
  }
);

save();

console.log("✅ Design Quality panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);