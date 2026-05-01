"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  FileCheck2,
  Globe2,
  KeyRound,
  Rocket,
  ShieldCheck,
  UploadCloud,
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

import styles from "./PublishWorkspace.module.css";

export type PublishRequirementStatus = "passed" | "warning" | "blocked";

export type PublishRequirement = {
  id: string;
  title: string;
  description: string;
  status: PublishRequirementStatus;
  area: "files" | "security" | "cloud" | "database" | "environment" | "review";
};

export type PublishWorkspaceProps = {
  projectName?: string;
  generatedUrl?: string;
  lastCheckedLabel?: string;
  fileCount?: number;
  changedFileCount?: number;
  environmentVariableCount?: number;
  integrationCount?: number;
  requirements?: PublishRequirement[];
  onClose?: () => void;
  onOpenCloud?: () => void;
  onOpenSecurity?: () => void;
  onCreateChecklist?: () => void;
  onContinuePublish?: () => void;
};

const defaultRequirements: PublishRequirement[] = [
  {
    id: "generated-files",
    title: "Generated files reviewed",
    description:
      "Confirm the generated app files are present and the important changed files have been inspected.",
    status: "passed",
    area: "files",
  },
  {
    id: "security-review",
    title: "Security review required",
    description:
      "Review protected routes, server-only secrets, database policies, and auth behaviour before launch.",
    status: "warning",
    area: "security",
  },
  {
    id: "env-vars",
    title: "Production environment variables",
    description:
      "Confirm required production values are configured in the deployment provider.",
    status: "warning",
    area: "environment",
  },
  {
    id: "database-policies",
    title: "Database migration and RLS",
    description:
      "Review generated SQL, run migrations manually, and verify Row Level Security policies.",
    status: "warning",
    area: "database",
  },
];

function getRequirementTone(status: PublishRequirementStatus) {
  if (status === "passed") return "green" as const;
  if (status === "blocked") return "red" as const;
  return "orange" as const;
}

function getRequirementLabel(status: PublishRequirementStatus) {
  if (status === "passed") return "Passed";
  if (status === "blocked") return "Blocked";
  return "Review";
}

function getAreaIcon(area: PublishRequirement["area"]) {
  if (area === "security") return <ShieldCheck size={15} strokeWidth={2.25} />;
  if (area === "cloud") return <Cloud size={15} strokeWidth={2.25} />;
  if (area === "database") return <Database size={15} strokeWidth={2.25} />;
  if (area === "environment") return <KeyRound size={15} strokeWidth={2.25} />;
  if (area === "files") return <Code2 size={15} strokeWidth={2.25} />;
  return <ClipboardCheck size={15} strokeWidth={2.25} />;
}

function getPublishScore(requirements: PublishRequirement[]) {
  if (requirements.length === 0) return 72;

  const points = requirements.reduce((total, requirement) => {
    if (requirement.status === "passed") return total + 1;
    if (requirement.status === "warning") return total + 0.45;
    return total;
  }, 0);

  return Math.round((points / requirements.length) * 100);
}

function getPublishTone(score: number, blockedCount: number) {
  if (blockedCount > 0) return "red" as const;
  if (score >= 85) return "green" as const;
  if (score >= 60) return "orange" as const;
  return "red" as const;
}

export function PublishWorkspace({
  projectName = "Founder AI workspace",
  generatedUrl = "https://founder-ai-build.founder-ai.app",
  lastCheckedLabel = "Just now",
  fileCount = 0,
  changedFileCount = 0,
  environmentVariableCount = 0,
  integrationCount = 0,
  requirements = defaultRequirements,
  onClose,
  onOpenCloud,
  onOpenSecurity,
  onCreateChecklist,
  onContinuePublish,
}: PublishWorkspaceProps) {
  const blockedCount = requirements.filter(
    (requirement) => requirement.status === "blocked"
  ).length;

  const warningCount = requirements.filter(
    (requirement) => requirement.status === "warning"
  ).length;

  const passedCount = requirements.filter(
    (requirement) => requirement.status === "passed"
  ).length;

  const score = getPublishScore(requirements);
  const publishTone = getPublishTone(score, blockedCount);

  const canContinue = blockedCount === 0;

  return (
    <WorkspacePanel
      title="Publish"
      eyebrow="Launch readiness"
      description="Review files, security, cloud setup, environment variables, and final launch blockers."
      icon={<Rocket size={17} strokeWidth={2.3} />}
      badge={
        <WorkspaceStatusPill tone={publishTone}>
          {blockedCount > 0 ? "Blocked" : score >= 85 ? "Ready" : "Needs review"}
        </WorkspaceStatusPill>
      }
      onClose={onClose}
    >
      <div className={styles.publishWorkspace}>
        <WorkspaceHero
          eyebrow="Publish readiness"
          title={`${projectName} launch review`}
          description="A final checkpoint before this thing leaves the workshop and wanders into production, where users and payment systems start having opinions."
          icon={<UploadCloud size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone={publishTone}>
              Last checked · {lastCheckedLabel}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Ready",
            value: `${score}%`,
            tone: publishTone,
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onContinuePublish}
                disabled={!canContinue}
              >
                <Rocket size={14} strokeWidth={2.3} />
                Continue to publish
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onCreateChecklist}
              >
                <FileCheck2 size={14} strokeWidth={2.3} />
                Create checklist
              </button>
            </>
          }
        />

        {blockedCount > 0 ? (
          <WorkspaceAlert title="Publishing is blocked" tone="danger">
            {blockedCount} blocker{blockedCount === 1 ? "" : "s"} must be fixed
            before continuing to production.
          </WorkspaceAlert>
        ) : warningCount > 0 ? (
          <WorkspaceAlert title="Manual review recommended" tone="warning">
            {warningCount} item{warningCount === 1 ? "" : "s"} still need manual
            review before launch. Not glamorous, but neither is explaining
            production failure to future you.
          </WorkspaceAlert>
        ) : (
          <WorkspaceAlert title="Ready for final publish review" tone="success">
            No generated blockers were detected. Still perform a manual smoke
            test before production, because confidence is not a QA strategy.
          </WorkspaceAlert>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Files"
            value={fileCount}
            detail="Generated files available."
            icon={<Code2 size={15} strokeWidth={2.25} />}
            tone={fileCount > 0 ? "blue" : "orange"}
          />

          <WorkspaceMetricCard
            label="Changed"
            value={changedFileCount}
            detail="Created or updated files."
            icon={<ClipboardCheck size={15} strokeWidth={2.25} />}
            tone={changedFileCount > 0 ? "green" : "orange"}
          />

          <WorkspaceMetricCard
            label="Env vars"
            value={environmentVariableCount}
            detail="Required configuration values."
            icon={<KeyRound size={15} strokeWidth={2.25} />}
            tone={environmentVariableCount > 0 ? "orange" : "green"}
          />

          <WorkspaceMetricCard
            label="Integrations"
            value={integrationCount}
            detail="Detected service dependencies."
            icon={<Cloud size={15} strokeWidth={2.25} />}
            tone={integrationCount > 0 ? "blue" : "default"}
          />
        </WorkspaceMetricGrid>

        <div className={styles.publishGrid}>
          <WorkspaceCard
            title="Generated URL"
            description="Preview or staging URL for this workspace."
            badge={<WorkspaceStatusPill tone="blue">Preview</WorkspaceStatusPill>}
          >
            <div className={styles.urlCard}>
              <span className={styles.urlIcon}>
                <Globe2 size={20} strokeWidth={2.2} />
              </span>

              <div className={styles.urlText}>
                <h4>{generatedUrl.replace(/^https?:\/\//, "")}</h4>
                <p>
                  Use this URL for final review, stakeholder preview, and launch
                  smoke testing.
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
            title="Readiness requirements"
            description="Launch conditions grouped by status and area."
            badge={
              <WorkspaceStatusPill tone={publishTone}>
                {passedCount}/{requirements.length} passed
              </WorkspaceStatusPill>
            }
          >
            {requirements.length > 0 ? (
              <div className={styles.requirementList}>
                {requirements.map((requirement) => (
                  <article key={requirement.id} className={styles.requirementCard}>
                    <div className={styles.requirementIcon}>
                      {getAreaIcon(requirement.area)}
                    </div>

                    <div className={styles.requirementBody}>
                      <div className={styles.requirementTop}>
                        <div>
                          <h4>{requirement.title}</h4>
                          <span>{requirement.area}</span>
                        </div>

                        <WorkspaceStatusPill
                          tone={getRequirementTone(requirement.status)}
                        >
                          {getRequirementLabel(requirement.status)}
                        </WorkspaceStatusPill>
                      </div>

                      <p>{requirement.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<CheckCircle2 size={22} strokeWidth={2.2} />}
                title="No requirements generated"
                description="Publish requirements will appear here after the workspace is analysed."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Launch actions"
            description="Useful next steps before continuing."
            badge={<WorkspaceStatusPill>Actions</WorkspaceStatusPill>}
          >
            <div className={styles.actionList}>
              <WorkspaceActionRow
                title="Review cloud setup"
                description="Check deployment target, integrations, and environment variables."
                icon={<Cloud size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Cloud</WorkspaceStatusPill>}
                onClick={onOpenCloud}
              />

              <WorkspaceActionRow
                title="Review security"
                description="Check authentication, protected routes, server secrets, and database policies."
                icon={<ShieldCheck size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="orange">Security</WorkspaceStatusPill>}
                onClick={onOpenSecurity}
              />

              <WorkspaceActionRow
                title="Generate publish checklist"
                description="Create a markdown launch checklist for review and handoff."
                icon={<FileCheck2 size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="green">Generate</WorkspaceStatusPill>}
                onClick={onCreateChecklist}
              />

              <WorkspaceActionRow
                title="Continue to publish"
                description={
                  canContinue
                    ? "Proceed to final publish flow."
                    : "Resolve blockers before continuing."
                }
                icon={
                  canContinue ? (
                    <Rocket size={15} strokeWidth={2.25} />
                  ) : (
                    <AlertTriangle size={15} strokeWidth={2.25} />
                  )
                }
                badge={
                  <WorkspaceStatusPill tone={canContinue ? "green" : "red"}>
                    {canContinue ? "Ready" : "Blocked"}
                  </WorkspaceStatusPill>
                }
                onClick={canContinue ? onContinuePublish : undefined}
              />
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}