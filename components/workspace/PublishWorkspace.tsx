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
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceStatusPill,
} from "@/components/workspace/tool-system/WorkspacePanel";

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
  if (status === "passed") return "success" as const;
  if (status === "blocked") return "danger" as const;

  return "warning" as const;
}

function getRequirementLabel(status: PublishRequirementStatus) {
  if (status === "passed") return "Passed";
  if (status === "blocked") return "Blocked";

  return "Review";
}

function getRequirementIcon(status: PublishRequirementStatus) {
  if (status === "passed") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "blocked") return <XCircle className="h-4 w-4" />;

  return <AlertTriangle className="h-4 w-4" />;
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
  if (blockedCount > 0) return "danger" as const;
  if (score >= 85) return "success" as const;
  if (score >= 60) return "warning" as const;

  return "danger" as const;
}

function getPublishLabel(score: number, blockedCount: number) {
  if (blockedCount > 0) return "Blocked";
  if (score >= 85) return "Ready";

  return "Needs review";
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
      eyebrow="Launch readiness"
      title="Publish"
      description="Review files, security, cloud setup, environment variables, and final launch blockers before deployment."
      status={getPublishLabel(score, blockedCount)}
      statusTone={publishTone}
      actions={
        <>
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            onClick={onCreateChecklist}
          >
            <FileCheck2 className="h-4 w-4" />
            Checklist
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            onClick={onContinuePublish}
            disabled={!canContinue}
          >
            <Rocket className="h-4 w-4" />
            Continue
          </Button>

          {onClose ? (
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          ) : null}
        </>
      }
    >
      {blockedCount > 0 ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Publishing is blocked</AlertTitle>
          <AlertDescription>
            {blockedCount} blocker{blockedCount === 1 ? "" : "s"} must be
            resolved before continuing to production.
          </AlertDescription>
        </Alert>
      ) : warningCount > 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Manual review recommended</AlertTitle>
          <AlertDescription>
            {warningCount} item{warningCount === 1 ? "" : "s"} still need
            review before launch. Boring, yes. Still cheaper than production
            embarrassment.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Ready for final publish review</AlertTitle>
          <AlertDescription>
            No generated blockers were detected. Still perform a manual smoke
            test before production, because confidence is not a QA strategy.
          </AlertDescription>
        </Alert>
      )}

      <WorkspaceMetricGrid>
        <WorkspaceMetricCard
          label="Readiness"
          value={`${score}%`}
          description="Calculated from launch requirements."
          icon={<Rocket className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Files"
          value={fileCount}
          description="Generated files available."
          icon={<Code2 className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Changed"
          value={changedFileCount}
          description="Created or updated files."
          icon={<ClipboardCheck className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Warnings"
          value={warningCount}
          description="Manual review items."
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </WorkspaceMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>Readiness requirements</CardTitle>
                <CardDescription>
                  Launch conditions grouped by status and affected area.
                </CardDescription>
              </div>

              <CardAction>
                <Badge variant="outline" className="rounded-full">
                  {passedCount}/{requirements.length} passed
                </Badge>
              </CardAction>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead className="w-[150px]">Area</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {requirements.length > 0 ? (
                    requirements.map((requirement) => (
                      <TableRow key={requirement.id}>
                        <TableCell>
                          <WorkspaceStatusPill
                            tone={getRequirementTone(requirement.status)}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {getRequirementIcon(requirement.status)}
                              {getRequirementLabel(requirement.status)}
                            </span>
                          </WorkspaceStatusPill>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">{requirement.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {requirement.description}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            {getAreaIcon(requirement.area)}
                            <span className="capitalize">{requirement.area}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                          <div className="font-medium">
                            No requirements generated
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Publish requirements will appear after analysis.
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated URL</CardTitle>
              <CardDescription>
                Preview or staging URL for final review.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted">
                  <Globe2 className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <h4 className="break-words font-medium">
                    {generatedUrl.replace(/^https?:\/\//, "")}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use this for QA, stakeholder preview, and smoke testing.
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4" />
                Open preview
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Launch summary</CardTitle>
              <CardDescription>
                Final deployment signals and setup state.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Last checked</span>
                <span className="font-medium">{lastCheckedLabel}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Environment vars</span>
                <Badge variant="outline">{environmentVariableCount}</Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Integrations</span>
                <Badge variant="outline">{integrationCount}</Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Blockers</span>
                <WorkspaceStatusPill
                  tone={blockedCount > 0 ? "danger" : "success"}
                >
                  {blockedCount}
                </WorkspaceStatusPill>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Launch actions</CardTitle>
              <CardDescription>
                Review setup before continuing.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-2">
              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="justify-start"
                onClick={onOpenCloud}
              >
                <Cloud className="h-4 w-4" />
                Review cloud setup
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="justify-start"
                onClick={onOpenSecurity}
              >
                <ShieldCheck className="h-4 w-4" />
                Review security
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="justify-start"
                onClick={onCreateChecklist}
              >
                <FileCheck2 className="h-4 w-4" />
                Generate checklist
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                className="justify-start"
                onClick={onContinuePublish}
                disabled={!canContinue}
              >
                <UploadCloud className="h-4 w-4" />
                {canContinue ? "Continue to publish" : "Resolve blockers first"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspacePanel>
  );
}