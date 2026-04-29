import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-integrations-view-${Date.now()}.tsx`
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

function replaceOnce(label, find, replacement) {
  if (!source.includes(find)) {
    die(`Missing block: ${label}`);
  }

  source = source.replace(find, replacement);
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
 * 1. Add integrations to WorkspaceView.
 */
if (!source.includes(`| "integrations"`)) {
  source = source.replace(
    `type WorkspaceView = "preview" | "code" | "architecture" | "history";`,
    `type WorkspaceView =
  | "preview"
  | "code"
  | "architecture"
  | "integrations"
  | "history";`
  );
  console.log("Added integrations to WorkspaceView.");
} else {
  console.log("WorkspaceView already includes integrations.");
}

/**
 * 2. Add integration readiness types after BuildClassification.
 */
const integrationTypes = `type IntegrationReadiness = {
  id: string;
  label: string;
  provider: string;
  required: boolean;
  status: "ready" | "needs-setup" | "optional";
  reason: string;
  checklist: string[];
};

`;

if (!source.includes("type IntegrationReadiness = {")) {
  insertBefore(
    "IntegrationReadiness type",
    "type DetectedModule =",
    integrationTypes
  );
  console.log("Added IntegrationReadiness type.");
} else {
  console.log("IntegrationReadiness type already exists.");
}

/**
 * 3. Add helper functions before createBuildSummary or createBuildSteps.
 */
const integrationHelpers = `function textIncludesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getBuildTextSignal({
  projectType,
  modules,
  architecture,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}) {
  return [
    projectType,
    getProjectTypeLabel(projectType),
    classification?.primaryCategory ?? "",
    classification?.industry ?? "",
    ...(classification?.secondaryCategories ?? []),
    ...(classification?.platformTargets ?? []),
    ...modules.map((module) => module.id),
    ...modules.map((module) => module.label),
    ...modules.map((module) => module.description),
    ...architecture.tables.map((table) => table.name),
    ...architecture.tables.map((table) => table.purpose),
    ...architecture.endpoints.map((endpoint) => endpoint.path),
    ...architecture.endpoints.map((endpoint) => endpoint.purpose),
    ...architecture.securityRules.map((rule) => rule.label),
    ...architecture.securityRules.map((rule) => rule.description),
  ]
    .join(" ")
    .toLowerCase();
}

function getIntegrationReadiness({
  projectType,
  modules,
  architecture,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}): IntegrationReadiness[] {
  const signal = getBuildTextSignal({
    projectType,
    modules,
    architecture,
    classification,
  });

  const needsAi = textIncludesAny(signal, [
    "ai",
    "openai",
    "assistant",
    "agent",
    "generate",
    "generation",
    "prompt",
    "ugc",
    "video",
    "image",
    "script",
  ]);

  const needsBilling = textIncludesAny(signal, [
    "stripe",
    "billing",
    "subscription",
    "payment",
    "checkout",
    "invoice",
    "pricing",
    "plan",
  ]);

  const needsShopify = textIncludesAny(signal, [
    "shopify",
    "merchant",
    "storefront",
    "admin api",
    "webhook",
    "theme",
    "checkout",
  ]);

  const needsMeta = textIncludesAny(signal, [
    "facebook",
    "instagram",
    "meta",
    "ads",
    "campaign",
    "creative",
    "marketing",
  ]);

  const needsLinkedIn = textIncludesAny(signal, [
    "linkedin",
    "lead",
    "leads",
    "prospect",
    "outreach",
    "sales",
    "crm",
  ]);

  const needsEmail = textIncludesAny(signal, [
    "email",
    "newsletter",
    "sequence",
    "invite",
    "magic link",
    "notification",
    "transactional",
  ]);

  const needsDatabase =
    architecture.tables.length > 0 ||
    textIncludesAny(signal, [
      "auth",
      "database",
      "storage",
      "workspace",
      "dashboard",
      "user",
      "team",
      "supabase",
    ]);

  const needsDeployment = true;

  return [
    {
      id: "openai",
      label: "OpenAI",
      provider: "OpenAI API",
      required: needsAi,
      status: needsAi ? "needs-setup" : "optional",
      reason: needsAi
        ? "Required for AI generation, assistants, prompts, creative output, or agent workflows."
        : "Optional unless the product uses AI generation or assistant workflows.",
      checklist: [
        "Add OPENAI_API_KEY to .env.local and production environment.",
        "Choose the model for build generation and product features.",
        "Set usage limits, logging, and abuse safeguards.",
        "Decide which generated outputs need moderation or review.",
      ],
    },
    {
      id: "supabase",
      label: "Supabase",
      provider: "Supabase Auth, Postgres, Storage",
      required: needsDatabase,
      status: needsDatabase ? "needs-setup" : "optional",
      reason: needsDatabase
        ? "Required for authentication, database tables, project files, workspaces, and stored build history."
        : "Optional for static-only projects, but useful for auth, storage, and persistence.",
      checklist: [
        "Confirm NEXT_PUBLIC_SUPABASE_URL is configured.",
        "Confirm NEXT_PUBLIC_SUPABASE_ANON_KEY is configured.",
        "Confirm SUPABASE_SERVICE_ROLE_KEY is configured server-side only.",
        "Run migrations for generated tables.",
        "Review Row Level Security policies before production.",
      ],
    },
    {
      id: "stripe",
      label: "Stripe",
      provider: "Stripe Billing",
      required: needsBilling,
      status: needsBilling ? "needs-setup" : "optional",
      reason: needsBilling
        ? "Required for paid plans, checkout, subscriptions, invoices, and customer billing."
        : "Optional unless the project sells plans, credits, services, or subscriptions.",
      checklist: [
        "Add STRIPE_SECRET_KEY and publishable key.",
        "Create products and prices in Stripe.",
        "Configure checkout/session route.",
        "Add webhook endpoint and STRIPE_WEBHOOK_SECRET.",
        "Test subscription lifecycle events.",
      ],
    },
    {
      id: "shopify",
      label: "Shopify",
      provider: "Shopify Admin API / Storefront",
      required: needsShopify,
      status: needsShopify ? "needs-setup" : "optional",
      reason: needsShopify
        ? "Required for Shopify apps, store integrations, merchant dashboards, webhooks, and storefront workflows."
        : "Optional unless the project connects to Shopify stores or merchant data.",
      checklist: [
        "Create Shopify Partner app.",
        "Configure app URL and redirect URLs.",
        "Set OAuth scopes.",
        "Implement HMAC validation.",
        "Register required webhook topics.",
        "Add billing flow if this is a paid Shopify app.",
      ],
    },
    {
      id: "meta",
      label: "Meta",
      provider: "Meta Marketing API",
      required: needsMeta,
      status: needsMeta ? "needs-setup" : "optional",
      reason: needsMeta
        ? "Required for Facebook/Instagram marketing workflows, campaign data, or ad creative publishing."
        : "Optional unless the product manages Facebook, Instagram, or Meta ad workflows.",
      checklist: [
        "Use approved Meta APIs and OAuth.",
        "Request only necessary permissions.",
        "Avoid scraping or unauthorized automation.",
        "Add campaign/ad account connection flow.",
        "Store access tokens securely.",
      ],
    },
    {
      id: "linkedin",
      label: "LinkedIn / approved lead source",
      provider: "LinkedIn API or compliant lead provider",
      required: needsLinkedIn,
      status: needsLinkedIn ? "needs-setup" : "optional",
      reason: needsLinkedIn
        ? "Required for compliant lead sourcing, prospect workflows, CRM enrichment, or sales outreach."
        : "Optional unless the product handles lead generation, prospecting, or sales data.",
      checklist: [
        "Use approved LinkedIn APIs or licensed lead data providers.",
        "Do not scrape LinkedIn pages or bypass platform limits.",
        "Add OAuth or provider connection flow.",
        "Track consent, source, and lawful basis for leads.",
        "Add unsubscribe/suppression handling for outreach.",
      ],
    },
    {
      id: "email",
      label: "Email provider",
      provider: "Resend, Postmark, SendGrid, or SES",
      required: needsEmail,
      status: needsEmail ? "needs-setup" : "optional",
      reason: needsEmail
        ? "Required for notifications, magic links, invites, transactional messages, or campaigns."
        : "Optional unless the product sends emails.",
      checklist: [
        "Choose an email provider.",
        "Verify sending domain.",
        "Add API key to environment variables.",
        "Create transactional email templates.",
        "Add unsubscribe handling for marketing emails.",
      ],
    },
    {
      id: "deployment",
      label: "Deployment",
      provider: "Vercel / production hosting",
      required: needsDeployment,
      status: "needs-setup",
      reason: "Required to publish the generated project outside the local development environment.",
      checklist: [
        "Connect repository to Vercel.",
        "Add production environment variables.",
        "Configure custom domain if needed.",
        "Run production build before publishing.",
        "Check logs after first deploy.",
      ],
    },
  ];
}

`;

if (!source.includes("function getIntegrationReadiness(")) {
  if (source.includes("function createBuildSummary(")) {
    insertBefore(
      "integration readiness helpers",
      "function createBuildSummary(",
      integrationHelpers
    );
  } else {
    insertBefore(
      "integration readiness helpers",
      "function createBuildSteps(",
      integrationHelpers
    );
  }
  console.log("Added integration readiness helpers.");
} else {
  console.log("Integration readiness helpers already exist.");
}

/**
 * 4. Add IntegrationsWorkspace component before HistoryWorkspace.
 */
const integrationsWorkspaceComponent = `function IntegrationsWorkspace({
  previewState,
}: {
  previewState: PreviewState;
}) {
  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const required = integrations.filter((integration) => integration.required);
  const optional = integrations.filter((integration) => !integration.required);

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
          Integration readiness
        </div>

        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "32px",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          Required setup before publish
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
          Founder AI detected {required.length} required integration
          {required.length === 1 ? "" : "s"} for this build and{" "}
          {optional.length} optional integration{optional.length === 1 ? "" : "s"}.
          This is where fantasy becomes infrastructure, unfortunately.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        <IntegrationGroup title="Required" integrations={required} />
        <IntegrationGroup title="Optional" integrations={optional} />
      </div>
    </div>
  );
}

function IntegrationGroup({
  title,
  integrations,
}: {
  title: string;
  integrations: IntegrationReadiness[];
}) {
  if (integrations.length === 0) {
    return null;
  }

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
      <h3
        style={{
          margin: "0 0 14px",
          color: "#111827",
          fontSize: "16px",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </section>
  );
}

function IntegrationCard({
  integration,
}: {
  integration: IntegrationReadiness;
}) {
  const statusLabel =
    integration.status === "ready"
      ? "Ready"
      : integration.status === "optional"
        ? "Optional"
        : "Needs setup";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
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
        <div>
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "15px",
              lineHeight: 1.2,
              marginBottom: "4px",
            }}
          >
            {integration.label}
          </strong>

          <span
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {integration.provider}
          </span>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background:
              integration.status === "needs-setup" ? "#fff7ed" : "#ecfdf5",
            color:
              integration.status === "needs-setup" ? "#9a3412" : "#166534",
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
        {integration.reason}
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
        {integration.checklist.map((item) => (
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
    </article>
  );
}

`;

if (!source.includes("function IntegrationsWorkspace(")) {
  insertBefore(
    "IntegrationsWorkspace component",
    "function HistoryWorkspace(",
    integrationsWorkspaceComponent
  );
  console.log("Added IntegrationsWorkspace component.");
} else {
  console.log("IntegrationsWorkspace component already exists.");
}

/**
 * 5. Add toolbar button for integrations view.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function PreviewContent({",
  (section) => {
    let updated = section;

    if (updated.includes(`workspaceView === "integrations"`)) {
      console.log("PreviewToolbar already has integrations button.");
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
          workspaceView === "integrations" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Integrations"
        aria-pressed={workspaceView === "integrations"}
        onClick={() => setWorkspaceView("integrations")}
      >
        <Cloud className="icon" />
      </button>

`;

    if (!updated.includes(marker)) {
      console.log("Could not find history button marker. Skipping toolbar insertion.");
      return updated;
    }

    updated = updated.replace(marker, `${insertion}${marker}`);
    console.log("Added integrations toolbar button.");
    return updated;
  }
);

/**
 * 6. Update URL pill for integrations.
 */
if (!source.includes(`: workspaceView === "integrations"`)) {
  source = source.replace(
    `: workspaceView === "architecture"
                ? "/architecture"
                : "/history"}`,
    `: workspaceView === "architecture"
                ? "/architecture"
                : workspaceView === "integrations"
                  ? "/integrations"
                  : "/history"}`
  );
  console.log("Updated URL pill for integrations.");
} else {
  console.log("URL pill already supports integrations.");
}

/**
 * 7. Render integrations view inside PreviewContent.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (updated.includes(`workspaceView === "integrations"`)) {
      console.log("PreviewContent already renders integrations view.");
      return updated;
    }

    const marker = `          {!isLoadingWorkspace && workspaceView === "history" ? (
            <HistoryWorkspace`;

    const insertion = `          {!isLoadingWorkspace && workspaceView === "integrations" ? (
            <IntegrationsWorkspace previewState={previewState} />
          ) : null}

`;

    if (!updated.includes(marker)) {
      console.log("Could not find history render marker. Skipping integrations render.");
      return updated;
    }

    updated = updated.replace(marker, `${insertion}${marker}`);
    console.log("Added integrations render to PreviewContent.");
    return updated;
  }
);

save();

console.log("✅ Integrations readiness view wiring complete.");
console.log(`Backup created at: ${backupPath}`);