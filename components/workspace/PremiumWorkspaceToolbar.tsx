"use client";

import type { ComponentType } from "react";
import {
  ArrowUp,
  BarChart3,
  Cloud,
  Code2,
  FileText,
  Globe2,
  MoreHorizontal,
  Share,
  Upload,
} from "lucide-react";

import styles from "./PremiumWorkspaceToolbar.module.css";

type WorkspaceView =
  | "preview"
  | "code"
  | "architecture"
  | "integrations"
  | "publish-readiness"
  | "history";

type ToolId =
  | "preview"
  | "files"
  | "cloud"
  | "code"
  | "architecture"
  | "history";

type ToolConfig = {
  id: ToolId;
  label: string;
  icon: ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
  }>;
};

type PremiumWorkspaceToolbarProps = {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  fileCountLabel: string;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
  onOpenPublishCenter: () => void;
};

const tools: ToolConfig[] = [
  {
    id: "preview",
    label: "Preview",
    icon: Globe2,
  },
  {
    id: "files",
    label: "Files",
    icon: FileText,
  },
  {
    id: "cloud",
    label: "Cloud",
    icon: Cloud,
  },
  {
    id: "code",
    label: "Code",
    icon: Code2,
  },
  {
    id: "architecture",
    label: "Build",
    icon: BarChart3,
  },
  {
    id: "history",
    label: "More",
    icon: MoreHorizontal,
  },
];

function GitHubLogo() {
  return (
    <svg
      aria-hidden="true"
      className={styles.githubLogo}
      viewBox="0 0 24 24"
      role="img"
    >
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.427 2.865 8.182 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-1.04-.014-1.887-2.782.605-3.369-1.192-3.369-1.192-.455-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.893 1.53 2.341 1.088 2.91.832.091-.651.35-1.088.636-1.338-2.221-.254-4.555-1.114-4.555-4.957 0-1.094.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.651 0 0 .84-.269 2.75 1.027A9.564 9.564 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.594 1.028 2.688 0 3.853-2.338 4.7-4.566 4.95.359.31.678.92.678 1.855 0 1.34-.012 2.422-.012 2.75 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"
      />
    </svg>
  );
}

function getActiveTool(filesOpen: boolean, workspaceView: WorkspaceView): ToolId {
  if (filesOpen) return "files";
  if (workspaceView === "code") return "code";
  if (workspaceView === "architecture") return "architecture";
  if (workspaceView === "integrations") return "cloud";
  if (workspaceView === "history") return "history";
  return "preview";
}

export function PremiumWorkspaceToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
}: PremiumWorkspaceToolbarProps) {
  const activeTool = getActiveTool(filesOpen, workspaceView);

  function selectTool(toolId: ToolId) {
    if (toolId === "files") {
      setWorkspaceView("preview");
      setFilesOpen(!filesOpen);
      return;
    }

    setFilesOpen(false);

    if (toolId === "preview") {
      setWorkspaceView("preview");
      return;
    }

    if (toolId === "cloud") {
      setWorkspaceView("integrations");
      return;
    }

    if (toolId === "code") {
      setWorkspaceView("code");
      return;
    }

    if (toolId === "architecture") {
      setWorkspaceView("architecture");
      return;
    }

    if (toolId === "history") {
      setWorkspaceView("history");
    }
  }

  return (
    <header className={styles.toolbarShell} aria-label="Preview toolbar">
      <div className={styles.toolRail} aria-label="Workspace tools">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          const label =
            tool.id === "files" && fileCountLabel
              ? `Files · ${fileCountLabel}`
              : tool.label;

          return (
            <button
              key={tool.id}
              suppressHydrationWarning
              type="button"
              className={`${styles.toolButton} ${
                isActive ? styles.toolButtonActive : ""
              }`}
              aria-label={label}
              aria-pressed={isActive}
              title={label}
              onClick={() => selectTool(tool.id)}
            >
              <span className={styles.toolIconWrap}>
                <Icon className={styles.toolIcon} size={17} strokeWidth={2.25} />
              </span>

              <span className={styles.toolLabelWrap} aria-hidden={!isActive}>
                <span className={styles.toolLabel}>{tool.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.actionRail} aria-label="Workspace actions">
        <button suppressHydrationWarning type="button" className={styles.shareButton}>
          <Share size={15} strokeWidth={2.15} />
          <span>Share</span>
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={styles.githubButton}
          aria-label="GitHub"
          title="GitHub"
        >
          <GitHubLogo />
        </button>

        <button suppressHydrationWarning type="button" className={styles.upgradeButton}>
          <ArrowUp size={15} strokeWidth={2.35} />
          <span>Upgrade</span>
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={styles.publishButton}
          onClick={onOpenPublishCenter}
        >
          <Upload size={15} strokeWidth={2.2} />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
}