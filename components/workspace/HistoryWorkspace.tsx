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

import styles from "./HistoryWorkspace.module.css";

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
  if (status === "completed") return <CheckCircle2 size={15} strokeWidth={2.25} />;
  if (status === "restored") return <RotateCcw size={15} strokeWidth={2.25} />;
  if (status === "failed") return <TimerReset size={15} strokeWidth={2.25} />;
  return <Clock3 size={15} strokeWidth={2.25} />;
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

  const failedCount = historyItems.filter((item) => item.status === "failed").length;

  const totalChangedFiles = historyItems.reduce(
    (total, item) => total + (item.changedFiles ?? 0),
    0
  );

  const latestItem = historyItems[0];

  return (
    <WorkspacePanel
      title="History"
      eyebrow="Build timeline"
      description="Review previous builds, restore versions, and inspect generated workspace changes."
      icon={<History size={17} strokeWidth={2.3} />}
      badge={<WorkspaceStatusPill tone="blue">Updated · {lastUpdatedLabel}</WorkspaceStatusPill>}
      actions={
        <button
          suppressHydrationWarning
          type="button"
          className={styles.topbarButton}
          onClick={onOpenPreview}
        >
          <RefreshCcw size={14} strokeWidth={2.3} />
          Refresh
        </button>
      }
      onClose={onClose}
    >
      <div className={styles.historyWorkspace}>
        <WorkspaceHero
          eyebrow="Version timeline"
          title={`${projectName} build history`}
          description="Track what changed, when it changed, and which version you want to resurrect without pretending memory is a deployment strategy."
          icon={<GitBranch size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone={failedCount > 0 ? "orange" : "green"}>
              {failedCount > 0 ? `${failedCount} needs review` : "Healthy"}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Builds",
            value: historyItems.length,
            tone: historyItems.length > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onOpenPreview}
              >
                <Search size={14} strokeWidth={2.3} />
                Inspect latest
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={() => latestItem && onRestoreBuild?.(latestItem)}
                disabled={!latestItem}
              >
                <RotateCcw size={14} strokeWidth={2.3} />
                Restore latest
              </button>
            </>
          }
        />

        {historyItems.length > 0 ? (
          <WorkspaceAlert title="History is available" tone="info">
            You can restore previous generated states from here. Review changed
            files before restoring, because “undo” is not a substitute for having
            a functioning frontal lobe.
          </WorkspaceAlert>
        ) : (
          <WorkspaceAlert title="No history yet" tone="warning">
            Generate or save a build before expecting history to perform miracles.
          </WorkspaceAlert>
        )}

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Builds"
            value={historyItems.length}
            detail="Saved generated states."
            icon={<Archive size={15} strokeWidth={2.25} />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Completed"
            value={completedCount}
            detail="Successfully finished builds."
            icon={<CheckCircle2 size={15} strokeWidth={2.25} />}
            tone={completedCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Restored"
            value={restoredCount}
            detail="Versions brought back."
            icon={<RotateCcw size={15} strokeWidth={2.25} />}
            tone={restoredCount > 0 ? "blue" : "default"}
          />

          <WorkspaceMetricCard
            label="Files changed"
            value={totalChangedFiles}
            detail="Across tracked builds."
            icon={<Sparkles size={15} strokeWidth={2.25} />}
            tone="purple"
          />
        </WorkspaceMetricGrid>

        <div className={styles.historyGrid}>
          <WorkspaceCard
            title="Build timeline"
            description="Saved builds, generated prompts, and restore points."
            badge={<WorkspaceStatusPill tone="blue">{historyItems.length} items</WorkspaceStatusPill>}
          >
            {historyItems.length > 0 ? (
              <div className={styles.timelineList}>
                {historyItems.map((item) => (
                  <article key={item.id} className={styles.timelineItem}>
                    <div className={styles.timelineIcon}>
                      {getStatusIcon(item.status)}
                    </div>

                    <div className={styles.timelineBody}>
                      <div className={styles.timelineTop}>
                        <div>
                          <h4>{item.title}</h4>
                          <span>
                            {item.projectType} · {item.createdAtLabel}
                          </span>
                        </div>

                        <WorkspaceStatusPill tone={getStatusTone(item.status)}>
                          {getStatusLabel(item.status)}
                        </WorkspaceStatusPill>
                      </div>

                      <p>{item.prompt}</p>

                      <div className={styles.timelineMeta}>
                        <span>{item.changedFiles ?? 0} files changed</span>
                        <span>{item.modules ?? 0} modules</span>
                      </div>

                      <div className={styles.timelineActions}>
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={() => onRestoreBuild?.(item)}
                        >
                          <RotateCcw size={13} strokeWidth={2.3} />
                          Restore
                        </button>

                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={onOpenPreview}
                        >
                          <Search size={13} strokeWidth={2.3} />
                          Inspect
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<History size={22} strokeWidth={2.2} />}
                title="No saved builds"
                description="Build history will appear here after you generate and save workspace changes."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Recommended actions"
            description="Keep version history clean and recoverable."
            badge={<WorkspaceStatusPill>Workflow</WorkspaceStatusPill>}
          >
            <div className={styles.actionList}>
              <WorkspaceActionRow
                title="Review latest generated files"
                description="Inspect changed files before restoring or publishing."
                icon={<Search size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Review</WorkspaceStatusPill>}
                onClick={onOpenPreview}
              />

              <WorkspaceActionRow
                title="Restore only known-good builds"
                description="Avoid restoring partial or failed generations unless you enjoy debugging archaeology."
                icon={<RotateCcw size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="orange">Careful</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Commit stable checkpoints"
                description="Push stable workspace states to GitHub before risky UI refactors."
                icon={<GitBranch size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="green">Recommended</WorkspaceStatusPill>}
              />
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}