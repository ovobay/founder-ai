"use client";

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

import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";

: ToolButtonProps) {
  const style = {
    ["--tool-accent" as string]: accent,
    ["--tool-surface" as string]: surface,
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

: PremiumWorkspaceToolbarProps) {
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
          title={fileCountLabel ? `Files · ${fileCountLabel}` : "Files"}
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