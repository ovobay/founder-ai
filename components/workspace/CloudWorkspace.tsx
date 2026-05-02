"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  FileText,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCcw,
  ServerCog,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WorkspaceCallout,
  WorkspaceList,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceSidebarLayout,
  WorkspaceSidebarNav,
  WorkspaceStatusPill,
  WorkspaceSubHeader,
} from "@/components/workspace/tool-system/WorkspacePanel";

export type CloudIntegrationStatus =
  | "connected"
  | "needs-setup"
  | "optional"
  | "disabled";

export type CloudIntegration = {
  id: string;
  label: string;
  description: string;
  provider: string;
  status: CloudIntegrationStatus;
  required?: boolean;
};

export type CloudEnvironmentVariable = {
  key: string;
  label: string;
  scope: "client" | "server";
  required: boolean;
  reason: string;
  example?: string;
};

export type CloudWorkspaceProps = {
  projectName?: string;
  deploymentTarget?: string;
  lastCheckedLabel?: string;
  integrations?: CloudIntegration[];
  environmentVariables?: CloudEnvironmentVariable[];
  onClose?: () => void;
  onRefresh?: () => void;
  onOpenPublish?: () => void;
  onOpenSecurity?: () => void;
};

type CloudSectionKey =
  | "overview"
  | "ai"
  | "emails"
  | "database"
  | "users"
  | "storage"
  | "security"
  | "secrets"
  | "logs"
  | "usage";

const defaultIntegrations: CloudIntegration[] = [
  {
    id: "openai",
    label: "OpenAI setup",
    provider: "AI",
    description:
      "Required for generation, app planning, workspace assistance, and reasoning workflows.",
    status: "connected",
    required: true,
  },
  {
    id: "email",
    label: "Domain email",
    provider: "Email",
    description:
      "Optional branded email sending for notifications, invites, and product messages.",
    status: "optional",
    required: false,
  },
  {
    id: "supabase",
    label: "Supabase database",
    provider: "Database",
    description:
      "Stores projects, generated files, user records, workspace state, and auth data.",
    status: "needs-setup",
    required: true,
  },
  {
    id: "stripe",
    label: "Stripe billing",
    provider: "Billing",
    description:
      "Optional subscription billing, checkout, usage limits, and customer portal support.",
    status: "optional",
    required: false,
  },
  {
    id: "github",
    label: "GitHub sync",
    provider: "Source control",
    description:
      "Repository sync, file review, generated branch flow, and deployment history.",
    status: "connected",
    required: false,
  },
];

const defaultEnvironmentVariables: CloudEnvironmentVariable[] = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    label: "Supabase URL",
    scope: "client",
    required: true,
    reason: "Used by the browser client to connect to Supabase.",
    example: "https://your-project.supabase.co",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    label: "Supabase anon key",
    scope: "client",
    required: true,
    reason: "Public anon key used for Supabase client-side auth.",
    example: "eyJhbGciOi...",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    label: "Supabase service role key",
    scope: "server",
    required: true,
    reason:
      "Server-only key for privileged project file operations and secure admin tasks.",
    example: "eyJhbGciOi...",
  },
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API key",
    scope: "server",
    required: true,
    reason: "Server-only key used for AI generation and reasoning calls.",
    example: "sk-...",
  },
  {
    key: "STRIPE_SECRET_KEY",
    label: "Stripe secret key",
    scope: "server",
    required: false,
    reason: "Required when subscriptions and billing are enabled.",
    example: "sk_live_...",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    label: "Stripe webhook secret",
    scope: "server",
    required: false,
    reason: "Required to verify live Stripe webhook events.",
    example: "whsec_...",
  },
];

function getIntegrationTone(status: CloudIntegrationStatus) {
  if (status === "connected") return "success" as const;
  if (status === "needs-setup") return "warning" as const;
  if (status === "optional") return "info" as const;

  return "neutral" as const;
}

function getIntegrationLabel(status: CloudIntegrationStatus) {
  if (status === "connected") return "Connected";
  if (status === "needs-setup") return "Needs setup";
  if (status === "optional") return "Optional";

  return "Disabled";
}

function getIntegrationIcon(provider: string) {
  const normalized = provider.toLowerCase();

  if (normalized.includes("ai")) return <BrainCircuit className="h-4 w-4" />;
  if (normalized.includes("email")) return <Mail className="h-4 w-4" />;
  if (normalized.includes("database")) return <Database className="h-4 w-4" />;
  if (normalized.includes("billing")) return <Sparkles className="h-4 w-4" />;
  if (normalized.includes("source")) return <Code2 className="h-4 w-4" />;

  return <Cloud className="h-4 w-4" />;
}

function getCloudScore({
  integrations,
  environmentVariables,
}: {
  integrations: CloudIntegration[];
  environmentVariables: CloudEnvironmentVariable[];
}) {
  const requiredIntegrations = integrations.filter((item) => item.required);
  const connectedRequiredIntegrations = requiredIntegrations.filter(
    (item) => item.status === "connected"
  );

  const requiredEnvVars = environmentVariables.filter((item) => item.required);

  const integrationScore =
    requiredIntegrations.length === 0
      ? 50
      : Math.round(
          (connectedRequiredIntegrations.length / requiredIntegrations.length) *
            50
        );

  const envScore = requiredEnvVars.length > 0 ? 25 : 35;
  const securityScore = 15;

  return Math.min(100, integrationScore + envScore + securityScore);
}

function getScoreTone(score: number, pendingRequiredCount: number) {
  if (pendingRequiredCount > 0) return "warning" as const;
  if (score >= 80) return "success" as const;
  if (score >= 55) return "warning" as const;

  return "danger" as const;
}

function getSectionRows({
  activeSection,
  integrations,
  environmentVariables,
  deploymentTarget,
}: {
  activeSection: CloudSectionKey;
  integrations: CloudIntegration[];
  environmentVariables: CloudEnvironmentVariable[];
  deploymentTarget: string;
}) {
  if (activeSection === "ai") {
    return integrations
      .filter((item) => item.provider.toLowerCase().includes("ai"))
      .map((item) => ({
        label: item.label,
        description: item.description,
        value: getIntegrationLabel(item.status),
        trailing: (
          <WorkspaceStatusPill tone={getIntegrationTone(item.status)}>
            {getIntegrationLabel(item.status)}
          </WorkspaceStatusPill>
        ),
      }));
  }

  if (activeSection === "emails") {
    return integrations
      .filter((item) => item.provider.toLowerCase().includes("email"))
      .map((item) => ({
        label: item.label,
        description: item.description,
        value: getIntegrationLabel(item.status),
        trailing: (
          <WorkspaceStatusPill tone={getIntegrationTone(item.status)}>
            {getIntegrationLabel(item.status)}
          </WorkspaceStatusPill>
        ),
      }));
  }

  if (activeSection === "database") {
    return [
      {
        label: "Primary database",
        description:
          "Stores project records, generated files, workspace state, users, and build metadata.",
        value: "Supabase",
        trailing: <WorkspaceStatusPill tone="warning">Review</WorkspaceStatusPill>,
      },
      {
        label: "Generated tables",
        description:
          "Tables should be reviewed before migration and protected with Row Level Security.",
        value: "Planned",
        trailing: <WorkspaceStatusPill tone="info">Schema</WorkspaceStatusPill>,
      },
      {
        label: "Storage-backed files",
        description:
          "Generated code files should be stored safely and scoped to the project owner.",
        value: "Enabled",
        trailing: <WorkspaceStatusPill tone="success">Ready</WorkspaceStatusPill>,
      },
    ];
  }

  if (activeSection === "security") {
    return [
      {
        label: "Server-only secrets",
        description:
          "Privileged values must stay server-side and never use NEXT_PUBLIC prefixes.",
        value: "Required",
        trailing: <WorkspaceStatusPill tone="warning">Manual</WorkspaceStatusPill>,
      },
      {
        label: "Webhook verification",
        description:
          "Billing and platform webhooks should be verified before processing events.",
        value: "Review",
        trailing: <WorkspaceStatusPill tone="warning">Check</WorkspaceStatusPill>,
      },
      {
        label: "Database ownership checks",
        description:
          "Users should only read and update records they own or are permitted to access.",
        value: "Required",
        trailing: <WorkspaceStatusPill tone="danger">Important</WorkspaceStatusPill>,
      },
    ];
  }

  if (activeSection === "secrets") {
    return environmentVariables.map((item) => ({
      label: item.key,
      description: item.reason,
      value: item.scope,
      trailing: (
        <WorkspaceStatusPill tone={item.scope === "server" ? "warning" : "info"}>
          {item.required ? "Required" : "Optional"}
        </WorkspaceStatusPill>
      ),
    }));
  }

  if (activeSection === "logs") {
    return [
      {
        label: "Build logs",
        description:
          "Track generated files, failed edits, publish attempts, and workspace warnings.",
        value: "Planned",
        trailing: <WorkspaceStatusPill tone="info">Later</WorkspaceStatusPill>,
      },
      {
        label: "Deployment logs",
        description:
          "Connect deployment provider events after production deployment is wired.",
        value: deploymentTarget,
        trailing: <WorkspaceStatusPill tone="neutral">External</WorkspaceStatusPill>,
      },
    ];
  }

  if (activeSection === "usage") {
    return [
      {
        label: "AI usage",
        description:
          "Track generation requests, token usage, tool calls, and model activity.",
        value: "Planned",
        trailing: <WorkspaceStatusPill tone="info">Usage</WorkspaceStatusPill>,
      },
      {
        label: "Storage usage",
        description:
          "Track generated files, project snapshots, preview assets, and history size.",
        value: "Planned",
        trailing: <WorkspaceStatusPill tone="info">Storage</WorkspaceStatusPill>,
      },
    ];
  }

  if (activeSection === "users") {
    return [
      {
        label: "Authentication",
        description:
          "User login, workspace ownership, and access control are required before launch.",
        value: "Supabase Auth",
        trailing: <WorkspaceStatusPill tone="warning">Review</WorkspaceStatusPill>,
      },
      {
        label: "Roles",
        description:
          "Owner/admin roles should be enforced server-side for project actions.",
        value: "Planned",
        trailing: <WorkspaceStatusPill tone="info">Roles</WorkspaceStatusPill>,
      },
    ];
  }

  if (activeSection === "storage") {
    return [
      {
        label: "Generated files",
        description:
          "Store generated files with ownership scoping and safe retrieval paths.",
        value: "Database",
        trailing: <WorkspaceStatusPill tone="success">Enabled</WorkspaceStatusPill>,
      },
      {
        label: "Preview assets",
        description:
          "Images, uploads, and exported assets should use a storage-backed workflow.",
        value: "Planned",
        trailing: <WorkspaceStatusPill tone="info">Assets</WorkspaceStatusPill>,
      },
    ];
  }

  return integrations.map((item) => ({
    label: item.label,
    description: item.description,
    value: item.provider,
    trailing: (
      <WorkspaceStatusPill tone={getIntegrationTone(item.status)}>
        {getIntegrationLabel(item.status)}
      </WorkspaceStatusPill>
    ),
  }));
}

export function CloudWorkspace({
  projectName = "Founder AI workspace",
  deploymentTarget = "Vercel",
  lastCheckedLabel = "Just now",
  integrations = defaultIntegrations,
  environmentVariables = defaultEnvironmentVariables,
  onClose,
  onRefresh,
  onOpenPublish,
  onOpenSecurity,
}: CloudWorkspaceProps) {
  const [activeSection, setActiveSection] =
    useState<CloudSectionKey>("overview");

  const requiredIntegrations = integrations.filter((item) => item.required);
  const pendingRequiredIntegrations = requiredIntegrations.filter(
    (item) => item.status !== "connected"
  );
  const optionalIntegrations = integrations.filter((item) => !item.required);
  const connectedIntegrations = integrations.filter(
    (item) => item.status === "connected"
  );

  const requiredEnvVars = environmentVariables.filter((item) => item.required);
  const serverEnvVars = environmentVariables.filter(
    (item) => item.scope === "server"
  );

  const cloudScore = getCloudScore({ integrations, environmentVariables });
  const scoreTone = getScoreTone(
    cloudScore,
    pendingRequiredIntegrations.length
  );

  const navItems = useMemo(
    () => [
      {
        key: "overview",
        label: "Overview",
      },
      {
        key: "ai",
        label: "AI",
        badge:
          integrations.find((item) => item.provider.toLowerCase().includes("ai"))
            ?.status === "connected"
            ? "Ready"
            : "Req",
      },
      {
        key: "emails",
        label: "Emails",
        badge: "Pro",
      },
      {
        key: "database",
        label: "Database",
        badge: `${requiredEnvVars.length}`,
      },
      {
        key: "users",
        label: "Users",
      },
      {
        key: "storage",
        label: "Storage",
      },
      {
        key: "security",
        label: "Security",
      },
      {
        key: "secrets",
        label: "Secrets",
        badge: `${serverEnvVars.length}`,
      },
      {
        key: "logs",
        label: "Logs",
      },
      {
        key: "usage",
        label: "Usage",
      },
    ],
    [integrations, requiredEnvVars.length, serverEnvVars.length]
  );

  const rows = getSectionRows({
    activeSection,
    integrations,
    environmentVariables,
    deploymentTarget,
  });

  const activeTitle =
    navItems.find((item) => item.key === activeSection)?.label ?? "Overview";

  return (
    <WorkspacePanel
      eyebrow="Cloud setup"
      title="Cloud"
      description="Review deployment target, integrations, secrets, database setup, and production readiness."
      status={`${cloudScore}% ready`}
      statusTone={scoreTone}
      actions={
        <>
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            className="h-9 rounded-[12px]"
            onClick={onRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
            Update scan
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            className="h-9 rounded-[12px]"
            onClick={onOpenPublish}
          >
            <UploadCloud className="h-4 w-4" />
            Publish
          </Button>

          {onClose ? (
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-[12px]"
              onClick={onClose}
            >
              Close
            </Button>
          ) : null}
        </>
      }
    >
      <WorkspaceSidebarLayout
        sidebar={
          <WorkspaceSidebarNav
            activeKey={activeSection}
            items={navItems}
            onChange={(key) => setActiveSection(key as CloudSectionKey)}
          />
        }
      >
        <div className="space-y-5">
          <WorkspaceSubHeader
            left={
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {activeTitle}
                </div>
                <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
                  {projectName} cloud configuration
                </h3>
                <p className="mt-1 max-w-[850px] text-[14px] leading-6 text-slate-600">
                  Keep setup clear, scannable, and production-aware. The cloud
                  screen should tell the user what is ready, what is optional,
                  and what will burn the house down later.
                </p>
              </div>
            }
            right={
              <WorkspaceStatusPill tone={scoreTone}>
                Last checked · {lastCheckedLabel}
              </WorkspaceStatusPill>
            }
          />

          {pendingRequiredIntegrations.length > 0 ? (
            <WorkspaceCallout
              title="Security and setup issues detected"
              description="Fix required integrations and production secrets before publishing."
              tone="danger"
              action={
                <Button
                  suppressHydrationWarning
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-[12px] bg-white"
                  onClick={onOpenSecurity}
                >
                  View issues
                </Button>
              }
            />
          ) : (
            <WorkspaceCallout
              title="Cloud setup looks healthy"
              description="Required integrations are connected. Review production variables before publishing."
              tone="success"
              action={
                <Button
                  suppressHydrationWarning
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-[12px] bg-white"
                  onClick={onOpenPublish}
                >
                  Continue
                </Button>
              }
            />
          )}

          <WorkspaceMetricGrid>
            <WorkspaceMetricCard
              label="Required"
              value={requiredIntegrations.length}
              description="Required service connections."
              tone={pendingRequiredIntegrations.length > 0 ? "warning" : "success"}
              icon={<AlertTriangle className="h-4 w-4" />}
            />

            <WorkspaceMetricCard
              label="Optional"
              value={optionalIntegrations.length}
              description="Extra services detected."
              tone="neutral"
              icon={<Sparkles className="h-4 w-4" />}
            />

            <WorkspaceMetricCard
              label="Ready"
              value={connectedIntegrations.length}
              description="Connected integrations."
              tone={connectedIntegrations.length > 0 ? "success" : "warning"}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />

            <WorkspaceMetricCard
              label="Env vars"
              value={environmentVariables.length}
              description="Client and server variables."
              tone="info"
              icon={<KeyRound className="h-4 w-4" />}
            />
          </WorkspaceMetricGrid>

          <WorkspaceSection
            title={activeTitle}
            description="Configuration summary for the selected cloud area."
            action={
              <Badge variant="outline" className="rounded-full">
                {deploymentTarget}
              </Badge>
            }
          >
            <WorkspaceList rows={rows} />
          </WorkspaceSection>

          {activeSection === "overview" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <WorkspaceSection
                title="Deployment target"
                description="Recommended target for hosting, previews, and environment configuration."
              >
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-blue-200 bg-blue-50 text-blue-700">
                      <Globe2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
                        {deploymentTarget}
                      </h4>
                      <p className="mt-2 text-[14px] leading-6 text-slate-600">
                        Use this for preview deployments, production variables,
                        server-side API routes, and final launch promotion.
                      </p>
                    </div>
                  </div>
                </div>
              </WorkspaceSection>

              <WorkspaceSection
                title="Launch checklist"
                description="The boring bits that save you from dramatic production nonsense."
              >
                <WorkspaceList
                  rows={[
                    {
                      label: "Confirm production variables",
                      description:
                        "Set required server and client values in the deployment provider.",
                      value: "Required",
                      trailing: (
                        <WorkspaceStatusPill tone="warning">
                          Manual
                        </WorkspaceStatusPill>
                      ),
                    },
                    {
                      label: "Review database policies",
                      description:
                        "Verify ownership checks and Row Level Security before launch.",
                      value: "Required",
                      trailing: (
                        <WorkspaceStatusPill tone="danger">
                          Important
                        </WorkspaceStatusPill>
                      ),
                    },
                    {
                      label: "Open publish readiness",
                      description:
                        "Run final launch checks before promoting the project.",
                      value: "Next",
                      trailing: (
                        <Button
                          suppressHydrationWarning
                          type="button"
                          size="sm"
                          className="h-8 rounded-[10px]"
                          onClick={onOpenPublish}
                        >
                          Publish
                        </Button>
                      ),
                    },
                  ]}
                />
              </WorkspaceSection>
            </div>
          ) : null}

          {activeSection === "secrets" ? (
            <WorkspaceSection
              title="Secret handling rules"
              description="Server-only values must never be exposed to the client bundle. This is less a suggestion and more a survival instinct."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[20px] border border-amber-200 bg-amber-50/70 p-5 text-amber-800">
                  <div className="flex items-center gap-2 text-[14px] font-semibold">
                    <LockKeyhole className="h-4 w-4" />
                    Server-only
                  </div>
                  <p className="mt-2 text-[14px] leading-6">
                    Keep service-role keys, OpenAI keys, Stripe secrets, webhook
                    secrets, and privileged tokens out of the browser.
                  </p>
                </div>

                <div className="rounded-[20px] border border-blue-200 bg-blue-50/70 p-5 text-blue-800">
                  <div className="flex items-center gap-2 text-[14px] font-semibold">
                    <Code2 className="h-4 w-4" />
                    Client-safe
                  </div>
                  <p className="mt-2 text-[14px] leading-6">
                    Only expose values designed for the client, such as public
                    Supabase URLs and anon keys.
                  </p>
                </div>
              </div>
            </WorkspaceSection>
          ) : null}

          <WorkspaceSection
            title="Detected integrations"
            description="Services inferred from the current build plan and workspace files."
          >
            <div className="grid gap-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-start justify-between gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-slate-700">
                      {getIntegrationIcon(integration.provider)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[14px] font-semibold tracking-[-0.01em] text-slate-950">
                          {integration.label}
                        </h4>
                        <WorkspaceStatusPill
                          tone={getIntegrationTone(integration.status)}
                        >
                          {getIntegrationLabel(integration.status)}
                        </WorkspaceStatusPill>
                      </div>

                      <p className="mt-1 text-[14px] leading-6 text-slate-600">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    suppressHydrationWarning
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 shrink-0 rounded-[12px]"
                  >
                    Configure
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </WorkspaceSection>
        </div>
      </WorkspaceSidebarLayout>
    </WorkspacePanel>
  );
}