import fs from "node:fs";
import path from "node:path";

/**
 * Fixes duplicate PremiumWorkspaceToolbar definitions.
 *
 * Problem:
 * app/page.tsx imports PremiumWorkspaceToolbar AND also contains:
 *   export function PremiumWorkspaceToolbar(...)
 *
 * Fix:
 * - Remove local PremiumWorkspaceToolbar implementation from app/page.tsx.
 * - Remove local ToolButton helper and toolbar prop/helper types if present.
 * - Ensure the proper import exists once:
 *   import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";
 * - Recreate the component files to ensure they exist.
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
  `app/page.backup-before-fix-duplicate-premium-toolbar-${Date.now()}.tsx`
);

fs.writeFileSync(pageBackupPath, page);

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

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

function removeFunctionByMarkers(markers) {
  for (const marker of markers) {
    const start = page.indexOf(marker);

    if (start === -1) continue;

    const openBraceIndex = page.indexOf("{", start);

    if (openBraceIndex === -1) {
      console.log(`Could not find opening brace for ${marker}`);
      continue;
    }

    const closeBraceIndex = findMatchingBrace(page, openBraceIndex);

    if (closeBraceIndex === -1) {
      console.log(`Could not find closing brace for ${marker}`);
      continue;
    }

    page =
      page.slice(0, start).trimEnd() +
      "\n\n" +
      page.slice(closeBraceIndex + 1).trimStart();

    console.log(`Removed local function: ${marker}`);
    return true;
  }

  return false;
}

function removeTypeDeclaration(typeName) {
  const marker = `type ${typeName} =`;
  const start = page.indexOf(marker);

  if (start === -1) {
    console.log(`Type not found, skipped: ${typeName}`);
    return false;
  }

  const afterStart = page.indexOf("};", start);

  if (afterStart === -1) {
    console.log(`Could not safely remove type: ${typeName}`);
    return false;
  }

  page =
    page.slice(0, start).trimEnd() +
    "\n\n" +
    page.slice(afterStart + 2).trimStart();

  console.log(`Removed local type: ${typeName}`);
  return true;
}

/**
 * Remove local pasted toolbar component pieces from app/page.tsx.
 */
removeFunctionByMarkers([
  "export function PremiumWorkspaceToolbar",
  "function PremiumWorkspaceToolbar",
]);

removeFunctionByMarkers([
  "function ToolButton",
]);

removeTypeDeclaration("PremiumWorkspaceToolbarProps");
removeTypeDeclaration("ToolButtonProps");

/**
 * Remove bad local module CSS import if it was pasted into app/page.tsx.
 */
page = page.replace(
  /^\s*import\s+styles\s+from\s+["']\.\/PremiumWorkspaceToolbar\.module\.css["'];\s*$/gm,
  ""
);

page = page.replace(
  /^\s*import\s+styles\s+from\s+["']@\/components\/workspace\/PremiumWorkspaceToolbar\.module\.css["'];\s*$/gm,
  ""
);

/**
 * Ensure proper component import exists once.
 */
const correctImport =
  'import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";';

page = page
  .split("\n")
  .filter((line) => {
    const trimmed = line.trim();

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
  const importLines = [...page.matchAll(/^import .+;$/gm)];

  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1];
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

/**
 * Create/overwrite the actual component files.
 */
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
  gap: 12px;
  min-width: 0;
}

.toolbarLeft {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: nowrap;
}

.sidebarToggle {
  height: 44px;
  width: 44px;
  border-radius: 14px;
  border: 1px solid #d9deea;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  color: #101828;
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
  stroke-width: 2.2;
}

.toolButton {
  --tool-accent: #2457ff;
  --tool-surface: #eef3ff;
  position: relative;
  height: 44px;
  min-width: 44px;
  max-width: 44px;
  padding: 0 12px 0 8px;
  border-radius: 14px;
  border: 1px solid #d9deea;
  background: #ffffff;
  color: var(--tool-accent);
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  overflow: hidden;
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
  min-width: 136px;
  max-width: 180px;
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
  stroke-width: 2.25;
}

.toolLabel {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  transform: translateX(-8px);
  font-size: 15px;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: var(--tool-accent);
  transition:
    max-width 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.toolButton[data-selected="true"] .toolLabel {
  max-width: 110px;
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 980px) {
  .toolButton[data-selected="true"] {
    min-width: 44px;
    max-width: 44px;
  }

  .toolButton[data-selected="true"] .toolLabel {
    max-width: 0;
    opacity: 0;
    transform: translateX(-8px);
  }
}
`
);

fs.writeFileSync(pagePath, page);

console.log("");
console.log("✅ Fixed duplicate PremiumWorkspaceToolbar definition.");
console.log(`Page backup created at: ${pageBackupPath}`);
console.log(`Component written: ${toolbarPath}`);
console.log(`CSS module written: ${toolbarCssPath}`);