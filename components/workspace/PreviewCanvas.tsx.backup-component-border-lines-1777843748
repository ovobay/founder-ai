"use client";

import type { ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

import styles from "./PreviewCanvas.module.css";

type PreviewCanvasProps = {
  title?: string;
  generatedUrl?: string;
  isLoading?: boolean;
  children: ReactNode;

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
  isLoading = false,
  children,
}: PreviewCanvasProps) {
  return (
    <section
      className={styles.previewCanvas}
      data-preview-frame="true"
      aria-label={title}
    >
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
        <div className={styles.previewViewport} data-preview-viewport="true">
          {children}
        </div>
      )}
    </section>
  );
}
