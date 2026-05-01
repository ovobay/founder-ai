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
      "Confirm generated app files are present and important changed files have been inspected.",
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
  if (area === "security") return <ShieldCheck className="h-4 w-4" />;
  if (area === "cloud") return <Cloud className="h-4 w-4" />;
  if (area === "database") return <Database className="h-4 w-4" />;
  if (area === "environment") return <KeyRound className="h-4 w-4" />;
  if (area === "files") return <Code2 className="h-4 w-4" />;

  return <ClipboardCheck className="h-4 w-4" />;
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
    <WorkspaceShell
      title="Publish"
      eyebrow="Launch readiness"
      description="Review files, security, cloud setup, environment variables, and final launch blockers."
      icon={<Rocket className="h-4 w-4" />}
      badge={
        <WorkspaceStatusBadge tone={publishTone}>
          {blockedCount > 0 ? "Blocked" : score >= 85 ? "Ready" : "Needs review"}
        </WorkspaceStatusBadge>
      }
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="Publish readiness"
          title={`${projectName} launch review`}
          description="A final checkpoint before this thing leaves the workshop and wanders into production, where users and payment systems start having opinions."
          icon={<UploadCloud className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone={publishTone}>
              Last checked · {lastCheckedLabel}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Ready",
            value: `${score}%`,
            tone: publishTone,
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onContinuePublish}
                disabled={!canContinue}
              >
                <Rocket className="h-4 w-4" />
                Continue to publish
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onCreateChecklist}
              >
                <FileCheck2 className="h-4 w-4" />
                Create checklist
              </Button>
            </>
          }
        />

        {blockedCount > 0 ? (
          <WorkspaceNotice title="Publishing is blocked" tone="danger">
            {blockedCount} blocker{blockedCount === 1 ? "" : "s"} must be fixed
            before continuing to production.
          </WorkspaceNotice>
        ) : warningCount > 0 ? (
          <WorkspaceNotice title="Manual review recommended" tone="warning">
            {warningCount} item{warningCount === 1 ? "" : "s"} still need manual
            review before launch. Boring, yes. Still cheaper than production
            embarrassment.
          </WorkspaceNotice>
        ) : (
          <WorkspaceNotice title="Ready for final publish review" tone="success">
            No generated blockers were detected. Still perform a manual smoke
            test before production, because confidence is not a QA strategy.
          </WorkspaceNotice>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Files"
            value={fileCount}
            detail="Generated files available."
            icon={<Code2 className="h-4 w-4" />}
            tone={fileCount > 0 ? "blue" : "orange"}
          />

          <WorkspaceMetricCard
            label="Changed"
            value={changedFileCount}
            detail="Created or updated files."
            icon={<ClipboardCheck className="h-4 w-4" />}
            tone={changedFileCount > 0 ? "green" : "orange"}
          />

          <WorkspaceMetricCard
            label="Env vars"
            value={environmentVariableCount}
            detail="Required configuration values."
            icon={<KeyRound className="h-4 w-4" />}
            tone={environmentVariableCount > 0 ? "orange" : "green"}
          />

          <WorkspaceMetricCard
            label="Integrations"
            value={integrationCount}
            detail="Detected service dependencies."
            icon={<Cloud className="h-4 w-4" />}
            tone={integrationCount > 0 ? "blue" : "default"}
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="Generated URL"
            description="Preview or staging URL for this workspace."
            badge={<WorkspaceStatusBadge tone="blue">Preview</WorkspaceStatusBadge>}
          >
            <div className="grid min-h-36 grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border bg-background p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                <Globe2 className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <h4 className="break-words text-base font-bold tracking-tight text-foreground">
                  {generatedUrl.replace(/^https?:\/\//, "")}
                </h4>
                <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
                  Use this URL for final review, stakeholder preview, and launch
                  smoke testing.
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
            title="Readiness requirements"
            description="Launch conditions grouped by status and area."
            badge={
              <WorkspaceStatusBadge tone={publishTone}>
                {passedCount}/{requirements.length} passed
              </WorkspaceStatusBadge>
            }
          >
            {requirements.length > 0 ? (
              <div className="grid gap-2">
                {requirements.map((requirement) => (
                  <article
                    key={requirement.id}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border bg-background p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
                      {getAreaIcon(requirement.area)}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold tracking-tight text-foreground">
                            {requirement.title}
                          </h4>
                          <span className="mt-1 block text-xs font-medium capitalize text-muted-foreground">
                            {requirement.area}
                          </span>
                        </div>

                        <WorkspaceStatusBadge
                          tone={getRequirementTone(requirement.status)}
                        >
                          {getRequirementLabel(requirement.status)}
                        </WorkspaceStatusBadge>
                      </div>

                      <p className="mt-3 text-xs font-medium leading-5 text-muted-foreground">
                        {requirement.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="No requirements generated"
                description="Publish requirements will appear here after the workspace is analysed."
              />
            )}
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Launch actions"
          description="Useful next steps before continuing."
          badge={<WorkspaceStatusBadge>Actions</WorkspaceStatusBadge>}
        >
          <div className="grid gap-2">
            <WorkspaceActionRow
              title="Review cloud setup"
              description="Check deployment target, integrations, and environment variables."
              icon={<Cloud className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="blue">Cloud</WorkspaceStatusBadge>}
              onClick={onOpenCloud}
            />

            <WorkspaceActionRow
              title="Review security"
              description="Check authentication, protected routes, server secrets, and database policies."
              icon={<ShieldCheck className="h-4 w-4" />}
              badge={
                <WorkspaceStatusBadge tone="orange">
                  Security
                </WorkspaceStatusBadge>
              }
              onClick={onOpenSecurity}
            />

            <WorkspaceActionRow
              title="Generate publish checklist"
              description="Create a markdown launch checklist for review and handoff."
              icon={<FileCheck2 className="h-4 w-4" />}
              badge={
                <WorkspaceStatusBadge tone="green">
                  Generate
                </WorkspaceStatusBadge>
              }
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
                  <Rocket className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )
              }
              badge={
                <WorkspaceStatusBadge tone={canContinue ? "green" : "red"}>
                  {canContinue ? "Ready" : "Blocked"}
                </WorkspaceStatusBadge>
              }
              onClick={canContinue ? onContinuePublish : undefined}
            />
          </div>
        </WorkspaceCard>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}