"use client";
import type { WorkspaceView } from "@/types/workspace";

import type { ComponentType, CSSProperties } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Copy,
  Eye,
  FileCheck2,
  FileText,
  Globe2,
  MoreHorizontal,
  Share2,
  Shield,
  Upload,
} from "lucide-react";

import styles from "./PremiumWorkspaceToolbar.module.css";


type ToolId =
  | "preview"
  | "files"
  | "cloud"
  | "code"
  | "architecture"
  | "security"
  | "analytics"
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
  onOpenPublishCenter?: () => void;
  previewState?: {
    projectType?: string;
    securityFindings?: Array<{ severity?: string }>;
  };
};

const tools: ToolConfig[] = [
  { id: "preview", label: "Preview", icon: Globe2 },
  { id: "files", label: "Files", icon: FileText },
  { id: "cloud", label: "Cloud", icon: Cloud },
  { id: "code", label: "Code", icon: Code2 },
  { id: "architecture", label: "Build", icon: BarChart3 },
  { id: "security", label: "Security", icon: Shield },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "More", icon: MoreHorizontal },
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
  if (workspaceView === "security") return "security";
  if (workspaceView === "analytics") return "analytics";
  if (workspaceView === "history") return "history";
  return "preview";
}

function buildProjectUrl(projectType?: string) {
  const slug = (projectType || "founder-workspace")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "founder-workspace"}.founderai.app`;
}

export function PremiumWorkspaceToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
  previewState,
}: PremiumWorkspaceToolbarProps) {
  const activeTool = getActiveTool(filesOpen, workspaceView);

  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishPanelPosition, setPublishPanelPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: 640,
  });

  const publishButtonRef = useRef<HTMLButtonElement | null>(null);
  const publishPanelRef = useRef<HTMLDivElement | null>(null);

  const projectUrl = useMemo(
    () => buildProjectUrl(previewState?.projectType),
    [previewState?.projectType]
  );

  const securityCount = useMemo(() => {
    if (!previewState?.securityFindings?.length) return 0;
    return previewState.securityFindings.length;
  }, [previewState?.securityFindings]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isPublishOpen) return;

    function updatePosition() {
      const button = publishButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const panelWidth = 448;
      const viewportPadding = 12;

      let left = rect.right - panelWidth;
      if (left < viewportPadding) left = viewportPadding;
      if (left + panelWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - panelWidth - viewportPadding;
      }

      const preferredTop = rect.bottom + 12;
      const availableBelow = window.innerHeight - preferredTop - viewportPadding;
      const preferredMaxHeight = Math.min(640, window.innerHeight - viewportPadding * 2);

      const shouldOpenFromTop = availableBelow < 520;
      const top = shouldOpenFromTop ? viewportPadding : preferredTop;
      const maxHeight = shouldOpenFromTop
        ? window.innerHeight - viewportPadding * 2
        : Math.max(420, Math.min(preferredMaxHeight, availableBelow));

      setPublishPanelPosition({ top, left, maxHeight });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isPublishOpen]);

  useEffect(() => {
    if (!isPublishOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (publishButtonRef.current?.contains(target)) return;
      if (publishPanelRef.current?.contains(target)) return;

      setIsPublishOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPublishOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPublishOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function selectTool(toolId: ToolId) {
    setIsPublishOpen(false);

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

    if (toolId === "security") {
      setWorkspaceView("security");
      return;
    }

    if (toolId === "analytics") {
      setWorkspaceView("analytics");
      return;
    }

    if (toolId === "history") {
      setWorkspaceView("history");
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(`https://${projectUrl}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function openPublishReadiness() {
    setFilesOpen(false);
    setWorkspaceView("publish-readiness");
    setIsPublishOpen(false);
  }

  function openSecurity() {
    setFilesOpen(false);
    setWorkspaceView("security");
    setIsPublishOpen(false);
  }

  function openCloud() {
    setFilesOpen(false);
    setWorkspaceView("integrations");
    setIsPublishOpen(false);
  }

  function handleContinuePublish() {
    setIsPublishOpen(false);

    if (onOpenPublishCenter) {
      onOpenPublishCenter();
      return;
    }

    setFilesOpen(false);
    setWorkspaceView("publish-readiness");
  }

  const publishPanel =
    isMounted && isPublishOpen
      ? createPortal(
          <div
            className={styles.publishPopover}
            ref={publishPanelRef}
            role="dialog"
            aria-label="Publish panel"
            style={
              {
                top: `${publishPanelPosition.top}px`,
                left: `${publishPanelPosition.left}px`,
                maxHeight: `${publishPanelPosition.maxHeight}px`,
              } as CSSProperties
            }
          >
            <div className={styles.publishPopoverHeader}>
              <div>
                <h3 className={styles.publishPopoverTitle}>Publish</h3>
                <p className={styles.publishPopoverSubtitle}>
                  Review launch readiness before going live.
                </p>
              </div>

              <span className={styles.publishStatusChip}>
                <CheckCircle2 size={13} strokeWidth={2.2} />
                Ready to review
              </span>
            </div>

            <div className={styles.publishPopoverBody}>
              <div className={styles.publishPopoverSection}>
                <div className={styles.publishSectionHeader}>
                  <div>
                    <h4>Website URL</h4>
                  <p>Generated staging domain for this workspace.</p>
                  </div>

                  <button
                    suppressHydrationWarning
                    type="button"
                    className={styles.publishMiniAction}
                    onClick={handleCopyUrl}
                  >
                    <Copy size={13} strokeWidth={2.2} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className={styles.publishUrlCard}>
                  <span className={styles.publishUrlText}>{projectUrl}</span>
                </div>
              </div>

              <div className={styles.publishPopoverSection}>
                <div className={styles.publishSectionHeader}>
                <div>
                  <h4>Visibility</h4>
                  <p>Who can access the published project.</p>
                </div>
              </div>

              <div className={styles.publishVisibilityCard}>
                <div className={styles.publishVisibilityIcon}>
                  <Eye size={18} strokeWidth={2.1} />
                </div>

                <div className={styles.publishVisibilityText}>
                  <strong>Public preview</strong>
                  <span>Anyone with the URL can access the workspace preview.</span>
                </div>
              </div>
            </div>

            <div className={styles.publishPopoverSection}>
              <div className={styles.publishSectionHeader}>
                <div>
                  <h4>Launch actions</h4>
                  <p>Review the things most likely to bite you later.</p>
                </div>
              </div>

              <div className={styles.publishActionGrid}>
                <button
                  suppressHydrationWarning
                  type="button"
                  className={styles.publishActionCard}
                  onClick={openSecurity}
                >
                  <span className={styles.publishActionIcon}>
                    <Shield size={16} strokeWidth={2.2} />
                  </span>
                  <span className={styles.publishActionText}>
                    <strong>Review security</strong>
                    <small>
                      {securityCount > 0
                        ? `${securityCount} finding${securityCount === 1 ? "" : "s"} to review`
                        : "No blockers detected"}
                    </small>
                  </span>
                  <ChevronRight size={16} strokeWidth={2.3} />
                </button>

                <button
                  suppressHydrationWarning
                  type="button"
                  className={styles.publishActionCard}
                  onClick={openPublishReadiness}
                >
                  <span className={styles.publishActionIcon}>
                    <FileCheck2 size={16} strokeWidth={2.2} />
                  </span>
                  <span className={styles.publishActionText}>
                    <strong>Create checklist</strong>
                    <small>Generate launch steps and review blockers</small>
                  </span>
                  <ChevronRight size={16} strokeWidth={2.3} />
                </button>

                <button
                  suppressHydrationWarning
                  type="button"
                  className={styles.publishActionCard}
                  onClick={openCloud}
                >
                  <span className={styles.publishActionIcon}>
                    <Cloud size={16} strokeWidth={2.2} />
                  </span>
                  <span className={styles.publishActionText}>
                    <strong>Deployment settings</strong>
                    <small>Cloud, environment variables, and integrations</small>
                  </span>
                  <ChevronRight size={16} strokeWidth={2.3} />
                </button>
              </div>
            </div>

            </div>

            <div className={styles.publishPopoverFooter}>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.publishPrimaryButton}
                onClick={handleContinuePublish}
              >
                <Upload size={15} strokeWidth={2.2} />
                Continue to publish
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
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
                  <Icon className={styles.toolIcon} size={14} strokeWidth={2.25} />
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
            <Share2 size={14} strokeWidth={2.15} />
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
            <ArrowUp size={14} strokeWidth={2.3} />
            <span>Upgrade</span>
          </button>

          <button
            ref={publishButtonRef}
            suppressHydrationWarning
            type="button"
            className={styles.publishButton}
            aria-label="Open publish panel"
            aria-haspopup="dialog"
            aria-expanded={isPublishOpen}
            onClick={() => setIsPublishOpen((current) => !current)}
          >
            <Upload size={14} strokeWidth={2.2} />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {publishPanel}
    </>
  );
}
