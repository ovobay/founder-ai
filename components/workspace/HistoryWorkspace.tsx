"use client";

import { useMemo, useState } from "react";
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
  XCircle,
} from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  if (status === "completed") return "success" as const;
  if (status === "restored") return "info" as const;
  if (status === "failed") return "danger" as const;

  return "warning" as const;
}

function getStatusLabel(status: WorkspaceHistoryStatus) {
  if (status === "completed") return "Completed";
  if (status === "restored") return "Restored";
  if (status === "failed") return "Failed";

  return "Draft";
}

function getStatusIcon(status: WorkspaceHistoryStatus) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "restored") return <RotateCcw className="h-4 w-4" />;
  if (status === "failed") return <XCircle className="h-4 w-4" />;

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
  const [selectedId, setSelectedId] = useState(historyItems[0]?.id ?? "");

  const selectedItem = useMemo(
    () =>
      historyItems.find((item) => item.id === selectedId) ??
      historyItems[0] ??
      null,
    [historyItems, selectedId]
  );

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

  return (
    <WorkspacePanel
      eyebrow="Build timeline"
      title="History"
      description="Review previous builds, restore versions, and inspect generated workspace changes."
      status={`Updated · ${lastUpdatedLabel}`}
      statusTone={failedCount > 0 ? "warning" : "info"}
      actions={
        <>
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

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            onClick={() => selectedItem && onRestoreBuild?.(selectedItem)}
            disabled={!selectedItem}
          >
            <RotateCcw className="h-4 w-4" />
            Restore
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
      <WorkspaceMetricGrid>
        <WorkspaceMetricCard
          label="Builds"
          value={historyItems.length}
          description="Saved generated states."
          icon={<Archive className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Completed"
          value={completedCount}
          description="Successfully finished builds."
          icon={<CheckCircle2 className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Restored"
          value={restoredCount}
          description="Versions brought back."
          icon={<RotateCcw className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Files changed"
          value={totalChangedFiles}
          description="Across tracked builds."
          icon={<Sparkles className="h-4 w-4" />}
        />
      </WorkspaceMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>Build timeline</CardTitle>
                <CardDescription>
                  Saved builds, prompts, status, changed files, and restore points.
                </CardDescription>
              </div>

              <CardAction>
                <Badge variant="outline" className="rounded-full">
                  {historyItems.length} versions
                </Badge>
              </CardAction>
            </div>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-[600px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Build</TableHead>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead className="w-[120px]">Files</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {historyItems.length > 0 ? (
                    historyItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;

                      return (
                        <TableRow
                          key={item.id}
                          data-state={isSelected ? "selected" : undefined}
                          className="cursor-pointer"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <TableCell>
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                {getStatusIcon(item.status)}
                              </div>

                              <div className="min-w-0">
                                <div className="truncate font-medium">
                                  {item.title}
                                </div>
                                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                  {item.prompt}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {item.createdAtLabel}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">{item.projectType}</Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {item.changedFiles ?? 0} files
                              </div>
                              <div className="text-muted-foreground">
                                {item.modules ?? 0} modules
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <WorkspaceStatusPill tone={getStatusTone(item.status)}>
                              {getStatusLabel(item.status)}
                            </WorkspaceStatusPill>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History className="h-8 w-8 text-muted-foreground" />
                          <div className="font-medium">No saved builds</div>
                          <div className="text-sm text-muted-foreground">
                            Build history will appear after generated changes are saved.
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected build</CardTitle>
              <CardDescription>
                Inspect the active restore point before doing anything dramatic.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                      <GitBranch className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="break-words font-medium">
                        {selectedItem.title}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedItem.prompt}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">{selectedItem.projectType}</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {selectedItem.createdAtLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Changed files</span>
                      <Badge variant="outline">
                        {selectedItem.changedFiles ?? 0}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Modules</span>
                      <Badge variant="outline">
                        {selectedItem.modules ?? 0}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <WorkspaceStatusPill tone={getStatusTone(selectedItem.status)}>
                        {getStatusLabel(selectedItem.status)}
                      </WorkspaceStatusPill>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => onRestoreBuild?.(selectedItem)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore this build
                    </Button>

                    <Button
                      suppressHydrationWarning
                      type="button"
                      variant="outline"
                      onClick={onOpenPreview}
                    >
                      <Search className="h-4 w-4" />
                      Inspect preview
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                  <History className="h-8 w-8 text-muted-foreground" />
                  <div className="font-medium">No build selected</div>
                  <p className="max-w-[260px] text-sm text-muted-foreground">
                    Select a version from the timeline to inspect or restore it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version safety</CardTitle>
              <CardDescription>
                Tiny reminders before restoring things. Humanity demanded this.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>Review changed files before restoring older versions.</span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>Commit stable checkpoints before major refactors.</span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>Inspect Preview after restoring a build.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspacePanel>
  );
}