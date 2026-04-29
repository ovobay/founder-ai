import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-deploy-readiness-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
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
 * 1. Add deployment readiness types.
 */
const deployReadinessTypes = `type DeployReadinessItem = {
  id: string;
  label: string;
  status: "ready" | "needs-setup" | "blocked";
  detail: string;
  checklist: string[];
};

`;

if (!source.includes("type DeployReadinessItem = {")) {
  if (source.includes("type PublishReadinessStatus =")) {
    insertBefore(
      "DeployReadinessItem type",
      "type PublishReadinessStatus =",
      deployReadinessTypes
    );
  } else {
    insertBefore(
      "DeployReadinessItem type",
      "type DetectedModule =",
      deployReadinessTypes
    );
  }

  console.log("Added DeployReadinessItem type.");
} else {
  console.log("DeployReadinessItem type already exists.");
}

/**
 * 2. Add deployment readiness helper.
 */
const deployReadinessHelper = `function getDeployReadinessItems({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): DeployReadinessItem[] {
  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const hasPackageJson = files.some((file) => file.path === "package.json");
  const hasNextApp =
    files.some((file) => file.path.startsWith("app/")) ||
    files.some((file) => file.path.startsWith("components/"));

  const hasEnvExample = files.some((file) => file.path === "config/env.example");
  const hasMigration = files.some(
    (file) => file.path === "supabase/migrations/generated_architecture.sql"
  );

  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasSecurityRules = previewState.architecture.securityRules.length > 0;

  return [
    {
      id: "git-repository",
      label: "Git repository",
      status: files.length > 0 ? "needs-setup" : "blocked",
      detail:
        files.length > 0
          ? "Generated files exist and should be committed to a Git repository before deployment."
          : "No generated files exist yet.",
      checklist:
        files.length > 0
          ? [
              "Create or select a GitHub repository.",
              "Commit generated files.",
              "Push the repository to GitHub.",
              "Keep generated backups out of production commits if they are only local safety files.",
            ]
          : ["Generate a build before creating a deployment repository."],
    },
    {
      id: "framework",
      label: "Framework detection",
      status: hasNextApp ? "ready" : "needs-setup",
      detail: hasNextApp
        ? "Next.js App Router style files were detected."
        : "No obvious Next.js app files were detected.",
      checklist: hasNextApp
        ? [
            "Use npm run build as the production build check.",
            "Use npm run dev for local development.",
            "Confirm app routes and API routes compile successfully.",
          ]
        : [
            "Confirm framework type.",
            "Add framework configuration before deployment.",
            "Confirm build command manually.",
          ],
    },
    {
      id: "package-json",
      label: "Package configuration",
      status: hasPackageJson ? "ready" : "needs-setup",
      detail: hasPackageJson
        ? "package.json exists in the project file tree."
        : "package.json was not detected in generated files.",
      checklist: hasPackageJson
        ? [
            "Confirm dependencies are installed.",
            "Confirm scripts include dev, build, and start where relevant.",
            "Run npm install before deployment.",
          ]
        : [
            "Create or verify package.json.",
            "Add required dependencies.",
            "Add dev/build/start scripts.",
          ],
    },
    {
      id: "environment",
      label: "Production environment",
      status: requiredEnvVars.length > 0 ? "needs-setup" : "ready",
      detail:
        requiredEnvVars.length > 0
          ? \`\${requiredEnvVars.length} required environment variable\${requiredEnvVars.length === 1 ? "" : "s"} must be added to Vercel.\`
          : "No required environment variables were detected.",
      checklist:
        requiredEnvVars.length > 0
          ? [
              "Open Vercel project settings.",
              "Go to Environment Variables.",
              ...requiredEnvVars.map((variable) => \`Add \${variable.key}.\`),
              "Redeploy after adding production secrets.",
            ]
          : ["Confirm no external secrets are needed for this build."],
    },
    {
      id: "env-example",
      label: "Environment example file",
      status: hasEnvExample ? "ready" : "needs-setup",
      detail: hasEnvExample
        ? "config/env.example exists in the project file tree."
        : "config/env.example has not been exported yet.",
      checklist: hasEnvExample
        ? [
            "Review config/env.example.",
            "Do not commit real secret values.",
            "Use it as the template for local and production environment setup.",
          ]
        : [
            "Open Publish readiness.",
            "Click Export or update config/env.example.",
            "Review the generated file in Code view.",
          ],
    },
    {
      id: "database",
      label: "Database migration",
      status:
        hasDatabaseTables && hasMigration
          ? "needs-setup"
          : hasDatabaseTables
            ? "needs-setup"
            : "ready",
      detail:
        hasDatabaseTables && hasMigration
          ? "A SQL migration file exists, but it still needs to be reviewed and run in Supabase."
          : hasDatabaseTables
            ? "Database tables are planned, but no generated SQL migration file was detected."
            : "No planned database tables detected.",
      checklist:
        hasDatabaseTables && hasMigration
          ? [
              "Open supabase/migrations/generated_architecture.sql.",
              "Review fields, indexes, and RLS policies.",
              "Run the SQL in Supabase SQL Editor.",
              "Test database access from the app.",
            ]
          : hasDatabaseTables
            ? [
                "Open Architecture.",
                "Click Export SQL migration.",
                "Review and run the migration in Supabase.",
              ]
            : ["No database migration required for the current build."],
    },
    {
      id: "security",
      label: "Security before deploy",
      status: hasSecurityRules ? "needs-setup" : "blocked",
      detail: hasSecurityRules
        ? "Security rules were generated, but they need review before production."
        : "No security rules were generated. That is not deploy-ready unless the product is imaginary, which investors prefer but users do not.",
      checklist: hasSecurityRules
        ? [
            "Review authentication requirements.",
            "Check server-only secrets are never exposed to client code.",
            "Confirm API routes validate ownership and authorization.",
            "Confirm RLS policies match the product model.",
          ]
        : [
            "Generate or add security rules.",
            "Add authorization checks to API routes.",
            "Add RLS policies for user-owned data.",
          ],
    },
    {
      id: "vercel",
      label: "Vercel deployment",
      status: "needs-setup",
      detail:
        "The project still needs a Vercel deployment target and production build verification.",
      checklist: [
        "Import the GitHub repository into Vercel.",
        "Set framework preset to Next.js if detected.",
        "Set build command to npm run build.",
        "Set install command to npm install.",
        "Add production environment variables.",
        "Deploy and inspect build logs.",
      ],
    },
    {
      id: "domain",
      label: "Domain and routing",
      status: "needs-setup",
      detail:
        "A production domain or preview URL must be configured before launch.",
      checklist: [
        "Use the default Vercel preview URL for testing.",
        "Add a custom domain when ready.",
        "Update NEXT_PUBLIC_APP_URL to the production URL.",
        "Check auth redirect URLs and webhook callback URLs.",
      ],
    },
    {
      id: "post-deploy",
      label: "Post-deploy checks",
      status: "needs-setup",
      detail:
        "The first deployment needs a basic smoke test. Revolutionary concept: clicking things before announcing launch.",
      checklist: [
        "Open the deployed site.",
        "Test sign-in/sign-up.",
        "Test generated core workflow.",
        "Check browser console for errors.",
        "Check Vercel function logs.",
        "Test API routes that require authentication.",
      ],
    },
  ];
}

`;

if (!source.includes("function getDeployReadinessItems(")) {
  if (source.includes("function getPublishReadinessReport(")) {
    insertBefore(
      "getDeployReadinessItems helper",
      "function getPublishReadinessReport(",
      deployReadinessHelper
    );
  } else {
    insertBefore(
      "getDeployReadinessItems helper",
      "function PublishReadinessWorkspace(",
      deployReadinessHelper
    );
  }

  console.log("Added getDeployReadinessItems helper.");
} else {
  console.log("getDeployReadinessItems helper already exists.");
}

/**
 * 3. Add DeployReadinessPanel component before PublishReadinessWorkspace.
 */
const deployReadinessPanel = `function DeployReadinessPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const blocked = deployItems.filter((item) => item.status === "blocked");
  const needsSetup = deployItems.filter((item) => item.status === "needs-setup");
  const ready = deployItems.filter((item) => item.status === "ready");

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
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 6px",
              color: "#111827",
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Deploy readiness
          </h3>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {ready.length} ready, {needsSetup.length} need setup, and{" "}
            {blocked.length} blocked. A tidy little autopsy before Vercel gets involved.
          </p>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "26px",
            padding: "0 10px",
            borderRadius: "999px",
            background:
              blocked.length > 0
                ? "#fef2f2"
                : needsSetup.length > 0
                  ? "#fff7ed"
                  : "#ecfdf5",
            color:
              blocked.length > 0
                ? "#991b1b"
                : needsSetup.length > 0
                  ? "#9a3412"
                  : "#166534",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {blocked.length > 0
            ? "Blocked"
            : needsSetup.length > 0
              ? "Needs setup"
              : "Ready"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {deployItems.map((item) => (
          <DeployReadinessCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function DeployReadinessCard({
  item,
}: {
  item: DeployReadinessItem;
}) {
  const statusLabel =
    item.status === "ready"
      ? "Ready"
      : item.status === "blocked"
        ? "Blocked"
        : "Needs setup";

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
          {item.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background:
              item.status === "ready"
                ? "#ecfdf5"
                : item.status === "blocked"
                  ? "#fef2f2"
                  : "#fff7ed",
            color:
              item.status === "ready"
                ? "#166534"
                : item.status === "blocked"
                  ? "#991b1b"
                  : "#9a3412",
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
          margin: "0 0 12px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {item.detail}
      </p>

      <div
        style={{
          color: "#6b7280",
          fontSize: "11px",
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        Checklist
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#111827",
        }}
      >
        {item.checklist.map((check) => (
          <li
            key={check}
            style={{
              marginBottom: "6px",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {check}
          </li>
        ))}
      </ul>
    </article>
  );
}

`;

if (!source.includes("function DeployReadinessPanel(")) {
  if (source.includes("function PublishReadinessWorkspace(")) {
    insertBefore(
      "DeployReadinessPanel component",
      "function PublishReadinessWorkspace(",
      deployReadinessPanel
    );
  } else {
    insertBefore(
      "DeployReadinessPanel component",
      "function PublishReadinessCard(",
      deployReadinessPanel
    );
  }

  console.log("Added DeployReadinessPanel component.");
} else {
  console.log("DeployReadinessPanel component already exists.");
}

/**
 * 4. Render DeployReadinessPanel inside PublishReadinessWorkspace.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<DeployReadinessPanel")) {
      console.log("PublishReadinessWorkspace already renders DeployReadinessPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <EnvironmentVariablesPanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DeployReadinessPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Added DeployReadinessPanel before EnvironmentVariablesPanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DeployReadinessPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Added DeployReadinessPanel before readiness cards.");
      return updated;
    }

    console.log("Could not find insertion marker for DeployReadinessPanel.");
    return updated;
  }
);

save();

console.log("✅ Deploy readiness panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);