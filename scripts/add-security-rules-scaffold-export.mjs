import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a security rules scaffold export.
 *
 * It adds:
 * - createSecurityRulesScaffoldMarkdown()
 * - Export security rules scaffold button
 * - config/security-rules.md export/update behavior
 * - config/security-rules.md into the Full build pack
 * - config/security-rules.md into Build Pack contents tracking
 *
 * The goal is to give users a concrete security checklist based on the generated
 * architecture instead of leaving "security review" as a vague cloud of doom.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-security-rules-scaffold-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. A patch script without a backup is just confidence with a knife.
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
 * 1. Add security rules scaffold markdown helper.
 *
 * This helper creates a developer-readable security rules checklist from:
 * - architecture.securityRules
 * - API endpoints
 * - database tables
 * - required integrations
 * - required environment variables
 */
const securityRulesScaffoldHelper = `function createSecurityRulesScaffoldMarkdown({
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

  const securityRules =
    previewState.architecture.securityRules.length > 0
      ? previewState.architecture.securityRules
      : [
          {
            id: "auth-required",
            label: "Authentication required",
            description:
              "Protect authenticated pages, user workspaces, project files, build history, billing, API routes, and data mutations behind verified sessions.",
          },
          {
            id: "ownership-checks",
            label: "User ownership checks",
            description:
              "Validate on the server that users can only read or mutate records belonging to their own account, workspace, project, or organization.",
          },
          {
            id: "server-only-secrets",
            label: "Server-only secrets",
            description:
              "Keep service role keys, Stripe secrets, Shopify secrets, OAuth client secrets, webhook secrets, and OpenAI keys out of client components and public variables.",
          },
        ];

  const endpointRules =
    previewState.architecture.endpoints.length > 0
      ? previewState.architecture.endpoints.flatMap((endpoint) => [
          \`### \${endpoint.method} \${endpoint.path}\`,
          "",
          endpoint.purpose,
          "",
          "- [ ] Validate user session before processing the request.",
          "- [ ] Validate user ownership, role, or organization membership.",
          "- [ ] Validate and sanitize request body/query params.",
          "- [ ] Return safe errors without leaking stack traces or secrets.",
          "- [ ] Add rate limiting if the route triggers AI, payments, email, or third-party APIs.",
          "",
        ])
      : ["No API routes were planned for this build.", ""];

  const tableRules =
    previewState.architecture.tables.length > 0
      ? previewState.architecture.tables.flatMap((table) => [
          \`### \${table.name}\`,
          "",
          table.purpose,
          "",
          "- [ ] Enable Row Level Security.",
          "- [ ] Define select policy.",
          "- [ ] Define insert policy.",
          "- [ ] Define update policy.",
          "- [ ] Define delete policy if deletes are allowed.",
          "- [ ] Confirm policies match the product ownership model.",
          "- [ ] Test policies with at least two different users.",
          "",
        ])
      : ["No database tables were planned for this build.", ""];

  const integrationRules =
    requiredIntegrations.length > 0
      ? requiredIntegrations.flatMap((integration) => [
          \`### \${integration.label}\`,
          "",
          \`Provider: \${integration.provider}\`,
          "",
          integration.reason,
          "",
          "- [ ] Use the minimum required OAuth scopes or API permissions.",
          "- [ ] Store tokens securely server-side.",
          "- [ ] Rotate credentials if compromised.",
          "- [ ] Verify webhook signatures where relevant.",
          "- [ ] Log only safe operational metadata.",
          "",
        ])
      : ["No required third-party integrations were detected.", ""];

  const serverSecretLines =
    serverSecrets.length > 0
      ? serverSecrets.map(
          (variable) =>
            \`- [ ] \${variable.key}: server-side only, never exposed through NEXT_PUBLIC_ variables or client components.\`
        )
      : ["- [ ] No server-side secrets were inferred from the current build."];

  const generatedFiles =
    files.length > 0
      ? files.map((file) => \`- \${file.path}\`)
      : ["- No generated files found."];

  const lines = [
    "# Security rules scaffold",
    "",
    \`Product: \${previewState.title}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    "",
    "## How to use this file",
    "",
    "Use this as the implementation checklist for security work before production. It does not replace a real security audit, because apparently reality insists on being annoying.",
    "",
    "## Core security rules",
    "",
    ...securityRules.flatMap((rule) => [
      \`### \${rule.label}\`,
      "",
      rule.description,
      "",
      "- [ ] Implement this rule in code.",
      "- [ ] Add tests or manual verification steps.",
      "- [ ] Confirm the rule still works after deployment.",
      "",
    ]),
    "## API route rules",
    "",
    ...endpointRules,
    "## Database and RLS rules",
    "",
    ...tableRules,
    "## Secret handling rules",
    "",
    ...serverSecretLines,
    "",
    "## Integration rules",
    "",
    ...integrationRules,
    "## Deployment security rules",
    "",
    "- [ ] Run npm run build before deployment.",
    "- [ ] Confirm production environment variables are set in Vercel.",
    "- [ ] Confirm no real secrets are committed to Git.",
    "- [ ] Confirm OAuth callback URLs match the production domain.",
    "- [ ] Confirm webhook URLs use HTTPS.",
    "- [ ] Confirm error messages do not expose internals.",
    "- [ ] Confirm logs do not contain secrets, passwords, tokens, payment data, or sensitive prompts.",
    "",
    "## Generated files to inspect",
    "",
    ...generatedFiles,
    "",
    "## Final security sign-off",
    "",
    "- [ ] Authentication checked.",
    "- [ ] Authorization checked.",
    "- [ ] API route protection checked.",
    "- [ ] Database/RLS checked.",
    "- [ ] Secret handling checked.",
    "- [ ] Integration security checked.",
    "- [ ] Deployment security checked.",
    "- [ ] Smoke tests completed with multiple users.",
    "",
    "> Generated by Founder AI. Treat this as a serious checklist, not a decorative markdown doily.",
    "",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createSecurityRulesScaffoldMarkdown(")) {
  if (source.includes("function createSecurityReviewSummary(")) {
    insertBefore(
      "createSecurityRulesScaffoldMarkdown helper",
      "function createSecurityReviewSummary(",
      securityRulesScaffoldHelper
    );
  } else if (source.includes("function createSecurityReviewMarkdown(")) {
    insertBefore(
      "createSecurityRulesScaffoldMarkdown helper",
      "function createSecurityReviewMarkdown(",
      securityRulesScaffoldHelper
    );
  } else {
    insertBefore(
      "createSecurityRulesScaffoldMarkdown helper",
      "function DeployReadinessPanel(",
      securityRulesScaffoldHelper
    );
  }

  console.log("Added createSecurityRulesScaffoldMarkdown helper.");
} else {
  console.log("createSecurityRulesScaffoldMarkdown helper already exists.");
}

/**
 * 2. Patch DeployReadinessPanel with security rules export state, handler, and button.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for security rules scaffold export.
     */
    if (!updated.includes("const [isExportingSecurityRules")) {
      updated = updated.replace(
        `  const [copySecuritySummaryMessage, setCopySecuritySummaryMessage] =
    useState("");`,
        `  const [copySecuritySummaryMessage, setCopySecuritySummaryMessage] =
    useState("");
  const [isExportingSecurityRules, setIsExportingSecurityRules] =
    useState(false);
  const [securityRulesMessage, setSecurityRulesMessage] = useState("");`
      );

      console.log("Added security rules scaffold export state.");
    } else {
      console.log("Security rules scaffold export state already exists.");
    }

    /**
     * Add handler that creates or updates config/security-rules.md.
     */
    if (!updated.includes("async function handleExportSecurityRules()")) {
      const exportHandler = `

  async function handleExportSecurityRules() {
    setIsExportingSecurityRules(true);
    setSecurityRulesMessage("");
    setWorkspaceError("");

    const filePath = "config/security-rules.md";
    const contents = createSecurityRulesScaffoldMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setSecurityRulesMessage(\`config/security-rules.md \${result}.\`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export security rules scaffold.";

      setSecurityRulesMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingSecurityRules(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportSecurityRules function.");
    } else {
      console.log("handleExportSecurityRules already exists.");
    }

    /**
     * Add button near the security review controls.
     */
    if (!updated.includes("Export security rules")) {
      updated = updated.replace(
        `            <button
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
            </span>`,
        `            <button
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
            </span>

            <button
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
            </span>`
      );

      console.log("Added Export security rules UI.");
    } else {
      console.log("Export security rules UI already exists.");
    }

    /**
     * Add security rules scaffold to Full build pack.
     */
    if (!updated.includes('filePath: "config/security-rules.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/security-review.md",
        contents: createSecurityReviewMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/security-review.md",
        contents: createSecurityReviewMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/security-rules.md",
        contents: createSecurityRulesScaffoldMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added security rules scaffold to Full build pack.");
    } else {
      console.log("Security rules scaffold already included in Full build pack.");
    }

    /**
     * Update full build pack text.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, security review, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, security rules, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, security review, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, security rules, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/security-rules.md into Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/security-rules.md"')) {
      console.log("Build Pack contents already tracks security rules scaffold.");
      return updated;
    }

    const securityReviewBlock = `    {
      path: "config/security-review.md",
      label: "Security review",
      purpose:
        "Security handoff covering authentication, authorization, API protection, database access, secrets, integrations, deployment risks, and open security tasks.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/security-review.md",
      label: "Security review",
      purpose:
        "Security handoff covering authentication, authorization, API protection, database access, secrets, integrations, deployment risks, and open security tasks.",
    },
    {
      path: "config/security-rules.md",
      label: "Security rules",
      purpose:
        "Implementation checklist for authentication, authorization, API protection, database/RLS, secrets, integrations, deployment security, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(securityReviewBlock)) {
      updated = updated.replace(securityReviewBlock, repairedBlock);
      console.log("Added security rules to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the security review block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/security-rules.md",
      label: "Security rules",
      purpose:
        "Implementation checklist for authentication, authorization, API protection, database/RLS, secrets, integrations, deployment security, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/security-rules.md"')) {
      die("Could not add security rules to Build Pack contents tracking.");
    }

    console.log("Added security rules to Build Pack contents tracking using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Security rules scaffold export wiring complete.");
console.log(`Backup created at: ${backupPath}`);