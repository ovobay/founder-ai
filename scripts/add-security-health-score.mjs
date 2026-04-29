import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a security health score.
 *
 * The security health score appears in Publish readiness and evaluates:
 * - Whether security rules exist
 * - Whether API routes need protection
 * - Whether database tables need Row Level Security
 * - Whether server-side secrets exist
 * - Whether config/security-review.md has been exported
 * - Whether required integrations need review
 *
 * This is not a replacement for a real security audit. It is a practical
 * pre-publish warning system so nobody ships a beautiful security incident.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-security-health-score-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first, because the file has already survived enough patch-script gymnastics.
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
 * 1. Add security health types.
 *
 * SecurityHealthFinding describes one risk/check.
 * SecurityHealthReport describes the overall score and verdict.
 */
const securityHealthTypes = `type SecurityHealthStatus = "ready" | "needs-review" | "blocked";

type SecurityHealthFinding = {
  id: string;
  label: string;
  status: SecurityHealthStatus;
  detail: string;
};

type SecurityHealthReport = {
  status: SecurityHealthStatus;
  label: string;
  score: number;
  summary: string;
  findings: SecurityHealthFinding[];
};

`;

if (!source.includes("type SecurityHealthStatus =")) {
  if (source.includes("type BuildPackHealth =")) {
    insertBefore(
      "Security health types",
      "type BuildPackHealth =",
      securityHealthTypes
    );
  } else if (source.includes("type BuildPackFileStatus =")) {
    insertBefore(
      "Security health types",
      "type BuildPackFileStatus =",
      securityHealthTypes
    );
  } else {
    insertBefore(
      "Security health types",
      "type DetectedModule =",
      securityHealthTypes
    );
  }

  console.log("Added security health types.");
} else {
  console.log("Security health types already exist.");
}

/**
 * 2. Add helper to calculate security health.
 *
 * The scoring is intentionally conservative:
 * - Missing security rules blocks the build.
 * - API routes/database tables require review.
 * - Exported security-review.md improves readiness but does not magically make the app safe.
 */
const securityHealthHelper = `function getSecurityHealthReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): SecurityHealthReport {
  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const hasSecurityReviewFile = files.some(
    (file) => file.path === "config/security-review.md"
  );

  const hasSecurityRules = previewState.architecture.securityRules.length > 0;
  const hasApiRoutes = previewState.architecture.endpoints.length > 0;
  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasServerSecrets = requiredEnvVars.some(
    (variable) => variable.scope === "server"
  );

  const findings: SecurityHealthFinding[] = [
    {
      id: "security-review-file",
      label: "Security review file",
      status: hasSecurityReviewFile ? "needs-review" : "blocked",
      detail: hasSecurityReviewFile
        ? "config/security-review.md exists. Review it before production."
        : "config/security-review.md is missing. Export the security review before publish planning.",
    },
    {
      id: "security-rules",
      label: "Generated security rules",
      status: hasSecurityRules ? "needs-review" : "blocked",
      detail: hasSecurityRules
        ? \`\${previewState.architecture.securityRules.length} security rule\${previewState.architecture.securityRules.length === 1 ? "" : "s"} generated and awaiting manual review.\`
        : "No generated security rules found. Authentication, authorization, API protection, and data access rules must be defined.",
    },
    {
      id: "api-protection",
      label: "API route protection",
      status: hasApiRoutes ? "needs-review" : "ready",
      detail: hasApiRoutes
        ? \`\${previewState.architecture.endpoints.length} API route\${previewState.architecture.endpoints.length === 1 ? "" : "s"} planned. Each route needs auth, ownership checks, validation, and safe error handling.\`
        : "No API routes were planned for this build.",
    },
    {
      id: "database-rls",
      label: "Database / RLS",
      status: hasDatabaseTables ? "needs-review" : "ready",
      detail: hasDatabaseTables
        ? \`\${previewState.architecture.tables.length} database table\${previewState.architecture.tables.length === 1 ? "" : "s"} planned. Row Level Security and policies must be reviewed and tested.\`
        : "No database tables were planned for this build.",
    },
    {
      id: "server-secrets",
      label: "Server-side secrets",
      status: hasServerSecrets ? "needs-review" : "ready",
      detail: hasServerSecrets
        ? \`\${requiredEnvVars.filter((variable) => variable.scope === "server").length} server-side secret\${requiredEnvVars.filter((variable) => variable.scope === "server").length === 1 ? "" : "s"} detected. Confirm none are exposed to client components.\`
        : "No server-side secrets were detected from the current integration requirements.",
    },
    {
      id: "integration-risk",
      label: "Integration security",
      status: requiredIntegrations.length > 0 ? "needs-review" : "ready",
      detail: requiredIntegrations.length > 0
        ? \`\${requiredIntegrations.length} required integration\${requiredIntegrations.length === 1 ? "" : "s"} detected. OAuth, webhook signatures, scopes, and token storage need review.\`
        : "No required third-party integrations were detected.",
    },
  ];

  const blockedCount = findings.filter((finding) => finding.status === "blocked").length;
  const needsReviewCount = findings.filter(
    (finding) => finding.status === "needs-review"
  ).length;
  const readyCount = findings.filter((finding) => finding.status === "ready").length;

  const score = Math.round((readyCount / findings.length) * 100);

  if (blockedCount > 0) {
    return {
      status: "blocked",
      label: "Blocked",
      score,
      summary:
        "Security readiness is blocked. Export the security review and define security rules before publishing.",
      findings,
    };
  }

  if (needsReviewCount > 0) {
    return {
      status: "needs-review",
      label: "Needs review",
      score,
      summary:
        "Security scaffolding exists, but manual review is required before production.",
      findings,
    };
  }

  return {
    status: "ready",
    label: "Ready",
    score,
    summary:
      "No obvious security blockers detected from the generated architecture. Final manual review is still required.",
    findings,
  };
}

`;

if (!source.includes("function getSecurityHealthReport(")) {
  if (source.includes("function createSecurityReviewSummary(")) {
    insertBefore(
      "getSecurityHealthReport helper",
      "function createSecurityReviewSummary(",
      securityHealthHelper
    );
  } else if (source.includes("function createSecurityReviewMarkdown(")) {
    insertBefore(
      "getSecurityHealthReport helper",
      "function createSecurityReviewMarkdown(",
      securityHealthHelper
    );
  } else {
    insertBefore(
      "getSecurityHealthReport helper",
      "function DeployReadinessPanel(",
      securityHealthHelper
    );
  }

  console.log("Added getSecurityHealthReport helper.");
} else {
  console.log("getSecurityHealthReport helper already exists.");
}

/**
 * 3. Add SecurityHealthPanel component.
 *
 * This renders a score card and individual security findings.
 */
const securityHealthPanel = `function SecurityHealthPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getSecurityHealthReport({
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
              Security health
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
          <SecurityFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function SecurityFindingCard({
  finding,
}: {
  finding: SecurityHealthFinding;
}) {
  const tone =
    finding.status === "ready"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "blocked"
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
      : finding.status === "blocked"
        ? "Blocked"
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

if (!source.includes("function SecurityHealthPanel(")) {
  if (source.includes("function BuildPackContentsPanel(")) {
    insertBefore(
      "SecurityHealthPanel component",
      "function BuildPackContentsPanel(",
      securityHealthPanel
    );
  } else if (source.includes("function DeployReadinessPanel(")) {
    insertBefore(
      "SecurityHealthPanel component",
      "function DeployReadinessPanel(",
      securityHealthPanel
    );
  } else {
    insertBefore(
      "SecurityHealthPanel component",
      "function PublishReadinessWorkspace(",
      securityHealthPanel
    );
  }

  console.log("Added SecurityHealthPanel component.");
} else {
  console.log("SecurityHealthPanel already exists.");
}

/**
 * 4. Render SecurityHealthPanel in PublishReadinessWorkspace.
 *
 * It appears after Build Pack contents and before Deploy readiness.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<SecurityHealthPanel")) {
      console.log("PublishReadinessWorkspace already renders SecurityHealthPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DeployReadinessPanel`;

    if (!updated.includes(marker)) {
      console.log("Could not find DeployReadinessPanel marker. Trying fallback before EnvironmentVariablesPanel.");

      const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <EnvironmentVariablesPanel`;

      if (!updated.includes(fallbackMarker)) {
        console.log("Could not find insertion marker for SecurityHealthPanel.");
        return updated;
      }

      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <SecurityHealthPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered SecurityHealthPanel before EnvironmentVariablesPanel.");
      return updated;
    }

    updated = updated.replace(
      marker,
      `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <SecurityHealthPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
    );

    console.log("Rendered SecurityHealthPanel before DeployReadinessPanel.");
    return updated;
  }
);

save();

console.log("✅ Security health score wiring complete.");
console.log(`Backup created at: ${backupPath}`);