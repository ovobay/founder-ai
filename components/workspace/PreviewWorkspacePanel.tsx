"use client";

import {
  ArrowUpRight,
  Eye,
  FileCode2,
  Globe2,
  Monitor,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

import styles from "./PreviewWorkspacePanel.module.css";

export type PreviewSignal = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "blue" | "green" | "orange" | "red" | "purple";
};

export type PreviewWorkspacePanelProps = {
  projectName?: string;
  projectType?: string;
  generatedUrl?: string;
  lastUpdatedLabel?: string;
  fileCount?: number;
  moduleCount?: number;
  isLoading?: boolean;
  children?: React.ReactNode;
  signals?: PreviewSignal[];
  onRefresh?: () => void;
  onOpenCode?: () => void;
  onOpenFiles?: () => void;
  onOpenPublish?: () => void;
  onOpenSecurity?: () => void;
};

const defaultSignals: PreviewSignal[] = [
  {
    id: "responsive",
    label: "Responsive",
    value: "Ready",
    detail: "Preview shell supports desktop and mobile review.",
    tone: "green",
  },
  {
    id: "files",
    label: "Files",
    value: "Synced",
    detail: "Generated files are available for inspection.",
    tone: "blue",
  },
  {
    id: "launch",
    label: "Launch",
    value: "Review",
    detail: "Publish readiness should be checked before deployment.",
    tone: "orange",
  },
];

export function PreviewWorkspacePanel({
  projectName = "Founder AI workspace",
  projectType = "Generated app",
  generatedUrl = "https://founder-ai-build.founder-ai.app",
  lastUpdatedLabel = "Just now",
  fileCount = 0,
  moduleCount = 0,
  isLoading = false,
  children,
  signals = defaultSignals,
  onRefresh,
  onOpenCode,
  onOpenFiles,
  onOpenPublish,
  onOpenSecurity,
}: PreviewWorkspacePanelProps) {
  return (
    <WorkspacePanel
      title="Preview"
      eyebrow="Live workspace"
      description="Review the generated product experience before editing, securing, or publishing."
      icon={<Eye size={17} strokeWidth={2.3} />}
      badge={
        <WorkspaceStatusPill tone={isLoading ? "orange" : "green"}>
          {isLoading ? "Loading" : "Live preview"}
        </WorkspaceStatusPill>
      }
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
    >
      <div className={styles.previewWorkspace}>
        <WorkspaceHero
          eyebrow="Generated preview"
          title={`${projectName} preview`}
          description="Inspect the generated app as a product, not just a pile of files pretending to have meaning. Review layout, messaging, responsiveness, and launch readiness."
          icon={<Monitor size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone="blue">
              Updated · {lastUpdatedLabel}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Files",
            value: fileCount,
            tone: fileCount > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onOpenPublish}
              >
                <Rocket size={14} strokeWidth={2.3} />
                Publish readiness
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onOpenCode}
              >
                <FileCode2 size={14} strokeWidth={2.3} />
                Open code
              </button>
            </>
          }
        />

        <WorkspaceAlert title="Preview before publishing" tone="info">
          Use this space to review the generated experience before touching
          production. Users are famously unreasonable about broken layouts and
          buttons that do nothing.
        </WorkspaceAlert>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Project type"
            value={projectType}
            detail="Detected generated product category."
            icon={<Sparkles size={15} strokeWidth={2.25} />}
            tone="purple"
          />

          <WorkspaceMetricCard
            label="Files"
            value={fileCount}
            detail="Generated or loaded files."
            icon={<FileCode2 size={15} strokeWidth={2.25} />}
            tone={fileCount > 0 ? "blue" : "default"}
          />

          <WorkspaceMetricCard
            label="Modules"
            value={moduleCount}
            detail="Detected product modules."
            icon={<Globe2 size={15} strokeWidth={2.25} />}
            tone={moduleCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Status"
            value={isLoading ? "Loading" : "Ready"}
            detail="Current preview state."
            icon={<Eye size={15} strokeWidth={2.25} />}
            tone={isLoading ? "orange" : "green"}
          />
        </WorkspaceMetricGrid>

        <div className={styles.previewGrid}>
          <WorkspaceCard
            title="Live preview"
            description="Generated app output rendered inside the workspace."
            badge={<WorkspaceStatusPill tone="green">Preview</WorkspaceStatusPill>}
          >
            <div className={styles.previewStage}>
              {isLoading ? (
                <WorkspaceEmptyState
                  icon={<RefreshCcw size={22} strokeWidth={2.2} />}
                  title="Loading preview"
                  description="The generated preview is loading."
                />
              ) : children ? (
                <div className={styles.previewContent}>{children}</div>
              ) : (
                <WorkspaceEmptyState
                  icon={<Eye size={22} strokeWidth={2.2} />}
                  title="No preview available"
                  description="Generate a build to render a live preview here."
                />
              )}
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Preview URL"
            description="Generated preview destination for review and sharing."
            badge={<WorkspaceStatusPill tone="blue">URL</WorkspaceStatusPill>}
          >
            <div className={styles.urlCard}>
              <span className={styles.urlIcon}>
                <Globe2 size={20} strokeWidth={2.2} />
              </span>

              <div className={styles.urlText}>
                <h4>{generatedUrl.replace(/^https?:\/\//, "")}</h4>
                <p>
                  Use this URL for review, QA, stakeholder preview, and final
                  launch checks.
                </p>
              </div>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.iconButton}
              >
                <ArrowUpRight size={14} strokeWidth={2.25} />
              </button>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Preview checks"
            description="Quick actions before moving into code or publish."
            badge={<WorkspaceStatusPill>Checklist</WorkspaceStatusPill>}
          >
            <div className={styles.actionList}>
              <WorkspaceActionRow
                title="Open generated files"
                description="Review the project tree and inspect changed files."
                icon={<FileCode2 size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Files</WorkspaceStatusPill>}
                onClick={onOpenFiles}
              />

              <WorkspaceActionRow
                title="Review code"
                description="Inspect and edit the selected generated file."
                icon={<FileCode2 size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="purple">Code</WorkspaceStatusPill>}
                onClick={onOpenCode}
              />

              <WorkspaceActionRow
                title="Check security"
                description="Review secrets, protected routes, and launch risks."
                icon={<ShieldCheck size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="orange">Security</WorkspaceStatusPill>}
                onClick={onOpenSecurity}
              />

              <WorkspaceActionRow
                title="Open publish readiness"
                description="Review blockers and launch requirements before deployment."
                icon={<Rocket size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="green">Publish</WorkspaceStatusPill>}
                onClick={onOpenPublish}
              />
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Responsive review"
            description="Device checks to run before launch."
            badge={<WorkspaceStatusPill tone="blue">Devices</WorkspaceStatusPill>}
          >
            <div className={styles.deviceGrid}>
              <div className={styles.deviceCard}>
                <Monitor size={18} strokeWidth={2.25} />
                <strong>Desktop</strong>
                <span>Check spacing, cards, navigation, and preview frame.</span>
              </div>

              <div className={styles.deviceCard}>
                <Smartphone size={18} strokeWidth={2.25} />
                <strong>Mobile</strong>
                <span>Check stacked layout, buttons, scrolling, and overflow.</span>
              </div>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Signals"
            description="Current preview health indicators."
            badge={<WorkspaceStatusPill>{signals.length} signals</WorkspaceStatusPill>}
          >
            <div className={styles.actionList}>
              {signals.map((signal) => (
                <WorkspaceActionRow
                  key={signal.id}
                  title={`${signal.label}: ${signal.value}`}
                  description={signal.detail}
                  icon={<Sparkles size={15} strokeWidth={2.25} />}
                  badge={<WorkspaceStatusPill tone={signal.tone}>{signal.label}</WorkspaceStatusPill>}
                />
              ))}
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}