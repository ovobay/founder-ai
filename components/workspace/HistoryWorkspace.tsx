"use client";

import {
  Archive,
  CheckCircle2,
  Clock3,
  GitBranch,
  History,
  RefreshCcw,
  RotateCcw,
  Search,
  Sparkles,
  TimerReset,
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

export type WorkspaceHistoryStatus =
  | "completed"
  | "restored"
  | "failed"
  | "draft";

export type WorkspaceHistoryItem = {
  id: string;
  title: string;
  prompt: string;
  projectType: string;
  createdAtLabel: string;
  status: WorkspaceHistoryStatus;
  changedFiles?: number;
  modules?: number;
};

export type HistoryWorkspaceProps = {
  projectName?: string;
  lastUpdatedLabel?: string;
  historyItems?: WorkspaceHistoryItem[];
  onClose?: () => void;
  onRestoreBuild?: (item: WorkspaceHistoryItem) => void;
  onOpenPreview?: () => void;
};

const defaultHistoryItems: WorkspaceHistoryItem[] = [
  {
    id: "workspace-polish",
    title: "Workspace tool polish",
    prompt:
      "Create a cleaner tool workspace system with security, analytics, cloud, and publish panels.",
    projectType: "Founder AI workspace",
    createdAtLabel: "Just now",
    status: "completed",
    changedFiles: 8,
    modules: 4,
  },
  {
    id: "publish-panel",
    title: "Publish panel update",
    prompt:
      "Improve the publish flow with a floating panel and launch readiness actions.",
    projectType: "Publishing",
    createdAtLabel: "Earlier today",
    status: "restored",
    changedFiles: 3,
    modules: 2,
  },
  {
    id: "security-foundation",
    title: "Security workspace foundation",
    prompt:
      "Add a security review workspace with findings, environment risks, and launch checklist.",
    projectType: "Security",
    createdAtLabel: "Yesterday",
    status: "completed",
    changedFiles: 2,
    modules: 1,
  },
];

function getStatusTone(status: WorkspaceHistoryStatus) {
  if (status === "completed") return "green" as const;
  if (status === "restored") return "blue" as const;
  if (status === "failed") return "red" as const;

  return "orange" as const;
}

function getStatusLabel(status: WorkspaceHistoryStatus) {
  if (status === "completed") return "Completed";
  if (status === "restored") return "Restored";
  if (status === "failed") return "Failed";

  return "Draft";
}

function getStatusIcon(status: WorkspaceHistoryStatus) {
  if (status === "completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "restored") {
    return <RotateCcw className="h-4 w-4" />;
  }

  if (status === "failed") {
    return <TimerReset className="h-4 w-4" />;
  }

  return <Clock3 className="h-4 w-4" />;
}

export function HistoryWorkspace({
  projectName = "Founder AI workspace",
  lastUpdatedLabel = "Just now",
  historyItems = defaultHistoryItems,
  onClose,
  onRestoreBuild,
  onOpenPreview,
}: HistoryWorkspaceProps) {
  const completedCount = historyItems.filter(
    (item) => item.status === "completed"
  ).length;

  const restoredCount = historyItems.filter(
    (item) => item.status === "restored"
  ).length;

  const failedCount = historyItems.filter(
    (item) => item.status === "failed"
  ).length;

  const totalChangedFiles = historyItems.reduce(
    (total, item) => total + (item.changedFiles ?? 0),
    0
  );

  const latestItem = historyItems[0];

  return (
    <WorkspaceShell
      title="History"
      eyebrow="Build timeline"
      description="Review previous builds, restore versions, and inspect generated workspace changes."
      icon={<History className="h-4 w-4" />}
      badge={
        <WorkspaceStatusBadge tone="blue">
          Updated · {lastUpdatedLabel}
        </WorkspaceStatusBadge>
      }
      actions={
        <Button
          suppressHydrationWarning
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenPreview}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      }
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="Version timeline"
          title={`${projectName} build history`}
          description="Track what changed, when it changed, and which version you want to resurrect without pretending memory is a deployment strategy."
          icon={<GitBranch className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone={failedCount > 0 ? "orange" : "green"}>
              {failedCount > 0 ? `${failedCount} needs review` : "Healthy"}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Builds",
            value: historyItems.length,
            tone: historyItems.length > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onOpenPreview}
              >
                <Search className="h-4 w-4" />
                Inspect latest
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={() => latestItem && onRestoreBuild?.(latestItem)}
                disabled={!latestItem}
              >
                <RotateCcw className="h-4 w-4" />
                Restore latest
              </Button>
            </>
          }
        />

        {historyItems.length > 0 ? (
          <WorkspaceNotice title="History is available" tone="info">
            You can restore previous generated states from here. Review changed
            files before restoring, because “undo” is not a substitute for
            knowing what changed.
          </WorkspaceNotice>
        ) : (
          <WorkspaceNotice title="No history yet" tone="warning">
            Generate or save a build before expecting history to perform
            miracles. It is version control, not archaeology with a halo.
          </WorkspaceNotice>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Builds"
            value={historyItems.length}
            detail="Saved generated states."
            icon={<Archive className="h-4 w-4" />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Completed"
            value={completedCount}
            detail="Successfully finished builds."
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone={completedCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Restored"
            value={restoredCount}
            detail="Versions brought back."
            icon={<RotateCcw className="h-4 w-4" />}
            tone={restoredCount > 0 ? "blue" : "default"}
          />

          <WorkspaceMetricCard
            label="Files changed"
            value={totalChangedFiles}
            detail="Across tracked builds."
            icon={<Sparkles className="h-4 w-4" />}
            tone="purple"
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="Build timeline"
            description="Saved builds, generated prompts, and restore points."
            badge={
              <WorkspaceStatusBadge tone="blue">
                {historyItems.length} items
              </WorkspaceStatusBadge>
            }
          >
            {historyItems.length > 0 ? (
              <div className="grid gap-2">
                {historyItems.map((item) => (
                  <article
                    key={item.id}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border bg-background p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
                      {getStatusIcon(item.status)}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold tracking-tight text-foreground">
                            {item.title}
                          </h4>
                          <span className="mt-1 block text-xs font-medium text-muted-foreground">
                            {item.projectType} · {item.createdAtLabel}
                          </span>
                        </div>

                        <WorkspaceStatusBadge tone={getStatusTone(item.status)}>
                          {getStatusLabel(item.status)}
                        </WorkspaceStatusBadge>
                      </div>

                      <p className="mt-3 text-xs font-medium leading-5 text-muted-foreground">
                        {item.prompt}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                          {item.changedFiles ?? 0} files changed
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                          {item.modules ?? 0} modules
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          suppressHydrationWarning
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onRestoreBuild?.(item)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>

                        <Button
                          suppressHydrationWarning
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={onOpenPreview}
                        >
                          <Search className="h-4 w-4" />
                          Inspect
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<History className="h-6 w-6" />}
                title="No saved builds"
                description="Build history will appear here after you generate and save workspace changes."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Recommended actions"
            description="Keep version history clean and recoverable."
            badge={<WorkspaceStatusBadge>Workflow</WorkspaceStatusBadge>}
          >
            <div className="grid gap-2">
              <WorkspaceActionRow
                title="Review latest generated files"
                description="Inspect changed files before restoring or publishing."
                icon={<Search className="h-4 w-4" />}
                badge={<WorkspaceStatusBadge tone="blue">Review</WorkspaceStatusBadge>}
                onClick={onOpenPreview}
              />

              <WorkspaceActionRow
                title="Restore only known-good builds"
                description="Avoid restoring partial or failed generations unless you enjoy debugging archaeology."
                icon={<RotateCcw className="h-4 w-4" />}
                badge={<WorkspaceStatusBadge tone="orange">Careful</WorkspaceStatusBadge>}
              />

              <WorkspaceActionRow
                title="Commit stable checkpoints"
                description="Push stable workspace states to GitHub before risky UI refactors."
                icon={<GitBranch className="h-4 w-4" />}
                badge={
                  <WorkspaceStatusBadge tone="green">
                    Recommended
                  </WorkspaceStatusBadge>
                }
              />
            </div>
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}