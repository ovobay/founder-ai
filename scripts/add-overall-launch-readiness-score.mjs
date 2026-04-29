import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add an Overall Launch Readiness panel.
 *
 * The panel appears inside Publish readiness and combines:
 * - Build Pack health
 * - Deploy readiness
 * - Security health
 * - Design quality
 * - Claude Design competitiveness
 * - Visual QA health
 *
 * The goal is to give the user one practical launch verdict instead of making
 * them mentally average seventeen panels like a cursed spreadsheet monk.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-overall-launch-readiness-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before patching. We are editing the app's central nervous system, not folding laundry.
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
 * 1. Add Overall Launch Readiness types.
 *
 * LaunchReadinessSignal describes one scoring input.
 * LaunchReadinessReport describes the final combined launch verdict.
 */
const launchReadinessTypes = `type LaunchReadinessStatus =
  | "ready"
  | "nearly-ready"
  | "needs-work"
  | "blocked";

type LaunchReadinessSignal = {
  id: string;
  label: string;
  status: LaunchReadinessStatus;
  score: number;
  detail: string;
};

type LaunchReadinessReport = {
  status: LaunchReadinessStatus;
  label: string;
  score: number;
  summary: string;
  signals: LaunchReadinessSignal[];
  blockers: string[];
  nextActions: string[];
};

`;

if (!source.includes("type LaunchReadinessStatus =")) {
  if (source.includes("type VisualQaHealthStatus =")) {
    insertBefore(
      "Launch readiness types",
      "type VisualQaHealthStatus =",
      launchReadinessTypes
    );
  } else if (source.includes("type ClaudeDesignCompetitiveStatus =")) {
    insertBefore(
      "Launch readiness types",
      "type ClaudeDesignCompetitiveStatus =",
      launchReadinessTypes
    );
  } else {
    insertBefore(
      "Launch readiness types",
      "type DetectedModule =",
      launchReadinessTypes
    );
  }

  console.log("Added launch readiness types.");
} else {
  console.log("Launch readiness types already exist.");
}

/**
 * 2. Add launch readiness scoring helper.
 *
 * This helper combines the existing readiness reports into one launch score.
 * It is intentionally conservative:
 * - Missing build pack files block readiness.
 * - Security blocked blocks readiness.
 * - Visual QA missing blocks visual readiness.
 * - Deployment is usually needs-work until configured externally.
 */
const launchReadinessHelper = `function mapSignalStatusToLaunchStatus({
  isBlocked,
  isReady,
}: {
  isBlocked: boolean;
  isReady: boolean;
}): LaunchReadinessStatus {
  if (isBlocked) return "blocked";
  if (isReady) return "ready";
  return "needs-work";
}

function getLaunchReadinessReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): LaunchReadinessReport {
  const buildPackHealth = getBuildPackHealth(files);

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const securityHealth = getSecurityHealthReport({
    previewState,
    files,
  });

  const designQuality = getDesignQualityReport({
    previewState,
    files,
  });

  const claudeCompetitiveness = getClaudeDesignCompetitivenessReport({
    previewState,
    files,
  });

  const visualQaHealth = getVisualQaHealthReport({
    previewState,
    files,
  });

  const deployBlocked = deployItems.some((item) => item.status === "blocked");
  const deployNeedsSetup = deployItems.some(
    (item) => item.status === "needs-setup"
  );
  const deployReadyCount = deployItems.filter(
    (item) => item.status === "ready"
  ).length;
  const deployScore =
    deployItems.length > 0
      ? Math.round((deployReadyCount / deployItems.length) * 100)
      : 0;

  const signals: LaunchReadinessSignal[] = [
    {
      id: "build-pack",
      label: "Build pack",
      status:
        buildPackHealth.status === "complete"
          ? "ready"
          : buildPackHealth.status === "missing"
            ? "blocked"
            : "needs-work",
      score: buildPackHealth.score,
      detail: \`Build pack is \${buildPackHealth.label} at \${buildPackHealth.score}%.\`,
    },
    {
      id: "deployment",
      label: "Deployment",
      status: mapSignalStatusToLaunchStatus({
        isBlocked: deployBlocked,
        isReady: !deployBlocked && !deployNeedsSetup,
      }),
      score: deployScore,
      detail: deployBlocked
        ? "Deployment has blockers."
        : deployNeedsSetup
          ? "Deployment still needs setup."
          : "Deployment checklist looks ready.",
    },
    {
      id: "security",
      label: "Security",
      status:
        securityHealth.status === "ready"
          ? "ready"
          : securityHealth.status === "blocked"
            ? "blocked"
            : "needs-work",
      score: securityHealth.score,
      detail: \`Security health is \${securityHealth.label} at \${securityHealth.score}%.\`,
    },
    {
      id: "design-quality",
      label: "Design quality",
      status:
        designQuality.status === "strong"
          ? "ready"
          : designQuality.status === "weak"
            ? "blocked"
            : "needs-work",
      score: designQuality.score,
      detail: \`Design quality is \${designQuality.label} at \${designQuality.score}%.\`,
    },
    {
      id: "claude-competitiveness",
      label: "Claude Design competitiveness",
      status:
        claudeCompetitiveness.status === "competitive"
          ? "ready"
          : claudeCompetitiveness.status === "behind"
            ? "needs-work"
            : "nearly-ready",
      score: claudeCompetitiveness.score,
      detail: \`Claude Design competitiveness is \${claudeCompetitiveness.label} at \${claudeCompetitiveness.score}%.\`,
    },
    {
      id: "visual-qa",
      label: "Visual QA",
      status:
        visualQaHealth.status === "ready"
          ? "ready"
          : visualQaHealth.status === "missing"
            ? "blocked"
            : "needs-work",
      score: visualQaHealth.score,
      detail: \`Visual QA health is \${visualQaHealth.label} at \${visualQaHealth.score}%.\`,
    },
  ];

  const blockedSignals = signals.filter((signal) => signal.status === "blocked");
  const needsWorkSignals = signals.filter(
    (signal) => signal.status === "needs-work"
  );
  const nearlyReadySignals = signals.filter(
    (signal) => signal.status === "nearly-ready"
  );
  const readySignals = signals.filter((signal) => signal.status === "ready");

  const score = Math.round(
    signals.reduce((total, signal) => total + signal.score, 0) / signals.length
  );

  const blockers = blockedSignals.map(
    (signal) => \`\${signal.label}: \${signal.detail}\`
  );

  const nextActions = [
    ...(buildPackHealth.status !== "complete"
      ? ["Export the full build pack."]
      : []),
    ...(securityHealth.status !== "ready"
      ? [
          "Export and review security review/security rules.",
          "Confirm authentication, authorization, API protection, secrets, and RLS.",
        ]
      : []),
    ...(visualQaHealth.status !== "ready"
      ? ["Export Visual QA and review UI quality across breakpoints."]
      : []),
    ...(designQuality.status !== "strong"
      ? ["Improve visual hierarchy, spacing, typography, CTAs, and responsive polish."]
      : []),
    ...(claudeCompetitiveness.status !== "competitive"
      ? ["Improve prototype completeness, realistic content, design system maturity, and interaction states."]
      : []),
    ...(deployNeedsSetup || deployBlocked
      ? [
          "Configure production environment variables.",
          "Connect GitHub repository to Vercel.",
          "Run production build and inspect logs.",
        ]
      : []),
  ];

  if (blockedSignals.length > 0) {
    return {
      status: "blocked",
      label: "Blocked",
      score,
      summary:
        "This build is not launch-ready. It has blockers across readiness, security, design, deployment, or QA.",
      signals,
      blockers,
      nextActions,
    };
  }

  if (needsWorkSignals.length > 0) {
    return {
      status: "needs-work",
      label: "Needs work",
      score,
      summary:
        "This build has useful structure, but it needs more implementation, review, or production setup before launch.",
      signals,
      blockers,
      nextActions,
    };
  }

  if (nearlyReadySignals.length > 0 || readySignals.length < signals.length) {
    return {
      status: "nearly-ready",
      label: "Nearly ready",
      score,
      summary:
        "This build is close, but it still needs final review before launch. Conveniently, reality remains rude.",
      signals,
      blockers,
      nextActions,
    };
  }

  return {
    status: "ready",
    label: "Ready",
    score,
    summary:
      "This build appears launch-ready from the generated readiness signals. Final manual review is still required, because computers are not lawyers, designers, or your deployment priest.",
    signals,
    blockers,
    nextActions: nextActions.length > 0 ? nextActions : ["Run final smoke tests."],
  };
}

`;

if (!source.includes("function getLaunchReadinessReport(")) {
  if (source.includes("function getVisualQaHealthReport(")) {
    insertBefore(
      "Launch readiness helper",
      "function getVisualQaHealthReport(",
      launchReadinessHelper
    );
  } else if (source.includes("function getClaudeDesignCompetitivenessReport(")) {
    insertBefore(
      "Launch readiness helper",
      "function getClaudeDesignCompetitivenessReport(",
      launchReadinessHelper
    );
  } else {
    insertBefore(
      "Launch readiness helper",
      "function DeployReadinessPanel(",
      launchReadinessHelper
    );
  }

  console.log("Added launch readiness helper.");
} else {
  console.log("Launch readiness helper already exists.");
}

/**
 * 3. Add OverallLaunchReadinessPanel component.
 *
 * This renders the combined launch verdict and each scoring signal.
 */
const launchReadinessPanel = `function OverallLaunchReadinessPanel({
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

  const tone =
    report.status === "ready"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : report.status === "needs-work"
          ? {
              background: "#fff7ed",
              border: "#fed7aa",
              text: "#9a3412",
            }
          : {
              background: "#eff6ff",
              border: "#bfdbfe",
              text: "#1d4ed8",
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
              Overall launch readiness
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
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {report.signals.map((signal) => (
          <LaunchReadinessSignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {report.blockers.length > 0 ? (
        <div
          style={{
            border: "1px solid #fecaca",
            borderRadius: "18px",
            background: "#fef2f2",
            padding: "15px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              color: "#991b1b",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Blockers
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "#111827",
            }}
          >
            {report.blockers.map((blocker) => (
              <li
                key={blocker}
                style={{
                  marginBottom: "6px",
                  fontSize: "13px",
                  lineHeight: 1.45,
                }}
              >
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
          Next actions
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

function LaunchReadinessSignalCard({
  signal,
}: {
  signal: LaunchReadinessSignal;
}) {
  const tone =
    signal.status === "ready"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : signal.status === "blocked"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : signal.status === "needs-work"
          ? {
              background: "#fff7ed",
              text: "#9a3412",
            }
          : {
              background: "#eff6ff",
              text: "#1d4ed8",
            };

  const statusLabel =
    signal.status === "ready"
      ? "Ready"
      : signal.status === "blocked"
        ? "Blocked"
        : signal.status === "needs-work"
          ? "Needs work"
          : "Nearly ready";

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
          {signal.label}
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

      <div
        style={{
          color: "#111827",
          fontSize: "22px",
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          marginBottom: "8px",
        }}
      >
        {signal.score}%
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {signal.detail}
      </p>
    </article>
  );
}

`;

if (!source.includes("function OverallLaunchReadinessPanel(")) {
  if (source.includes("function VisualQaHealthPanel(")) {
    insertBefore(
      "Overall launch readiness panel",
      "function VisualQaHealthPanel(",
      launchReadinessPanel
    );
  } else if (source.includes("function ClaudeDesignCompetitivenessPanel(")) {
    insertBefore(
      "Overall launch readiness panel",
      "function ClaudeDesignCompetitivenessPanel(",
      launchReadinessPanel
    );
  } else {
    insertBefore(
      "Overall launch readiness panel",
      "function PublishReadinessWorkspace(",
      launchReadinessPanel
    );
  }

  console.log("Added OverallLaunchReadinessPanel component.");
} else {
  console.log("OverallLaunchReadinessPanel already exists.");
}

/**
 * 4. Render OverallLaunchReadinessPanel at the top of PublishReadinessWorkspace.
 *
 * It should appear immediately after the header card, before the detailed panels.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<OverallLaunchReadinessPanel")) {
      console.log("PublishReadinessWorkspace already renders OverallLaunchReadinessPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <BuildPackContentsPanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <OverallLaunchReadinessPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Rendered OverallLaunchReadinessPanel before BuildPackContentsPanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <VisualQaHealthPanel`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <OverallLaunchReadinessPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered OverallLaunchReadinessPanel before VisualQaHealthPanel.");
      return updated;
    }

    console.log("Could not find insertion marker for OverallLaunchReadinessPanel.");
    return updated;
  }
);

save();

console.log("✅ Overall launch readiness score wiring complete.");
console.log(`Backup created at: ${backupPath}`);