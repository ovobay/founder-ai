"use client";

import type { ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

import styles from "./PreviewCanvas.module.css";

type PreviewCanvasProps = {
  title?: string;
  generatedUrl?: string;
  isLoading?: boolean;
  children: ReactNode;

  /**
   * These props are intentionally kept optional for compatibility with
   * existing app/page.tsx wiring. PreviewCanvas no longer renders these as
   * inner-toolbar controls because the top workspace toolbar is the single
   * control surface.
   */
  deviceMode?: "desktop" | "mobile";
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
  children,
}: PreviewCanvasProps) {
  const cleanUrl = generatedUrl.replace(/^https?:\/\//, "");

  return (
    <section className={styles.previewCanvas} aria-label={title}>
      <header className={styles.previewHeader}>
        <div className={styles.previewIdentity}>
          <span className={styles.liveDot} aria-hidden="true" />

          <div className={styles.previewText}>
            <strong>{title}</strong>
            <span>{cleanUrl}</span>
          </div>
        </div>
      </header>

      <main className={styles.previewBody}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <RefreshCcw
              className={styles.loadingIcon}
              size={22}
              strokeWidth={2.25}
            />
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