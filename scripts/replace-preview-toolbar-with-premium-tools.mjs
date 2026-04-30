import fs from "node:fs";
import path from "node:path";

/**
 * Replaces only the real PreviewToolbar function with a premium animated
 * workspace toolbar.
 *
 * Fixes:
 * - removes duplicate toolbar-level Publish button
 * - restores Preview as the first tool
 * - adds selected tool animation via PremiumWorkspaceToolbar
 * - keeps the real top-right Publish button untouched
 *
 * Writes:
 * - components/workspace/PremiumWorkspaceToolbar.tsx
 * - components/workspace/PremiumWorkspaceToolbar.module.css
 * - updates app/page.tsx import
 * - replaces function PreviewToolbar(...)
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

const backupPath = path.join(
  root,
  `app/page.backup-before-premium-preview-toolbar-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, page);

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

function replacePreviewToolbar() {
  const marker = "function PreviewToolbar";
  const start = page.indexOf(marker);

  if (start === -1) {
    throw new Error("Could not find function PreviewToolbar in app/page.tsx.");
  }

  const openBraceIndex = page.indexOf("{", start);

  if (openBraceIndex === -1) {
    throw new Error("Could not find opening brace for PreviewToolbar.");
  }

  const closeBraceIndex = findMatchingBrace(page, openBraceIndex);

  if (closeBraceIndex === -1) {
    throw new Error("Could not find closing brace for PreviewToolbar.");
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
      onToggleSidebar={() => {
        // Sidebar toggle can be wired here later if needed.
      }}
    />
  );
}`;

  page =
    page.slice(0, start) +
    replacement +
    page.slice(closeBraceIndex + 1);

  console.log("Replaced function PreviewToolbar.");
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

    console.log("Added PremiumWorkspaceToolbar import.");
  } else {
    console.log("PremiumWorkspaceToolbar import already exists.");
  }
}

function writeToolbarComponent() {
  fs.mkdirSync(path.dirname(toolbarPath), {
    recursive: true,
  });

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
  Globe2,
  PanelLeft,
  Shield,
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
  onToggleSidebar,
}: PremiumWorkspaceToolbarProps) {
  return (
    <div className={styles.toolbarShell}>
      <button
        type="button"
        className={styles.sidebarToggle}
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <PanelLeft className={styles.sidebarIcon} />
      </button>

      <div className={styles.toolbarGroup}>
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
          accent="#5b3df5"
          surface="#f2efff"
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
  );
}
`
  );

  fs.writeFileSync(
    toolbarCssPath,
    `.toolbarShell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.toolbarGroup {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: nowrap;
}

.sidebarToggle {
  height: 42px;
  width: 42px;
  border-radius: 14px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: #101828;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  flex: 0 0 auto;
}

.sidebarToggle:hover {
  transform: translateY(-1px);
  border-color: #c8d0e0;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.sidebarIcon {
  height: 18px;
  width: 18px;
  stroke-width: 2.35;
}

.toolButton {
  --tool-accent: #2457ff;
  --tool-surface: #eef3ff;
  position: relative;
  height: 42px;
  min-width: 42px;
  max-width: 42px;
  padding: 0 11px 0 7px;
  border-radius: 14px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: var(--tool-accent);
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  overflow: hidden;
  cursor: pointer;
  transition:
    max-width 260ms cubic-bezier(0.22, 1, 0.36, 1),
    min-width 260ms cubic-bezier(0.22, 1, 0.36, 1),
    background 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease,
    transform 180ms ease;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  flex: 0 0 auto;
}

.toolButton:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--tool-accent) 28%, #d9deea);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.toolButton[data-selected="true"] {
  min-width: 126px;
  max-width: 174px;
  background: var(--tool-surface);
  border-color: color-mix(in srgb, var(--tool-accent) 42%, #ffffff);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px color-mix(in srgb, var(--tool-accent) 8%, transparent);
}

.iconWrap {
  height: 28px;
  width: 28px;
  min-width: 28px;
  border-radius: 10px;
  background: var(--tool-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--tool-accent);
  transition:
    background 220ms ease,
    color 220ms ease,
    transform 220ms ease,
    box-shadow 220ms ease;
}

.toolButton[data-selected="true"] .iconWrap {
  background: var(--tool-accent);
  color: #ffffff;
  transform: scale(1.02);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--tool-accent) 30%, transparent);
}

.icon {
  height: 16px;
  width: 16px;
  stroke-width: 2.45;
}

.toolLabel {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  transform: translateX(-8px);
  font-size: 15px;
  font-weight: 760;
  letter-spacing: -0.02em;
  color: var(--tool-accent);
  transition:
    max-width 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.toolButton[data-selected="true"] .toolLabel {
  max-width: 112px;
  opacity: 1;
  transform: translateX(0);
}

.routeDisplay {
  min-width: 220px;
  max-width: 520px;
  flex: 1;
  height: 42px;
  border-radius: 15px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: #111827;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-size: 19px;
  font-weight: 900;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.routeIcon {
  color: #64748b;
  font-size: 18px;
  margin-right: 9px;
}

@media (max-width: 1100px) {
  .routeDisplay {
    min-width: 140px;
  }

  .toolButton[data-selected="true"] {
    min-width: 42px;
    max-width: 42px;
  }

  .toolButton[data-selected="true"] .toolLabel {
    max-width: 0;
    opacity: 0;
    transform: translateX(-8px);
  }
}

@media (max-width: 760px) {
  .routeDisplay {
    display: none;
  }

  .toolbarGroup {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .toolbarGroup::-webkit-scrollbar {
    display: none;
  }
}
`
  );

  console.log("Wrote PremiumWorkspaceToolbar component and CSS module.");
}

ensureImport();
writeToolbarComponent();
replacePreviewToolbar();

fs.writeFileSync(pagePath, page);

console.log("");
console.log("✅ PreviewToolbar replaced with premium animated toolbar.");
console.log(`Backup created at: ${backupPath}`);
console.log("");
console.log("Next:");
console.log("rm -rf .next && npm run dev");