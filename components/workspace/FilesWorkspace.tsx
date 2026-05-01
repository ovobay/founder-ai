"use client";

import {
  CheckCircle2,
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

import styles from "./FilesWorkspace.module.css";

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
    <WorkspacePanel
      title="Files"
      eyebrow="Project tree"
      description="Browse generated files, database-backed files, and changed workspace output."
      icon={<Files size={17} strokeWidth={2.3} />}
      badge={<WorkspaceStatusPill tone="blue">{files.length} files</WorkspaceStatusPill>}
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
      onClose={onClose}
    >
      <div className={styles.filesWorkspace}>
        <WorkspaceHero
          eyebrow="File system"
          title={`${projectName} project files`}
          description="Review created, updated, checked, and database-backed files before editing or publishing. Because trusting generated code blindly is how software becomes folklore."
          icon={<FolderTree size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone="blue">
              Updated · {lastUpdatedLabel}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Files",
            value: files.length,
            tone: files.length > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onCreateFile}
              >
                <FilePlus2 size={14} strokeWidth={2.3} />
                Create file
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onOpenCode}
              >
                <Code2 size={14} strokeWidth={2.3} />
                Open code
              </button>
            </>
          }
        />

        <WorkspaceAlert title="File review matters" tone="info">
          Generated files should be inspected before publishing. The machine can
          write code quickly, which is useful, and also exactly how nonsense
          gets deployed at speed.
        </WorkspaceAlert>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Created"
            value={createdCount}
            detail="New files generated."
            icon={<FilePlus2 size={15} strokeWidth={2.25} />}
            tone={createdCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Updated"
            value={updatedCount}
            detail="Existing files changed."
            icon={<Sparkles size={15} strokeWidth={2.25} />}
            tone={updatedCount > 0 ? "blue" : "default"}
          />

          <WorkspaceMetricCard
            label="Database"
            value={databaseCount}
            detail="Synced project files."
            icon={<Database size={15} strokeWidth={2.25} />}
            tone={databaseCount > 0 ? "purple" : "default"}
          />

          <WorkspaceMetricCard
            label="Generated"
            value={generatedCount}
            detail="AI generated output."
            icon={<FileCode2 size={15} strokeWidth={2.25} />}
            tone={generatedCount > 0 ? "blue" : "default"}
          />
        </WorkspaceMetricGrid>

        <div className={styles.filesGrid}>
          <WorkspaceCard
            title="File browser"
            description="Project files grouped by generated and database-backed output."
            badge={<WorkspaceStatusPill tone="blue">{files.length} total</WorkspaceStatusPill>}
          >
            {files.length > 0 ? (
              <div className={styles.fileList}>
                {files.map((file) => {
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <button
                      suppressHydrationWarning
                      key={file.id}
                      type="button"
                      className={`${styles.fileRow} ${
                        isSelected ? styles.fileRowSelected : ""
                      }`}
                      onClick={() => onSelectFile?.(file.id)}
                    >
                      <span className={styles.fileIcon}>
                        <File size={15} strokeWidth={2.25} />
                      </span>

                      <span className={styles.fileText}>
                        <strong>{file.path}</strong>
                        <small>
                          {file.description ?? `${getFileExtension(file.path)} file`}
                        </small>
                      </span>

                      <span className={styles.fileBadges}>
                        <WorkspaceStatusPill tone={getSourceTone(file.source)}>
                          {file.source ?? "local"}
                        </WorkspaceStatusPill>

                        <WorkspaceStatusPill tone={getStatusTone(file.status)}>
                          {getStatusLabel(file.status)}
                        </WorkspaceStatusPill>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Files size={22} strokeWidth={2.2} />}
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
                <WorkspaceStatusPill tone={getStatusTone(selectedFile.status)}>
                  {getStatusLabel(selectedFile.status)}
                </WorkspaceStatusPill>
              ) : null
            }
          >
            {selectedFile ? (
              <div className={styles.selectedFileCard}>
                <div className={styles.selectedFileTop}>
                  <span className={styles.selectedFileIcon}>
                    <FileCode2 size={22} strokeWidth={2.25} />
                  </span>

                  <div>
                    <h4>{selectedFile.path}</h4>
                    <p>
                      {selectedFile.description ??
                        `${getFileExtension(selectedFile.path)} project file.`}
                    </p>
                  </div>
                </div>

                <div className={styles.selectedFileMeta}>
                  <span>Extension · {getFileExtension(selectedFile.path)}</span>
                  <span>Source · {selectedFile.source ?? "local"}</span>
                  <span>Status · {getStatusLabel(selectedFile.status)}</span>
                </div>

                <button
                  suppressHydrationWarning
                  type="button"
                  className={styles.fullWidthAction}
                  onClick={onOpenCode}
                >
                  <Code2 size={14} strokeWidth={2.3} />
                  Open in code editor
                </button>
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Search size={22} strokeWidth={2.2} />}
                title="No file selected"
                description="Select a file to inspect details before editing."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Folders"
            description="Top-level folders detected in the current project tree."
            badge={<WorkspaceStatusPill>{folders.length} folders</WorkspaceStatusPill>}
          >
            <div className={styles.folderList}>
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <WorkspaceActionRow
                    key={folder.name}
                    title={folder.name}
                    description={`${folder.count} file${folder.count === 1 ? "" : "s"}`}
                    icon={<FolderTree size={15} strokeWidth={2.25} />}
                    badge={<WorkspaceStatusPill>{folder.count}</WorkspaceStatusPill>}
                  />
                ))
              ) : (
                <WorkspaceEmptyState
                  icon={<FolderTree size={22} strokeWidth={2.2} />}
                  title="No folders detected"
                  description="Folder summaries will appear when files are available."
                />
              )}
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}