import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-readiness-${Date.now()}.tsx`
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
 * 1. Add publish-readiness to WorkspaceView.
 */
if (!source.includes(`| "publish-readiness"`)) {
  source = source.replace(
    `  | "integrations"
  | "history";`,
    `  | "integrations"
  | "publish-readiness"
  | "history";`
  );
  console.log("Added publish-readiness to WorkspaceView.");
} else {
  console.log("WorkspaceView already includes publish-readiness.");
}

/**
 * 2. Add publish readiness types.
 */
const publishReadinessTypes = `type PublishReadinessStatus = "ready" | "needs-setup" | "blocked";

type PublishReadinessItem = {
  id: string;
  label: string;
  status: PublishReadinessStatus;
  detail: string;
  checklist: string[];
};

type PublishReadinessReport = {
  status: PublishReadinessStatus;
  score: number;
  summary: string;
  items: PublishReadinessItem[];
};

`;

if (!source.includes("type PublishReadinessStatus =")) {
  if (source.includes("type IntegrationReadiness = {")) {
    insertBefore(
      "Publish readiness types",
      "type IntegrationReadiness =",
      publishReadinessTypes
    );
  } else {
    insertBefore(
      "Publish readiness types",
      "type DetectedModule =",
      publishReadinessTypes
    );
  }

  console.log("Added publish readiness types.");
} else {
  console.log("Publish readiness types already exist.");
}

/**
 * 3. Add publish readiness helper functions.
 */
const publishReadinessHelpers = `function getPublishReadinessReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): PublishReadinessReport {
  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = integrations.filter(
    (integration) => integration.required
  );

  const requiredIntegrationsNeedSetup = requiredIntegrations.filter(
    (integration) => integration.status !== "ready"
  );

  const isMobileTarget =
    previewState.classification?.platformTargets.some((target) =>
      target.toLowerCase().includes("mobile")
    ) ?? false;

  const items: PublishReadinessItem[] = [
    {
      id: "files",
      label: "Generated files",
      status: files.length > 0 ? "ready" : "blocked",
      detail:
        files.length > 0
          ? \`\${files.length} generated file\${files.length === 1 ? "" : "s"} available in the project file tree.\`
          : "No generated files exist yet.",
      checklist:
        files.length > 0
          ? [
              "Review generated files in Code view.",
              "Save any edits before publishing.",
              "Remove unused placeholder files.",
            ]
          : ["Generate at least one build before publishing."],
    },
    {
      id: "database",
      label: "Database and migrations",
      status:
        previewState.architecture.tables.length > 0
          ? "needs-setup"
          : "ready",
      detail:
        previewState.architecture.tables.length > 0
          ? \`\${previewState.architecture.tables.length} database table\${previewState.architecture.tables.length === 1 ? "" : "s"} planned. Migrations still need to be created or confirmed.\`
          : "No database tables were detected for this build.",
      checklist:
        previewState.architecture.tables.length > 0
          ? [
              "Generate SQL migrations for planned tables.",
              "Run migrations in Supabase SQL Editor or Supabase CLI.",
              "Review Row Level Security policies.",
              "Test authenticated and unauthenticated access paths.",
            ]
          : ["Confirm this build does not require persistence."],
    },
    {
      id: "security",
      label: "Security review",
      status:
        previewState.architecture.securityRules.length > 0
          ? "needs-setup"
          : "blocked",
      detail:
        previewState.architecture.securityRules.length > 0
          ? \`\${previewState.architecture.securityRules.length} security rule\${previewState.architecture.securityRules.length === 1 ? "" : "s"} planned and waiting for review.\`
          : "No security rules were generated. That is not publish-ready unless this is a toy, and even toys have choking hazards.",
      checklist:
        previewState.architecture.securityRules.length > 0
          ? [
              "Review generated security rules.",
              "Confirm auth boundaries.",
              "Confirm API route authorization.",
              "Verify secrets are server-side only.",
            ]
          : [
              "Add security rules for auth, data access, API protection, and secrets.",
            ],
    },
    {
      id: "integrations",
      label: "Required integrations",
      status:
        requiredIntegrationsNeedSetup.length === 0 ? "ready" : "needs-setup",
      detail:
        requiredIntegrationsNeedSetup.length === 0
          ? "No required integrations are currently marked as needing setup."
          : \`\${requiredIntegrationsNeedSetup.length} required integration\${requiredIntegrationsNeedSetup.length === 1 ? "" : "s"} still need setup.\`,
      checklist:
        requiredIntegrationsNeedSetup.length === 0
          ? ["Confirm production environment variables are configured."]
          : requiredIntegrationsNeedSetup.map(
              (integration) => \`Configure \${integration.label}.\`
            ),
    },
    {
      id: "environment",
      label: "Environment variables",
      status: "needs-setup",
      detail:
        "Production environment variables must be configured before deployment.",
      checklist: [
        "Add Supabase URL and anon key.",
        "Add Supabase service role key server-side only.",
        "Add OpenAI key if AI features are required.",
        "Add Stripe keys and webhook secret if billing is required.",
        "Add Shopify keys/secrets if Shopify is required.",
        "Add email provider keys if email is required.",
      ],
    },
    {
      id: "deployment",
      label: "Deployment",
      status: "needs-setup",
      detail:
        "The generated project needs a production deployment target and production build check.",
      checklist: [
        "Connect GitHub repository to Vercel.",
        "Add production environment variables.",
        "Run production build.",
        "Check deployment logs.",
        "Configure custom domain if needed.",
      ],
    },
    {
      id: "mobile",
      label: "Mobile/native support",
      status: isMobileTarget ? "blocked" : "ready",
      detail: isMobileTarget
        ? "Mobile target detected. Native iOS/Android generation is planned for a later phase."
        : "No native mobile blocker detected.",
      checklist: isMobileTarget
        ? [
            "Decide whether this should be a web app first.",
            "Plan React Native/Expo generation later.",
            "Add App Store and Play Store deployment pipeline later.",
          ]
        : ["No mobile-specific action required."],
    },
  ];

  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const needsSetupCount = items.filter(
    (item) => item.status === "needs-setup"
  ).length;
  const readyCount = items.filter((item) => item.status === "ready").length;

  const score = Math.round((readyCount / items.length) * 100);

  const status: PublishReadinessStatus =
    blockedCount > 0 ? "blocked" : needsSetupCount > 0 ? "needs-setup" : "ready";

  const summary =
    status === "ready"
      ? "This build is publish-ready after final human review."
      : status === "blocked"
        ? "This build has blockers that must be resolved before publishing."
        : "This build is structurally useful, but setup is still required before publishing.";

  return {
    status,
    score,
    summary,
    items,
  };
}

`;

if (!source.includes("function getPublishReadinessReport(")) {
  if (source.includes("function getIntegrationReadiness(")) {
    insertBefore(
      "Publish readiness helpers",
      "function getIntegrationReadiness(",
      publishReadinessHelpers
    );
  } else if (source.includes("function createBuildSummary(")) {
    insertBefore(
      "Publish readiness helpers",
      "function createBuildSummary(",
      publishReadinessHelpers
    );
  } else {
    insertBefore(
      "Publish readiness helpers",
      "function createBuildSteps(",
      publishReadinessHelpers
    );
  }

  console.log("Added publish readiness helpers.");
} else {
  console.log("Publish readiness helpers already exist.");
}

/**
 * 4. Add PublishReadinessWorkspace component before HistoryWorkspace.
 */
const publishReadinessWorkspace = `function PublishReadinessWorkspace({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getPublishReadinessReport({
    previewState,
    files,
  });

  const statusLabel =
    report.status === "ready"
      ? "Ready"
      : report.status === "blocked"
        ? "Blocked"
        : "Needs setup";

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#ffffff",
        padding: "28px",
      }}
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "24px",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
          padding: "22px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Publish readiness
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "32px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              {statusLabel} · {report.score}%
            </h2>

            <p
              style={{
                margin: "12px 0 0",
                maxWidth: "820px",
                color: "#4b5563",
                fontSize: "15px",
                lineHeight: 1.65,
              }}
            >
              {report.summary}
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "30px",
              padding: "0 12px",
              borderRadius: "999px",
              background:
                report.status === "ready"
                  ? "#ecfdf5"
                  : report.status === "blocked"
                    ? "#fef2f2"
                    : "#fff7ed",
              color:
                report.status === "ready"
                  ? "#166534"
                  : report.status === "blocked"
                    ? "#991b1b"
                    : "#9a3412",
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >
        {report.items.map((item) => (
          <PublishReadinessCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function PublishReadinessCard({
  item,
}: {
  item: PublishReadinessItem;
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
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "16px",
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
            fontSize: "15px",
            lineHeight: 1.2,
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

if (!source.includes("function PublishReadinessWorkspace(")) {
  insertBefore(
    "PublishReadinessWorkspace component",
    "function HistoryWorkspace(",
    publishReadinessWorkspace
  );
  console.log("Added PublishReadinessWorkspace component.");
} else {
  console.log("PublishReadinessWorkspace component already exists.");
}

/**
 * 5. Add toolbar button before history.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function PreviewContent({",
  (section) => {
    let updated = section;

    if (updated.includes(`workspaceView === "publish-readiness"`)) {
      console.log("PreviewToolbar already has publish readiness button.");
      return updated;
    }

    const marker = `      <button
        type="button"
        className={[
          "tool-button",
          workspaceView === "history" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Build history"`;

    const insertion = `      <button
        type="button"
        className={[
          "tool-button",
          workspaceView === "publish-readiness" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Publish readiness"
        aria-pressed={workspaceView === "publish-readiness"}
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        <Play className="icon" />
      </button>

`;

    if (!updated.includes(marker)) {
      console.log("Could not find history button marker. Skipping toolbar insertion.");
      return updated;
    }

    updated = updated.replace(marker, `${insertion}${marker}`);
    console.log("Added publish readiness toolbar button.");
    return updated;
  }
);

/**
 * 6. Update URL pill.
 */
if (!source.includes(`? "/publish-readiness"`)) {
  source = source.replace(
    `: workspaceView === "integrations"
                  ? "/integrations"
                  : "/history"}`,
    `: workspaceView === "integrations"
                  ? "/integrations"
                  : workspaceView === "publish-readiness"
                    ? "/publish-readiness"
                    : "/history"}`
  );
  console.log("Updated URL pill for publish readiness.");
} else {
  console.log("URL pill already supports publish readiness.");
}

/**
 * 7. Render publish readiness view.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (updated.includes(`workspaceView === "publish-readiness"`)) {
      console.log("PreviewContent already renders publish readiness.");
      return updated;
    }

    const marker = `          {!isLoadingWorkspace && workspaceView === "history" ? (
            <HistoryWorkspace`;

    const insertion = `          {!isLoadingWorkspace && workspaceView === "publish-readiness" ? (
            <PublishReadinessWorkspace
              previewState={previewState}
              files={files}
            />
          ) : null}

`;

    if (!updated.includes(marker)) {
      console.log("Could not find history render marker. Skipping publish readiness render.");
      return updated;
    }

    updated = updated.replace(marker, `${insertion}${marker}`);
    console.log("Added publish readiness render.");
    return updated;
  }
);

save();

console.log("✅ Publish readiness view wiring complete.");
console.log(`Backup created at: ${backupPath}`);