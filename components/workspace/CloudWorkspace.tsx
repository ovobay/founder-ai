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

import {
  WorkspaceActionRow,
  WorkspaceAlert,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceStatusPill,
} from "./tool-system/WorkspacePanel";

import styles from "./CloudWorkspace.module.css";

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
  if (status === "connected") return <CheckCircle2 size={15} strokeWidth={2.25} />;
  if (status === "needs-setup") return <PlugZap size={15} strokeWidth={2.25} />;
  if (status === "optional") return <Workflow size={15} strokeWidth={2.25} />;
  return <XCircle size={15} strokeWidth={2.25} />;
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
          (connectedRequiredIntegrations.length / requiredIntegrations.length) * 50
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
  const requiredIntegrations = integrations.filter((item) => item.required);
  const connectedIntegrations = integrations.filter(
    (item) => item.status === "connected"
  );
  const setupIntegrations = integrations.filter(
    (item) => item.status === "needs-setup"
  );
  const requiredEnvVars = environmentVariables.filter((item) => item.required);
  const serverEnvVars = environmentVariables.filter((item) => item.scope === "server");

  const cloudScore = getCloudScore({ integrations, environmentVariables });
  const cloudTone = getCloudScoreTone(cloudScore);

  return (
    <WorkspacePanel
      title="Cloud"
      eyebrow="Deployment setup"
      description="Review integrations, environment variables, deployment target, and production readiness."
      icon={<Cloud size={17} strokeWidth={2.3} />}
      badge={<WorkspaceStatusPill tone={cloudTone}>{cloudScore}% ready</WorkspaceStatusPill>}
      actions={
        <button
          suppressHydrationWarning
          type="button"
          className={styles.topbarButton}
          onClick={onRefresh}
        >
          <RefreshCcw size={14} strokeWidth={2.3} />
          Refresh
        </button>
      }
      onClose={onClose}
    >
      <div className={styles.cloudWorkspace}>
        <WorkspaceHero
          eyebrow="Cloud readiness"
          title={`${projectName} deployment setup`}
          description="Central place for deployment target, required services, production variables, and all the tiny configuration gremlins that ruin launch day."
          icon={<UploadCloud size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone={cloudTone}>
              Last checked · {lastCheckedLabel}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Ready",
            value: `${cloudScore}%`,
            tone: cloudTone,
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onOpenPublish}
              >
                <UploadCloud size={14} strokeWidth={2.3} />
                Publish readiness
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onOpenSecurity}
              >
                <ShieldCheck size={14} strokeWidth={2.3} />
                Security review
              </button>
            </>
          }
        />

        {setupIntegrations.length > 0 ? (
          <WorkspaceAlert title="Required setup still needed" tone="warning">
            {setupIntegrations.length} integration
            {setupIntegrations.length === 1 ? "" : "s"} still need setup before
            a clean production launch.
          </WorkspaceAlert>
        ) : (
          <WorkspaceAlert title="Cloud setup looks healthy" tone="success">
            Required integrations are connected. Still verify production
            environment variables before deploying, because “it worked locally”
            belongs in a museum of famous last words.
          </WorkspaceAlert>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Integrations"
            value={integrations.length}
            detail="Detected service connections."
            icon={<PlugZap size={15} strokeWidth={2.25} />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Connected"
            value={connectedIntegrations.length}
            detail="Services ready to use."
            icon={<CheckCircle2 size={15} strokeWidth={2.25} />}
            tone={connectedIntegrations.length > 0 ? "green" : "orange"}
          />

          <WorkspaceMetricCard
            label="Required env"
            value={requiredEnvVars.length}
            detail="Variables needed for launch."
            icon={<KeyRound size={15} strokeWidth={2.25} />}
            tone={requiredEnvVars.length > 0 ? "orange" : "green"}
          />

          <WorkspaceMetricCard
            label="Server secrets"
            value={serverEnvVars.length}
            detail="Must stay server-only."
            icon={<ServerCog size={15} strokeWidth={2.25} />}
            tone="purple"
          />
        </WorkspaceMetricGrid>

        <div className={styles.cloudGrid}>
          <WorkspaceCard
            title="Deployment target"
            description="Where this generated workspace should be prepared for production."
            badge={<WorkspaceStatusPill tone="blue">{deploymentTarget}</WorkspaceStatusPill>}
          >
            <div className={styles.deploymentCard}>
              <span className={styles.deploymentIcon}>
                <Globe2 size={22} strokeWidth={2.2} />
              </span>

              <div className={styles.deploymentText}>
                <h4>{deploymentTarget}</h4>
                <p>
                  Recommended target for Next.js hosting, environment variables,
                  preview deployments, and production promotion.
                </p>
              </div>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.iconButton}
              >
                <ExternalLink size={14} strokeWidth={2.25} />
              </button>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Integrations"
            description="Required and optional external services detected for this build."
            badge={
              <WorkspaceStatusPill tone={setupIntegrations.length > 0 ? "orange" : "green"}>
                {setupIntegrations.length} pending
              </WorkspaceStatusPill>
            }
          >
            <div className={styles.integrationList}>
              {integrations.length > 0 ? (
                integrations.map((integration) => (
                  <article key={integration.id} className={styles.integrationCard}>
                    <div className={styles.integrationTop}>
                      <span className={styles.integrationIcon}>
                        {getIntegrationIcon(integration.status)}
                      </span>

                      <div>
                        <h4>{integration.label}</h4>
                        <span>{integration.provider}</span>
                      </div>

                      <WorkspaceStatusPill tone={getIntegrationTone(integration.status)}>
                        {getIntegrationLabel(integration.status)}
                      </WorkspaceStatusPill>
                    </div>

                    <p>{integration.description}</p>

                    <div className={styles.integrationFooter}>
                      <span>{integration.required ? "Required" : "Optional"}</span>
                      <button suppressHydrationWarning type="button">
                        Configure
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <WorkspaceEmptyState
                  icon={<PlugZap size={22} strokeWidth={2.2} />}
                  title="No integrations detected"
                  description="Generated integration requirements will appear here after the project is analysed."
                />
              )}
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Environment variables"
            description="Public and server-only values required by this workspace."
            badge={
              <WorkspaceStatusPill tone={requiredEnvVars.length > 0 ? "orange" : "green"}>
                {requiredEnvVars.length} required
              </WorkspaceStatusPill>
            }
          >
            <div className={styles.envList}>
              {environmentVariables.length > 0 ? (
                environmentVariables.map((variable) => (
                  <WorkspaceActionRow
                    key={variable.key}
                    title={variable.key}
                    description={variable.reason}
                    icon={
                      variable.scope === "server" ? (
                        <ServerCog size={15} strokeWidth={2.25} />
                      ) : (
                        <Code2 size={15} strokeWidth={2.25} />
                      )
                    }
                    badge={
                      <WorkspaceStatusPill
                        tone={variable.scope === "server" ? "purple" : "blue"}
                      >
                        {variable.scope}
                      </WorkspaceStatusPill>
                    }
                  />
                ))
              ) : (
                <WorkspaceEmptyState
                  icon={<KeyRound size={22} strokeWidth={2.2} />}
                  title="No environment variables"
                  description="No environment requirements were detected for this build."
                />
              )}
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Cloud checklist"
            description="Recommended setup steps before production deployment."
            badge={<WorkspaceStatusPill>Checklist</WorkspaceStatusPill>}
          >
            <div className={styles.envList}>
              <WorkspaceActionRow
                title="Confirm production environment variables"
                description="Check all server and public variables in your deployment provider."
                icon={<KeyRound size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="orange">Required</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Verify database and auth configuration"
                description="Confirm Supabase URL, anon key, policies, and auth redirects."
                icon={<Database size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill>Manual</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Review deployment security"
                description="Check server-only secrets, webhook validation, and protected routes."
                icon={<ShieldCheck size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Security</WorkspaceStatusPill>}
                onClick={onOpenSecurity}
              />

              <WorkspaceActionRow
                title="Open publish readiness"
                description="Generate final launch checks and review blockers before deployment."
                icon={<UploadCloud size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="green">Next</WorkspaceStatusPill>}
                onClick={onOpenPublish}
              />
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}