"use client";

import type { ReactNode } from "react";
import { Pin } from "lucide-react";

type WorkspaceToolNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  pinned?: boolean;
  badge?: ReactNode;
};

type WorkspaceToolShellProps = {
  title: string;
  children: ReactNode;
  sidebar?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
};

type WorkspaceToolNavProps = {
  items: WorkspaceToolNavItem[];
  activeItemId: string;
  onSelectItem: (itemId: string) => void;
};

export function WorkspaceToolShell({
  title,
  children,
  sidebar,
  actions,
  onClose,
}: WorkspaceToolShellProps) {
  return (
    <section className="workspace-tool-shell">
      <header className="workspace-tool-topbar">
        <div className="workspace-tool-topbar-left">{actions}</div>

        <div className="workspace-tool-title">{title}</div>

        <div className="workspace-tool-topbar-right">
          {onClose ? (
            <button
              suppressHydrationWarning
              type="button"
              className="workspace-tool-close-button"
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="workspace-tool-body">
        {sidebar ? (
          <div className="workspace-tool-split">
            <aside className="workspace-tool-sidebar">{sidebar}</aside>
            <main className="workspace-tool-main">{children}</main>
          </div>
        ) : (
          <main className="workspace-tool-main">{children}</main>
        )}
      </div>
    </section>
  );
}

export function WorkspaceToolNav({
  items,
  activeItemId,
  onSelectItem,
}: WorkspaceToolNavProps) {
  return (
    <nav className="workspace-tool-nav" aria-label="Workspace tool navigation">
      {items.map((item) => (
        <button
          suppressHydrationWarning
          key={item.id}
          type="button"
          className={[
            "workspace-tool-nav-button",
            activeItemId === item.id ? "is-active" : "",
          ].join(" ")}
          onClick={() => onSelectItem(item.id)}
        >
          <span>
            {item.icon}
            {item.label}
          </span>

          {item.badge ? (
            item.badge
          ) : item.pinned ? (
            <Pin className="workspace-tool-pin" />
          ) : null}
        </button>
      ))}
    </nav>
  );
}

export function WorkspaceToolEmpty({
  icon,
  title,
  body,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="workspace-tool-empty">
      <div className="workspace-tool-empty-inner">
        {icon ? <div className="workspace-tool-empty-icon">{icon}</div> : null}
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

export function WorkspaceToolCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="workspace-tool-card">
      <div className="workspace-tool-card-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      <div className="workspace-tool-card-body">{children}</div>
    </section>
  );
}