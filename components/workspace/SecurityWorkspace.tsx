"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  ScanLine,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
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
  WorkspaceStatusPill,
  WorkspaceSubHeader,
} from "@/components/workspace/tool-system/WorkspacePanel";

type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";
type SecurityFindingStatus = "open" | "reviewed" | "resolved";
type SecurityFilter = "all" | "open" | "high-risk" | "reviewed" | "resolved";

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
    title: "Protected routes need review",
    description:
      "Admin, billing, workspace, and project mutation routes should require authenticated access.",
    severity: "medium",
    area: "Authentication",
    status: "open",
    recommendation:
      "Add route-level authorization checks and verify server-side access control.",
  },
  {
    id: "env-secrets",
    title: "Server-only secrets must be confirmed",
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
    title: "Supabase RLS policies need validation",
    description:
      "Generated tables should have Row Level Security enabled before production deployment.",
    severity: "medium",
    area: "Database",
    status: "reviewed",
    recommendation:
      "Validate select, insert, update, and delete policies using test users.",
  },
  {
    id: "webhook-signatures",
    title: "Webhook signature verification",
    description:
      "Billing and platform webhooks should be verified before processing events.",
    severity: "high",
    area: "Webhooks",
    status: "open",
    recommendation:
      "Verify webhook signatures on the server before accepting events.",
  },
];

const defaultEnvironmentRisks = [
  "Missing production webhook verification checks can allow spoofed requests.",
  "Public environment variables should be reviewed before deployment.",
  "Database write routes should validate ownership server-side.",
];

function getSeverityTone(severity: SecuritySeverity) {
  if (severity === "critical" || severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  if (severity === "low") return "info" as const;

  return "neutral" as const;
}

function getSeverityLabel(severity: SecuritySeverity) {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";

  return "Info";
}

function getStatusTone(status?: SecurityFindingStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "reviewed") return "info" as const;

  return "warning" as const;
}

function getStatusLabel(status?: SecurityFindingStatus) {
  if (status === "resolved") return "Resolved";
  if (status === "reviewed") return "Reviewed";

  return "Open";
}

function getAreaIcon(area: string) {
  const normalized = area.toLowerCase();

  if (normalized.includes("auth")) return <Shield className="h-4 w-4" />;
  if (normalized.includes("environment")) return <KeyRound className="h-4 w-4" />;
  if (normalized.includes("database")) return <Database className="h-4 w-4" />;
  if (normalized.includes("webhook")) return <ScanLine className="h-4 w-4" />;

  return <ShieldAlert className="h-4 w-4" />;
}

function getOverallScore(findings: SecurityFinding[]) {
  if (findings.length === 0) return 96;

  const penalty = findings.reduce((total, finding) => {
    if (finding.status === "resolved") return total;

    if (finding.severity === "critical") return total + 28;
    if (finding.severity === "high") return total + 18;
    if (finding.severity === "medium") return total + 10;
    if (finding.severity === "low") return total + 4;

    return total + 2;
  }, 0);

  return Math.max(12, 100 - penalty);
}

function getScoreTone(score: number, highRiskCount: number) {
  if (highRiskCount > 0) return "danger" as const;
  if (score >= 85) return "success" as const;
  if (score >= 65) return "warning" as const;

  return "danger" as const;
}

function matchesFilter(finding: SecurityFinding, filter: SecurityFilter) {
  if (filter === "all") return true;
  if (filter === "open") return finding.status !== "resolved";
  if (filter === "reviewed") return finding.status === "reviewed";
  if (filter === "resolved") return finding.status === "resolved";

  return (
    finding.severity === "critical" ||
    finding.severity === "high"
  );
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
  const [activeFilter, setActiveFilter] = useState<SecurityFilter>("all");
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(
    findings[0]?.id ?? null
  );

  const openFindings = findings.filter(
    (finding) => finding.status !== "resolved"
  );

  const highRiskFindings = findings.filter(
    (finding) =>
      finding.status !== "resolved" &&
      (finding.severity === "critical" || finding.severity === "high")
  );

  const reviewedCount = findings.filter(
    (finding) => finding.status === "reviewed" || finding.status === "resolved"
  ).length;

  const resolvedCount = findings.filter(
    (finding) => finding.status === "resolved"
  ).length;

  const score = getOverallScore(findings);
  const scoreTone = getScoreTone(score, highRiskFindings.length);

  const filteredFindings = useMemo(
    () => findings.filter((finding) => matchesFilter(finding, activeFilter)),
    [findings, activeFilter]
  );

  const filterItems: Array<{
    key: SecurityFilter;
    label: string;
    count: number;
  }> = [
    {
      key: "all",
      label: "All",
      count: findings.length,
    },
    {
      key: "open",
      label: "Open",
      count: openFindings.length,
    },
    {
      key: "high-risk",
      label: "High risk",
      count: highRiskFindings.length,
    },
    {
      key: "reviewed",
      label: "Reviewed",
      count: reviewedCount,
    },
    {
      key: "resolved",
      label: "Resolved",
      count: resolvedCount,
    },
  ];

  const scanLabel =
    scanStatus === "running"
      ? "Scanning"
      : scanStatus === "complete"
        ? "Complete"
        : "Idle";

  return (
    <WorkspacePanel
      eyebrow="Security scan"
      title="Security"
      description="Review launch risks, access control, secrets, database policies, and deployment safety."
      status={highRiskFindings.length > 0 ? "Needs review" : "Healthy"}
      statusTone={scoreTone}
      actions={
        <>
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            className="h-9 rounded-[12px]"
          >
            <RefreshCcw className="h-4 w-4" />
            Update scan
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            className="h-9 rounded-[12px]"
            onClick={onGenerateSecurityDoc}
          >
            <FileCheck2 className="h-4 w-4" />
            security.md
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
      <div className="space-y-5">
        <WorkspaceSubHeader
          left={
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Workspace protection
              </div>
              <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
                {projectName} security review
              </h3>
              <p className="mt-1 max-w-[900px] text-[14px] leading-6 text-slate-600">
                Keep the security view direct and actionable: what is risky,
                why it matters, and what the user must review before launch.
                An issue list beats a dramatic dashboard monologue every time.
              </p>
            </div>
          }
          right={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <WorkspaceStatusPill tone={scoreTone}>
                Score · {score}%
              </WorkspaceStatusPill>

              <WorkspaceStatusPill tone="neutral">
                {scanLabel} · {lastCheckedLabel}
              </WorkspaceStatusPill>
            </div>
          }
        />

        {highRiskFindings.length > 0 ? (
          <WorkspaceCallout
            title="Security issues detected"
            description={`${highRiskFindings.length} high-priority security item${
              highRiskFindings.length === 1 ? "" : "s"
            } should be reviewed before production deployment.`}
            tone="danger"
            action={
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                className="h-9 rounded-[12px] bg-white"
                onClick={onOpenPublish}
              >
                View blockers
              </Button>
            }
          />
        ) : (
          <WorkspaceCallout
            title="No high-risk blockers detected"
            description="No critical or high-severity generated findings are currently open. Manual review is still required, because production has the personality of a debt collector."
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
            label="Open"
            value={openFindings.length}
            description="Findings requiring review."
            tone={openFindings.length > 0 ? "warning" : "success"}
            icon={<ShieldAlert className="h-4 w-4" />}
          />

          <WorkspaceMetricCard
            label="High risk"
            value={highRiskFindings.length}
            description="Critical and high severity items."
            tone={highRiskFindings.length > 0 ? "danger" : "success"}
            icon={<AlertTriangle className="h-4 w-4" />}
          />

          <WorkspaceMetricCard
            label="Reviewed"
            value={reviewedCount}
            description="Reviewed or resolved findings."
            tone="info"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <WorkspaceMetricCard
            label="Env risks"
            value={environmentRisks.length}
            description="Secrets and config checks."
            tone={environmentRisks.length > 0 ? "warning" : "success"}
            icon={<KeyRound className="h-4 w-4" />}
          />
        </WorkspaceMetricGrid>

        <WorkspaceSection
          title="Detected issues"
          description="Generated review items grouped by severity, status, and affected area."
          action={
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-[12px]"
            >
              Try fix all
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {filterItems.map((item) => {
                const isActive = activeFilter === item.key;

                return (
                  <button
                    suppressHydrationWarning
                    key={item.key}
                    type="button"
                    onClick={() => setActiveFilter(item.key)}
                    className={[
                      "inline-flex h-9 items-center gap-2 rounded-[12px] border px-3 text-[13px] font-medium transition-colors",
                      isActive
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {item.label}
                    <Badge
                      variant="outline"
                      className="rounded-full bg-white px-2 text-[11px]"
                    >
                      {item.count}
                    </Badge>
                  </button>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-[20px] border border-slate-200">
              <div className="grid grid-cols-[36px_110px_minmax(0,1fr)_150px_130px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-500">
                <div />
                <div>Level</div>
                <div>Issue</div>
                <div>Area</div>
                <div>Status</div>
              </div>

              {filteredFindings.length > 0 ? (
                filteredFindings.map((finding) => {
                  const isExpanded = expandedFindingId === finding.id;

                  return (
                    <div key={finding.id} className="border-b border-slate-200 last:border-b-0">
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() =>
                          setExpandedFindingId(isExpanded ? null : finding.id)
                        }
                        className="grid w-full grid-cols-[36px_110px_minmax(0,1fr)_150px_130px] items-center px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <WorkspaceStatusPill tone={getSeverityTone(finding.severity)}>
                            {getSeverityLabel(finding.severity)}
                          </WorkspaceStatusPill>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-slate-950">
                            {finding.title}
                          </div>
                          <div className="mt-0.5 truncate text-[13px] text-slate-500">
                            {finding.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                          {getAreaIcon(finding.area)}
                          {finding.area}
                        </div>

                        <div>
                          <WorkspaceStatusPill tone={getStatusTone(finding.status)}>
                            {getStatusLabel(finding.status)}
                          </WorkspaceStatusPill>
                        </div>
                      </button>

                      {isExpanded ? (
                        <div className="grid gap-3 bg-slate-50 px-4 py-4 pl-[150px]">
                          <p className="max-w-[900px] text-[14px] leading-6 text-slate-700">
                            {finding.description}
                          </p>

                          {finding.recommendation ? (
                            <div className="rounded-[18px] border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
                              <div className="text-[12px] font-semibold uppercase tracking-[0.14em]">
                                Recommended action
                              </div>
                              <p className="mt-1 text-[14px] leading-6">
                                {finding.recommendation}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-12 text-center">
                  <div className="text-[15px] font-semibold text-slate-950">
                    No findings in this filter
                  </div>
                  <p className="mt-1 text-[14px] text-slate-600">
                    Change the filter to see other security items.
                  </p>
                </div>
              )}
            </div>
          </div>
        </WorkspaceSection>

        <div className="grid gap-5 xl:grid-cols-2">
          <WorkspaceSection
            title="Environment and secrets"
            description="Configuration risks to check before launch."
            action={
              <WorkspaceStatusPill tone={environmentRisks.length > 0 ? "warning" : "success"}>
                {environmentRisks.length} checks
              </WorkspaceStatusPill>
            }
          >
            <WorkspaceList
              rows={
                environmentRisks.length > 0
                  ? environmentRisks.map((risk) => ({
                      label: risk,
                      description: "Review before production deployment.",
                      value: "Review",
                      trailing: (
                        <WorkspaceStatusPill tone="warning">
                          Manual
                        </WorkspaceStatusPill>
                      ),
                    }))
                  : [
                      {
                        label: "No environment risks",
                        description:
                          "No environment configuration risks were generated.",
                        value: "Clear",
                        trailing: (
                          <WorkspaceStatusPill tone="success">
                            Healthy
                          </WorkspaceStatusPill>
                        ),
                      },
                    ]
              }
            />
          </WorkspaceSection>

          <WorkspaceSection
            title="Launch checklist"
            description="Security checks that should be complete before publishing."
          >
            <WorkspaceList
              rows={[
                {
                  label: "Verify route protection",
                  description:
                    "Protected screens and mutation endpoints should require authenticated users.",
                  value: "Manual",
                  trailing: <Shield className="h-4 w-4 text-slate-500" />,
                },
                {
                  label: "Confirm ownership checks",
                  description:
                    "Users should only read and mutate records they own or are permitted to access.",
                  value: "Required",
                  trailing: <LockKeyhole className="h-4 w-4 text-slate-500" />,
                },
                {
                  label: "Review production variables",
                  description:
                    "Confirm live keys, callback URLs, webhook secrets, and server-only values.",
                  value: "Manual",
                  trailing: <KeyRound className="h-4 w-4 text-slate-500" />,
                },
                {
                  label: "Run final publish readiness",
                  description:
                    "Open publish readiness and review blockers before deployment.",
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

        <WorkspaceSection
          title="Security documentation"
          description="Generate a security.md file for launch handoff, review notes, and deployment expectations."
        >
          <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-950">
                <FileCheck2 className="h-4 w-4" />
                security.md
              </div>
              <p className="mt-1 max-w-[760px] text-[14px] leading-6 text-slate-600">
                Create a security checklist covering auth, secrets, database
                policies, webhooks, production variables, and manual launch
                checks.
              </p>
            </div>

            <Button
              suppressHydrationWarning
              type="button"
              className="h-9 rounded-[12px]"
              onClick={onGenerateSecurityDoc}
            >
              Generate security.md
            </Button>
          </div>
        </WorkspaceSection>
      </div>
    </WorkspacePanel>
  );
}