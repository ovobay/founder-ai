import fs from "node:fs";
import path from "node:path";

/**
 * Compacts the premium workspace toolbar and restores right-side actions.
 *
 * Fixes:
 * - toolbar buttons too large
 * - selected pill too wide
 * - missing Share / Git / Upgrade / Publish actions
 * - keeps only ONE Publish button
 *
 * Updates:
 * - components/workspace/PremiumWorkspaceToolbar.tsx
 * - components/workspace/PremiumWorkspaceToolbar.module.css
 * - app/page.tsx PreviewToolbar function
 */

const root = process.cwd();

const pagePath = path.join(root, "app/page.tsx");
const toolbarPath = path.join(
  root,
  "components/workspace/PremiumWorkspaceToolbar.tsx"
);
const toolbarCssPath = path.join(
  root,
  "components/workspace/PremiumWorkspaceToolbar.module.css"
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let page = fs.readFileSync(pagePath, "utf8");

const pageBackupPath = path.join(
  root,
  `app/page.backup-before-compact-premium-toolbar-${Date.now()}.tsx`
);

const toolbarBackupPath = fs.existsSync(toolbarPath)
  ? `${toolbarPath}.backup-${Date.now()}`
  : null;

const toolbarCssBackupPath = fs.existsSync(toolbarCssPath)
  ? `${toolbarCssPath}.backup-${Date.now()}`
  : null;

fs.writeFileSync(pageBackupPath, page);

if (toolbarBackupPath) {
  fs.copyFileSync(toolbarPath, toolbarBackupPath);
}

if (toolbarCssBackupPath) {
  fs.copyFileSync(toolbarCssPath, toolbarCssBackupPath);
}

function findMatchingBrace(text, openBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quote) {
      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function ensureImport() {
  const correctImport =
    'import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";';

  const lines = page.split("\n");
  let seen = false;

  page = lines
    .filter((line) => {
      const trimmed = line.trim();

      if (trimmed === correctImport) {
        if (seen) return false;
        seen = true;
        return true;
      }

      if (
        trimmed.startsWith("import { PremiumWorkspaceToolbar }") &&
        trimmed !== correctImport
      ) {
        return false;
      }

      return true;
    })
    .join("\n");

  if (!page.includes(correctImport)) {
    const importMatches = [...page.matchAll(/^import .+;$/gm)];

    if (importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertAt = (lastImport.index ?? 0) + lastImport[0].length;

      page =
        page.slice(0, insertAt) +
        "\n" +
        correctImport +
        page.slice(insertAt);
    } else {
      page = correctImport + "\n\n" + page;
    }
  }
}

function replacePreviewToolbar() {
  const start = page.indexOf("function PreviewToolbar");

  if (start === -1) {
    throw new Error("Could not find function PreviewToolbar.");
  }

  const openBraceIndex = page.indexOf("{", start);

  if (openBraceIndex === -1) {
    throw new Error("Could not find PreviewToolbar opening brace.");
  }

  const closeBraceIndex = findMatchingBrace(page, openBraceIndex);

  if (closeBraceIndex === -1) {
    throw new Error("Could not find PreviewToolbar closing brace.");
  }

  const replacement = `function PreviewToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
}: {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  fileCountLabel: string;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
  onOpenPublishCenter: () => void;
  previewState?: PreviewState;
  files?: ChangedFile[];
}) {
  return (
    <PremiumWorkspaceToolbar
      fileCountLabel={fileCountLabel}
      isPreviewSelected={workspaceView === "preview"}
      isFilesSelected={filesOpen}
      isCloudSelected={workspaceView === "integrations"}
      isCodeSelected={workspaceView === "code"}
      isAnalyticsSelected={workspaceView === "architecture"}
      isSecuritySelected={workspaceView === "publish-readiness"}
      onSelectPreview={() => setWorkspaceView("preview")}
      onSelectFiles={() => setFilesOpen(!filesOpen)}
      onSelectCloud={() => setWorkspaceView("integrations")}
      onSelectCode={() => setWorkspaceView("code")}
      onSelectAnalytics={() => setWorkspaceView("architecture")}
      onSelectSecurity={() => setWorkspaceView("publish-readiness")}
      onSelectMore={onOpenPublishCenter}
      onShare={() => {
        // Share action can be wired to a share modal later.
      }}
      onGit={() => {
        // Git action can be wired to repository controls later.
      }}
      onUpgrade={() => setWorkspaceView("integrations")}
      onPublish={onOpenPublishCenter}
      onToggleSidebar={() => {
        // Sidebar toggle can be wired here later.
      }}
    />
  );
}`;

  page =
    page.slice(0, start) +
    replacement +
    page.slice(closeBraceIndex + 1);
}

fs.mkdirSync(path.dirname(toolbarPath), { recursive: true });

fs.writeFileSync(
  toolbarPath,
  `"use client";

import type { CSSProperties } from "react";
import {
  BarChart3,
  Cloud,
  Code2,
  Ellipsis,
  FileText,
  GitBranch,
  Globe2,
  PanelLeft,
  Share2,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import styles from "./PremiumWorkspaceToolbar.module.css";

type PremiumWorkspaceToolbarProps = {
  fileCountLabel?: string;
  isPreviewSelected: boolean;
  isFilesSelected: boolean;
  isCloudSelected: boolean;
  isCodeSelected: boolean;
  isAnalyticsSelected: boolean;
  isSecuritySelected: boolean;
  onSelectPreview: () => void;
  onSelectFiles: () => void;
  onSelectCloud: () => void;
  onSelectCode: () => void;
  onSelectAnalytics: () => void;
  onSelectSecurity: () => void;
  onSelectMore?: () => void;
  onShare?: () => void;
  onGit?: () => void;
  onUpgrade?: () => void;
  onPublish?: () => void;
  onToggleSidebar?: () => void;
};

type ToolButtonProps = {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
  accent: string;
  surface: string;
  title?: string;
};

function ToolButton({
  label,
  icon: Icon,
  selected,
  onClick,
  accent,
  surface,
  title,
}: ToolButtonProps) {
  const style = {
    "--tool-accent": accent,
    "--tool-surface": surface,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={styles.toolButton}
      data-selected={selected ? "true" : "false"}
      onClick={onClick}
      title={title ?? label}
      style={style}
      aria-pressed={selected}
    >
      <span className={styles.iconWrap}>
        <Icon className={styles.icon} />
      </span>

      <span className={styles.toolLabel}>{label}</span>
    </button>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant = "neutral",
}: {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "neutral" | "upgrade" | "publish";
}) {
  return (
    <button
      type="button"
      className={[styles.actionButton, styles[variant]].join(" ")}
      onClick={onClick}
    >
      {Icon ? <Icon className={styles.actionIcon} /> : null}
      <span>{label}</span>
    </button>
  );
}

export function PremiumWorkspaceToolbar({
  fileCountLabel,
  isPreviewSelected,
  isFilesSelected,
  isCloudSelected,
  isCodeSelected,
  isAnalyticsSelected,
  isSecuritySelected,
  onSelectPreview,
  onSelectFiles,
  onSelectCloud,
  onSelectCode,
  onSelectAnalytics,
  onSelectSecurity,
  onSelectMore,
  onShare,
  onGit,
  onUpgrade,
  onPublish,
  onToggleSidebar,
}: PremiumWorkspaceToolbarProps) {
  return (
    <div className={styles.toolbarShell}>
      <div className={styles.toolbarLeft}>
        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <PanelLeft className={styles.sidebarIcon} />
        </button>

        <div className={styles.toolCluster}>
          <ToolButton
            label="Preview"
            icon={Globe2}
            selected={isPreviewSelected}
            onClick={onSelectPreview}
            accent="#2457ff"
            surface="#eef3ff"
          />

          <ToolButton
            label="Files"
            icon={FileText}
            selected={isFilesSelected}
            onClick={onSelectFiles}
            accent="#111827"
            surface="#f2f4f7"
            title={fileCountLabel ? \`Files · \${fileCountLabel}\` : "Files"}
          />

          <ToolButton
            label="Cloud"
            icon={Cloud}
            selected={isCloudSelected}
            onClick={onSelectCloud}
            accent="#4f46e5"
            surface="#eff0ff"
          />

          <ToolButton
            label="Code"
            icon={Code2}
            selected={isCodeSelected}
            onClick={onSelectCode}
            accent="#0f172a"
            surface="#eef2f7"
          />

          <ToolButton
            label="Analytics"
            icon={BarChart3}
            selected={isAnalyticsSelected}
            onClick={onSelectAnalytics}
            accent="#2563eb"
            surface="#eef5ff"
          />

          <ToolButton
            label="Security"
            icon={Shield}
            selected={isSecuritySelected}
            onClick={onSelectSecurity}
            accent="#6d28d9"
            surface="#f3efff"
          />

          <ToolButton
            label="More"
            icon={Ellipsis}
            selected={false}
            onClick={onSelectMore ?? (() => {})}
            accent="#475467"
            surface="#f5f7fa"
          />
        </div>

        <div className={styles.routeDisplay} aria-label="Current preview route">
          <span className={styles.routeIcon} aria-hidden="true">
            ▭
          </span>
          <span>/</span>
        </div>
      </div>

      <div className={styles.toolbarRight}>
        <ActionButton label="Share" icon={Share2} onClick={onShare} />
        <ActionButton label="Git" icon={GitBranch} onClick={onGit} />
        <ActionButton
          label="Upgrade"
          icon={Sparkles}
          onClick={onUpgrade}
          variant="upgrade"
        />
        <ActionButton label="Publish" onClick={onPublish} variant="publish" />
      </div>
    </div>
  );
}
`
);

fs.writeFileSync(
  toolbarCssPath,
  `.toolbarShell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.toolbarLeft {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.toolbarRight {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  flex: 0 0 auto;
}

.toolCluster {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 0 0 auto;
}

.sidebarToggle {
  height: 36px;
  width: 36px;
  border-radius: 11px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: #101828;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  flex: 0 0 auto;
}

.sidebarToggle:hover {
  transform: translateY(-1px);
  border-color: #c8d0e0;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.sidebarIcon {
  height: 16px;
  width: 16px;
  stroke-width: 2.35;
}

.toolButton {
  --tool-accent: #2457ff;
  --tool-surface: #eef3ff;
  position: relative;
  height: 36px;
  min-width: 36px;
  max-width: 36px;
  padding: 0 9px 0 5px;
  border-radius: 11px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: var(--tool-accent);
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  overflow: hidden;
  cursor: pointer;
  transition:
    max-width 240ms cubic-bezier(0.22, 1, 0.36, 1),
    min-width 240ms cubic-bezier(0.22, 1, 0.36, 1),
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 160ms ease;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  flex: 0 0 auto;
}

.toolButton:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--tool-accent) 28%, #d9deea);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.toolButton[data-selected="true"] {
  min-width: 104px;
  max-width: 142px;
  background: var(--tool-surface);
  border-color: color-mix(in srgb, var(--tool-accent) 42%, #ffffff);
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px color-mix(in srgb, var(--tool-accent) 9%, transparent);
}

.iconWrap {
  height: 25px;
  width: 25px;
  min-width: 25px;
  border-radius: 9px;
  background: var(--tool-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--tool-accent);
  transition:
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.toolButton[data-selected="true"] .iconWrap {
  background: var(--tool-accent);
  color: #ffffff;
  transform: scale(1.02);
  box-shadow: 0 7px 14px color-mix(in srgb, var(--tool-accent) 28%, transparent);
}

.icon {
  height: 14.5px;
  width: 14.5px;
  stroke-width: 2.55;
}

.toolLabel {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  transform: translateX(-7px);
  font-size: 13.5px;
  font-weight: 760;
  letter-spacing: -0.02em;
  color: var(--tool-accent);
  transition:
    max-width 240ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease,
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.toolButton[data-selected="true"] .toolLabel {
  max-width: 92px;
  opacity: 1;
  transform: translateX(0);
}

.routeDisplay {
  min-width: 140px;
  max-width: 440px;
  flex: 1;
  height: 36px;
  border-radius: 12px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: #111827;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.routeIcon {
  color: #64748b;
  font-size: 16px;
  margin-right: 8px;
}

.actionButton {
  min-height: 36px;
  border-radius: 11px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  font-size: 13.5px;
  font-weight: 760;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.actionButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.actionIcon {
  height: 14.5px;
  width: 14.5px;
  stroke-width: 2.5;
}

.neutral {
  background: #ffffff;
  color: #111827;
}

.upgrade {
  border-color: rgba(124, 58, 237, 0.34);
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(124, 58, 237, 0.2);
}

.publish {
  border-color: rgba(37, 99, 235, 0.34);
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}

@media (max-width: 1220px) {
  .actionButton span {
    display: none;
  }

  .actionButton {
    width: 36px;
    padding: 0;
  }

  .publish {
    width: auto;
    padding: 0 12px;
  }

  .publish span {
    display: inline;
  }
}

@media (max-width: 1060px) {
  .toolButton[data-selected="true"] {
    min-width: 36px;
    max-width: 36px;
  }

  .toolButton[data-selected="true"] .toolLabel {
    max-width: 0;
    opacity: 0;
    transform: translateX(-7px);
  }
}

@media (max-width: 860px) {
  .toolbarShell {
    flex-wrap: wrap;
  }

  .toolbarLeft,
  .toolbarRight {
    width: 100%;
  }

  .toolbarRight {
    justify-content: flex-end;
  }

  .routeDisplay {
    display: none;
  }
}
`
);

ensureImport();
replacePreviewToolbar();

fs.writeFileSync(pagePath, page);

console.log("");
console.log("✅ Compact toolbar applied and right-side actions restored.");
console.log(`Page backup: ${pageBackupPath}`);

if (toolbarBackupPath) {
  console.log(`Toolbar backup: ${toolbarBackupPath}`);
}

if (toolbarCssBackupPath) {
  console.log(`Toolbar CSS backup: ${toolbarCssBackupPath}`);
}