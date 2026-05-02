"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import styles from "./PremiumWorkspaceToolbar.module.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  BarChart3,
  Cloud,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  History,
  MoreHorizontal,
  Rocket,
  Share2,
  Shield,
  Wand2,
  Wrench,
} from "lucide-react";

type ToolbarViewKey =
  | "preview"
  | "files"
  | "cloud"
  | "code"
  | "build"
  | "security"
  | "analytics"
  | "history"
  | "publish"
  | "publish-readiness";

type PremiumWorkspaceToolbarProps<
  TWorkspaceView extends string = ToolbarViewKey,
> = {
  filesOpen?: boolean;
  setFilesOpen?: (value: boolean) => void;
  fileCountLabel?: string;
  workspaceView: TWorkspaceView;
  setWorkspaceView: (view: TWorkspaceView) => void;
  onOpenPublishCenter?: () => void;
  onOpenPublishReadiness?: () => void;
  onCreateChecklist?: () => void;
  onDeployProject?: () => void;
  onShare?: () => void;
  onOpenGithub?: () => void;
  previewUrl?: string;
  projectTitle?: string;
  publishIssueCount?: number;
  publishStatusLabel?: string;
  [key: string]: unknown;
};

type ToolItem = {
  key: ToolbarViewKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const PRIMARY_TOOLS: ToolItem[] = [
  { key: "preview", label: "Preview", icon: Globe2 },
  { key: "files", label: "Files", icon: FileText },
  { key: "cloud", label: "Cloud", icon: Cloud },
  { key: "code", label: "Code", icon: Code2 },
  { key: "build", label: "Build", icon: Wrench },
  { key: "security", label: "Security", icon: Shield },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const OVERFLOW_TOOLS: ToolItem[] = [
  { key: "history", label: "History", icon: History },
];

function GithubLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.99c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.12 10.12 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function ToolButton({
  item,
  active,
  onClick,
}: {
  item: ToolItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <Button
      suppressHydrationWarning
      type="button"
      variant="outline"
      aria-label={item.label}
      onClick={onClick}
      data-active={active ? "true" : "false"}
      className={cn(styles.toolButton, active && styles.toolButtonActive)}
    >
      <Icon className={styles.toolIcon} />
      {active ? <span className={styles.toolLabel}>{item.label}</span> : null}
    </Button>
  );
}

function PublishMenu({
  previewUrl,
  projectTitle,
  publishIssueCount,
  publishStatusLabel,
  onOpenPublishCenter,
  onOpenPublishReadiness,
  onCreateChecklist,
  onDeployProject,
}: {
  previewUrl: string;
  projectTitle: string;
  publishIssueCount: number;
  publishStatusLabel: string;
  onOpenPublishCenter?: () => void;
  onOpenPublishReadiness?: () => void;
  onCreateChecklist?: () => void;
  onDeployProject?: () => void;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(previewUrl);
    } catch {
      // Clipboard failure should not punish the user. Revolutionary, I know.
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          suppressHydrationWarning
          type="button"
          className={cn(styles.actionButton, styles.publishButton)}
        >
          <ExternalLink className={styles.actionIcon} />
          <span>Publish</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          avoidCollisions
          className={styles.publishMenu}
        >
          <div className={styles.publishPanel}>
            <header className={styles.publishPanelHeader}>
              <div>
                <DropdownMenu.Label className={styles.publishPanelTitle}>
                  Published
                </DropdownMenu.Label>
                <p className={styles.publishPanelSubtitle}>
                  {publishStatusLabel || "Ready to review"}
                </p>
              </div>

              <div className={styles.visitorPill} aria-label="Visitors">
                <BarChart3 className={styles.visitorIcon} />
                <span>8 Visitors</span>
              </div>
            </header>

            <div className={styles.publishPanelSection}>
              <div className={styles.sectionTitleRow}>
                <h4>Website URL</h4>

                <button
                  type="button"
                  className={styles.customDomainButton}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenPublishCenter?.();
                  }}
                >
                  <ExternalLink className={styles.menuIcon} />
                  Add custom domain
                </button>
              </div>

              <div className={styles.urlField}>
                <span>{previewUrl.replace(/^https?:\/\//, "")}</span>

                <button
                  type="button"
                  className={styles.copyIconButton}
                  aria-label="Copy website URL"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleCopy();
                  }}
                >
                  <Copy className={styles.menuIcon} />
                </button>
              </div>
            </div>

            <div className={styles.publishPanelSection}>
              <h4 className={styles.sectionTitle}>Who can see this website</h4>

              <div className={styles.visibilityCard}>
                <span className={styles.visibilityIcon}>
                  <Globe2 className={styles.visibilityIconSvg} />
                </span>

                <div>
                  <strong>Public</strong>
                  <p>Anyone with the URL can access this workspace.</p>
                </div>
              </div>
            </div>

            <footer className={styles.publishFooter}>
              <div className={styles.publishFooterGrid}>
                <button
                  type="button"
                  className={styles.footerButton}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenPublishReadiness?.();
                  }}
                >
                  <span>Review security</span>

                  {publishIssueCount > 0 ? (
                    <span className={styles.securityCount}>
                      {publishIssueCount}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  className={styles.footerButton}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenPublishCenter?.();
                  }}
                >
                  Edit settings
                </button>
              </div>

              <button
                type="button"
                className={styles.updateButton}
                onClick={(event) => {
                  event.preventDefault();
                  onOpenPublishCenter?.();
                  onDeployProject?.();
                }}
              >
                Update
              </button>
            </footer>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function PremiumWorkspaceToolbar<
  TWorkspaceView extends string = ToolbarViewKey,
>({
  setFilesOpen,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
  onOpenPublishReadiness,
  onCreateChecklist,
  onDeployProject,
  onShare,
  onOpenGithub,
  previewUrl = "https://itsm-command-center.founder-ai.app",
  projectTitle = "this workspace",
  publishIssueCount = 3,
  publishStatusLabel = "Ready to review",
}: PremiumWorkspaceToolbarProps<TWorkspaceView>) {
  const handleToolChange = React.useCallback(
    (nextView: ToolbarViewKey) => {
      setWorkspaceView(nextView as TWorkspaceView);

      if (setFilesOpen) {
        setFilesOpen(nextView === "files");
      }
    },
    [setWorkspaceView, setFilesOpen]
  );

  const overflowActive = OVERFLOW_TOOLS.some(
    (item) => item.key === workspaceView
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.toolStrip}>
          {PRIMARY_TOOLS.map((item) => (
            <ToolButton
              key={item.key}
              item={item}
              active={workspaceView === item.key}
              onClick={() => handleToolChange(item.key)}
            />
          ))}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                aria-label="More tools"
                data-active={overflowActive ? "true" : "false"}
                className={cn(
                  styles.toolButton,
                  overflowActive && styles.toolButtonActive
                )}
              >
                <MoreHorizontal className={styles.toolIcon} />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                side="bottom"
                sideOffset={8}
                collisionPadding={12}
                avoidCollisions
                className={styles.moreMenu}
              >
                <DropdownMenu.Label>More tools</DropdownMenu.Label>
                <DropdownMenu.Separator />

                {OVERFLOW_TOOLS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <DropdownMenu.Item
                      key={item.key}
                      onSelect={() => handleToolChange(item.key)}
                    >
                      <Icon className={styles.menuIcon} />
                      {item.label}
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <div className={styles.right}>
        <Button
          suppressHydrationWarning
          type="button"
          variant="outline"
          className={cn(styles.actionButton, styles.shareButton)}
          onClick={() => onShare?.()}
        >
          <Share2 className={styles.actionIcon} />
          <span>Share</span>
        </Button>

        <Button
          suppressHydrationWarning
          type="button"
          variant="outline"
          aria-label="Open GitHub"
          className={styles.githubButton}
          onClick={() => onOpenGithub?.()}
        >
          <GithubLogo className={styles.githubIcon} />
        </Button>

        <Button
          suppressHydrationWarning
          type="button"
          className={cn(styles.actionButton, styles.upgradeButton)}
        >
          <Wand2 className={styles.actionIcon} />
          <span>Upgrade</span>
        </Button>

        <PublishMenu
          previewUrl={previewUrl}
          projectTitle={projectTitle}
          publishIssueCount={publishIssueCount}
          publishStatusLabel={publishStatusLabel}
          onOpenPublishCenter={onOpenPublishCenter}
          onOpenPublishReadiness={onOpenPublishReadiness}
          onCreateChecklist={onCreateChecklist}
          onDeployProject={onDeployProject}
        />
      </div>
    </div>
  );
}