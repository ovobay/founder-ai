import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a "Copy security summary" button.
 *
 * The copied summary is shorter than config/security-review.md.
 * It is meant for quickly sharing the key security risks and next actions.
 *
 * It includes:
 * - Security verdict
 * - Auth/authz risk summary
 * - API/database/RLS status
 * - Required integrations
 * - Required environment variables
 * - Open security tasks
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-copy-security-summary-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because debugging without backups is just performance art with stack traces.
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
 * 1. Add a helper that creates a compact security summary.
 *
 * This is designed for clipboard sharing, not a full formal review.
 */
const securitySummaryHelper = `function createSecurityReviewSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
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

  const serverSecrets = requiredEnvVars.filter(
    (variable) => variable.scope === "server"
  );

  const clientVariables = requiredEnvVars.filter(
    (variable) => variable.scope === "client"
  );

  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasApiRoutes = previewState.architecture.endpoints.length > 0;
  const hasSecurityRules = previewState.architecture.securityRules.length > 0;
  const hasSecurityReviewFile = files.some(
    (file) => file.path === "config/security-review.md"
  );

  const verdict = hasSecurityRules
    ? "Security rules were generated, but they still need manual review and implementation before production."
    : "No security rules were generated. This build is not production-ready until auth, authorization, API protection, and data access controls are reviewed.";

  const lines = [
    "Founder AI security summary",
    "",
    \`Product: \${previewState.title}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Security review file: \${hasSecurityReviewFile ? "present" : "missing"}\`,
    "",
    "Verdict:",
    verdict,
    "",
    "Security scope:",
    \`- Generated files: \${files.length}\`,
    \`- API routes planned: \${previewState.architecture.endpoints.length}\`,
    \`- Database tables planned: \${previewState.architecture.tables.length}\`,
    \`- Security rules planned: \${previewState.architecture.securityRules.length}\`,
    \`- Required integrations: \${requiredIntegrations.length}\`,
    \`- Required environment variables: \${requiredEnvVars.length}\`,
    "",
    "Authentication:",
    "- Confirm protected pages require a valid session.",
    "- Confirm sign-in, sign-up, logout, and refresh behavior work after deployment.",
    "- Confirm OAuth or magic-link callback URLs match production.",
    "",
    "Authorization:",
    "- Confirm users can only access their own projects, files, builds, workspaces, billing records, and customer data.",
    "- Confirm admin-only actions are protected server-side.",
    "- Confirm team/role permissions are enforced if teams exist.",
    "",
    "API protection:",
    hasApiRoutes
      ? "- API routes were planned. Each route needs session validation, request validation, ownership checks, and safe errors."
      : "- No API routes were planned.",
    "",
    "Database / RLS:",
    hasDatabaseTables
      ? "- Database tables were planned. Enable and test Row Level Security before production."
      : "- No database tables were planned.",
    "",
    "Secrets and environment variables:",
    serverSecrets.length > 0
      ? \`- Server-only secrets detected: \${serverSecrets.map((variable) => variable.key).join(", ")}\`
      : "- No server-only secrets detected.",
    clientVariables.length > 0
      ? \`- Public client variables detected: \${clientVariables.map((variable) => variable.key).join(", ")}\`
      : "- No public client variables detected.",
    "- Never expose service role keys, Stripe secrets, Shopify secrets, webhook secrets, or OAuth client secrets to client components.",
    "",
    "Required integrations:",
    ...(requiredIntegrations.length > 0
      ? requiredIntegrations.map(
          (integration) =>
            \`- \${integration.label} · \${integration.provider}\`
        )
      : ["- None detected"]),
    "",
    "Open security tasks:",
    "- Review generated files for hardcoded secrets.",
    "- Confirm API routes validate ownership server-side.",
    "- Confirm database policies are not overly permissive.",
    "- Confirm webhook signatures are verified where relevant.",
    "- Confirm expensive AI/API routes have usage limits or abuse prevention.",
    "- Confirm logs do not store tokens, passwords, payment data, or sensitive prompts.",
    "- Run smoke tests with at least two different users before production.",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createSecurityReviewSummary(")) {
  if (source.includes("function createSecurityReviewMarkdown(")) {
    insertBefore(
      "createSecurityReviewSummary helper",
      "function createSecurityReviewMarkdown(",
      securitySummaryHelper
    );
  } else if (source.includes("function createDeveloperInstructions(")) {
    insertBefore(
      "createSecurityReviewSummary helper",
      "function createDeveloperInstructions(",
      securitySummaryHelper
    );
  } else {
    insertBefore(
      "createSecurityReviewSummary helper",
      "function DeployReadinessPanel(",
      securitySummaryHelper
    );
  }

  console.log("Added createSecurityReviewSummary helper.");
} else {
  console.log("createSecurityReviewSummary helper already exists.");
}

/**
 * 2. Add copy state, handler, and button inside DeployReadinessPanel.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state used by the copy security summary button.
     */
    if (!updated.includes("const [copySecuritySummaryMessage")) {
      updated = updated.replace(
        `  const [securityReviewMessage, setSecurityReviewMessage] = useState("");`,
        `  const [securityReviewMessage, setSecurityReviewMessage] = useState("");
  const [copySecuritySummaryMessage, setCopySecuritySummaryMessage] =
    useState("");`
      );

      console.log("Added copy security summary state.");
    } else {
      console.log("Copy security summary state already exists.");
    }

    /**
     * Add clipboard handler.
     */
    if (!updated.includes("async function handleCopySecuritySummary()")) {
      const copyHandler = `

  async function handleCopySecuritySummary() {
    setCopySecuritySummaryMessage("");
    setWorkspaceError("");

    const securitySummary = createSecurityReviewSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(securitySummary);
      setCopySecuritySummaryMessage("Security summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy security summary.";

      setCopySecuritySummaryMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopySecuritySummary function.");
    } else {
      console.log("handleCopySecuritySummary already exists.");
    }

    /**
     * Add the button beside Export security review.
     */
    if (!updated.includes("Copy security summary")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportSecurityReview}
              disabled={isExportingSecurityReview}
            >
              {isExportingSecurityReview
                ? "Exporting..."
                : "Export security review"}
            </button>

            <span
              style={{
                color:
                  securityReviewMessage.toLowerCase().includes("failed") ||
                  securityReviewMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {securityReviewMessage ||
                "Save security review into the project tree."}
            </span>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportSecurityReview}
              disabled={isExportingSecurityReview}
            >
              {isExportingSecurityReview
                ? "Exporting..."
                : "Export security review"}
            </button>

            <span
              style={{
                color:
                  securityReviewMessage.toLowerCase().includes("failed") ||
                  securityReviewMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {securityReviewMessage ||
                "Save security review into the project tree."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleCopySecuritySummary}
            >
              Copy security summary
            </button>

            <span
              style={{
                color:
                  copySecuritySummaryMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copySecuritySummaryMessage ||
                "Copy the key security warnings."}
            </span>`
      );

      console.log("Added Copy security summary UI.");
    } else {
      console.log("Copy security summary UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Copy security summary wiring complete.");
console.log(`Backup created at: ${backupPath}`);