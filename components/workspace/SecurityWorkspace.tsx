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

import styles from "./SecurityWorkspace.module.css";

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
      <WorkspaceStatusPill tone="blue">Scanning</WorkspaceStatusPill>
    ) : scanStatus === "complete" ? (
      <WorkspaceStatusPill tone={scoreTone}>
        {score >= 85 ? "Healthy" : "Needs review"}
      </WorkspaceStatusPill>
    ) : (
      <WorkspaceStatusPill>Idle</WorkspaceStatusPill>
    );

  return (
    <WorkspacePanel
      title="Security"
      eyebrow="Workspace protection"
      description="Review launch risks, auth checks, secrets, and deployment safety."
      icon={<Shield size={17} strokeWidth={2.3} />}
      badge={scanBadge}
      onClose={onClose}
    >
      <div className={styles.securityWorkspace}>
        <WorkspaceHero
          eyebrow="Security scan"
          title={`${projectName} security review`}
          description="Use this workspace to catch the boring-but-expensive mistakes before launch: exposed secrets, weak access control, missing database policies, and deployment gaps."
          icon={<ShieldCheck size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone={scoreTone}>
              Last checked · {lastCheckedLabel}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Score",
            value: `${score}%`,
            tone: scoreTone,
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onGenerateSecurityDoc}
              >
                <FileCheck2 size={14} strokeWidth={2.3} />
                Generate security.md
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onOpenPublish}
              >
                <Upload size={14} strokeWidth={2.3} />
                Publish readiness
              </button>
            </>
          }
        />

        {highRiskCount > 0 ? (
          <WorkspaceAlert title="High-risk items need review" tone="warning">
            {highRiskCount} high-priority security item
            {highRiskCount === 1 ? "" : "s"} should be reviewed before
            production deployment.
          </WorkspaceAlert>
        ) : (
          <WorkspaceAlert title="No high-risk blockers detected" tone="success">
            No critical or high-severity generated findings are currently open.
            Manual review is still required, because production does not care
            about our optimism.
          </WorkspaceAlert>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Open findings"
            value={openFindings.length}
            detail="Issues still requiring review."
            icon={<ShieldAlert size={15} strokeWidth={2.25} />}
            tone={openFindings.length > 0 ? "orange" : "green"}
          />

          <WorkspaceMetricCard
            label="High risk"
            value={highRiskCount}
            detail="Critical and high severity items."
            icon={<AlertTriangle size={15} strokeWidth={2.25} />}
            tone={highRiskCount > 0 ? "red" : "green"}
          />

          <WorkspaceMetricCard
            label="Reviewed"
            value={reviewedCount}
            detail="Items already reviewed or resolved."
            icon={<CheckCircle2 size={15} strokeWidth={2.25} />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Env risks"
            value={environmentRisks.length}
            detail="Secrets and configuration checks."
            icon={<KeyRound size={15} strokeWidth={2.25} />}
            tone={environmentRisks.length > 0 ? "orange" : "green"}
          />
        </WorkspaceMetricGrid>

        <div className={styles.securityGrid}>
          <WorkspaceCard
            title="Security findings"
            description="Generated review items grouped by severity and area."
            badge={
              <WorkspaceStatusPill tone={openFindings.length > 0 ? "orange" : "green"}>
                {openFindings.length} open
              </WorkspaceStatusPill>
            }
          >
            {findings.length > 0 ? (
              <div className={styles.findingsList}>
                {findings.map((finding) => (
                  <article key={finding.id} className={styles.findingCard}>
                    <div className={styles.findingTop}>
                      <div>
                        <h4>{finding.title}</h4>
                        <span>{finding.area}</span>
                      </div>

                      <WorkspaceStatusPill tone={getSeverityTone(finding.severity)}>
                        {getSeverityLabel(finding.severity)}
                      </WorkspaceStatusPill>
                    </div>

                    <p>{finding.description}</p>

                    {finding.recommendation ? (
                      <div className={styles.recommendationBox}>
                        <strong>Recommended action</strong>
                        <span>{finding.recommendation}</span>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<ShieldCheck size={22} strokeWidth={2.2} />}
                title="No findings detected"
                description="Generated security findings will appear here after a scan or build analysis."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Environment and secrets"
            description="Configuration risks to check before launch."
            badge={
              <WorkspaceStatusPill tone={environmentRisks.length > 0 ? "orange" : "green"}>
                {environmentRisks.length} checks
              </WorkspaceStatusPill>
            }
          >
            <div className={styles.actionList}>
              {environmentRisks.length > 0 ? (
                environmentRisks.map((risk) => (
                  <WorkspaceActionRow
                    key={risk}
                    title={risk}
                    description="Review before production deployment."
                    icon={<LockKeyhole size={15} strokeWidth={2.25} />}
                    badge={<WorkspaceStatusPill tone="orange">Review</WorkspaceStatusPill>}
                  />
                ))
              ) : (
                <WorkspaceEmptyState
                  icon={<KeyRound size={22} strokeWidth={2.2} />}
                  title="No environment risks"
                  description="No environment configuration risks were generated."
                />
              )}
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Launch checklist"
            description="Security checks that should be complete before publishing."
            badge={<WorkspaceStatusPill tone="blue">Required</WorkspaceStatusPill>}
          >
            <div className={styles.actionList}>
              <WorkspaceActionRow
                title="Verify authentication and route protection"
                description="Protected screens and mutation endpoints should require authenticated users."
                icon={<Shield size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill>Manual</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Confirm database ownership checks"
                description="Users should only read and mutate records they own or are permitted to access."
                icon={<LockKeyhole size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill>Manual</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Review production deployment variables"
                description="Confirm live keys, callback URLs, webhook secrets, and server-only values."
                icon={<KeyRound size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill>Manual</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Run final publish readiness review"
                description="Open publish readiness and generate the deployment checklist."
                icon={<ScanLine size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Next</WorkspaceStatusPill>}
                onClick={onOpenPublish}
              />
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}