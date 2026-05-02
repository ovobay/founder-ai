"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type WorkspaceTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const toneClasses: Record<WorkspaceTone, string> = {
  default:
    "border-slate-200 bg-white text-slate-700",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700",
  info:
    "border-blue-200 bg-blue-50 text-blue-700",
  neutral:
    "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export function WorkspaceSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-full rounded-[28px] border border-slate-200/80 bg-[#fcfcfd] shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WorkspacePanel({
  eyebrow,
  title,
  description,
  status,
  statusTone = "default",
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  status?: string;
  statusTone?: WorkspaceTone;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[26px] border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div className="space-y-1">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {eyebrow}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <CardTitle className="text-[20px] font-semibold tracking-[-0.03em] text-slate-950">
              {title}
            </CardTitle>

            {status ? (
              <WorkspaceStatusPill tone={statusTone}>
                {status}
              </WorkspaceStatusPill>
            ) : null}
          </div>

          {description ? (
            <CardDescription className="max-w-[900px] text-[14px] leading-6 text-slate-600">
              {description}
            </CardDescription>
          ) : null}
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>

      <CardContent className="px-6 py-6">{children}</CardContent>
    </Card>
  );
}

export function WorkspaceStatusPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: WorkspaceTone;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-3 py-1 text-[12px] font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </Badge>
  );
}

export function WorkspaceMetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WorkspaceMetricCard({
  label,
  value,
  description,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  description?: string;
  tone?: WorkspaceTone;
  icon?: React.ReactNode;
}) {
  const softToneMap: Record<WorkspaceTone, string> = {
    default: "border-slate-200 bg-slate-50/70",
    success: "border-emerald-200 bg-emerald-50/70",
    warning: "border-amber-200 bg-amber-50/70",
    danger: "border-rose-200 bg-rose-50/70",
    info: "border-blue-200 bg-blue-50/70",
    neutral: "border-zinc-200 bg-zinc-50/70",
  };

  return (
    <Card className={cn("rounded-[22px] shadow-none", softToneMap[tone])}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
          {icon ? <div className="text-slate-500">{icon}</div> : null}
        </div>

        <div className="text-[42px] font-semibold leading-none tracking-[-0.04em] text-slate-950">
          {value}
        </div>

        {description ? (
          <p className="mt-3 text-[14px] leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function WorkspaceCallout({
  title,
  description,
  tone = "info",
  action,
}: {
  title: string;
  description?: string;
  tone?: WorkspaceTone;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4",
        toneClasses[tone],
      )}
    >
      <div>
        <div className="text-[14px] font-semibold">{title}</div>
        {description ? (
          <p className="mt-1 text-[14px] leading-6 opacity-90">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function WorkspaceSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-[22px] border-slate-200 shadow-none", className)}>
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-[16px] font-semibold tracking-[-0.02em] text-slate-950">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-1 text-[14px] leading-6 text-slate-600">
                {description}
              </CardDescription>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>

      <CardContent className="px-5 py-5">{children}</CardContent>
    </Card>
  );
}

export function WorkspaceSidebarLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <div>{sidebar}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function WorkspaceSidebarNav({
  items,
  activeKey,
  onChange,
}: {
  items: Array<{
    key: string;
    label: string;
    badge?: string;
  }>;
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <Card className="rounded-[22px] border-slate-200 shadow-none">
      <CardContent className="p-3">
        <div className="flex flex-col gap-1.5">
          {items.map((item) => {
            const active = item.key === activeKey;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {item.badge}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceList({
  rows,
}: {
  rows: Array<{
    label: string;
    value: React.ReactNode;
    description?: string;
    trailing?: React.ReactNode;
  }>;
}) {
  return (
    <div className="divide-y divide-slate-200 rounded-[18px] border border-slate-200">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="flex items-start justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-slate-950">{row.label}</div>
            {row.description ? (
              <div className="mt-1 text-[13px] leading-5 text-slate-600">
                {row.description}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[14px] font-medium text-slate-700">{row.value}</div>
            {row.trailing}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkspaceScrollable({
  children,
  className,
  height = 520,
}: {
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <ScrollArea
      className={cn("rounded-[18px] border border-slate-200", className)}
      style={{ height }}
    >
      <div className="p-4">{children}</div>
    </ScrollArea>
  );
}

export function WorkspaceEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-950">
        {title}
      </h3>
      <p className="mt-2 max-w-[520px] text-[14px] leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function WorkspaceHeaderActions({
  onRefresh,
  refreshLabel = "Refresh",
  primaryAction,
}: {
  onRefresh?: () => void;
  refreshLabel?: string;
  primaryAction?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {onRefresh ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-[12px]"
          onClick={onRefresh}
        >
          {refreshLabel}
        </Button>
      ) : null}
      {primaryAction}
    </div>
  );
}

export function WorkspaceSubHeader({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>{left}</div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function WorkspaceDivider() {
  return <Separator className="my-5" />;
}