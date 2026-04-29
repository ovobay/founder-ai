import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Publish Gate panel.
 *
 * The Publish Gate converts all readiness signals into a simple decision:
 * - Blocked
 * - Can preview
 * - Can stage
 * - Can publish
 *
 * It uses the existing launch readiness report so the decision is based on:
 * - Build pack health
 * - Deployment readiness
 * - Security health
 * - Design quality
 * - Visual builder competitiveness
 * - Visual QA health
 *
 * This is intentionally conservative. A generated build should not claim it can
 * publish just because it owns a nice button and a dream.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-gate-panel-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before patching. We are making product decisions now, not finger painting.
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
 * 1. Add Publish Gate types.
 *
 * PublishGateDecision is the simple user-facing decision.
 * PublishGateReport gives the UI enough detail to explain the verdict.
 */
const publishGateTypes = `type PublishGateDecision =
  | "blocked"
  | "can-preview"
  | "can-stage"
  | "can-publish";

type PublishGateRequirement = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

type PublishGateReport = {
  decision: PublishGateDecision;
  label: string;
  score: number;
  summary: string;
  requirements: PublishGateRequirement[];
  nextActions: string[];
};

`;

if (!source.includes("type PublishGateDecision =")) {
  if (source.includes("type LaunchReadinessStatus =")) {
    insertBefore(
      "Publish Gate types",
      "type LaunchReadinessStatus =",
      publishGateTypes
    );
  } else if (source.includes("type VisualQaHealthStatus =")) {
    insertBefore(
      "Publish Gate types",
      "type VisualQaHealthStatus =",
      publishGateTypes
    );
  } else {
    insertBefore(
      "Publish Gate types",
      "type DetectedModule =",
      publishGateTypes
    );
  }

  console.log("Added Publish Gate types.");
} else {
  console.log("Publish Gate types already exist.");
}

/**
 * 2. Add Publish Gate scoring helper.
 *
 * This helper turns the existing launch readiness report into a plain decision.
 */
const publishGateHelper = `function getPublishGateReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): PublishGateReport {
  const launchReport = getLaunchReadinessReport({
    previewState,
    files,
  });

  const buildPackHealth = getBuildPackHealth(files);

  const securityHealth = getSecurityHealthReport({
    previewState,
    files,
  });

  const visualQaHealth = getVisualQaHealthReport({
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

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const deployBlocked = deployItems.some((item) => item.status === "blocked");
  const deployNeedsSetup = deployItems.some(
    (item) => item.status === "needs-setup"
  );

  const hasCriticalBlocker =
    launchReport.status === "blocked" ||
    securityHealth.status === "blocked" ||
    buildPackHealth.status === "missing";

  const requirements: PublishGateRequirement[] = [
    {
      id: "build-pack",
      label: "Full build pack",
      passed: buildPackHealth.status === "complete",
      detail:
        buildPackHealth.status === "complete"
          ? "Full build pack is complete."
          : "Full build pack is incomplete. Export the full build pack before staging or publishing.",
    },
    {
      id: "security",
      label: "Security readiness",
      passed: securityHealth.status !== "blocked",
      detail:
        securityHealth.status === "blocked"
          ? "Security readiness is blocked. Security review and rules need attention before staging."
          : \`Security is \${securityHealth.label} at \${securityHealth.score}% and still requires manual review.\`,
    },
    {
      id: "visual-qa",
      label: "Visual QA readiness",
      passed: visualQaHealth.status !== "missing",
      detail:
        visualQaHealth.status === "missing"
          ? "Visual QA is missing. Export and review the Visual QA checklist."
          : \`Visual QA is \${visualQaHealth.label} at \${visualQaHealth.score}%.\`,
    },
    {
      id: "design",
      label: "Design quality",
      passed: designQuality.status !== "weak",
      detail:
        designQuality.status === "weak"
          ? "Design quality is weak. Improve UI structure before publishing."
          : \`Design quality is \${designQuality.label} at \${designQuality.score}%.\`,
    },
    {
      id: "visual-builder",
      label: "Visual builder competitiveness",
      passed: visualBuilderReport.status !== "behind",
      detail:
        visualBuilderReport.status === "behind"
          ? "Visual builder competitiveness is behind. Improve prototype completeness, polish, and content realism."
          : \`Visual builder competitiveness is \${visualBuilderReport.label} at \${visualBuilderReport.score}%.\`,
    },
    {
      id: "deployment",
      label: "Deployment setup",
      passed: !deployBlocked,
      detail: deployBlocked
        ? "Deployment readiness has blockers."
        : deployNeedsSetup
          ? "Deployment still needs setup before production publish."
          : "Deployment readiness has no generated blockers.",
    },
  ];

  const passedCount = requirements.filter((requirement) => requirement.passed).length;
  const score = Math.round((passedCount / requirements.length) * 100);

  const nextActions = [
    ...requirements
      .filter((requirement) => !requirement.passed)
      .map((requirement) => requirement.detail),
    ...(deployNeedsSetup && !deployBlocked
      ? [
          "Configure production environment variables.",
          "Connect GitHub repository to Vercel.",
          "Run production build and inspect deployment logs.",
        ]
      : []),
    ...(launchReport.nextActions.length > 0 ? launchReport.nextActions : []),
  ].filter((item, index, array) => array.indexOf(item) === index);

  if (hasCriticalBlocker) {
    return {
      decision: "blocked",
      label: "Blocked",
      score,
      summary:
        "Publishing is blocked. Fix build pack, security, or launch readiness blockers before moving forward.",
      requirements,
      nextActions,
    };
  }

  if (launchReport.score < 55 || designQuality.status === "weak") {
    return {
      decision: "can-preview",
      label: "Can preview",
      score,
      summary:
        "This build can be previewed internally, but it is not ready for staging or production.",
      requirements,
      nextActions,
    };
  }

  if (
    launchReport.score < 85 ||
    deployNeedsSetup ||
    securityHealth.status !== "ready" ||
    visualQaHealth.status !== "ready"
  ) {
    return {
      decision: "can-stage",
      label: "Can stage",
      score,
      summary:
        "This build can move to staging for review, testing, and deployment setup. Do not publish to production yet.",
      requirements,
      nextActions,
    };
  }

  return {
    decision: "can-publish",
    label: "Can publish",
    score,
    summary:
      "This build passes generated publish gates. Run final manual review and smoke tests before production.",
    requirements,
    nextActions: nextActions.length > 0 ? nextActions : ["Run final smoke tests."],
  };
}

`;

if (!source.includes("function getPublishGateReport(")) {
  if (source.includes("function getLaunchReadinessReport(")) {
    insertBefore(
      "Publish Gate helper",
      "function getLaunchReadinessReport(",
      publishGateHelper
    );
  } else if (source.includes("function getVisualQaHealthReport(")) {
    insertBefore(
      "Publish Gate helper",
      "function getVisualQaHealthReport(",
      publishGateHelper
    );
  } else {
    insertBefore(
      "Publish Gate helper",
      "function PublishReadinessWorkspace(",
      publishGateHelper
    );
  }

  console.log("Added Publish Gate helper.");
} else {
  console.log("Publish Gate helper already exists.");
}

/**
 * 3. Add PublishGatePanel component.
 *
 * This shows the simple publish decision, requirements, and next actions.
 */
const publishGatePanel = `function PublishGatePanel({
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

  const tone =
    report.decision === "can-publish"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.decision === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : report.decision === "can-stage"
          ? {
              background: "#eff6ff",
              border: "#bfdbfe",
              text: "#1d4ed8",
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
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        padding: "20px",
      }}
    >
      <div
        style={{
          border: \`1px solid \${tone.border}\`,
          borderRadius: "20px",
          background: tone.background,
          padding: "18px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: "7px",
              }}
            >
              Publish gate
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "28px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "30px",
              padding: "0 12px",
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
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {report.requirements.map((requirement) => (
          <PublishGateRequirementCard
            key={requirement.id}
            requirement={requirement}
          />
        ))}
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          background: "#f9fafb",
          padding: "15px",
        }}
      >
        <div
          style={{
            color: "#374151",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Gate actions
        </div>

        <ul
          style={{
            margin: 0,
            paddingLeft: "18px",
            color: "#111827",
          }}
        >
          {report.nextActions.map((action) => (
            <li
              key={action}
              style={{
                marginBottom: "6px",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              {action}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PublishGateRequirementCard({
  requirement,
}: {
  requirement: PublishGateRequirement;
}) {
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
          gap: "10px",
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
          {requirement.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: requirement.passed ? "#ecfdf5" : "#fef2f2",
            color: requirement.passed ? "#166534" : "#991b1b",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {requirement.passed ? "Passed" : "Needs work"}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {requirement.detail}
      </p>
    </article>
  );
}

`;

if (!source.includes("function PublishGatePanel(")) {
  if (source.includes("function OverallLaunchReadinessPanel(")) {
    insertBefore(
      "Publish Gate panel",
      "function OverallLaunchReadinessPanel(",
      publishGatePanel
    );
  } else if (source.includes("function VisualQaHealthPanel(")) {
    insertBefore(
      "Publish Gate panel",
      "function VisualQaHealthPanel(",
      publishGatePanel
    );
  } else {
    insertBefore(
      "Publish Gate panel",
      "function PublishReadinessWorkspace(",
      publishGatePanel
    );
  }

  console.log("Added Publish Gate panel.");
} else {
  console.log("Publish Gate panel already exists.");
}

/**
 * 4. Render PublishGatePanel at the top of PublishReadinessWorkspace.
 *
 * It should appear before Overall Launch Readiness, because it is the clearest
 * publish decision.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<PublishGatePanel")) {
      console.log("PublishReadinessWorkspace already renders PublishGatePanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <OverallLaunchReadinessPanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishGatePanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Rendered PublishGatePanel before OverallLaunchReadinessPanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <BuildPackContentsPanel`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishGatePanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered PublishGatePanel before BuildPackContentsPanel.");
      return updated;
    }

    console.log("Could not find insertion marker for PublishGatePanel.");
    return updated;
  }
);

save();

console.log("✅ Publish Gate panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);