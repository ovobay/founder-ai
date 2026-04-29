import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-env-readiness-${Date.now()}.tsx`
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
 * 1. Add environment readiness type.
 */
const envTypes = `type EnvironmentVariableReadiness = {
  key: string;
  label: string;
  required: boolean;
  scope: "client" | "server";
  reason: string;
  example: string;
};

`;

if (!source.includes("type EnvironmentVariableReadiness = {")) {
  if (source.includes("type PublishReadinessStatus =")) {
    insertBefore(
      "EnvironmentVariableReadiness type",
      "type PublishReadinessStatus =",
      envTypes
    );
  } else if (source.includes("type IntegrationReadiness =")) {
    insertBefore(
      "EnvironmentVariableReadiness type",
      "type IntegrationReadiness =",
      envTypes
    );
  } else {
    insertBefore(
      "EnvironmentVariableReadiness type",
      "type DetectedModule =",
      envTypes
    );
  }

  console.log("Added EnvironmentVariableReadiness type.");
} else {
  console.log("EnvironmentVariableReadiness type already exists.");
}

/**
 * 2. Add environment variable inference helpers.
 */
const envHelpers = `function getEnvironmentVariableReadiness({
  projectType,
  modules,
  architecture,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}): EnvironmentVariableReadiness[] {
  const integrations = getIntegrationReadiness({
    projectType,
    modules,
    architecture,
    classification,
  });

  const requiredIntegrationIds = new Set(
    integrations
      .filter((integration) => integration.required)
      .map((integration) => integration.id)
  );

  const variables: EnvironmentVariableReadiness[] = [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "Supabase project URL",
      required: requiredIntegrationIds.has("supabase"),
      scope: "client",
      reason: "Required by the browser client to connect to Supabase Auth, database, and storage.",
      example: "https://your-project.supabase.co",
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      label: "Supabase anon key",
      required: requiredIntegrationIds.has("supabase"),
      scope: "client",
      reason: "Required by the browser client for safe public Supabase access with Row Level Security.",
      example: "eyJhbGciOi...",
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "Supabase service role key",
      required: requiredIntegrationIds.has("supabase"),
      scope: "server",
      reason: "Required for trusted server-side project/build/file operations. Never expose this to the browser.",
      example: "eyJhbGciOi...",
    },
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI API key",
      required: requiredIntegrationIds.has("openai"),
      scope: "server",
      reason: "Required for AI build generation, assistant workflows, content generation, and agent features.",
      example: "sk-...",
    },
    {
      key: "STRIPE_SECRET_KEY",
      label: "Stripe secret key",
      required: requiredIntegrationIds.has("stripe"),
      scope: "server",
      reason: "Required for checkout sessions, subscriptions, invoices, and billing operations.",
      example: "sk_test_...",
    },
    {
      key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      label: "Stripe publishable key",
      required: requiredIntegrationIds.has("stripe"),
      scope: "client",
      reason: "Required by client-side Stripe checkout/payment components.",
      example: "pk_test_...",
    },
    {
      key: "STRIPE_WEBHOOK_SECRET",
      label: "Stripe webhook secret",
      required: requiredIntegrationIds.has("stripe"),
      scope: "server",
      reason: "Required to verify Stripe webhook events before changing billing state.",
      example: "whsec_...",
    },
    {
      key: "SHOPIFY_API_KEY",
      label: "Shopify API key",
      required: requiredIntegrationIds.has("shopify"),
      scope: "server",
      reason: "Required for Shopify OAuth and embedded app installation.",
      example: "your_shopify_api_key",
    },
    {
      key: "SHOPIFY_API_SECRET",
      label: "Shopify API secret",
      required: requiredIntegrationIds.has("shopify"),
      scope: "server",
      reason: "Required for Shopify OAuth verification and HMAC validation.",
      example: "your_shopify_api_secret",
    },
    {
      key: "SHOPIFY_APP_URL",
      label: "Shopify app URL",
      required: requiredIntegrationIds.has("shopify"),
      scope: "server",
      reason: "Required for OAuth redirects, webhook callbacks, and embedded app configuration.",
      example: "https://app.yourdomain.com",
    },
    {
      key: "META_APP_ID",
      label: "Meta app ID",
      required: requiredIntegrationIds.has("meta"),
      scope: "server",
      reason: "Required for Meta OAuth and Marketing API workflows.",
      example: "1234567890",
    },
    {
      key: "META_APP_SECRET",
      label: "Meta app secret",
      required: requiredIntegrationIds.has("meta"),
      scope: "server",
      reason: "Required for trusted Meta API calls and token exchange.",
      example: "your_meta_app_secret",
    },
    {
      key: "LINKEDIN_CLIENT_ID",
      label: "LinkedIn client ID",
      required: requiredIntegrationIds.has("linkedin"),
      scope: "server",
      reason: "Required for LinkedIn OAuth or approved lead data provider workflows.",
      example: "your_linkedin_client_id",
    },
    {
      key: "LINKEDIN_CLIENT_SECRET",
      label: "LinkedIn client secret",
      required: requiredIntegrationIds.has("linkedin"),
      scope: "server",
      reason: "Required for LinkedIn OAuth token exchange. Do not expose it to the client.",
      example: "your_linkedin_client_secret",
    },
    {
      key: "EMAIL_PROVIDER_API_KEY",
      label: "Email provider API key",
      required: requiredIntegrationIds.has("email"),
      scope: "server",
      reason: "Required for transactional email, invites, notifications, or email campaigns.",
      example: "re_... / sg_... / postmark_...",
    },
    {
      key: "NEXT_PUBLIC_APP_URL",
      label: "Public app URL",
      required: true,
      scope: "client",
      reason: "Required for redirects, share links, auth callbacks, preview links, and production routing.",
      example: "https://yourdomain.com",
    },
  ];

  return variables;
}

function getRequiredEnvironmentVariables(args: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}) {
  return getEnvironmentVariableReadiness(args).filter(
    (variable) => variable.required
  );
}

`;

if (!source.includes("function getEnvironmentVariableReadiness(")) {
  if (source.includes("function getPublishReadinessReport(")) {
    insertBefore(
      "environment variable helpers",
      "function getPublishReadinessReport(",
      envHelpers
    );
  } else if (source.includes("function getIntegrationReadiness(")) {
    insertBefore(
      "environment variable helpers",
      "function getIntegrationReadiness(",
      envHelpers
    );
  } else {
    insertBefore(
      "environment variable helpers",
      "function createBuildSteps(",
      envHelpers
    );
  }

  console.log("Added environment variable helpers.");
} else {
  console.log("Environment variable helpers already exist.");
}

/**
 * 3. Upgrade publish readiness environment checklist to use exact env vars.
 */
updateBetween(
  "getPublishReadinessReport",
  "function getPublishReadinessReport({",
  "function getIntegrationReadiness(",
  (section) => {
    let updated = section;

    if (!updated.includes("const requiredEnvironmentVariables =")) {
      updated = updated.replace(
        `  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });`,
        `  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredEnvironmentVariables = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });`
      );

      console.log("Added requiredEnvironmentVariables to publish readiness report.");
    }

    const oldEnvironmentItem = `    {
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
    },`;

    const newEnvironmentItem = `    {
      id: "environment",
      label: "Environment variables",
      status:
        requiredEnvironmentVariables.length > 0 ? "needs-setup" : "ready",
      detail:
        requiredEnvironmentVariables.length > 0
          ? \`\${requiredEnvironmentVariables.length} required environment variable\${requiredEnvironmentVariables.length === 1 ? "" : "s"} detected for this build.\`
          : "No required environment variables were detected.",
      checklist:
        requiredEnvironmentVariables.length > 0
          ? requiredEnvironmentVariables.map(
              (variable) => \`\${variable.key} · \${variable.scope}\`
            )
          : ["No environment setup required."],
    },`;

    if (updated.includes(oldEnvironmentItem)) {
      updated = updated.replace(oldEnvironmentItem, newEnvironmentItem);
      console.log("Replaced generic environment checklist with exact env vars.");
    } else {
      console.log("Generic environment checklist block not found, possibly already changed.");
    }

    return updated;
  }
);

/**
 * 4. Add EnvironmentVariablesPanel component before PublishReadinessWorkspace.
 */
const envPanelComponent = `function EnvironmentVariablesPanel({
  previewState,
}: {
  previewState: PreviewState;
}) {
  const variables = getEnvironmentVariableReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const required = variables.filter((variable) => variable.required);
  const optional = variables.filter((variable) => !variable.required);

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
        Environment variables
      </h3>

      <p
        style={{
          margin: "0 0 14px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {required.length} required key{required.length === 1 ? "" : "s"} and{" "}
        {optional.length} optional key{optional.length === 1 ? "" : "s"} were
        inferred from this build.
      </p>

      <EnvironmentVariableGroup title="Required" variables={required} />
      <EnvironmentVariableGroup title="Optional" variables={optional} />
    </section>
  );
}

function EnvironmentVariableGroup({
  title,
  variables,
}: {
  title: string;
  variables: EnvironmentVariableReadiness[];
}) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "12px",
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

      <div
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        {variables.map((variable) => (
          <EnvironmentVariableRow key={variable.key} variable={variable} />
        ))}
      </div>
    </div>
  );
}

function EnvironmentVariableRow({
  variable,
}: {
  variable: EnvironmentVariableReadiness;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "13px",
              lineHeight: 1.35,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              overflowWrap: "anywhere",
            }}
          >
            {variable.key}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: "3px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {variable.label}
          </span>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: variable.scope === "server" ? "#eff6ff" : "#ecfdf5",
            color: variable.scope === "server" ? "#1d4ed8" : "#166534",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {variable.scope}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 8px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {variable.reason}
      </p>

      <code
        style={{
          display: "block",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          background: "#ffffff",
          padding: "8px 10px",
          color: "#111827",
          fontSize: "12px",
          overflowWrap: "anywhere",
        }}
      >
        {variable.key}={variable.example}
      </code>
    </article>
  );
}

`;

if (!source.includes("function EnvironmentVariablesPanel(")) {
  if (source.includes("function PublishReadinessWorkspace(")) {
    insertBefore(
      "EnvironmentVariablesPanel component",
      "function PublishReadinessWorkspace(",
      envPanelComponent
    );
  } else if (source.includes("function IntegrationsWorkspace(")) {
    insertBefore(
      "EnvironmentVariablesPanel component",
      "function IntegrationsWorkspace(",
      envPanelComponent
    );
  } else {
    insertBefore(
      "EnvironmentVariablesPanel component",
      "function HistoryWorkspace(",
      envPanelComponent
    );
  }

  console.log("Added EnvironmentVariablesPanel component.");
} else {
  console.log("EnvironmentVariablesPanel component already exists.");
}

/**
 * 5. Render EnvironmentVariablesPanel inside PublishReadinessWorkspace.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<EnvironmentVariablesPanel")) {
      console.log("PublishReadinessWorkspace already renders EnvironmentVariablesPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >`;

    if (!updated.includes(marker)) {
      console.log("Could not find readiness cards grid marker. Skipping panel insertion.");
      return updated;
    }

    updated = updated.replace(
      marker,
      `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <EnvironmentVariablesPanel previewState={previewState} />
      </div>

${marker}`
    );

    console.log("Added EnvironmentVariablesPanel to PublishReadinessWorkspace.");
    return updated;
  }
);

/**
 * 6. Add the env var count to IntegrationsWorkspace intro if possible.
 */
updateBetween(
  "IntegrationsWorkspace",
  "function IntegrationsWorkspace({",
  "function IntegrationGroup(",
  (section) => {
    let updated = section;

    if (!updated.includes("const requiredEnvironmentVariables =")) {
      updated = updated.replace(
        `  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });`,
        `  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredEnvironmentVariables = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });`
      );

      console.log("Added requiredEnvironmentVariables to IntegrationsWorkspace.");
    }

    if (!updated.includes("required environment variable")) {
      updated = updated.replace(
        `This is where fantasy becomes infrastructure, unfortunately.`,
        `This is where fantasy becomes infrastructure, unfortunately. It also detected{" "}
          {requiredEnvironmentVariables.length} required environment variable
          {requiredEnvironmentVariables.length === 1 ? "" : "s"}.`
      );

      console.log("Added env var count to IntegrationsWorkspace intro.");
    }

    return updated;
  }
);

save();

console.log("✅ Environment variables readiness panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);