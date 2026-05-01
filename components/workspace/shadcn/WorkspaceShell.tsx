"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Info,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type WorkspaceTone =
  | "default"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple";

type WorkspaceShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
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
    tone?: WorkspaceTone;
  };
  actions?: ReactNode;
  className?: string;
};

type WorkspaceMetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: WorkspaceTone;
};

type WorkspaceCardProps = {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
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

type WorkspaceStatusBadgeProps = {
  children: ReactNode;
  tone?: WorkspaceTone;
};

type WorkspaceNoticeProps = {
  title?: string;
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
};

function toneClass(tone: WorkspaceTone = "default") {
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-700";
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "orange") return "border-orange-200 bg-orange-50 text-orange-700";
  if (tone === "red") return "border-red-200 bg-red-50 text-red-700";
  if (tone === "purple") return "border-violet-200 bg-violet-50 text-violet-700";

  return "border-border bg-muted text-muted-foreground";
}

function noticeClass(tone: WorkspaceNoticeProps["tone"] = "info") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "warning") {
    return "border-orange-200 bg-orange-50 text-orange-950";
  }

  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  return "border-blue-200 bg-blue-50 text-blue-950";
}

function noticeIcon(tone: WorkspaceNoticeProps["tone"] = "info") {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "warning") return <AlertCircle className="h-4 w-4" />;
  if (tone === "danger") return <AlertCircle className="h-4 w-4" />;

  return <Info className="h-4 w-4" />;
}

export function WorkspaceShell({
  title,
  eyebrow,
  description,
  icon,
  badge,
  actions,
  sidebar,
  children,
  onClose,
  className,
}: WorkspaceShellProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-muted/40 text-foreground",
        className
      )}
    >
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}

            <h2 className="truncate text-sm font-bold tracking-tight text-foreground">
              {title}
            </h2>

            {description ? (
              <p className="truncate text-xs font-medium text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {badge}
          {actions}

          {onClose ? (
            <Button
              suppressHydrationWarning
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl"
              aria-label="Close workspace"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {sidebar ? (
          <aside className="w-64 shrink-0 border-r bg-background/70">
            <ScrollArea className="h-full">
              <div className="p-3">{sidebar}</div>
            </ScrollArea>
          </aside>
        ) : null}

        <ScrollArea className="min-w-0 flex-1">
          <main className="p-3">{children}</main>
        </ScrollArea>
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
  className,
}: WorkspaceHeroProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 bg-background shadow-sm",
        className
      )}
    >
      <CardContent className="flex items-start justify-between gap-5 p-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}

            <h3 className="mt-1 max-w-4xl text-2xl font-black leading-none tracking-[-0.05em] text-foreground md:text-4xl">
              {title}
            </h3>

            {description ? (
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}

            {actions ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {badge}

          {metric ? (
            <div
              className={cn(
                "grid min-h-20 w-32 content-between rounded-2xl border p-3",
                toneClass(metric.tone)
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
                {metric.label}
              </span>
              <strong className="text-3xl font-black leading-none tracking-[-0.05em]">
                {metric.value}
              </strong>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceMetricGrid({ children }: { children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      {children}
    </section>
  );
}

export function WorkspaceMetricCard({
  label,
  value,
  detail,
  icon,
  tone = "default",
}: WorkspaceMetricCardProps) {
  return (
    <Card className={cn("border shadow-sm", toneClass(tone))}>
      <CardContent className="grid min-h-24 content-between gap-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
            {label}
          </span>

          {icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/70">
              {icon}
            </span>
          ) : null}
        </div>

        <strong className="text-2xl font-black leading-none tracking-[-0.05em]">
          {value}
        </strong>

        {detail ? (
          <p className="text-xs font-medium leading-5 opacity-80">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function WorkspaceCard({
  title,
  description,
  badge,
  action,
  children,
  className,
}: WorkspaceCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/80 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b p-4">
        <div className="min-w-0">
          <CardTitle className="text-sm font-bold tracking-tight">
            {title}
          </CardTitle>

          {description ? (
            <CardDescription className="mt-1 text-xs font-medium leading-5">
              {description}
            </CardDescription>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {badge}
          {action}
        </div>
      </CardHeader>

      <CardContent className="p-4">{children}</CardContent>
    </Card>
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
        {icon ?? <CircleDashed className="h-4 w-4" />}
      </span>

      <span className="min-w-0 flex-1 text-left">
        <strong className="block truncate text-sm font-bold tracking-tight text-foreground">
          {title}
        </strong>

        {description ? (
          <small className="mt-0.5 block text-xs font-medium leading-5 text-muted-foreground">
            {description}
          </small>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
        {badge}
        <ArrowRight className="h-4 w-4" />
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        className="grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border bg-background p-3 text-left">
      {content}
    </div>
  );
}

export function WorkspaceEmptyState({
  icon,
  title,
  description,
  action,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="grid min-h-56 place-items-center content-center gap-2 rounded-2xl border border-dashed bg-muted/40 p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
        {icon ?? <CircleDashed className="h-6 w-6" />}
      </span>

      <strong className="text-sm font-bold tracking-tight text-foreground">
        {title}
      </strong>

      {description ? (
        <p className="max-w-md text-xs font-medium leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function WorkspaceStatusBadge({
  children,
  tone = "default",
}: WorkspaceStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("h-7 rounded-full px-2.5 text-[11px] font-bold", toneClass(tone))}
    >
      {children}
    </Badge>
  );
}

export function WorkspaceNotice({
  title,
  children,
  tone = "info",
}: WorkspaceNoticeProps) {
  return (
    <Alert className={cn("rounded-2xl", noticeClass(tone))}>
      {noticeIcon(tone)}

      {title ? <AlertTitle className="font-bold">{title}</AlertTitle> : null}

      <AlertDescription className="text-xs font-medium leading-5">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function WorkspaceSectionStack({ children }: { children: ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

export function WorkspaceTwoColumnGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      {children}
    </div>
  );
}

export function WorkspaceSeparator() {
  return <Separator className="my-3" />;
}