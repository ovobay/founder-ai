"use client";

import { useState } from "react";
import {
  Boxes,
  Braces,
  Database,
  FileCode2,
  GitBranch,
  Network,
  Route,
  ShieldCheck,
  Table2,
  Upload,
} from "lucide-react";

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
import {
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceStatusPill,
} from "@/components/workspace/tool-system/WorkspacePanel";

export type ArchitectureModule = {
  id: string;
  label: string;
  description: string;
};

export type ArchitectureTable = {
  id: string;
  name: string;
  purpose: string;
  fields: string[];
};

export type ArchitectureEndpoint = {
  id: string;
  method: string;
  path: string;
  purpose: string;
};

export type ArchitectureSecurityRule = {
  id: string;
  label: string;
  description: string;
};

export type ArchitecturePlan = {
  modules: ArchitectureModule[];
  tables: ArchitectureTable[];
  endpoints: ArchitectureEndpoint[];
  securityRules: ArchitectureSecurityRule[];
};

export type ArchitectureClassification = {
  primaryCategory?: string;
  secondaryCategories?: string[];
  industry?: string | null;
  platformTargets?: string[];
  complexity?: "simple" | "standard" | "advanced" | "enterprise";
};

export type ArchitectureWorkspacePanelProps = {
  projectName?: string;
  projectType?: string;
  lastUpdatedLabel?: string;
  classification?: ArchitectureClassification;
  architecture?: ArchitecturePlan;
  onClose?: () => void;
  onOpenCode?: () => void;
  onOpenSecurity?: () => void;
  onOpenPublish?: () => void;
  onExportSql?: () => void;
};

type BuildTab = "modules" | "database" | "api" | "security" | "actions";

const defaultArchitecture: ArchitecturePlan = {
  modules: [
    {
      id: "workspace-ui",
      label: "Workspace UI",
      description:
        "Workspace panels for preview, files, code, build, cloud, security, analytics, publish, and history.",
    },
    {
      id: "project-files",
      label: "Project files",
      description:
        "Database-backed file tree with generated file inspection, save, and restore workflows.",
    },
    {
      id: "publish-readiness",
      label: "Publish readiness",
      description:
        "Launch review system covering files, cloud setup, security, environment variables, and manual checks.",
    },
  ],
  tables: [
    {
      id: "projects",
      name: "projects",
      purpose: "Stores generated projects and workspace metadata.",
      fields: ["id", "owner_user_id", "name", "description", "status"],
    },
    {
      id: "project_files",
      name: "project_files",
      purpose: "Stores database-backed generated project files.",
      fields: ["id", "project_id", "path", "contents", "status"],
    },
  ],
  endpoints: [
    {
      id: "project-files",
      method: "GET",
      path: "/api/projects/[projectId]/files",
      purpose: "Load files for a project workspace.",
    },
    {
      id: "file-update",
      method: "PATCH",
      path: "/api/files/[fileId]",
      purpose: "Update a saved project file.",
    },
  ],
  securityRules: [
    {
      id: "owner-access",
      label: "Owner-scoped access",
      description:
        "Users should only read and mutate projects and files they own.",
    },
    {
      id: "server-secrets",
      label: "Server-only secrets",
      description:
        "Privileged API keys and service-role secrets must never be exposed to the browser.",
    },
  ],
};

function getComplexityTone(
  complexity?: ArchitectureClassification["complexity"]
) {
  if (complexity === "enterprise" || complexity === "advanced") {
    return "warning" as const;
  }

  if (complexity === "standard") return "info" as const;

  return "neutral" as const;
}

function getMethodTone(method: string) {
  const normalized = method.toUpperCase();

  if (normalized === "GET") return "info" as const;
  if (normalized === "POST") return "success" as const;
  if (normalized === "PATCH" || normalized === "PUT") return "warning" as const;
  if (normalized === "DELETE") return "danger" as const;

  return "neutral" as const;
}

function getMethodIcon(method: string) {
  const normalized = method.toUpperCase();

  if (normalized === "GET") return <Route className="h-4 w-4" />;
  if (normalized === "POST") return <Braces className="h-4 w-4" />;
  if (normalized === "PATCH" || normalized === "PUT") {
    return <Braces className="h-4 w-4" />;
  }

  return <Route className="h-4 w-4" />;
}

export function ArchitectureWorkspacePanel({
  projectName = "Founder AI workspace",
  projectType = "Generated app",
  lastUpdatedLabel = "Just now",
  classification,
  architecture = defaultArchitecture,
  onClose,
  onOpenCode,
  onOpenSecurity,
  onOpenPublish,
  onExportSql,
}: ArchitectureWorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<BuildTab>("modules");

  const moduleCount = architecture.modules.length;
  const tableCount = architecture.tables.length;
  const endpointCount = architecture.endpoints.length;
  const securityRuleCount = architecture.securityRules.length;

  const complexity = classification?.complexity ?? "standard";
  const primaryCategory = classification?.primaryCategory ?? projectType;
  const platformTargets = classification?.platformTargets ?? ["web"];
  const secondaryCategories = classification?.secondaryCategories ?? [];

  const tabs: Array<{
    key: BuildTab;
    label: string;
    count: number;
  }> = [
    { key: "modules", label: "Modules", count: moduleCount },
    { key: "database", label: "Database", count: tableCount },
    { key: "api", label: "API", count: endpointCount },
    { key: "security", label: "Security", count: securityRuleCount },
    { key: "actions", label: "Actions", count: 4 },
  ];

  return (
    <WorkspacePanel
      eyebrow="Build plan"
      title="Build"
      description="Review generated modules, data model, API routes, security rules, and next actions."
      status={`${complexity} build`}
      statusTone={getComplexityTone(complexity)}
      actions={
        <>
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            onClick={onExportSql}
          >
            <Database className="h-4 w-4" />
            Export SQL
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenCode}
          >
            <FileCode2 className="h-4 w-4" />
            Code
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            onClick={onOpenPublish}
          >
            <Upload className="h-4 w-4" />
            Publish
          </Button>

          {onClose ? (
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          ) : null}
        </>
      }
    >
      <WorkspaceMetricGrid>
        <WorkspaceMetricCard
          label="Modules"
          value={moduleCount}
          description="Detected build areas."
          icon={<Boxes className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Tables"
          value={tableCount}
          description="Database tables planned."
          icon={<Table2 className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="API routes"
          value={endpointCount}
          description="Backend endpoints planned."
          icon={<Route className="h-4 w-4" />}
        />

        <WorkspaceMetricCard
          label="Security"
          value={securityRuleCount}
          description="Architecture security rules."
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </WorkspaceMetricGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>Architecture blueprint</CardTitle>
                <CardDescription>
                  Structured generated build plan for the selected project.
                </CardDescription>
              </div>

              <CardAction>
                <Badge variant="outline" className="rounded-full">
                  Updated · {lastUpdatedLabel}
                </Badge>
              </CardAction>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as BuildTab)}
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-5">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    <span>{tab.label}</span>
                    <Badge variant="outline" className="ml-2 rounded-full">
                      {tab.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {activeTab === "modules" ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {architecture.modules.length > 0 ? (
                      architecture.modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                                <Boxes className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="font-medium">{module.label}</div>
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {module.description}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">Module</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-40 text-center">
                          No modules detected.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "database" ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead className="w-[220px]">Fields</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {architecture.tables.length > 0 ? (
                        architecture.tables.map((table) => (
                          <TableRow key={table.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                                  <Table2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="font-mono font-medium">
                                  {table.name}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-muted-foreground">
                              {table.purpose}
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {table.fields.slice(0, 4).map((field) => (
                                  <Badge key={field} variant="outline">
                                    {field}
                                  </Badge>
                                ))}

                                {table.fields.length > 4 ? (
                                  <Badge variant="secondary">
                                    +{table.fields.length - 4}
                                  </Badge>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-40 text-center">
                            No database tables planned.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  suppressHydrationWarning
                  type="button"
                  variant="outline"
                  onClick={onExportSql}
                >
                  <Database className="h-4 w-4" />
                  Export generated SQL migration
                </Button>
              </div>
            ) : null}

            {activeTab === "api" ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Purpose</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {architecture.endpoints.length > 0 ? (
                      architecture.endpoints.map((endpoint) => (
                        <TableRow key={endpoint.id}>
                          <TableCell>
                            <WorkspaceStatusPill
                              tone={getMethodTone(endpoint.method)}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {getMethodIcon(endpoint.method)}
                                {endpoint.method.toUpperCase()}
                              </span>
                            </WorkspaceStatusPill>
                          </TableCell>

                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-sm">
                              {endpoint.path}
                            </code>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {endpoint.purpose}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-40 text-center">
                          No API routes planned.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "security" ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[150px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {architecture.securityRules.length > 0 ? (
                      architecture.securityRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="font-medium">{rule.label}</div>
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {rule.description}
                          </TableCell>

                          <TableCell>
                            <Button
                              suppressHydrationWarning
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={onOpenSecurity}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-40 text-center">
                          No security rules generated.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "actions" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Review generated code</CardTitle>
                    <CardDescription>
                      Open the code workspace and inspect important generated
                      files.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      suppressHydrationWarning
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={onOpenCode}
                    >
                      <FileCode2 className="h-4 w-4" />
                      Open code
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Export SQL migration</CardTitle>
                    <CardDescription>
                      Generate a starter Supabase migration from planned tables.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      suppressHydrationWarning
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={onExportSql}
                    >
                      <Database className="h-4 w-4" />
                      Export SQL
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Review security</CardTitle>
                    <CardDescription>
                      Open the security workspace and review architecture-level
                      risks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      suppressHydrationWarning
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={onOpenSecurity}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Security
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Publish readiness</CardTitle>
                    <CardDescription>
                      Open publish readiness and check launch blockers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      suppressHydrationWarning
                      type="button"
                      className="w-full justify-start"
                      onClick={onOpenPublish}
                    >
                      <Upload className="h-4 w-4" />
                      Publish
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project classification</CardTitle>
              <CardDescription>
                Detected category, platform, industry, and complexity.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted">
                  <Network className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <h4 className="break-words font-medium">{primaryCategory}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {projectType}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Complexity</span>
                  <WorkspaceStatusPill tone={getComplexityTone(complexity)}>
                    {complexity}
                  </WorkspaceStatusPill>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Industry</span>
                  <Badge variant="outline">
                    {classification?.industry ?? "General"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Platforms</span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {platformTargets.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Secondary</span>
                  <div className="flex max-w-[200px] flex-wrap justify-end gap-1.5">
                    {secondaryCategories.length > 0 ? (
                      secondaryCategories.map((category) => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium">{lastUpdatedLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Build summary</CardTitle>
              <CardDescription>
                Generated structure at a glance.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Modules</span>
                <Badge variant="outline">{moduleCount}</Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Tables</span>
                <Badge variant="outline">{tableCount}</Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">API routes</span>
                <Badge variant="outline">{endpointCount}</Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Security rules</span>
                <Badge variant="outline">{securityRuleCount}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended flow</CardTitle>
              <CardDescription>
                Clean order before publishing. Exciting, like flossing.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-2">
              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="justify-start"
                onClick={onOpenCode}
              >
                <FileCode2 className="h-4 w-4" />
                Review code
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="justify-start"
                onClick={onOpenSecurity}
              >
                <ShieldCheck className="h-4 w-4" />
                Review security
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                className="justify-start"
                onClick={onOpenPublish}
              >
                <Upload className="h-4 w-4" />
                Publish readiness
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                variant="outline"
                className="justify-start"
              >
                <GitBranch className="h-4 w-4" />
                Commit checkpoint
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspacePanel>
  );
}