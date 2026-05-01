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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
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
  const [draftContents, setDraftContents] = useState(
    selectedFile?.contents ?? ""
  );
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
      setStatusMessage(
        error instanceof Error ? error.message : "Delete failed."
      );
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
    <WorkspaceShell
      title="Code"
      eyebrow="File editor"
      description="Inspect and edit generated project files with save, delete, and review controls."
      icon={<Code2 className="h-4 w-4" />}
      badge={
        selectedFile ? (
          <WorkspaceStatusBadge tone={getStatusTone(selectedFile.status)}>
            {getStatusLabel(selectedFile.status)}
          </WorkspaceStatusBadge>
        ) : (
          <WorkspaceStatusBadge>No file selected</WorkspaceStatusBadge>
        )
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
          eyebrow="Code editor"
          title={
            selectedFile ? selectedFile.path : `${projectName} code workspace`
          }
          description={
            selectedFile
              ? selectedFile.description ??
                "Review this generated project file before saving or publishing."
              : "Select a file from the Files workspace to inspect and edit its contents."
          }
          icon={<FileCode2 className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone={isDirty ? "orange" : "green"}>
              {isDirty ? "Unsaved changes" : `Updated · ${lastUpdatedLabel}`}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Lines",
            value: lineCount,
            tone: selectedFile ? "blue" : "default",
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!selectedFile || !isDirty || isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving" : "Save"}
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenFiles}
              >
                <FileCode2 className="h-4 w-4" />
                Open files
              </Button>
            </>
          }
        />

        {!selectedFile ? (
          <WorkspaceEmptyState
            icon={<Code2 className="h-6 w-6" />}
            title="No file selected"
            description="Open the Files workspace and choose a file to edit."
            action={
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onOpenFiles}
              >
                Open files
              </Button>
            }
          />
        ) : (
          <>
            {!isDatabaseBacked ? (
              <WorkspaceNotice title="Preview-only file" tone="warning">
                This file may not be database-backed yet. Saving may be disabled
                depending on how persistence is wired. Because naturally files
                now have social classes.
              </WorkspaceNotice>
            ) : (
              <WorkspaceNotice title="Database-backed file" tone="success">
                This file is safe to edit and save through the project file
                store.
              </WorkspaceNotice>
            )}

            <WorkspaceMetricGrid>
              <WorkspaceMetricCard
                label="Language"
                value={language}
                detail="Detected from file extension."
                icon={<Code2 className="h-4 w-4" />}
                tone="blue"
              />

              <WorkspaceMetricCard
                label="Lines"
                value={lineCount}
                detail="Current draft line count."
                icon={<FileCode2 className="h-4 w-4" />}
                tone="purple"
              />

              <WorkspaceMetricCard
                label="Characters"
                value={characterCount.toLocaleString()}
                detail="Total draft characters."
                icon={<Sparkles className="h-4 w-4" />}
                tone="default"
              />

              <WorkspaceMetricCard
                label="State"
                value={isDirty ? "Dirty" : "Clean"}
                detail={
                  isDirty ? "Unsaved changes exist." : "No unsaved changes."
                }
                icon={
                  isDirty ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )
                }
                tone={isDirty ? "orange" : "green"}
              />
            </WorkspaceMetricGrid>

            <WorkspaceTwoColumnGrid>
              <WorkspaceCard
                title="File path"
                description="Rename the path before saving if needed."
                badge={
                  <WorkspaceStatusBadge
                    tone={isDatabaseBacked ? "purple" : "orange"}
                  >
                    {isDatabaseBacked ? "Database" : "Preview only"}
                  </WorkspaceStatusBadge>
                }
              >
                <Input
                  suppressHydrationWarning
                  value={draftPath}
                  onChange={(event) => setDraftPath(event.target.value)}
                  spellCheck={false}
                  disabled={isSaving || isDeleting}
                  className="font-mono text-sm font-semibold"
                />
              </WorkspaceCard>

              <WorkspaceCard
                title="Actions"
                description="Save, copy, delete, or return to the file browser."
                badge={
                  statusMessage ? (
                    <WorkspaceStatusBadge>{statusMessage}</WorkspaceStatusBadge>
                  ) : null
                }
              >
                <div className="grid gap-2">
                  <Button
                    suppressHydrationWarning
                    type="button"
                    className="justify-start"
                    onClick={handleSave}
                    disabled={!isDirty || isSaving || isDeleting}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving" : "Save changes"}
                  </Button>

                  <Button
                    suppressHydrationWarning
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={handleCopy}
                    disabled={!draftContents}
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied" : "Copy contents"}
                  </Button>

                  <Button
                    suppressHydrationWarning
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={onOpenFiles}
                  >
                    <FileCode2 className="h-4 w-4" />
                    Back to files
                  </Button>

                  <Button
                    suppressHydrationWarning
                    type="button"
                    variant="destructive"
                    className="justify-start"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Deleting" : "Delete file"}
                  </Button>
                </div>
              </WorkspaceCard>
            </WorkspaceTwoColumnGrid>

            <WorkspaceCard
              title="Editor"
              description="Edit the selected file contents."
              badge={<WorkspaceStatusBadge tone="blue">{language}</WorkspaceStatusBadge>}
            >
              <Textarea
                suppressHydrationWarning
                value={draftContents}
                onChange={(event) => setDraftContents(event.target.value)}
                spellCheck={false}
                disabled={isSaving || isDeleting}
                className="min-h-[560px] resize-y rounded-2xl font-mono text-[12.5px] font-semibold leading-7"
              />
            </WorkspaceCard>
          </>
        )}
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}