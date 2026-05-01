"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  FileCode2,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  WorkspaceAlert,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceStatusPill,
} from "./tool-system/WorkspacePanel";

import styles from "./CodeWorkspacePanel.module.css";

export type CodeWorkspaceFile = {
  id: string;
  path: string;
  contents: string;
  description?: string;
  status?: "created" | "updated" | "checked" | "deleted";
  source?: "database" | "generated" | "local";
  isDatabaseBacked?: boolean;
};

export type CodeWorkspacePanelProps = {
  projectName?: string;
  lastUpdatedLabel?: string;
  selectedFile?: CodeWorkspaceFile | null;
  onClose?: () => void;
  onSaveFile?: (
    fileId: string,
    path: string,
    contents: string
  ) => Promise<void> | void;
  onDeleteFile?: (fileId: string) => Promise<void> | void;
  onOpenFiles?: () => void;
  onRefresh?: () => void;
};

function getLanguageFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();

  if (extension === "tsx") return "TSX";
  if (extension === "ts") return "TypeScript";
  if (extension === "jsx") return "JSX";
  if (extension === "js") return "JavaScript";
  if (extension === "css") return "CSS";
  if (extension === "json") return "JSON";
  if (extension === "md") return "Markdown";
  if (extension === "sql") return "SQL";

  return extension ? extension.toUpperCase() : "Code";
}

function countLines(contents: string) {
  if (!contents) return 0;
  return contents.split("\n").length;
}

function countCharacters(contents: string) {
  return contents.length;
}

function getStatusTone(status?: CodeWorkspaceFile["status"]) {
  if (status === "created") return "green" as const;
  if (status === "updated") return "blue" as const;
  if (status === "deleted") return "red" as const;
  return "default" as const;
}

function getStatusLabel(status?: CodeWorkspaceFile["status"]) {
  if (status === "created") return "Created";
  if (status === "updated") return "Updated";
  if (status === "deleted") return "Deleted";
  return "Checked";
}

export function CodeWorkspacePanel({
  projectName = "Founder AI workspace",
  lastUpdatedLabel = "Just now",
  selectedFile,
  onClose,
  onSaveFile,
  onDeleteFile,
  onOpenFiles,
  onRefresh,
}: CodeWorkspacePanelProps) {
  const [draftPath, setDraftPath] = useState(selectedFile?.path ?? "");
  const [draftContents, setDraftContents] = useState(selectedFile?.contents ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraftPath(selectedFile?.path ?? "");
    setDraftContents(selectedFile?.contents ?? "");
    setStatusMessage("");
    setCopied(false);
  }, [selectedFile?.id, selectedFile?.path, selectedFile?.contents]);

  const isDatabaseBacked = Boolean(selectedFile?.isDatabaseBacked);
  const isDirty =
    draftPath !== (selectedFile?.path ?? "") ||
    draftContents !== (selectedFile?.contents ?? "");

  const language = useMemo(
    () => getLanguageFromPath(draftPath || selectedFile?.path || ""),
    [draftPath, selectedFile?.path]
  );

  const lineCount = countLines(draftContents);
  const characterCount = countCharacters(draftContents);

  async function handleSave() {
    if (!selectedFile || !isDirty || !onSaveFile) return;

    setIsSaving(true);
    setStatusMessage("");

    try {
      await onSaveFile(selectedFile.id, draftPath, draftContents);
      setStatusMessage("Saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedFile || !onDeleteFile) return;

    const confirmed = window.confirm(`Delete ${selectedFile.path}?`);

    if (!confirmed) return;

    setIsDeleting(true);
    setStatusMessage("");

    try {
      await onDeleteFile(selectedFile.id);
      setStatusMessage("Deleted.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draftContents);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <WorkspacePanel
      title="Code"
      eyebrow="File editor"
      description="Inspect and edit generated project files with save, delete, and review controls."
      icon={<Code2 size={17} strokeWidth={2.3} />}
      badge={
        selectedFile ? (
          <WorkspaceStatusPill tone={getStatusTone(selectedFile.status)}>
            {getStatusLabel(selectedFile.status)}
          </WorkspaceStatusPill>
        ) : (
          <WorkspaceStatusPill>No file selected</WorkspaceStatusPill>
        )
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
      onClose={onClose}
    >
      <div className={styles.codeWorkspace}>
        <WorkspaceHero
          eyebrow="Code editor"
          title={selectedFile ? selectedFile.path : `${projectName} code workspace`}
          description={
            selectedFile
              ? selectedFile.description ??
                "Review this generated project file before saving or publishing."
              : "Select a file from the Files workspace to inspect and edit its contents."
          }
          icon={<FileCode2 size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone={isDirty ? "orange" : "green"}>
              {isDirty ? "Unsaved changes" : `Updated · ${lastUpdatedLabel}`}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Lines",
            value: lineCount,
            tone: selectedFile ? "blue" : "default",
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={handleSave}
                disabled={!selectedFile || !isDirty || isSaving}
              >
                <Save size={14} strokeWidth={2.3} />
                {isSaving ? "Saving" : "Save"}
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onOpenFiles}
              >
                <FileCode2 size={14} strokeWidth={2.3} />
                Open files
              </button>
            </>
          }
        />

        {!selectedFile ? (
          <WorkspaceEmptyState
            icon={<Code2 size={22} strokeWidth={2.2} />}
            title="No file selected"
            description="Open the Files workspace and choose a file to edit."
            action={
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onOpenFiles}
              >
                Open files
              </button>
            }
          />
        ) : (
          <>
            {!isDatabaseBacked ? (
              <WorkspaceAlert title="Preview-only file" tone="warning">
                This file may not be database-backed yet. Saving may be disabled
                depending on how the parent workspace wires persistence. Because
                naturally files now have social classes.
              </WorkspaceAlert>
            ) : (
              <WorkspaceAlert title="Database-backed file" tone="success">
                This file is safe to edit and save through the project file store.
              </WorkspaceAlert>
            )}

            <WorkspaceMetricGrid>
              <WorkspaceMetricCard
                label="Language"
                value={language}
                detail="Detected from file extension."
                icon={<Code2 size={15} strokeWidth={2.25} />}
                tone="blue"
              />

              <WorkspaceMetricCard
                label="Lines"
                value={lineCount}
                detail="Current draft line count."
                icon={<FileCode2 size={15} strokeWidth={2.25} />}
                tone="purple"
              />

              <WorkspaceMetricCard
                label="Characters"
                value={characterCount.toLocaleString()}
                detail="Total draft characters."
                icon={<Sparkles size={15} strokeWidth={2.25} />}
                tone="default"
              />

              <WorkspaceMetricCard
                label="State"
                value={isDirty ? "Dirty" : "Clean"}
                detail={isDirty ? "Unsaved changes exist." : "No unsaved changes."}
                icon={
                  isDirty ? (
                    <AlertTriangle size={15} strokeWidth={2.25} />
                  ) : (
                    <CheckCircle2 size={15} strokeWidth={2.25} />
                  )
                }
                tone={isDirty ? "orange" : "green"}
              />
            </WorkspaceMetricGrid>

            <div className={styles.codeGrid}>
              <WorkspaceCard
                title="File path"
                description="Rename the path before saving if needed."
                badge={
                  <WorkspaceStatusPill tone={isDatabaseBacked ? "purple" : "orange"}>
                    {isDatabaseBacked ? "Database" : "Preview only"}
                  </WorkspaceStatusPill>
                }
              >
                <input
                  suppressHydrationWarning
                  className={styles.pathInput}
                  value={draftPath}
                  onChange={(event) => setDraftPath(event.target.value)}
                  spellCheck={false}
                  disabled={isSaving || isDeleting}
                />
              </WorkspaceCard>

              <WorkspaceCard
                title="Actions"
                description="Save, copy, delete, or return to the file browser."
                badge={statusMessage ? <WorkspaceStatusPill>{statusMessage}</WorkspaceStatusPill> : null}
              >
                <div className={styles.actionList}>
                  <button
                    suppressHydrationWarning
                    type="button"
                    className={styles.actionButton}
                    onClick={handleSave}
                    disabled={!isDirty || isSaving || isDeleting}
                  >
                    <Save size={14} strokeWidth={2.3} />
                    {isSaving ? "Saving" : "Save changes"}
                  </button>

                  <button
                    suppressHydrationWarning
                    type="button"
                    className={styles.actionButton}
                    onClick={handleCopy}
                    disabled={!draftContents}
                  >
                    <Copy size={14} strokeWidth={2.3} />
                    {copied ? "Copied" : "Copy contents"}
                  </button>

                  <button
                    suppressHydrationWarning
                    type="button"
                    className={styles.actionButton}
                    onClick={onOpenFiles}
                  >
                    <FileCode2 size={14} strokeWidth={2.3} />
                    Back to files
                  </button>

                  <button
                    suppressHydrationWarning
                    type="button"
                    className={`${styles.actionButton} ${styles.dangerButton}`}
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} strokeWidth={2.3} />
                    {isDeleting ? "Deleting" : "Delete file"}
                  </button>
                </div>
              </WorkspaceCard>

              <WorkspaceCard
                title="Editor"
                description="Edit the selected file contents."
                badge={<WorkspaceStatusPill tone="blue">{language}</WorkspaceStatusPill>}
              >
                <textarea
                  suppressHydrationWarning
                  className={styles.codeEditor}
                  value={draftContents}
                  onChange={(event) => setDraftContents(event.target.value)}
                  spellCheck={false}
                  disabled={isSaving || isDeleting}
                />
              </WorkspaceCard>
            </div>
          </>
        )}
      </div>
    </WorkspacePanel>
  );
}