"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  BarChart3,
  Database,
  KeyRound,
  LayoutDashboard,
  Mail,
  RefreshCcw,
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
  status?: "ready" | "required" | "optional" | "missing" | "review";
};

type CloudSection = {
  key: CloudTab;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  records: CloudRecord[];
};

export type CloudIntegrationStatus =
  | "connected"
  | "needs-setup"
  | "optional"
  | "disabled";

export type CloudIntegration = {
  id: string;
  label: string;
  description?: string;
  provider?: string;
  status?: CloudIntegrationStatus;
  required?: boolean;
};

export type CloudEnvironmentVariable = {
  key: string;
  label?: string;
  scope?: "client" | "server";
  required?: boolean;
  reason?: string;
};

export type CloudWorkspaceProps = {
  title?: string;
  projectName?: string;
  deploymentTarget?: string;
  lastCheckedLabel?: string;
  integrations?: CloudIntegration[];
  environmentVariables?: CloudEnvironmentVariable[];
  onClose?: () => void;
  onRefresh?: () => void;
  onUpdateScan?: () => void;
  onAddContext?: () => void;
  onViewIssues?: () => void;
  onOpenPublish?: () => void;
  onOpenSecurity?: () => void;
  summary?: {
    required?: number;
    optional?: number;
    ready?: number;
    envVars?: number;
  };
  sections?: CloudSection[];
};

const NAV_ITEMS: Array<{
  key: CloudTab;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}> = [
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
    badgeVariant: "secondary",
    records: [
      {
        label: "OpenAI setup",
        value: "Required",
        status: "ready",
      },
    ],
  },
  {
    key: "emails",
    title: "Emails",
    description: "Send branded emails from your domain.",
    badge: "Optional",
    badgeVariant: "outline",
    records: [
      {
        label: "Domain email",
        value: "Not detected",
        status: "optional",
      },
    ],
  },
  {
    key: "database",
    title: "Database",
    description: "View planned tables and storage-backed data.",
    badge: "9 tables",
    badgeVariant: "secondary",
    records: [
      { label: "organizations", value: "4 fields", status: "ready" },
      { label: "tickets", value: "12 fields", status: "ready" },
      { label: "agents", value: "8 fields", status: "ready" },
    ],
  },
  {
    key: "security",
    title: "Security",
    description: "Review policies, secrets exposure, and auth safety.",
    badge: "Needs review",
    badgeVariant: "destructive",
    records: [
      { label: "Auth checks", value: "Review needed", status: "review" },
      { label: "RLS policies", value: "Missing", status: "missing" },
    ],
  },
  {
    key: "secrets",
    title: "Secrets",
    description: "Track environment keys and deployment credentials.",
    badge: "14 vars",
    badgeVariant: "secondary",
    records: [
      { label: "OPENAI_API_KEY", value: "Configured", status: "ready" },
      { label: "SUPABASE_URL", value: "Configured", status: "ready" },
      { label: "STRIPE_SECRET_KEY", value: "Missing", status: "missing" },
    ],
  },
  {
    key: "logs",
    title: "Logs",
    description: "Inspect deploy events and workspace activity.",
    badge: "3 recent",
    badgeVariant: "outline",
    records: [
      { label: "Last deploy", value: "12 minutes ago", status: "ready" },
      { label: "Latest sync", value: "Successful", status: "ready" },
    ],
  },
  {
    key: "usage",
    title: "Usage",
    description: "Monitor quota, requests, and generated workload.",
    badge: "Healthy",
    badgeVariant: "secondary",
    records: [
      { label: "AI requests", value: "427", status: "ready" },
      { label: "Storage", value: "72 MB", status: "ready" },
      { label: "Tables touched", value: "9", status: "ready" },
    ],
  },
];

function getRecordBadge(record: CloudRecord) {
  if (record.status === "ready") {
    return <Badge variant="secondary">Ready</Badge>;
  }

  if (record.status === "required") {
    return <Badge variant="default">Required</Badge>;
  }

  if (record.status === "missing") {
    return <Badge variant="destructive">Missing</Badge>;
  }

  if (record.status === "review") {
    return <Badge variant="outline">Review</Badge>;
  }

  return <Badge variant="outline">Optional</Badge>;
}

function mapIntegrationsToSections(
  integrations?: CloudIntegration[],
  environmentVariables?: CloudEnvironmentVariable[]
): CloudSection[] {
  if (!integrations?.length && !environmentVariables?.length) {
    return DEFAULT_SECTIONS;
  }

  const ai = integrations?.filter((item) =>
    `${item.provider ?? ""} ${item.label}`.toLowerCase().includes("ai")
  );

  const emails = integrations?.filter((item) =>
    `${item.provider ?? ""} ${item.label}`.toLowerCase().includes("email")
  );

  const database = integrations?.filter((item) =>
    `${item.provider ?? ""} ${item.label}`.toLowerCase().includes("database")
  );

  const secrets = environmentVariables ?? [];

  return [
    {
      key: "ai",
      title: "AI",
      description: "Model readiness, AI keys, and generation setup.",
      badge: ai?.some((item) => item.status === "connected")
        ? "Connected"
        : "Review",
      badgeVariant: ai?.some((item) => item.status === "connected")
        ? "secondary"
        : "outline",
      records:
        ai?.length
          ? ai.map((item) => ({
              label: item.label,
              value: item.required ? "Required" : "Optional",
              status:
                item.status === "connected"
                  ? "ready"
                  : item.required
                    ? "required"
                    : "optional",
            }))
          : DEFAULT_SECTIONS.find((section) => section.key === "ai")!.records,
    },
    {
      key: "emails",
      title: "Emails",
      description: "Domain mail and notification setup.",
      badge: emails?.length ? "Detected" : "Optional",
      badgeVariant: "outline",
      records:
        emails?.length
          ? emails.map((item) => ({
              label: item.label,
              value: item.status ?? "optional",
              status: item.required ? "required" : "optional",
            }))
          : DEFAULT_SECTIONS.find((section) => section.key === "emails")!
              .records,
    },
    {
      key: "database",
      title: "Database",
      description: "Tables, storage-backed data, and persistence setup.",
      badge: database?.length ? `${database.length} detected` : "Review",
      badgeVariant: "secondary",
      records:
        database?.length
          ? database.map((item) => ({
              label: item.label,
              value: item.status ?? "needs setup",
              status:
                item.status === "connected"
                  ? "ready"
                  : item.required
                    ? "review"
                    : "optional",
            }))
          : DEFAULT_SECTIONS.find((section) => section.key === "database")!
              .records,
    },
    DEFAULT_SECTIONS.find((section) => section.key === "security")!,
    {
      key: "secrets",
      title: "Secrets",
      description: "Environment variables and server-only credentials.",
      badge: `${secrets.length || 14} vars`,
      badgeVariant: "secondary",
      records:
        secrets.length > 0
          ? secrets.map((item) => ({
              label: item.key,
              value: item.scope === "server" ? "Server" : "Client",
              status: item.required ? "required" : "optional",
            }))
          : DEFAULT_SECTIONS.find((section) => section.key === "secrets")!
              .records,
    },
    DEFAULT_SECTIONS.find((section) => section.key === "logs")!,
    DEFAULT_SECTIONS.find((section) => section.key === "usage")!,
  ];
}

export function CloudWorkspace({
  title = "Cloud",
  projectName,
  deploymentTarget = "Vercel",
  lastCheckedLabel = "Just now",
  integrations,
  environmentVariables,
  onClose,
  onRefresh,
  onUpdateScan,
  onAddContext,
  onViewIssues,
  onOpenPublish,
  onOpenSecurity,
  summary,
  sections,
}: CloudWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<CloudTab>("overview");

  const derivedSections = React.useMemo(
    () => sections ?? mapIntegrationsToSections(integrations, environmentVariables),
    [sections, integrations, environmentVariables]
  );

  const requiredCount =
    summary?.required ??
    integrations?.filter((item) => item.required).length ??
    8;

  const optionalCount =
    summary?.optional ??
    integrations?.filter((item) => !item.required).length ??
    0;

  const readyCount =
    summary?.ready ??
    integrations?.filter((item) => item.status === "connected").length ??
    0;

  const envVarsCount = summary?.envVars ?? environmentVariables?.length ?? 16;

  const visibleSections =
    activeTab === "overview"
      ? derivedSections
      : derivedSections.filter((section) => section.key === activeTab);

  const handleUpdateScan = onUpdateScan ?? onRefresh;
  const handleViewIssues = onViewIssues ?? onOpenSecurity;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {projectName
                ? `${projectName} deployment setup on ${deploymentTarget}.`
                : `Deployment setup, integrations, secrets, and cloud readiness on ${deploymentTarget}.`}
            </CardDescription>
          </div>

          <CardAction className="flex items-center gap-2">
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUpdateScan}
            >
              <RefreshCcw className="h-4 w-4" />
              Update scan
            </Button>

            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddContext}
            >
              Add context
            </Button>

            {onClose ? (
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            ) : null}
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid h-[calc(100vh-176px)] min-h-[620px] grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-r bg-muted/20 p-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CloudTab)}>
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-transparent p-0">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <TabsTrigger
                      key={item.key}
                      value={item.key}
                      className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <Badge variant="secondary" className="ml-auto rounded-full">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </aside>

          <ScrollArea className="h-full">
            <main className="space-y-4 p-4">
              <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Security issues detected</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>Fix critical setup items before publishing.</span>
                  <Button
                    suppressHydrationWarning
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-background"
                    onClick={handleViewIssues}
                  >
                    View issues
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardDescription>Required</CardDescription>
                    <CardTitle>{requiredCount}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardDescription>Optional</CardDescription>
                    <CardTitle>{optionalCount}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardDescription>Ready</CardDescription>
                    <CardTitle>{readyCount}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardDescription>Env vars</CardDescription>
                    <CardTitle>{envVarsCount}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Deployment summary</CardTitle>
                      <CardDescription>
                        Last checked {lastCheckedLabel}. Review service readiness before launch.
                      </CardDescription>
                    </div>

                    <CardAction className="flex items-center gap-2">
                      <Badge variant="outline">{deploymentTarget}</Badge>
                      <Button
                        suppressHydrationWarning
                        type="button"
                        size="sm"
                        onClick={onOpenPublish}
                      >
                        Publish
                      </Button>
                    </CardAction>
                  </div>
                </CardHeader>
              </Card>

              <div className="space-y-4">
                {visibleSections.map((section) => (
                  <Card key={section.key}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>

                        {section.badge ? (
                          <Badge
                            variant={section.badgeVariant ?? "outline"}
                            className="rounded-full"
                          >
                            {section.badge}
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>

                    <Separator />

                    <CardContent>
                      <Table>
                        <TableBody>
                          {section.records.map((record) => (
                            <TableRow key={`${section.key}-${record.label}`}>
                              <TableCell className="font-medium">
                                {record.label}
                              </TableCell>
                              <TableCell>{record.value}</TableCell>
                              <TableCell className="text-right">
                                {getRecordBadge(record)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </main>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}