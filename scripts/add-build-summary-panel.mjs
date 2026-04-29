import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-build-summary-panel-${Date.now()}.tsx`
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
 * 1. Add helper functions for build summary generation.
 */
const buildSummaryHelpers = `function inferRequiredIntegrations({
  modules,
  architecture,
  projectType,
  classification,
}: {
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  projectType: ProjectType;
  classification?: BuildClassification;
}) {
  const haystack = [
    projectType,
    classification?.primaryCategory ?? "",
    classification?.industry ?? "",
    ...(classification?.secondaryCategories ?? []),
    ...(classification?.platformTargets ?? []),
    ...modules.map((module) => module.id),
    ...modules.map((module) => module.label),
    ...architecture.endpoints.map((endpoint) => endpoint.path),
    ...architecture.endpoints.map((endpoint) => endpoint.purpose),
  ]
    .join(" ")
    .toLowerCase();

  const integrations = new Set<string>();

  if (
    haystack.includes("stripe") ||
    haystack.includes("billing") ||
    haystack.includes("subscription") ||
    haystack.includes("payment")
  ) {
    integrations.add("Stripe");
  }

  if (
    haystack.includes("openai") ||
    haystack.includes("ai") ||
    haystack.includes("generate") ||
    haystack.includes("assistant") ||
    haystack.includes("agent")
  ) {
    integrations.add("OpenAI");
  }

  if (
    haystack.includes("supabase") ||
    haystack.includes("database") ||
    haystack.includes("auth") ||
    haystack.includes("storage")
  ) {
    integrations.add("Supabase");
  }

  if (
    haystack.includes("shopify") ||
    haystack.includes("merchant") ||
    haystack.includes("storefront") ||
    haystack.includes("admin api")
  ) {
    integrations.add("Shopify");
  }

  if (
    haystack.includes("linkedin") ||
    haystack.includes("lead") ||
    haystack.includes("outreach") ||
    haystack.includes("sales")
  ) {
    integrations.add("LinkedIn API / approved lead source");
  }

  if (
    haystack.includes("facebook") ||
    haystack.includes("instagram") ||
    haystack.includes("meta")
  ) {
    integrations.add("Meta API");
  }

  if (
    haystack.includes("email") ||
    haystack.includes("newsletter") ||
    haystack.includes("sequence")
  ) {
    integrations.add("Transactional email provider");
  }

  if (integrations.size === 0) {
    integrations.add("Supabase");
  }

  return Array.from(integrations);
}

function createBuildSummary({
  projectType,
  modules,
  architecture,
  files,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  classification?: BuildClassification;
}) {
  const requiredIntegrations = inferRequiredIntegrations({
    modules,
    architecture,
    projectType,
    classification,
  });

  const created = [
    \`\${files.length} project file\${files.length === 1 ? "" : "s"}\`,
    \`\${modules.length} product module\${modules.length === 1 ? "" : "s"}\`,
    \`\${architecture.tables.length} database table\${architecture.tables.length === 1 ? "" : "s"}\`,
    \`\${architecture.endpoints.length} API route\${architecture.endpoints.length === 1 ? "" : "s"}\`,
    \`\${architecture.securityRules.length} security rule\${architecture.securityRules.length === 1 ? "" : "s"}\`,
  ];

  const missing = [];

  if (requiredIntegrations.includes("Stripe")) {
    missing.push("Connect Stripe keys and webhook secret before paid checkout can work.");
  }

  if (requiredIntegrations.includes("OpenAI")) {
    missing.push("Confirm OpenAI key, model, usage limits, and safety handling.");
  }

  if (requiredIntegrations.includes("Shopify")) {
    missing.push("Configure Shopify OAuth, webhook topics, app URL, scopes, and billing.");
  }

  if (
    requiredIntegrations.includes("LinkedIn API / approved lead source") ||
    requiredIntegrations.includes("Meta API")
  ) {
    missing.push("Use approved platform APIs/OAuth for lead and marketing data. No scraping nonsense in a hat.");
  }

  if (architecture.tables.length > 0) {
    missing.push("Run or generate database migrations for the planned tables.");
  }

  if (architecture.securityRules.length > 0) {
    missing.push("Review security rules before publishing.");
  }

  if (missing.length === 0) {
    missing.push("Review generated files and connect production environment variables.");
  }

  const publishReady =
    files.length > 0 &&
    architecture.securityRules.length > 0 &&
    !classification?.platformTargets.includes("mobile");

  return {
    primaryCategory:
      classification?.primaryCategory ?? getProjectTypeLabel(projectType),
    requiredIntegrations,
    created,
    missing,
    publishReadiness: publishReady
      ? "Draft-ready after review"
      : "Needs setup before publish",
  };
}

`;

if (!source.includes("function inferRequiredIntegrations(")) {
  insertBefore(
    "build summary helpers",
    "function createBuildSteps(",
    buildSummaryHelpers
  );
  console.log("Added build summary helper functions.");
} else {
  console.log("Build summary helper functions already exist.");
}

/**
 * 2. Add BuildSummaryPanel component before FeedMessage.
 */
const buildSummaryComponent = `function BuildSummaryPanel({
  projectType,
  modules,
  architecture,
  files,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  classification?: BuildClassification;
}) {
  const summary = createBuildSummary({
    projectType,
    modules,
    architecture,
    files,
    classification,
  });

  return (
    <div className="assistant-build-section">
      <div className="assistant-build-section-title">Build summary</div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            border: "1px solid #eef0f3",
            borderRadius: "16px",
            background: "#f9fafb",
            padding: "13px",
          }}
        >
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "13px",
              marginBottom: "5px",
            }}
          >
            {summary.primaryCategory}
          </strong>

          <span
            style={{
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Publish readiness: {summary.publishReadiness}
          </span>
        </div>

        <BuildSummaryList title="Created" items={summary.created} />
        <BuildSummaryList
          title="Required integrations"
          items={summary.requiredIntegrations}
        />
        <BuildSummaryList title="Still needed" items={summary.missing} />
      </div>
    </div>
  );
}

function BuildSummaryList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#ffffff",
        padding: "13px",
      }}
    >
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
        {title}
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#111827",
        }}
      >
        {items.map((item) => (
          <li
            key={item}
            style={{
              marginBottom: "6px",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

`;

if (!source.includes("function BuildSummaryPanel(")) {
  insertBefore("BuildSummaryPanel component", "function FeedMessage({", buildSummaryComponent);
  console.log("Added BuildSummaryPanel component.");
} else {
  console.log("BuildSummaryPanel component already exists.");
}

/**
 * 3. Add classification to FeedItem assistant and plan types if missing.
 */
updateBetween(
  "FeedItem type",
  "type FeedItem =",
  "type QueuedItem =",
  (section) => {
    let updated = section;

    if (!updated.includes("classification?: BuildClassification;")) {
      updated = updated.replaceAll(
        `projectType: ProjectType;`,
        `projectType: ProjectType;
      classification?: BuildClassification;`
      );
      console.log("Added classification to FeedItem variants.");
    } else {
      console.log("FeedItem already includes classification.");
    }

    return updated;
  }
);

/**
 * 4. Insert BuildSummaryPanel inside plan card.
 */
updateBetween(
  "FeedMessage",
  "function FeedMessage({",
  "function QueueCard(",
  (section) => {
    let updated = section;

    const planMarker = `        <div className="assistant-build-section">
          <div className="assistant-build-section-title">Expected changes</div>`;

    if (
      updated.includes(planMarker) &&
      !updated.includes("classification={item.classification}")
    ) {
      updated = updated.replace(
        planMarker,
        `        <BuildSummaryPanel
          projectType={item.projectType}
          modules={item.modules}
          architecture={item.architecture}
          files={item.files}
          classification={item.classification}
        />

${planMarker}`
      );
      console.log("Added BuildSummaryPanel to plan card.");
    }

    const assistantMarker = `      <div className="assistant-build-section">
        <div className="assistant-build-section-title">Changes applied</div>`;

    if (
      updated.includes(assistantMarker) &&
      !updated.includes("files={item.files}\\n        classification={item.classification}")
    ) {
      updated = updated.replace(
        assistantMarker,
        `      <BuildSummaryPanel
        projectType={item.projectType}
        modules={item.modules}
        architecture={item.architecture}
        files={item.files}
        classification={item.classification}
      />

${assistantMarker}`
      );
      console.log("Added BuildSummaryPanel to assistant card.");
    }

    return updated;
  }
);

/**
 * 5. Add classification to initialPreviewState if PreviewState now requires/uses it.
 */
if (
  source.includes("const initialPreviewState: PreviewState = {") &&
  !source.includes("primaryCategory: \"SaaS Builder Workspace\"")
) {
  source = source.replace(
    `  projectType: "SaaS",
  fileCount: 2,`,
    `  projectType: "SaaS",
  classification: {
    primaryCategory: "SaaS Builder Workspace",
    secondaryCategories: ["AI builder", "Developer tools"],
    industry: "Software",
    platformTargets: ["web", "api", "admin-dashboard"],
    complexity: "advanced",
  },
  fileCount: 2,`
  );
  console.log("Added classification to initialPreviewState.");
}

/**
 * 6. Add classification to initial build history if missing.
 */
if (
  source.includes(`id: "history-initial",`) &&
  !source.includes(`primaryCategory: "SaaS Builder Workspace",`)
) {
  source = source.replace(
    `      projectType: "saas",
      modules: initialModules,`,
    `      projectType: "saas",
      classification: initialPreviewState.classification,
      modules: initialModules,`
  );
  console.log("Added classification to initial build history.");
}

/**
 * 7. Add classification to initial assistant feed item if missing.
 */
if (
  source.includes(`id: "assistant-initial",`) &&
  !source.includes(`classification: initialPreviewState.classification,`)
) {
  source = source.replace(
    `      projectType: "saas",
      modules: initialModules,`,
    `      projectType: "saas",
      classification: initialPreviewState.classification,
      modules: initialModules,`
  );
  console.log("Added classification to initial assistant feed.");
}

save();

console.log("✅ Build Summary panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);