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
  if (status === "created") return "green" as const;
  if (status === "updated") return "blue" as const;
  if (status === "deleted") return "red" as const;

  return "default" as const;
}

function getStatusLabel(status: WorkspaceFileStatus) {
  if (status === "created") return "Created";
  if (status === "updated") return "Updated";
  if (status === "deleted") return "Deleted";

  return "Checked";
}

function getSourceTone(source?: WorkspaceFileItem["source"]) {
  if (source === "database") return "purple" as const;
  if (source === "generated") return "blue" as const;

  return "default" as const;
}

function getFileExtension(path: string) {
  const parts = path.split(".");

  return parts.length > 1 ? parts.at(-1) || "file" : "file";
}

function getTopFolders(files: WorkspaceFileItem[]) {
  const folders = new Map<string, number>();

  files.forEach((file) => {
    const folder = file.path.includes("/") ? file.path.split("/")[0] : "root";
    folders.set(folder, (folders.get(folder) ?? 0) + 1);
  });

  return Array.from(folders.entries()).map(([name, count]) => ({
    name,
    count,
  }));
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
    <WorkspaceShell
      title="Files"
      eyebrow="Project tree"
      description="Browse generated files, database-backed files, and changed workspace output."
      icon={<Files className="h-4 w-4" />}
      badge={
        <WorkspaceStatusBadge tone="blue">
          {files.length} files
        </WorkspaceStatusBadge>
      }
      actions={
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
      }
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="File system"
          title={`${projectName} project files`}
          description="Review created, updated, checked, and database-backed files before editing or publishing. Generated code is fast. That does not make it innocent."
          icon={<FolderTree className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone="blue">
              Updated · {lastUpdatedLabel}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Files",
            value: files.length,
            tone: files.length > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onCreateFile}
              >
                <FilePlus2 className="h-4 w-4" />
                Create file
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenCode}
              >
                <Code2 className="h-4 w-4" />
                Open code
              </Button>
            </>
          }
        />

        <WorkspaceNotice title="File review matters" tone="info">
          Generated files should be inspected before publishing. The machine can
          write code quickly, which is useful, and also exactly how nonsense gets
          deployed at speed.
        </WorkspaceNotice>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Created"
            value={createdCount}
            detail="New files generated."
            icon={<FilePlus2 className="h-4 w-4" />}
            tone={createdCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Updated"
            value={updatedCount}
            detail="Existing files changed."
            icon={<Sparkles className="h-4 w-4" />}
            tone={updatedCount > 0 ? "blue" : "default"}
          />

          <WorkspaceMetricCard
            label="Database"
            value={databaseCount}
            detail="Synced project files."
            icon={<Database className="h-4 w-4" />}
            tone={databaseCount > 0 ? "purple" : "default"}
          />

          <WorkspaceMetricCard
            label="Generated"
            value={generatedCount}
            detail="AI generated output."
            icon={<FileCode2 className="h-4 w-4" />}
            tone={generatedCount > 0 ? "blue" : "default"}
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="File browser"
            description="Project files grouped by generated and database-backed output."
            badge={
              <WorkspaceStatusBadge tone="blue">
                {files.length} total
              </WorkspaceStatusBadge>
            }
          >
            {files.length > 0 ? (
              <div className="grid gap-2">
                {files.map((file) => {
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <button
                      suppressHydrationWarning
                      key={file.id}
                      type="button"
                      onClick={() => onSelectFile?.(file.id)}
                      className={[
                        "grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm",
                        isSelected
                          ? "border-blue-300 bg-blue-50/50 shadow-sm"
                          : "",
                      ].join(" ")}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
                        <File className="h-4 w-4" />
                      </span>

                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-bold tracking-tight text-foreground">
                          {file.path}
                        </strong>

                        <small className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
                          {file.description ?? `${getFileExtension(file.path)} file`}
                        </small>
                      </span>

                      <span className="flex flex-wrap justify-end gap-1.5">
                        <WorkspaceStatusBadge tone={getSourceTone(file.source)}>
                          {file.source ?? "local"}
                        </WorkspaceStatusBadge>

                        <WorkspaceStatusBadge tone={getStatusTone(file.status)}>
                          {getStatusLabel(file.status)}
                        </WorkspaceStatusBadge>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Files className="h-6 w-6" />}
                title="No files yet"
                description="Create a file or generate a build to populate the project tree."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Selected file"
            description="Quick inspection for the currently selected project file."
            badge={
              selectedFile ? (
                <WorkspaceStatusBadge tone={getStatusTone(selectedFile.status)}>
                  {getStatusLabel(selectedFile.status)}
                </WorkspaceStatusBadge>
              ) : null
            }
          >
            {selectedFile ? (
              <div className="grid gap-3">
                <div className="flex min-h-36 items-start gap-3 rounded-2xl border bg-background p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                    <FileCode2 className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <h4 className="break-words text-base font-bold tracking-tight text-foreground">
                      {selectedFile.path}
                    </h4>

                    <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
                      {selectedFile.description ??
                        `${getFileExtension(selectedFile.path)} project file.`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <span className="rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                    Extension · {getFileExtension(selectedFile.path)}
                  </span>
                  <span className="rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                    Source · {selectedFile.source ?? "local"}
                  </span>
                  <span className="rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                    Status · {getStatusLabel(selectedFile.status)}
                  </span>
                </div>

                <Button
                  suppressHydrationWarning
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onOpenCode}
                >
                  <Code2 className="h-4 w-4" />
                  Open in code editor
                </Button>
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Search className="h-6 w-6" />}
                title="No file selected"
                description="Select a file to inspect details before editing."
              />
            )}
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Folders"
          description="Top-level folders detected in the current project tree."
          badge={<WorkspaceStatusBadge>{folders.length} folders</WorkspaceStatusBadge>}
        >
          <div className="grid gap-2">
            {folders.length > 0 ? (
              folders.map((folder) => (
                <WorkspaceActionRow
                  key={folder.name}
                  title={folder.name}
                  description={`${folder.count} file${folder.count === 1 ? "" : "s"}`}
                  icon={<FolderTree className="h-4 w-4" />}
                  badge={<WorkspaceStatusBadge>{folder.count}</WorkspaceStatusBadge>}
                />
              ))
            ) : (
              <WorkspaceEmptyState
                icon={<FolderTree className="h-6 w-6" />}
                title="No folders detected"
                description="Folder summaries will appear when files are available."
              />
            )}
          </div>
        </WorkspaceCard>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}