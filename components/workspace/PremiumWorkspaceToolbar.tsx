"use client";

import * as React from "react";
import styles from "./PremiumWorkspaceToolbar.module.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  Share2,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react";

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

type WorkspaceViewKey =
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

type PremiumWorkspaceToolbarProps<TWorkspaceView extends string = WorkspaceViewKey> = {
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
  key: WorkspaceViewKey;
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

  if (active) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className={cn(
          "h-11 rounded-2xl border-primary/40 bg-primary/5 px-4 text-primary shadow-sm",
          "hover:bg-primary/10 hover:text-primary",
          "focus-visible:ring-2 focus-visible:ring-primary/30",
          styles.labeledButton,
        )}
      >
        <Icon className="mr-2 h-5 w-5" />
        <span className="text-base font-semibold">{item.label}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label={item.label}
      className={cn(
        "h-11 w-11 rounded-2xl border-border bg-background shadow-sm",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-primary/30",
        styles.iconButton,
      )}
    >
      <Icon className="h-5 w-5" />
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
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
    } catch {
      // silent on purpose
    }
  }, [previewUrl]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          className={cn(
            "h-11 rounded-2xl px-5 text-base font-semibold shadow-md",
            "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          Publish
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          sideOffset={12}
          collisionPadding={16}
          className={cn(
            "z-[200] w-[440px] rounded-3xl border bg-background p-0 shadow-2xl",
            styles.publishMenuFix,
          )}
        >
          <div className="overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <DropdownMenuLabel className="p-0 text-xl font-semibold text-foreground">
                  Publish
                </DropdownMenuLabel>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review launch readiness before going live.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                {publishStatusLabel}
              </Badge>
            </div>

            <Separator />

            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-4">
                <Card className="rounded-2xl">
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Website URL</CardTitle>
                        <CardDescription>
                          Generated staging domain for this workspace.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={handleCopy}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-2xl border bg-muted/40 px-4 py-4 text-base font-medium">
                      {previewUrl}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Visibility</CardTitle>
                    <CardDescription>
                      Who can access the published project.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4 rounded-2xl border bg-muted/20 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-background">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold">Public preview</p>
                        <p className="text-sm text-muted-foreground">
                          Anyone with the URL can access {projectTitle}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Launch actions</CardTitle>
                    <CardDescription>
                      Review the things most likely to bite you later.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex h-auto w-full items-center justify-between rounded-2xl px-4 py-4 text-left"
                      onClick={onOpenPublishReadiness}
                    >
                      <div>
                        <div className="text-base font-semibold">Review security</div>
                        <div className="text-sm text-muted-foreground">
                          {publishIssueCount > 0
                            ? `${publishIssueCount} item(s) need review before launch.`
                            : "No blockers detected."}
                        </div>
                      </div>
                      <Badge
                        variant={publishIssueCount > 0 ? "destructive" : "secondary"}
                        className="rounded-full"
                      >
                        {publishIssueCount > 0 ? publishIssueCount : "Ready"}
                      </Badge>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex h-auto w-full items-center justify-between rounded-2xl px-4 py-4 text-left"
                      onClick={onCreateChecklist}
                    >
                      <div>
                        <div className="text-base font-semibold">Create checklist</div>
                        <div className="text-sm text-muted-foreground">
                          Generate launch and QA tasks for this build.
                        </div>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <Button
                      type="button"
                      variant="default"
                      className="h-12 w-full rounded-2xl text-base font-semibold"
                      onClick={() => {
                        onOpenPublishCenter?.();
                        onDeployProject?.();
                      }}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Continue publish flow
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export function PremiumWorkspaceToolbar<TWorkspaceView extends string = WorkspaceViewKey>({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
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
    (nextView: WorkspaceViewKey) => {
      setWorkspaceView(nextView as TWorkspaceView);
      if (setFilesOpen) {
        setFilesOpen(nextView === "files" ? true : false);
      }
    },
    [setWorkspaceView, setFilesOpen],
  );

  const currentOverflowActive = OVERFLOW_TOOLS.some((item) => item.key === workspaceView);

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="More tools"
                className={cn(
                  "h-11 w-11 rounded-2xl border-border bg-background shadow-sm",
                  currentOverflowActive &&
                    "border-primary/40 bg-primary/5 text-primary ring-2 ring-primary/20",
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={10}
              className="z-[160] min-w-[220px] rounded-2xl"
            >
              <DropdownMenuLabel>More tools</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {OVERFLOW_TOOLS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={() => handleToolChange(item.key)}
                      className="rounded-xl"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className={styles.right}>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-2xl px-5 text-base font-semibold shadow-sm"
          onClick={() => onShare?.()}
        >
          <Share2 className="mr-2 h-5 w-5" />
          Share
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open GitHub"
          className="h-11 w-11 rounded-2xl shadow-sm"
          onClick={() => onOpenGithub?.()}
        >
          <GithubLogo className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          className={cn(
            "h-11 rounded-2xl px-5 text-base font-semibold shadow-md",
            "bg-violet-600 text-white hover:bg-violet-700",
          )}
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Upgrade
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