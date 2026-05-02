"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  BarChart3,
  Database,
  KeyRound,
  LayoutDashboard,
  Mail,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";

type CloudTab =
  | "overview"
  | "ai"
  | "emails"
  | "database"
  | "security"
  | "secrets"
  | "logs"
  | "usage";

type CloudRecord = {
  label: string;
  value: string;
};

type CloudSection = {
  key: CloudTab;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: "default" | "secondary" | "destructive" | "success";
  records: CloudRecord[];
};

type CloudWorkspaceProps = {
  title?: string;
  onClose?: () => void;
  onUpdateScan?: () => void;
  onAddContext?: () => void;
  onViewIssues?: () => void;
  summary?: {
    required?: number;
    optional?: number;
    ready?: number;
    envVars?: number;
  };
  sections?: CloudSection[];
  [key: string]: unknown;
};

const NAV_ITEMS: {
  key: CloudTab;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "ai", label: "AI", icon: Sparkles },
  { key: "emails", label: "Emails", icon: Mail, badge: "Pro" },
  { key: "database", label: "Database", icon: Database },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "secrets", label: "Secrets", icon: KeyRound },
  { key: "logs", label: "Logs", icon: ScrollText },
  { key: "usage", label: "Usage", icon: BarChart3 },
];

const DEFAULT_SECTIONS: CloudSection[] = [
  {
    key: "ai",
    title: "AI",
    description: "View AI usage, model readiness, and setup requirements.",
    badge: "Connected",
    badgeTone: "secondary",
    records: [{ label: "OpenAI setup", value: "Required" }],
  },
  {
    key: "emails",
    title: "Emails",
    description: "Send branded emails from your domain.",
    badge: "Optional",
    badgeTone: "secondary",
    records: [{ label: "Domain email", value: "Not detected" }],
  },
  {
    key: "database",
    title: "Database",
    description: "View planned tables and storage-backed data.",
    badge: "9 tables",
    badgeTone: "secondary",
    records: [
      { label: "organizations", value: "4 fields" },
      { label: "tickets", value: "12 fields" },
      { label: "agents", value: "8 fields" },
    ],
  },
  {
    key: "security",
    title: "Security",
    description: "Review policies, secrets exposure, and auth safety.",
    badge: "Needs review",
    badgeTone: "destructive",
    records: [
      { label: "Auth checks", value: "Review needed" },
      { label: "RLS policies", value: "Missing" },
    ],
  },
  {
    key: "secrets",
    title: "Secrets",
    description: "Track env keys and deployment credentials.",
    badge: "14 vars",
    badgeTone: "secondary",
    records: [
      { label: "OPENAI_API_KEY", value: "Configured" },
      { label: "SUPABASE_URL", value: "Configured" },
      { label: "STRIPE_SECRET_KEY", value: "Missing" },
    ],
  },
  {
    key: "logs",
    title: "Logs",
    description: "Inspect deploy events and workspace activity.",
    badge: "3 recent",
    badgeTone: "secondary",
    records: [
      { label: "Last deploy", value: "12 minutes ago" },
      { label: "Latest sync", value: "Successful" },
    ],
  },
  {
    key: "usage",
    title: "Usage",
    description: "Monitor quota, requests, and generated workload.",
    badge: "Healthy",
    badgeTone: "secondary",
    records: [
      { label: "AI requests", value: "427" },
      { label: "Storage", value: "72 MB" },
      { label: "Tables touched", value: "9" },
    ],
  },
];

function toneClass(tone?: CloudSection["badgeTone"]) {
  switch (tone) {
    case "destructive":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "success":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    case "secondary":
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-3 text-5xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

export function CloudWorkspace({
  title = "Cloud",
  onClose,
  onUpdateScan,
  onAddContext,
  onViewIssues,
  summary,
  sections = DEFAULT_SECTIONS,
}: CloudWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<CloudTab>("overview");

  const mergedSummary = {
    required: summary?.required ?? 8,
    optional: summary?.optional ?? 0,
    ready: summary?.ready ?? 0,
    envVars: summary?.envVars ?? 16,
  };

  const visibleSections =
    activeTab === "overview"
      ? sections
      : sections.filter((section) => section.key === activeTab);

  return (
    <Card className="overflow-hidden rounded-[28px] border shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onUpdateScan?.()}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Update scan
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onAddContext?.()}
          >
            Add context
          </Button>
        </div>

        <div className="text-xl font-semibold">{title}</div>

        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={() => onClose?.()}
        >
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>

      <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-r bg-muted/10 p-4">
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeTab;

              return (
                <Button
                  key={item.key}
                  type="button"
                  variant={active ? "secondary" : "ghost"}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "h-12 w-full justify-start rounded-2xl px-4 text-base font-semibold",
                    active && "border border-primary/30 bg-primary/5 text-primary",
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <Badge variant="secondary" className="ml-auto rounded-full">
                      {item.badge}
                    </Badge>
                  ) : null}
                </Button>
              );
            })}
          </nav>
        </aside>

        <ScrollArea className="h-[720px]">
          <div className="space-y-6 p-6">
            <Alert className="rounded-3xl border-destructive/30 bg-destructive/5 text-destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle className="text-lg font-semibold">
                Security issues detected. Fix critical setup items before publish.
              </AlertTitle>
              <AlertDescription className="mt-3 flex items-center justify-between gap-4">
                <span>
                  This workspace is not launch-ready yet. Review blockers before deployment.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl bg-background"
                  onClick={() => onViewIssues?.()}
                >
                  View issues
                </Button>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Required" value={mergedSummary.required} />
              <SummaryCard label="Optional" value={mergedSummary.optional} />
              <SummaryCard label="Ready" value={mergedSummary.ready} />
              <SummaryCard label="Env vars" value={mergedSummary.envVars} />
            </div>

            <div className="space-y-5">
              {visibleSections.map((section) => (
                <Card key={section.key} className="rounded-3xl shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-3xl font-bold tracking-tight">
                          {section.title}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                          {section.description}
                        </CardDescription>
                      </div>

                      {section.badge ? (
                        <Badge
                          variant="outline"
                          className={cn("rounded-full px-3 py-1 text-sm", toneClass(section.badgeTone))}
                        >
                          {section.badge}
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>

                  <Separator />

                  <CardContent className="space-y-3 p-5">
                    {section.records.map((record) => (
                      <div
                        key={`${section.key}-${record.label}`}
                        className="flex items-center justify-between rounded-2xl border bg-muted/20 px-5 py-4"
                      >
                        <span className="text-base font-medium">{record.label}</span>
                        <span className="text-base font-semibold">{record.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}