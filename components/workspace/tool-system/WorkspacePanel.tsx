"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type WorkspaceTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const toneToBadgeVariant: Record<
  WorkspaceTone,
  "default" | "secondary" | "destructive" | "outline"
> = {
  default: "outline",
  success: "secondary",
  warning: "outline",
  danger: "destructive",
  info: "secondary",
  neutral: "outline",
};

function toneIcon(tone: WorkspaceTone) {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "danger") return <XCircle className="h-4 w-4" />;
  if (tone === "warning") return <AlertCircle className="h-4 w-4" />;

  return <Info className="h-4 w-4" />;
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
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardHeader>
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            {eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{title}</CardTitle>

              {status ? (
                <WorkspaceStatusPill tone={statusTone}>
                  {status}
                </WorkspaceStatusPill>
              ) : null}
            </div>

            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>

          {actions ? <CardAction>{actions}</CardAction> : null}
        </div>
      </CardHeader>

      <Separator />

      <CardContent>
        <ScrollArea className="h-[calc(100vh-220px)] pr-3">
          <div className="space-y-6">{children}</div>
        </ScrollArea>
      </CardContent>
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
    <Badge variant={toneToBadgeVariant[tone]} className="rounded-full">
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
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function WorkspaceMetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description?: string;
  tone?: WorkspaceTone;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          {icon ? <div className="text-muted-foreground">{icon}</div> : null}
        </div>

        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>

      {description ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
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
    <Alert variant={tone === "danger" ? "destructive" : "default"}>
      {toneIcon(tone)}

      <div className="flex w-full items-start justify-between gap-4">
        <div>
          <AlertTitle>{title}</AlertTitle>

          {description ? (
            <AlertDescription>{description}</AlertDescription>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </Alert>
  );
}

export function WorkspaceSection({
  title,
  description,
  action,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>

            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>

          {action ? <CardAction>{action}</CardAction> : null}
        </div>
      </CardHeader>

      <CardContent>{children}</CardContent>

      {footer ? <CardFooter>{footer}</CardFooter> : null}
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
    <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0">{sidebar}</aside>
      <main className="min-w-0">{children}</main>
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
    <Card>
      <CardContent className="p-2">
        <Tabs value={activeKey} orientation="vertical" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-transparent p-0">
            {items.map((item) => (
              <TabsTrigger
                key={item.key}
                value={item.key}
                onClick={() => onChange(item.key)}
                className="justify-between"
              >
                <span>{item.label}</span>

                {item.badge ? (
                  <Badge variant="outline" className="ml-2 rounded-full">
                    {item.badge}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="w-[160px]">Value</TableHead>
          <TableHead className="w-[140px] text-right">Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`${row.label}-${index}`}>
            <TableCell>
              <div className="font-medium">{row.label}</div>

              {row.description ? (
                <div className="text-sm text-muted-foreground">
                  {row.description}
                </div>
              ) : null}
            </TableCell>

            <TableCell>{row.value}</TableCell>

            <TableCell className="text-right">{row.trailing}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>{left}</div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
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
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {action ? (
        <CardContent className="flex justify-center">{action}</CardContent>
      ) : null}
    </Card>
  );
}

export function WorkspaceScrollable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <ScrollArea className={cn("h-[520px] rounded-md border", className)}>
      <div className="p-4">{children}</div>
    </ScrollArea>
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
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          {refreshLabel}
        </Button>
      ) : null}

      {primaryAction}
    </div>
  );
}

export function WorkspaceDivider() {
  return <Separator />;
}