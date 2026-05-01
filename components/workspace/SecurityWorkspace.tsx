"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  ScanLine,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
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

type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";
type SecurityFindingStatus = "open" | "reviewed" | "resolved";

export type SecurityFinding = {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  area: string;
  status?: SecurityFindingStatus;
  recommendation?: string;
};

export type SecurityWorkspaceProps = {
  projectName?: string;
  scanStatus?: "idle" | "running" | "complete";
  lastCheckedLabel?: string;
  findings?: SecurityFinding[];
  environmentRisks?: string[];
  onClose?: () => void;
  onOpenPublish?: () => void;
  onGenerateSecurityDoc?: () => void;
};

const defaultFindings: SecurityFinding[] = [
  {
    id: "auth-routes",
    title: "Review protected routes",
    description:
      "Confirm admin, billing, workspace, and project mutation routes require authenticated access.",
    severity: "medium",
    area: "Authentication",
    status: "open",
    recommendation:
      "Add route-level authorization checks and verify server-side access control.",
  },
  {
    id: "env-secrets",
    title: "Confirm server-only secrets",
    description:
      "API keys, database service keys, and webhook secrets must not be exposed to the browser.",
    severity: "high",
    area: "Environment",
    status: "open",
    recommendation:
      "Keep privileged values in server-only environment variables and never prefix them with NEXT_PUBLIC.",
  },
  {
    id: "rls-review",
    title: "Review Supabase RLS policies",
    description:
      "Generated tables should have Row Level Security enabled before production deployment.",
    severity: "medium",
    area: "Database",
    status: "reviewed",
    recommendation:
      "Validate policies for select, insert, update, and delete operations using test users.",
  },
];

const defaultEnvironmentRisks = [
  "Missing production webhook verification checks can allow spoofed requests.",
  "Public environment variables should be reviewed before deployment.",
  "Database write routes should validate ownership server-side.",
];

function getSeverityTone(severity: SecuritySeverity) {
  if (severity === "critical" || severity === "high") return "red" as const;
  if (severity === "medium") return "orange" as const;
  if (severity === "low") return "blue" as const;

  return "default" as const;
}

function getSeverityLabel(severity: SecuritySeverity) {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";

  return "Info";
}

function getOverallScore(findings: SecurityFinding[]) {
  if (findings.length === 0) return 96;

  const penalty = findings.reduce((total, finding) => {
    if (finding.severity === "critical") return total + 28;
    if (finding.severity === "high") return total + 18;
    if (finding.severity === "medium") return total + 10;
    if (finding.severity === "low") return total + 4;

    return total + 2;
  }, 0);

  return Math.max(12, 100 - penalty);
}

function getScoreTone(score: number) {
  if (score >= 85) return "green" as const;
  if (score >= 65) return "orange" as const;

  return "red" as const;
}

export function SecurityWorkspace({
  projectName = "Founder AI workspace",
  scanStatus = "complete",
  lastCheckedLabel = "Just now",
  findings = defaultFindings,
  environmentRisks = defaultEnvironmentRisks,
  onClose,
  onOpenPublish,
  onGenerateSecurityDoc,
}: SecurityWorkspaceProps) {
  const openFindings = findings.filter(
    (finding) => finding.status !== "resolved"
  );

  const highRiskCount = findings.filter(
    (finding) =>
      finding.severity === "critical" || finding.severity === "high"
  ).length;

  const reviewedCount = findings.filter(
    (finding) => finding.status === "reviewed" || finding.status === "resolved"
  ).length;

  const score = getOverallScore(openFindings);
  const scoreTone = getScoreTone(score);

  const scanBadge =
    scanStatus === "running" ? (
      <WorkspaceStatusBadge tone="blue">Scanning</WorkspaceStatusBadge>
    ) : scanStatus === "complete" ? (
      <WorkspaceStatusBadge tone={scoreTone}>
        {score >= 85 ? "Healthy" : "Needs review"}
      </WorkspaceStatusBadge>
    ) : (
      <WorkspaceStatusBadge>Idle</WorkspaceStatusBadge>
    );

  return (
    <WorkspaceShell
      title="Security"
      eyebrow="Workspace protection"
      description="Review launch risks, auth checks, secrets, and deployment safety."
      icon={<Shield className="h-4 w-4" />}
      badge={scanBadge}
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="Security scan"
          title={`${projectName} security review`}
          description="Use this workspace to catch expensive mistakes before launch: exposed secrets, weak access control, missing database policies, and deployment gaps."
          icon={<ShieldCheck className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone={scoreTone}>
              Last checked · {lastCheckedLabel}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Score",
            value: `${score}%`,
            tone: scoreTone,
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onGenerateSecurityDoc}
              >
                <FileCheck2 className="h-4 w-4" />
                Generate security.md
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenPublish}
              >
                <Upload className="h-4 w-4" />
                Publish readiness
              </Button>
            </>
          }
        />

        {highRiskCount > 0 ? (
          <WorkspaceNotice title="High-risk items need review" tone="warning">
            {highRiskCount} high-priority security item
            {highRiskCount === 1 ? "" : "s"} should be reviewed before
            production deployment.
          </WorkspaceNotice>
        ) : (
          <WorkspaceNotice title="No high-risk blockers detected" tone="success">
            No critical or high-severity generated findings are currently open.
            Manual review is still required, because production has never cared
            about anyone’s optimism.
          </WorkspaceNotice>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Open findings"
            value={openFindings.length}
            detail="Issues still requiring review."
            icon={<ShieldAlert className="h-4 w-4" />}
            tone={openFindings.length > 0 ? "orange" : "green"}
          />

          <WorkspaceMetricCard
            label="High risk"
            value={highRiskCount}
            detail="Critical and high severity items."
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={highRiskCount > 0 ? "red" : "green"}
          />

          <WorkspaceMetricCard
            label="Reviewed"
            value={reviewedCount}
            detail="Items already reviewed or resolved."
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Env risks"
            value={environmentRisks.length}
            detail="Secrets and configuration checks."
            icon={<KeyRound className="h-4 w-4" />}
            tone={environmentRisks.length > 0 ? "orange" : "green"}
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="Security findings"
            description="Generated review items grouped by severity and area."
            badge={
              <WorkspaceStatusBadge
                tone={openFindings.length > 0 ? "orange" : "green"}
              >
                {openFindings.length} open
              </WorkspaceStatusBadge>
            }
          >
            {findings.length > 0 ? (
              <div className="grid gap-2">
                {findings.map((finding) => (
                  <article
                    key={finding.id}
                    className="grid gap-3 rounded-2xl border bg-background p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold tracking-tight text-foreground">
                          {finding.title}
                        </h4>
                        <span className="mt-1 block text-xs font-medium text-muted-foreground">
                          {finding.area}
                        </span>
                      </div>

                      <WorkspaceStatusBadge
                        tone={getSeverityTone(finding.severity)}
                      >
                        {getSeverityLabel(finding.severity)}
                      </WorkspaceStatusBadge>
                    </div>

                    <p className="text-xs font-medium leading-5 text-muted-foreground">
                      {finding.description}
                    </p>

                    {finding.recommendation ? (
                      <div className="grid gap-1 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-950">
                        <strong className="text-[11px] font-bold uppercase tracking-[0.12em]">
                          Recommended action
                        </strong>
                        <span className="text-xs font-medium leading-5">
                          {finding.recommendation}
                        </span>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="No findings detected"
                description="Generated security findings will appear here after a scan or build analysis."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Environment and secrets"
            description="Configuration risks to check before launch."
            badge={
              <WorkspaceStatusBadge
                tone={environmentRisks.length > 0 ? "orange" : "green"}
              >
                {environmentRisks.length} checks
              </WorkspaceStatusBadge>
            }
          >
            <div className="grid gap-2">
              {environmentRisks.length > 0 ? (
                environmentRisks.map((risk) => (
                  <WorkspaceActionRow
                    key={risk}
                    title={risk}
                    description="Review before production deployment."
                    icon={<LockKeyhole className="h-4 w-4" />}
                    badge={
                      <WorkspaceStatusBadge tone="orange">
                        Review
                      </WorkspaceStatusBadge>
                    }
                  />
                ))
              ) : (
                <WorkspaceEmptyState
                  icon={<KeyRound className="h-6 w-6" />}
                  title="No environment risks"
                  description="No environment configuration risks were generated."
                />
              )}
            </div>
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Launch checklist"
          description="Security checks that should be complete before publishing."
          badge={<WorkspaceStatusBadge tone="blue">Required</WorkspaceStatusBadge>}
        >
          <div className="grid gap-2">
            <WorkspaceActionRow
              title="Verify authentication and route protection"
              description="Protected screens and mutation endpoints should require authenticated users."
              icon={<Shield className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge>Manual</WorkspaceStatusBadge>}
            />

            <WorkspaceActionRow
              title="Confirm database ownership checks"
              description="Users should only read and mutate records they own or are permitted to access."
              icon={<LockKeyhole className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge>Manual</WorkspaceStatusBadge>}
            />

            <WorkspaceActionRow
              title="Review production deployment variables"
              description="Confirm live keys, callback URLs, webhook secrets, and server-only values."
              icon={<KeyRound className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge>Manual</WorkspaceStatusBadge>}
            />

            <WorkspaceActionRow
              title="Run final publish readiness review"
              description="Open publish readiness and generate the deployment checklist."
              icon={<ScanLine className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="blue">Next</WorkspaceStatusBadge>}
              onClick={onOpenPublish}
            />
          </div>
        </WorkspaceCard>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}