"use client";

import {
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  Globe2,
  KeyRound,
  PlugZap,
  RefreshCcw,
  ServerCog,
  ShieldCheck,
  UploadCloud,
  Workflow,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  WorkspaceActionRow,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspaceNotice,
  WorkspaceSectionStack,
  WorkspaceShell,
  WorkspaceStatusBadge,
  WorkspaceTwoColumnGrid,
} from "@/components/workspace/shadcn/WorkspaceShell";

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

const defaultIntegrations: CloudIntegration[] = [
  {
    id: "supabase",
    label: "Supabase",
    provider: "Database",
    description:
      "Database, auth, storage, realtime updates, and secure server-side persistence.",
    status: "needs-setup",
    required: true,
  },
  {
    id: "openai",
    label: "OpenAI",
    provider: "AI",
    description:
      "Prompt generation, reasoning flows, app planning, and workspace assistance.",
    status: "needs-setup",
    required: true,
  },
  {
    id: "stripe",
    label: "Stripe",
    provider: "Billing",
    description:
      "Subscription plans, billing portal, payment events, and entitlement checks.",
    status: "optional",
    required: false,
  },
  {
    id: "github",
    label: "GitHub",
    provider: "Source control",
    description:
      "Repository sync, generated file review, branch management, and deployment flow.",
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
    reason: "Needed by the browser client to connect to Supabase.",
    example: "https://your-project.supabase.co",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    label: "Supabase anon key",
    scope: "client",
    required: true,
    reason: "Public anon key used by Supabase client-side auth.",
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
    reason: "Required when billing and subscriptions are enabled.",
    example: "sk_live_...",
  },
];

function getIntegrationTone(status: CloudIntegrationStatus) {
  if (status === "connected") return "green" as const;
  if (status === "needs-setup") return "orange" as const;
  if (status === "optional") return "blue" as const;

  return "default" as const;
}

function getIntegrationLabel(status: CloudIntegrationStatus) {
  if (status === "connected") return "Connected";
  if (status === "needs-setup") return "Needs setup";
  if (status === "optional") return "Optional";

  return "Disabled";
}

function getIntegrationIcon(status: CloudIntegrationStatus) {
  if (status === "connected") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "needs-setup") {
    return <PlugZap className="h-4 w-4" />;
  }

  if (status === "optional") {
    return <Workflow className="h-4 w-4" />;
  }

  return <XCircle className="h-4 w-4" />;
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

function getCloudScoreTone(score: number) {
  if (score >= 80) return "green" as const;
  if (score >= 55) return "orange" as const;

  return "red" as const;
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
  const connectedIntegrations = integrations.filter(
    (item) => item.status === "connected"
  );
  const setupIntegrations = integrations.filter(
    (item) => item.status === "needs-setup"
  );
  const requiredEnvVars = environmentVariables.filter((item) => item.required);
  const serverEnvVars = environmentVariables.filter(
    (item) => item.scope === "server"
  );

  const cloudScore = getCloudScore({ integrations, environmentVariables });
  const cloudTone = getCloudScoreTone(cloudScore);

  return (
    <WorkspaceShell
      title="Cloud"
      eyebrow="Deployment setup"
      description="Review integrations, environment variables, deployment target, and production readiness."
      icon={<Cloud className="h-4 w-4" />}
      badge={
        <WorkspaceStatusBadge tone={cloudTone}>
          {cloudScore}% ready
        </WorkspaceStatusBadge>
      }
      actions={
        <Button
          suppressHydrationWarning
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      }
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="Cloud readiness"
          title={`${projectName} deployment setup`}
          description="Central place for deployment target, required services, production variables, and all the tiny configuration gremlins that ruin launch day."
          icon={<UploadCloud className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone={cloudTone}>
              Last checked · {lastCheckedLabel}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Ready",
            value: `${cloudScore}%`,
            tone: cloudTone,
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onOpenPublish}
              >
                <UploadCloud className="h-4 w-4" />
                Publish readiness
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenSecurity}
              >
                <ShieldCheck className="h-4 w-4" />
                Security review
              </Button>
            </>
          }
        />

        {setupIntegrations.length > 0 ? (
          <WorkspaceNotice title="Required setup still needed" tone="warning">
            {setupIntegrations.length} integration
            {setupIntegrations.length === 1 ? "" : "s"} still need setup before
            a clean production launch.
          </WorkspaceNotice>
        ) : (
          <WorkspaceNotice title="Cloud setup looks healthy" tone="success">
            Required integrations are connected. Still verify production
            environment variables before deploying, because “it worked locally”
            belongs in a museum of famous last words.
          </WorkspaceNotice>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Integrations"
            value={integrations.length}
            detail="Detected service connections."
            icon={<PlugZap className="h-4 w-4" />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Connected"
            value={connectedIntegrations.length}
            detail="Services ready to use."
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone={connectedIntegrations.length > 0 ? "green" : "orange"}
          />

          <WorkspaceMetricCard
            label="Required env"
            value={requiredEnvVars.length}
            detail="Variables needed for launch."
            icon={<KeyRound className="h-4 w-4" />}
            tone={requiredEnvVars.length > 0 ? "orange" : "green"}
          />

          <WorkspaceMetricCard
            label="Server secrets"
            value={serverEnvVars.length}
            detail="Must stay server-only."
            icon={<ServerCog className="h-4 w-4" />}
            tone="purple"
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="Deployment target"
            description="Where this generated workspace should be prepared for production."
            badge={
              <WorkspaceStatusBadge tone="blue">
                {deploymentTarget}
              </WorkspaceStatusBadge>
            }
          >
            <div className="grid min-h-36 grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border bg-background p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                <Globe2 className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <h4 className="text-base font-bold tracking-tight text-foreground">
                  {deploymentTarget}
                </h4>
                <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
                  Recommended target for Next.js hosting, environment variables,
                  preview deployments, and production promotion.
                </p>
              </div>

              <Button
                suppressHydrationWarning
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-xl"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Integrations"
            description="Required and optional external services detected for this build."
            badge={
              <WorkspaceStatusBadge
                tone={setupIntegrations.length > 0 ? "orange" : "green"}
              >
                {setupIntegrations.length} pending
              </WorkspaceStatusBadge>
            }
          >
            {integrations.length > 0 ? (
              <div className="grid gap-2">
                {integrations.map((integration) => (
                  <article
                    key={integration.id}
                    className="grid gap-3 rounded-2xl border bg-background p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
                        {getIntegrationIcon(integration.status)}
                      </span>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold tracking-tight text-foreground">
                          {integration.label}
                        </h4>
                        <span className="mt-1 block text-xs font-medium text-muted-foreground">
                          {integration.provider}
                        </span>
                      </div>

                      <WorkspaceStatusBadge
                        tone={getIntegrationTone(integration.status)}
                      >
                        {getIntegrationLabel(integration.status)}
                      </WorkspaceStatusBadge>
                    </div>

                    <p className="text-xs font-medium leading-5 text-muted-foreground">
                      {integration.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 border-t pt-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        {integration.required ? "Required" : "Optional"}
                      </span>

                      <Button
                        suppressHydrationWarning
                        type="button"
                        size="sm"
                        variant="outline"
                      >
                        Configure
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<PlugZap className="h-6 w-6" />}
                title="No integrations detected"
                description="Generated integration requirements will appear here after the project is analysed."
              />
            )}
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Environment variables"
          description="Public and server-only values required by this workspace."
          badge={
            <WorkspaceStatusBadge
              tone={requiredEnvVars.length > 0 ? "orange" : "green"}
            >
              {requiredEnvVars.length} required
            </WorkspaceStatusBadge>
          }
        >
          <div className="grid gap-2">
            {environmentVariables.length > 0 ? (
              environmentVariables.map((variable) => (
                <WorkspaceActionRow
                  key={variable.key}
                  title={variable.key}
                  description={variable.reason}
                  icon={
                    variable.scope === "server" ? (
                      <ServerCog className="h-4 w-4" />
                    ) : (
                      <Code2 className="h-4 w-4" />
                    )
                  }
                  badge={
                    <WorkspaceStatusBadge
                      tone={variable.scope === "server" ? "purple" : "blue"}
                    >
                      {variable.scope}
                    </WorkspaceStatusBadge>
                  }
                />
              ))
            ) : (
              <WorkspaceEmptyState
                icon={<KeyRound className="h-6 w-6" />}
                title="No environment variables"
                description="No environment requirements were detected for this build."
              />
            )}
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          title="Cloud checklist"
          description="Recommended setup steps before production deployment."
          badge={<WorkspaceStatusBadge>Checklist</WorkspaceStatusBadge>}
        >
          <div className="grid gap-2">
            <WorkspaceActionRow
              title="Confirm production environment variables"
              description="Check all server and public variables in your deployment provider."
              icon={<KeyRound className="h-4 w-4" />}
              badge={
                <WorkspaceStatusBadge tone="orange">
                  Required
                </WorkspaceStatusBadge>
              }
            />

            <WorkspaceActionRow
              title="Verify database and auth configuration"
              description="Confirm Supabase URL, anon key, policies, and auth redirects."
              icon={<Database className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge>Manual</WorkspaceStatusBadge>}
            />

            <WorkspaceActionRow
              title="Review deployment security"
              description="Check server-only secrets, webhook validation, and protected routes."
              icon={<ShieldCheck className="h-4 w-4" />}
              badge={
                <WorkspaceStatusBadge tone="blue">
                  Security
                </WorkspaceStatusBadge>
              }
              onClick={onOpenSecurity}
            />

            <WorkspaceActionRow
              title="Open publish readiness"
              description="Generate final launch checks and review blockers before deployment."
              icon={<UploadCloud className="h-4 w-4" />}
              badge={
                <WorkspaceStatusBadge tone="green">Next</WorkspaceStatusBadge>
              }
              onClick={onOpenPublish}
            />
          </div>
        </WorkspaceCard>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}