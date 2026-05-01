"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Code2,
  FileCode2,
  Monitor,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import styles from "./PreviewCanvas.module.css";

type PreviewCanvasProps = {
  title?: string;
  generatedUrl?: string;
  isLoading?: boolean;
  deviceMode?: "desktop" | "mobile";
  children: ReactNode;
  onRefresh?: () => void;
  onOpenCode?: () => void;
  onOpenFiles?: () => void;
  onOpenPublish?: () => void;
  onOpenSecurity?: () => void;
  onSetDeviceMode?: (mode: "desktop" | "mobile") => void;
};

export function PreviewCanvas({
  title = "Generated preview",
  generatedUrl = "https://founder-ai-build.founder-ai.app",
  isLoading = false,
  deviceMode = "desktop",
  children,
  onRefresh,
  onOpenCode,
  onOpenFiles,
  onOpenPublish,
  onOpenSecurity,
  onSetDeviceMode,
}: PreviewCanvasProps) {
  return (
    <section className={styles.previewCanvas} aria-label={title}>
      <header className={styles.previewBar}>
        <div className={styles.previewIdentity}>
          <span className={styles.liveDot} aria-hidden="true" />

          <div className={styles.previewTitleGroup}>
            <strong>{title}</strong>
            <span>{generatedUrl.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>

        <div className={styles.previewControls}>
          <div className={styles.deviceSwitch} aria-label="Preview device mode">
            <button
              suppressHydrationWarning
              type="button"
              className={deviceMode === "desktop" ? styles.activeDevice : ""}
              aria-pressed={deviceMode === "desktop"}
              onClick={() => onSetDeviceMode?.("desktop")}
            >
              <Monitor size={14} strokeWidth={2.25} />
              Desktop
            </button>

            <button
              suppressHydrationWarning
              type="button"
              className={deviceMode === "mobile" ? styles.activeDevice : ""}
              aria-pressed={deviceMode === "mobile"}
              onClick={() => onSetDeviceMode?.("mobile")}
            >
              <Smartphone size={14} strokeWidth={2.25} />
              Mobile
            </button>
          </div>

          <button
            suppressHydrationWarning
            type="button"
            className={styles.iconAction}
            aria-label="Refresh preview"
            title="Refresh preview"
            onClick={onRefresh}
          >
            <RefreshCcw size={14} strokeWidth={2.25} />
          </button>

          <button
            suppressHydrationWarning
            type="button"
            className={styles.iconAction}
            aria-label="Open files"
            title="Open files"
            onClick={onOpenFiles}
          >
            <FileCode2 size={14} strokeWidth={2.25} />
          </button>

          <button
            suppressHydrationWarning
            type="button"
            className={styles.iconAction}
            aria-label="Open code"
            title="Open code"
            onClick={onOpenCode}
          >
            <Code2 size={14} strokeWidth={2.25} />
          </button>

          <button
            suppressHydrationWarning
            type="button"
            className={styles.iconAction}
            aria-label="Security review"
            title="Security review"
            onClick={onOpenSecurity}
          >
            <ShieldCheck size={14} strokeWidth={2.25} />
          </button>

          <button
            suppressHydrationWarning
            type="button"
            className={styles.publishAction}
            onClick={onOpenPublish}
          >
            <Rocket size={14} strokeWidth={2.25} />
            Publish
          </button>

          <a
            className={styles.openAction}
            href={generatedUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open preview in new tab"
            title="Open preview in new tab"
          >
            <ArrowUpRight size={14} strokeWidth={2.25} />
          </a>
        </div>
      </header>

      <main className={styles.previewStage} data-device={deviceMode}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <RefreshCcw className={styles.loadingIcon} size={22} strokeWidth={2.25} />
            <strong>Generating preview…</strong>
            <span>The generated result will appear here.</span>
          </div>
        ) : (
          <div className={styles.previewViewport}>{children}</div>
        )}
      </main>
    </section>
  );
}
