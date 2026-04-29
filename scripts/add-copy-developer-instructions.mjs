import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a "Copy developer instructions" button.
 *
 * The copied text is more technical than the handoff summary. It includes:
 * - Local setup commands
 * - Environment variable requirements
 * - Supabase migration steps
 * - Vercel deployment steps
 * - Generated files
 * - Post-deploy checks
 *
 * The button is added inside the Deploy readiness panel in Publish readiness.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-copy-developer-instructions-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because patching page.tsx without a backup is how villains are made.
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
 * 1. Add helper to create technical developer instructions.
 *
 * This produces a plain-text setup guide that can be copied and sent to a developer.
 * The markdown code fences are escaped as \\`\\`\\` so this patch script itself remains valid JS.
 */
const developerInstructionsHelper = `function createDeveloperInstructions({
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

  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasSqlMigration = files.some(
    (file) => file.path === "supabase/migrations/generated_architecture.sql"
  );

  const hasEnvExample = files.some((file) => file.path === "config/env.example");
  const hasDeployChecklist = files.some(
    (file) => file.path === "config/deploy-checklist.md"
  );
  const hasProjectBrief = files.some(
    (file) => file.path === "config/project-brief.md"
  );

  const generatedFileList =
    files.length > 0
      ? files.map((file) => \`- \${file.path}\`)
      : ["- No generated files found. Generate a build first."];

  const envVarLines =
    requiredEnvVars.length > 0
      ? requiredEnvVars.map(
          (variable) =>
            \`- \${variable.key} (\${variable.scope}) — \${variable.label}\`
        )
      : ["- No required environment variables detected."];

  const integrationLines =
    integrations.length > 0
      ? integrations.map(
          (integration) =>
            \`- \${integration.label} — \${integration.provider}\`
        )
      : ["- No required integrations detected."];

  const migrationSteps = hasDatabaseTables
    ? [
        "## Supabase migration steps",
        "",
        hasSqlMigration
          ? "A generated SQL migration exists at: supabase/migrations/generated_architecture.sql"
          : "Database tables are planned, but the generated SQL migration file is missing. Export the full build pack first.",
        "",
        "1. Open Supabase Dashboard.",
        "2. Go to SQL Editor.",
        "3. Create a new query.",
        "4. Paste the contents of supabase/migrations/generated_architecture.sql.",
        "5. Review the SQL before running it.",
        "6. Run the migration.",
        "7. Confirm Row Level Security policies are correct.",
        "8. Test authenticated access from the app.",
        "",
      ]
    : [
        "## Supabase migration steps",
        "",
        "No database tables were planned for this build.",
        "",
      ];

  const lines = [
    "Founder AI developer instructions",
    "",
    \`Product: \${previewState.title}\`,
    \`Description: \${previewState.subtitle}\`,
    \`Project type: \${previewState.projectType}\`,
    \`Primary category: \${previewState.classification?.primaryCategory ?? "Not classified"}\`,
    \`Complexity: \${previewState.classification?.complexity ?? "standard"}\`,
    "",
    "## Expected generated support files",
    "",
    \`- Project brief: \${hasProjectBrief ? "present" : "missing"}\`,
    \`- Deployment checklist: \${hasDeployChecklist ? "present" : "missing"}\`,
    \`- Environment example: \${hasEnvExample ? "present" : "missing"}\`,
    \`- SQL migration: \${hasSqlMigration ? "present" : hasDatabaseTables ? "missing" : "not required"}\`,
    "",
    "## Local setup",
    "",
    "Run these commands from the project root:",
    "",
    "\\\`\\\`\\\`bash",
    "npm install",
    "npm run dev",
    "\\\`\\\`\\\`",
    "",
    "For a production build check:",
    "",
    "\\\`\\\`\\\`bash",
    "npm run build",
    "\\\`\\\`\\\`",
    "",
    "## Environment variables",
    "",
    "Add required variables to .env.local for local development and to Vercel project settings for production.",
    "",
    ...envVarLines,
    "",
    hasEnvExample
      ? "Use config/env.example as the template. Do not put real secret values into committed files."
      : "config/env.example is missing. Export the full build pack before setup.",
    "",
    "## Required integrations",
    "",
    ...integrationLines,
    "",
    ...migrationSteps,
    "## Vercel deployment steps",
    "",
    "1. Push the project to GitHub.",
    "2. Import the GitHub repository into Vercel.",
    "3. Confirm the framework preset is Next.js.",
    "4. Set install command to npm install.",
    "5. Set build command to npm run build.",
    "6. Add production environment variables.",
    "7. Deploy.",
    "8. Check build logs and runtime function logs.",
    "9. Configure custom domain if needed.",
    "10. Update NEXT_PUBLIC_APP_URL and any auth/webhook callback URLs.",
    "",
    "## Generated files",
    "",
    ...generatedFileList,
    "",
    "## Post-deploy smoke tests",
    "",
    "- [ ] Open the deployed site.",
    "- [ ] Check browser console for errors.",
    "- [ ] Test sign-in/sign-up.",
    "- [ ] Test the primary user workflow.",
    "- [ ] Test protected API routes.",
    "- [ ] Check Vercel function logs.",
    "- [ ] Confirm database reads/writes work.",
    "- [ ] Confirm secrets are not exposed client-side.",
    "- [ ] Confirm Stripe/Shopify/OpenAI/email integrations if used.",
    "",
    "## Notes",
    "",
    "Review all generated files before production. Generated code is a scaffold, not a papal decree.",
  ];

  return lines.join("\\\\n");
}

`;

if (!source.includes("function createDeveloperInstructions(")) {
  if (source.includes("function createCompactHandoffSummary(")) {
    insertBefore(
      "createDeveloperInstructions helper",
      "function createCompactHandoffSummary(",
      developerInstructionsHelper
    );
  } else if (source.includes("function DeployReadinessPanel(")) {
    insertBefore(
      "createDeveloperInstructions helper",
      "function DeployReadinessPanel(",
      developerInstructionsHelper
    );
  } else {
    insertBefore(
      "createDeveloperInstructions helper",
      "function PublishReadinessWorkspace(",
      developerInstructionsHelper
    );
  }

  console.log("Added createDeveloperInstructions helper.");
} else {
  console.log("createDeveloperInstructions helper already exists.");
}

/**
 * 2. Add clipboard state and handler inside DeployReadinessPanel.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("const [copyDeveloperMessage")) {
      updated = updated.replace(
        `  const [copyHandoffMessage, setCopyHandoffMessage] = useState("");`,
        `  const [copyHandoffMessage, setCopyHandoffMessage] = useState("");
  const [copyDeveloperMessage, setCopyDeveloperMessage] = useState("");`
      );

      console.log("Added copy developer message state.");
    } else {
      console.log("Copy developer message state already exists.");
    }

    if (!updated.includes("async function handleCopyDeveloperInstructions()")) {
      const copyHandler = `

  async function handleCopyDeveloperInstructions() {
    setCopyDeveloperMessage("");
    setWorkspaceError("");

    const instructions = createDeveloperInstructions({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(instructions);
      setCopyDeveloperMessage("Developer instructions copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy developer instructions.";

      setCopyDeveloperMessage(message);
      setWorkspaceError(message);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${copyHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleCopyDeveloperInstructions function.");
    } else {
      console.log("handleCopyDeveloperInstructions already exists.");
    }

    /**
     * 3. Add the Copy developer instructions button beside the existing copy/export buttons.
     */
    if (!updated.includes("Copy developer instructions")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyHandoffSummary}
            >
              Copy handoff summary
            </button>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyHandoffSummary}
            >
              Copy handoff summary
            </button>

            <button
              type="button"
              className="pill-button"
              onClick={handleCopyDeveloperInstructions}
            >
              Copy developer instructions
            </button>

            <span
              style={{
                color:
                  copyDeveloperMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyDeveloperMessage ||
                "Copy exact setup and deployment instructions."}
            </span>`
      );

      console.log("Added Copy developer instructions UI.");
    } else {
      console.log("Copy developer instructions UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Copy developer instructions wiring complete.");
console.log(`Backup created at: ${backupPath}`);