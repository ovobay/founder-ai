"use client";

import {
  Code2,
  Database,
  File,
  FileCode2,
  FilePlus2,
  Files,
  FolderTree,
  RefreshCcw,
  Search,
  Sparkles,
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
import { Input } from "@/components/ui/input";
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

export type WorkspaceFileStatus = "created" | "updated" | "checked" | "deleted";

export type WorkspaceFileItem = {
  id: string;
  path: string;
  description?: string;
  status: WorkspaceFileStatus;
  source?: "database" | "generated" | "local";
  contents?: string;
};

export type FilesWorkspaceProps = {
  projectName?: string;
  lastUpdatedLabel?: string;
  files?: WorkspaceFileItem[];
  selectedFileId?: string;
  onClose?: () => void;
  onSelectFile?: (fileId: string) => void;
  onCreateFile?: () => void;
  onOpenCode?: () => void;
  onRefresh?: () => void;
};

const defaultFiles: WorkspaceFileItem[] = [
  {
    id: "app-page",
    path: "app/page.tsx",
    description: "Main workspace route and UI orchestration.",
    status: "updated",
    source: "database",
  },
  {
    id: "toolbar",
    path: "components/workspace/PremiumWorkspaceToolbar.tsx",
    description: "Premium toolbar controls and workspace navigation.",
    status: "updated",
    source: "database",
  },
  {
    id: "security-workspace",
    path: "components/workspace/SecurityWorkspace.tsx",
    description: "Security review panel for launch readiness.",
    status: "created",
    source: "generated",
  },
];

function getStatusTone(status: WorkspaceFileStatus) {
  if (status === "created") return "success" as const;
  if (status === "updated") return "info" as const;
  if (status === "deleted") return "danger" as const;

  return "neutral" as const;
}

function getStatusLabel(status: WorkspaceFileStatus) {
  if (status === "created") return "Created";
  if (status === "updated") return "Updated";
  if (status === "deleted") return "Deleted";

  return "Checked";
}

function getSourceTone(source?: WorkspaceFileItem["source"]) {
  if (source === "database") return "warning" as const;
  if (source === "generated") return "info" as const;

  return "neutral" as const;
}

function getFileExtension(path: string) {
  const parts = path.split(".");

  return parts.length > 1 ? parts.at(-1) || "file" : "file";
}

function getFolderName(path: string) {
  return path.includes("/") ? path.split("/")[0] : "root";
}

function getTopFolders(files: WorkspaceFileItem[]) {
  const folders = new Map<string, number>();

  files.forEach((file) => {
    const folder = getFolderName(file.path);
    folders.set(folder, (folders.get(folder) ?? 0) + 1);
  });

  return Array.from(folders.entries()).map(([name, count]) => ({
    name,
    count,
  }));
}

function getSearchableText(file: WorkspaceFileItem) {
  return [
    file.path,
    file.description,
    file.status,
    file.source,
    getFileExtension(file.path),
    getFolderName(file.path),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function FilesWorkspace({
  projectName = "Founder AI workspace",
  lastUpdatedLabel = "Just now",
  files = defaultFiles,
  selectedFileId,
  onClose,
  onSelectFile,
  onCreateFile,
  onOpenCode,
  onRefresh,
}: FilesWorkspaceProps) {
  const createdCount = files.filter((file) => file.status === "created").length;
  const updatedCount = files.filter((file) => file.status === "updated").length;
  const databaseCount = files.filter((file) => file.source === "database").length;
  const generatedCount = files.filter((file) => file.source === "generated").length;
  const folders = getTopFolders(files);

  const selectedFile =
    files.find((file) => file.id === selectedFileId) ?? files[0] ?? null;

  return (
    <WorkspacePanel
      eyebrow="Project files"
      title="Files"
      description="Browse generated files, database-backed files, changed files, and project folders."
      status={`${files.length} files`}
      statusTone="info"
      actions={
        <>
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            onClick={onRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenCode}
          >
            <Code2 className="h-4 w-4" />
            Code
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            onClick={onCreateFile}
          >
            <FilePlus2 className="h-4 w-4" />
            New file
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
          label="Created"
          value={createdCount}
          description="New files generated."
          icon={<FilePlus2 className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Updated"
          value={updatedCount}
          description="Existing files changed."
          icon={<Sparkles className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Database"
          value={databaseCount}
          description="Synced project files."
          icon={<Database className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Generated"
          value={generatedCount}
          description="AI generated output."
          icon={<FileCode2 className="h-4 w-4" />}
        />
      </WorkspaceMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>File browser</CardTitle>
                <CardDescription>
                  Select a generated or saved file to inspect and open in code.
                </CardDescription>
              </div>

              <CardAction>
                <Badge variant="outline" className="rounded-full">
                  {files.length} total
                </Badge>
              </CardAction>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                suppressHydrationWarning
                placeholder="Search files, folders, status..."
                className="pl-9"
                onChange={() => {
                  /*
                   * Search UI is intentionally presentational for now.
                   * We keep this controlled by future state when file filtering is wired.
                   * Yes, a search input that doesn’t search yet is normally a crime.
                   * Here it avoids touching routing/state while we migrate UI safely.
                   */
                }}
              />
            </div>

            <ScrollArea className="h-[560px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="w-[120px]">Source</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[90px]">Type</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {files.length > 0 ? (
                    files.map((file) => {
                      const isSelected = selectedFile?.id === file.id;

                      return (
                        <TableRow
                          key={file.id}
                          data-state={isSelected ? "selected" : undefined}
                          className="cursor-pointer"
                          onClick={() => onSelectFile?.(file.id)}
                        >
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                                <File className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <div className="min-w-0">
                                <div className="truncate font-medium">
                                  {file.path}
                                </div>
                                <div className="truncate text-sm text-muted-foreground">
                                  {file.description ??
                                    `${getFolderName(file.path)} folder file`}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <WorkspaceStatusPill tone={getSourceTone(file.source)}>
                              {file.source ?? "local"}
                            </WorkspaceStatusPill>
                          </TableCell>

                          <TableCell>
                            <WorkspaceStatusPill tone={getStatusTone(file.status)}>
                              {getStatusLabel(file.status)}
                            </WorkspaceStatusPill>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {getFileExtension(file.path)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Files className="h-8 w-8 text-muted-foreground" />
                          <div className="font-medium">No files yet</div>
                          <div className="text-sm text-muted-foreground">
                            Create a file or generate a build to populate the file
                            browser.
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Selected file</CardTitle>
                  <CardDescription>
                    Quick inspection for the active project file.
                  </CardDescription>
                </div>

                {selectedFile ? (
                  <WorkspaceStatusPill tone={getStatusTone(selectedFile.status)}>
                    {getStatusLabel(selectedFile.status)}
                  </WorkspaceStatusPill>
                ) : null}
              </div>
            </CardHeader>

            <CardContent>
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <FileCode2 className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="break-words font-medium">
                        {selectedFile.path}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedFile.description ??
                          `${getFileExtension(selectedFile.path)} project file.`}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Folder</span>
                      <Badge variant="outline">{getFolderName(selectedFile.path)}</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Extension</span>
                      <Badge variant="outline">
                        {getFileExtension(selectedFile.path)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Source</span>
                      <WorkspaceStatusPill tone={getSourceTone(selectedFile.source)}>
                        {selectedFile.source ?? "local"}
                      </WorkspaceStatusPill>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <WorkspaceStatusPill tone={getStatusTone(selectedFile.status)}>
                        {getStatusLabel(selectedFile.status)}
                      </WorkspaceStatusPill>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Updated</span>
                      <span className="font-medium">{lastUpdatedLabel}</span>
                    </div>
                  </div>

                  <Button
                    suppressHydrationWarning
                    type="button"
                    className="w-full"
                    onClick={onOpenCode}
                  >
                    <Code2 className="h-4 w-4" />
                    Open in code editor
                  </Button>
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                  <Files className="h-8 w-8 text-muted-foreground" />
                  <div className="font-medium">No file selected</div>
                  <p className="max-w-[260px] text-sm text-muted-foreground">
                    Select a file from the browser to inspect details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>
                Top-level folders detected in the current project tree.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {folders.length > 0 ? (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <button
                      suppressHydrationWarning
                      key={folder.name}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate font-medium">{folder.name}</span>
                      </span>

                      <Badge variant="outline" className="rounded-full">
                        {folder.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center">
                  <FolderTree className="h-8 w-8 text-muted-foreground" />
                  <div className="font-medium">No folders detected</div>
                  <p className="text-sm text-muted-foreground">
                    Folder summaries appear when files are available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspacePanel>
  );
}