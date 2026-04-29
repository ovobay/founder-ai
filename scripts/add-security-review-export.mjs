import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a security review export.
 *
 * It adds:
 * - createSecurityReviewMarkdown()
 * - Export security review button
 * - config/security-review.md export/update behavior
 * - config/security-review.md into the Full build pack
 * - config/security-review.md into Build Pack contents tracking
 *
 * The security review is meant to give developers a practical checklist before
 * deploying generated apps. Because "ship it" is not a security strategy,
 * despite what the internet keeps trying to prove.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-security-review-export-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. This file has been through enough surgery to qualify for a loyalty card.
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
 * 1. Add security review markdown helper.
 *
 * This helper builds a practical Markdown security review from the current
 * architecture, required integrations, required environment variables, and files.
 */
const securityReviewHelper = `function createSecurityReviewMarkdown({
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

  const hasServerSecrets = requiredEnvVars.some(
    (variable) => variable.scope === "server"
  );

  const hasClientVariables = requiredEnvVars.some(
    (variable) => variable.scope === "client"
  );

  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasApiRoutes = previewState.architecture.endpoints.length > 0;
  const hasSecurityRules = previewState.architecture.securityRules.length > 0;

  const generatedFileLines =
    files.length > 0
      ? files.map((file) => \`- \${file.path}\`)
      : ["- No generated files found."];

  const securityRuleLines =
    previewState.architecture.securityRules.length > 0
      ? previewState.architecture.securityRules.flatMap((rule) => [
          \`### \${rule.label}\`,
          "",
          rule.description,
          "",
          "- [ ] Confirm this rule is implemented in code.",
          "- [ ] Confirm this rule is tested before production.",
          "",
        ])
      : [
          "No generated security rules were found.",
          "",
          "- [ ] Add authentication requirements.",
          "- [ ] Add authorization requirements.",
          "- [ ] Add API ownership checks.",
          "- [ ] Add database Row Level Security rules if database tables exist.",
          "",
        ];

  const integrationLines =
    requiredIntegrations.length > 0
      ? requiredIntegrations.flatMap((integration) => [
          \`### \${integration.label}\`,
          "",
          \`Provider: \${integration.provider}\`,
          "",
          integration.reason,
          "",
          "Checklist:",
          "",
          ...integration.checklist.map((item) => \`- [ ] \${item}\`),
          "",
        ])
      : ["No required integrations were detected.", ""];

  const envVarLines =
    requiredEnvVars.length > 0
      ? requiredEnvVars.map(
          (variable) =>
            \`- \${variable.key} · \${variable.scope} · \${variable.label}\`
        )
      : ["- No required environment variables detected."];

  const lines = [
    "# Security review",
    "",
    \`Product: \${previewState.title}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    "",
    "## Security status",
    "",
    \`- Generated files: \${files.length}\`,
    \`- API routes planned: \${previewState.architecture.endpoints.length}\`,
    \`- Database tables planned: \${previewState.architecture.tables.length}\`,
    \`- Security rules planned: \${previewState.architecture.securityRules.length}\`,
    \`- Required integrations: \${requiredIntegrations.length}\`,
    \`- Required environment variables: \${requiredEnvVars.length}\`,
    "",
    "## Immediate security verdict",
    "",
    hasSecurityRules
      ? "Security rules were generated, but they must be reviewed and implemented before production."
      : "No security rules were generated. This build is not production-ready until authentication, authorization, API protection, and data access rules are added.",
    "",
    "## Authentication",
    "",
    "- [ ] Confirm which users can sign up.",
    "- [ ] Confirm whether email/password, OAuth, magic link, SSO, or Shopify OAuth is required.",
    "- [ ] Confirm protected pages cannot be accessed anonymously.",
    "- [ ] Confirm session handling works after refresh and deployment.",
    "- [ ] Confirm logout clears access properly.",
    "",
    "## Authorization",
    "",
    "- [ ] Confirm users can only access their own workspace, project, files, builds, billing records, and data.",
    "- [ ] Confirm admin-only routes are protected.",
    "- [ ] Confirm organization/team roles are enforced if the build uses teams.",
    "- [ ] Confirm API routes validate ownership server-side, not only in the UI.",
    "",
    "## API route protection",
    "",
    hasApiRoutes
      ? "API routes were planned. Every route below needs authentication and authorization review."
      : "No API routes were planned for this build.",
    "",
    ...(hasApiRoutes
      ? previewState.architecture.endpoints.flatMap((endpoint) => [
          \`### \${endpoint.method} \${endpoint.path}\`,
          "",
          endpoint.purpose,
          "",
          "- [ ] Validate session.",
          "- [ ] Validate ownership or role permissions.",
          "- [ ] Validate request body.",
          "- [ ] Return safe errors without leaking sensitive internals.",
          "",
        ])
      : []),
    "## Database and Row Level Security",
    "",
    hasDatabaseTables
      ? "Database tables were planned. Review generated migrations and Row Level Security before production."
      : "No database tables were planned for this build.",
    "",
    ...(hasDatabaseTables
      ? previewState.architecture.tables.flatMap((table) => [
          \`### \${table.name}\`,
          "",
          table.purpose,
          "",
          "Fields:",
          "",
          ...table.fields.map((field) => \`- \${field}\`),
          "",
          "- [ ] Confirm table has Row Level Security enabled.",
          "- [ ] Confirm select policy is not overly permissive.",
          "- [ ] Confirm insert/update/delete policies match ownership model.",
          "- [ ] Confirm service role key is only used server-side.",
          "",
        ])
      : []),
    "## Generated security rules",
    "",
    ...securityRuleLines,
    "## Environment variable safety",
    "",
    hasServerSecrets
      ? "Server-side secrets were detected. These must never be exposed to client components or public environment variables."
      : "No server-side secrets were detected.",
    "",
    hasClientVariables
      ? "Client-side public variables were detected. Confirm they are safe to expose publicly."
      : "No client-side public variables were detected.",
    "",
    ...envVarLines,
    "",
    "## Required integrations",
    "",
    ...integrationLines,
    "## Generated files to inspect",
    "",
    ...generatedFileLines,
    "",
    "## Deployment security checklist",
    "",
    "- [ ] Run production build locally.",
    "- [ ] Search generated code for hardcoded secrets.",
    "- [ ] Confirm service role keys are never used in client components.",
    "- [ ] Confirm OAuth callback URLs match production domain.",
    "- [ ] Confirm Stripe/Shopify/webhook signatures are verified if used.",
    "- [ ] Confirm CORS settings are not overly permissive.",
    "- [ ] Confirm rate limiting or abuse prevention exists for expensive AI/API routes.",
    "- [ ] Confirm logs do not store sensitive tokens, passwords, or payment data.",
    "- [ ] Confirm error messages do not leak stack traces in production.",
    "- [ ] Confirm database policies are tested with different user accounts.",
    "",
    "## Open risks",
    "",
    "- [ ] Generated code has not been manually security reviewed.",
    "- [ ] Generated SQL migration is a starter scaffold and must be reviewed before running.",
    "- [ ] Third-party integrations require production keys, webhook secrets, and callback validation.",
    "- [ ] AI generation routes should include usage limits, abuse monitoring, and safety controls.",
    "",
    "> Generated by Founder AI. Review before launch, because attackers do not care that the UI looks polished.",
    "",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createSecurityReviewMarkdown(")) {
  if (source.includes("function createDeveloperInstructions(")) {
    insertBefore(
      "createSecurityReviewMarkdown helper",
      "function createDeveloperInstructions(",
      securityReviewHelper
    );
  } else if (source.includes("function createCompactHandoffSummary(")) {
    insertBefore(
      "createSecurityReviewMarkdown helper",
      "function createCompactHandoffSummary(",
      securityReviewHelper
    );
  } else {
    insertBefore(
      "createSecurityReviewMarkdown helper",
      "function DeployReadinessPanel(",
      securityReviewHelper
    );
  }

  console.log("Added createSecurityReviewMarkdown helper.");
} else {
  console.log("createSecurityReviewMarkdown helper already exists.");
}

/**
 * 2. Patch DeployReadinessPanel with security review export state, handler, and button.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state used by the Export security review button.
     */
    if (!updated.includes("const [isExportingSecurityReview")) {
      updated = updated.replace(
        `  const [developerExportMessage, setDeveloperExportMessage] = useState("");`,
        `  const [developerExportMessage, setDeveloperExportMessage] = useState("");
  const [isExportingSecurityReview, setIsExportingSecurityReview] =
    useState(false);
  const [securityReviewMessage, setSecurityReviewMessage] = useState("");`
      );

      console.log("Added security review export state.");
    } else {
      console.log("Security review export state already exists.");
    }

    /**
     * Add handler that creates or updates config/security-review.md.
     */
    if (!updated.includes("async function handleExportSecurityReview()")) {
      const exportHandler = `

  async function handleExportSecurityReview() {
    setIsExportingSecurityReview(true);
    setSecurityReviewMessage("");
    setWorkspaceError("");

    const filePath = "config/security-review.md";
    const contents = createSecurityReviewMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setSecurityReviewMessage(\`config/security-review.md \${result}.\`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export security review.";

      setSecurityReviewMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingSecurityReview(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportSecurityReview function.");
    } else {
      console.log("handleExportSecurityReview already exists.");
    }

    /**
     * Add the Export security review button beside developer instructions export.
     */
    if (!updated.includes("Export security review")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportDeveloperInstructions}
              disabled={isExportingDeveloperInstructions}
            >
              {isExportingDeveloperInstructions
                ? "Exporting..."
                : "Export developer instructions"}
            </button>

            <span
              style={{
                color:
                  developerExportMessage.toLowerCase().includes("failed") ||
                  developerExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {developerExportMessage ||
                "Save developer setup instructions into the project tree."}
            </span>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleExportDeveloperInstructions}
              disabled={isExportingDeveloperInstructions}
            >
              {isExportingDeveloperInstructions
                ? "Exporting..."
                : "Export developer instructions"}
            </button>

            <span
              style={{
                color:
                  developerExportMessage.toLowerCase().includes("failed") ||
                  developerExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {developerExportMessage ||
                "Save developer setup instructions into the project tree."}
            </span>

            <button
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
            </span>`
      );

      console.log("Added Export security review UI.");
    } else {
      console.log("Export security review UI already exists.");
    }

    /**
     * Add security review to Full build pack export.
     */
    if (!updated.includes('filePath: "config/security-review.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/developer-instructions.md",
        contents: createDeveloperInstructions({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/developer-instructions.md",
        contents: createDeveloperInstructions({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/security-review.md",
        contents: createSecurityReviewMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added security review to Full build pack.");
    } else {
      console.log("Security review already included in Full build pack.");
    }

    /**
     * Update the full build pack helper text.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, developer instructions, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, security review, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, developer instructions, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, security review, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Add config/security-review.md into Build Pack contents tracking.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/security-review.md"')) {
      console.log("Build Pack contents already tracks security review.");
      return updated;
    }

    const developerBlock = `    {
      path: "config/developer-instructions.md",
      label: "Developer instructions",
      purpose:
        "Technical setup guide with local commands, required environment variables, Supabase migration steps, Vercel deployment steps, generated files, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    const repairedBlock = `    {
      path: "config/developer-instructions.md",
      label: "Developer instructions",
      purpose:
        "Technical setup guide with local commands, required environment variables, Supabase migration steps, Vercel deployment steps, generated files, and smoke tests.",
    },
    {
      path: "config/security-review.md",
      label: "Security review",
      purpose:
        "Security handoff covering authentication, authorization, API protection, database access, secrets, integrations, deployment risks, and open security tasks.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`;

    if (updated.includes(developerBlock)) {
      updated = updated.replace(developerBlock, repairedBlock);
      console.log("Added security review to Build Pack contents tracking.");
      return updated;
    }

    /**
     * Fallback insertion before SQL migration if the developer block differs.
     */
    updated = updated.replace(
      `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
      `    {
      path: "config/security-review.md",
      label: "Security review",
      purpose:
        "Security handoff covering authentication, authorization, API protection, database access, secrets, integrations, deployment risks, and open security tasks.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
    );

    if (!updated.includes('path: "config/security-review.md"')) {
      die("Could not add security review to Build Pack contents tracking.");
    }

    console.log("Added security review to Build Pack contents tracking using fallback insertion.");
    return updated;
  }
);

save();

console.log("✅ Security review export wiring complete.");
console.log(`Backup created at: ${backupPath}`);