"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Info,
  X,
} from "lucide-react";

import styles from "./WorkspacePanel.module.css";

type WorkspacePanelTone = "default" | "blue" | "green" | "orange" | "red" | "purple";

type WorkspacePanelProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
};

type WorkspaceHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  metric?: {
    label: string;
    value: string | number;
    tone?: WorkspacePanelTone;
  };
  actions?: ReactNode;
};

type WorkspaceMetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: WorkspacePanelTone;
};

type WorkspaceCardProps = {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

type WorkspaceActionRowProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

type WorkspaceEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

type WorkspaceStatusPillProps = {
  children: ReactNode;
  tone?: WorkspacePanelTone;
};

type WorkspaceAlertProps = {
  title?: string;
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
};

function toneClass(tone: WorkspacePanelTone | undefined) {
  if (!tone || tone === "default") return "";
  return styles[`tone${tone.charAt(0).toUpperCase()}${tone.slice(1)}`] ?? "";
}

function alertIcon(tone: WorkspaceAlertProps["tone"]) {
  if (tone === "success") return <CheckCircle2 size={16} strokeWidth={2.25} />;
  if (tone === "warning") return <AlertTriangle size={16} strokeWidth={2.25} />;
  if (tone === "danger") return <AlertTriangle size={16} strokeWidth={2.25} />;
  return <Info size={16} strokeWidth={2.25} />;
}

export function WorkspacePanel({
  title,
  eyebrow,
  description,
  icon,
  badge,
  actions,
  sidebar,
  children,
  onClose,
}: WorkspacePanelProps) {
  return (
    <section className={styles.panelShell} aria-label={title}>
      <header className={styles.panelTopbar}>
        <div className={styles.panelTitleGroup}>
          {icon ? <span className={styles.panelTitleIcon}>{icon}</span> : null}

          <div className={styles.panelTitleText}>
            {eyebrow ? <span>{eyebrow}</span> : null}
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        <div className={styles.panelTopbarActions}>
          {badge}
          {actions}

          {onClose ? (
            <button
              suppressHydrationWarning
              type="button"
              className={styles.panelCloseButton}
              aria-label="Close workspace"
              onClick={onClose}
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.panelLayout}>
        {sidebar ? <aside className={styles.panelSidebar}>{sidebar}</aside> : null}

        <main className={styles.panelMain}>{children}</main>
      </div>
    </section>
  );
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  icon,
  badge,
  metric,
  actions,
}: WorkspaceHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroMain}>
        {icon ? <span className={styles.heroIcon}>{icon}</span> : null}

        <div className={styles.heroText}>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}

          {actions ? <div className={styles.heroActions}>{actions}</div> : null}
        </div>
      </div>

      <div className={styles.heroSide}>
        {badge}

        {metric ? (
          <div className={`${styles.heroMetric} ${toneClass(metric.tone)}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function WorkspaceMetricGrid({ children }: { children: ReactNode }) {
  return <section className={styles.metricGrid}>{children}</section>;
}

export function WorkspaceMetricCard({
  label,
  value,
  detail,
  icon,
  tone = "default",
}: WorkspaceMetricCardProps) {
  return (
    <article className={`${styles.metricCard} ${toneClass(tone)}`}>
      <div className={styles.metricCardTop}>
        <span>{label}</span>
        {icon ? <span className={styles.metricIcon}>{icon}</span> : null}
      </div>

      <strong>{value}</strong>

      {detail ? <p>{detail}</p> : null}
    </article>
  );
}

export function WorkspaceCard({
  title,
  description,
  badge,
  action,
  children,
}: WorkspaceCardProps) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        <div className={styles.cardActions}>
          {badge}
          {action}
        </div>
      </header>

      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

export function WorkspaceActionRow({
  title,
  description,
  icon,
  badge,
  onClick,
  disabled,
}: WorkspaceActionRowProps) {
  const content = (
    <>
      <span className={styles.actionRowIcon}>
        {icon ?? <CircleDashed size={15} strokeWidth={2.2} />}
      </span>

      <span className={styles.actionRowText}>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>

      <span className={styles.actionRowSide}>
        {badge}
        <ArrowRight size={15} strokeWidth={2.25} />
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        className={styles.actionRow}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return <div className={styles.actionRow}>{content}</div>;
}

export function WorkspaceEmptyState({
  icon,
  title,
  description,
  action,
}: WorkspaceEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        {icon ?? <CircleDashed size={22} strokeWidth={2.15} />}
      </span>

      <strong>{title}</strong>

      {description ? <p>{description}</p> : null}

      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}

export function WorkspaceStatusPill({
  children,
  tone = "default",
}: WorkspaceStatusPillProps) {
  return (
    <span className={`${styles.statusPill} ${toneClass(tone)}`}>
      {children}
    </span>
  );
}

export function WorkspaceAlert({
  title,
  children,
  tone = "info",
}: WorkspaceAlertProps) {
  return (
    <div className={`${styles.alert} ${styles[`alert${tone.charAt(0).toUpperCase()}${tone.slice(1)}`]}`}>
      <span className={styles.alertIcon}>{alertIcon(tone)}</span>

      <div>
        {title ? <strong>{title}</strong> : null}
        <p>{children}</p>
      </div>
    </div>
  );
}