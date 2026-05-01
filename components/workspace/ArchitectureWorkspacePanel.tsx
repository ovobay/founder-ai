"use client";

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

import { Button } from "@/components/ui/button";
import {
  WorkspaceActionRow,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspaceNotice,
  WorkspaceSectionStack,
  WorkspaceShell,
  WorkspaceStatusBadge,
  WorkspaceTwoColumnGrid,
} from "@/components/workspace/shadcn/WorkspaceShell";

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

const defaultArchitecture: ArchitecturePlan = {
  modules: [
    {
      id: "workspace-ui",
      label: "Workspace UI",
      description:
        "Premium workspace panels for preview, files, code, build, cloud, security, analytics, publish, and history.",
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
    return "purple" as const;
  }

  if (complexity === "standard") return "blue" as const;

  return "default" as const;
}

function getMethodTone(method: string) {
  const normalized = method.toUpperCase();

  if (normalized === "GET") return "blue" as const;
  if (normalized === "POST") return "green" as const;
  if (normalized === "PATCH" || normalized === "PUT") return "orange" as const;
  if (normalized === "DELETE") return "red" as const;

  return "default" as const;
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
  const moduleCount = architecture.modules.length;
  const tableCount = architecture.tables.length;
  const endpointCount = architecture.endpoints.length;
  const securityRuleCount = architecture.securityRules.length;

  const complexity = classification?.complexity ?? "standard";
  const primaryCategory = classification?.primaryCategory ?? projectType;
  const platformTargets = classification?.platformTargets ?? ["web"];

  return (
    <WorkspaceShell
      title="Build"
      eyebrow="Architecture plan"
      description="Review generated modules, data model, API routes, and security architecture."
      icon={<Boxes className="h-4 w-4" />}
      badge={
        <WorkspaceStatusBadge tone={getComplexityTone(complexity)}>
          {complexity}
        </WorkspaceStatusBadge>
      }
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="System blueprint"
          title={`${projectName} architecture`}
          description="A structured view of what the build is supposed to contain before it becomes a nest of files and brave assumptions."
          icon={<Network className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone="blue">
              Updated · {lastUpdatedLabel}
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Modules",
            value: moduleCount,
            tone: moduleCount > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
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
                Open code
              </Button>
            </>
          }
        />

        <WorkspaceNotice title="Architecture review recommended" tone="info">
          Review the generated structure before publishing. A confident
          architecture plan is useful. A wrong confident architecture plan is
          just theatre with endpoints.
        </WorkspaceNotice>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Modules"
            value={moduleCount}
            detail="Detected build areas."
            icon={<Boxes className="h-4 w-4" />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Tables"
            value={tableCount}
            detail="Database tables planned."
            icon={<Table2 className="h-4 w-4" />}
            tone={tableCount > 0 ? "purple" : "default"}
          />

          <WorkspaceMetricCard
            label="API routes"
            value={endpointCount}
            detail="Backend endpoints planned."
            icon={<Route className="h-4 w-4" />}
            tone={endpointCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Security"
            value={securityRuleCount}
            detail="Generated review rules."
            icon={<ShieldCheck className="h-4 w-4" />}
            tone={securityRuleCount > 0 ? "orange" : "default"}
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="Classification"
            description="Detected project category, platform, and complexity."
            badge={
              <WorkspaceStatusBadge tone={getComplexityTone(complexity)}>
                {complexity}
              </WorkspaceStatusBadge>
            }
          >
            <div className="grid gap-2">
              <div className="grid min-h-14 gap-1 rounded-2xl border bg-background p-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Primary category
                </span>
                <strong className="text-sm font-bold tracking-tight text-foreground">
                  {primaryCategory}
                </strong>
              </div>

              <div className="grid min-h-14 gap-1 rounded-2xl border bg-background p-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Project type
                </span>
                <strong className="text-sm font-bold tracking-tight text-foreground">
                  {projectType}
                </strong>
              </div>

              <div className="grid min-h-14 gap-1 rounded-2xl border bg-background p-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Platforms
                </span>
                <strong className="text-sm font-bold tracking-tight text-foreground">
                  {platformTargets.join(", ")}
                </strong>
              </div>

              <div className="grid min-h-14 gap-1 rounded-2xl border bg-background p-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Industry
                </span>
                <strong className="text-sm font-bold tracking-tight text-foreground">
                  {classification?.industry ?? "General"}
                </strong>
              </div>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Detected modules"
            description="Major product areas generated from the prompt."
            badge={
              <WorkspaceStatusBadge tone="blue">
                {moduleCount} modules
              </WorkspaceStatusBadge>
            }
          >
            {architecture.modules.length > 0 ? (
              <div className="grid gap-2">
                {architecture.modules.map((module) => (
                  <WorkspaceActionRow
                    key={module.id}
                    title={module.label}
                    description={module.description}
                    icon={<Boxes className="h-4 w-4" />}
                    badge={<WorkspaceStatusBadge tone="blue">Module</WorkspaceStatusBadge>}
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Boxes className="h-6 w-6" />}
                title="No modules detected"
                description="Generate a build to populate architecture modules."
              />
            )}
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Database tables"
          description="Planned schema and table responsibilities."
          badge={
            <WorkspaceStatusBadge tone={tableCount > 0 ? "purple" : "default"}>
              {tableCount} tables
            </WorkspaceStatusBadge>
          }
        >
          {architecture.tables.length > 0 ? (
            <div className="grid gap-2">
              {architecture.tables.map((table) => (
                <article
                  key={table.id}
                  className="grid gap-3 rounded-2xl border bg-background p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                >
                  <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
                      <Table2 className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold tracking-tight text-foreground">
                        {table.name}
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                        {table.purpose}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {table.fields.map((field) => (
                      <span
                        key={field}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <WorkspaceEmptyState
              icon={<Database className="h-6 w-6" />}
              title="No tables planned"
              description="Database tables will appear when the build requires persistence."
            />
          )}
        </WorkspaceCard>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="API routes"
            description="Planned endpoint surface for the generated app."
            badge={
              <WorkspaceStatusBadge tone={endpointCount > 0 ? "green" : "default"}>
                {endpointCount} routes
              </WorkspaceStatusBadge>
            }
          >
            {architecture.endpoints.length > 0 ? (
              <div className="grid gap-2">
                {architecture.endpoints.map((endpoint) => (
                  <WorkspaceActionRow
                    key={endpoint.id}
                    title={`${endpoint.method.toUpperCase()} ${endpoint.path}`}
                    description={endpoint.purpose}
                    icon={<Braces className="h-4 w-4" />}
                    badge={
                      <WorkspaceStatusBadge tone={getMethodTone(endpoint.method)}>
                        {endpoint.method.toUpperCase()}
                      </WorkspaceStatusBadge>
                    }
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Route className="h-6 w-6" />}
                title="No API routes planned"
                description="API routes will appear when backend functionality is detected."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Security rules"
            description="Generated architecture-level security checks."
            badge={
              <WorkspaceStatusBadge
                tone={securityRuleCount > 0 ? "orange" : "default"}
              >
                {securityRuleCount} rules
              </WorkspaceStatusBadge>
            }
          >
            {architecture.securityRules.length > 0 ? (
              <div className="grid gap-2">
                {architecture.securityRules.map((rule) => (
                  <WorkspaceActionRow
                    key={rule.id}
                    title={rule.label}
                    description={rule.description}
                    icon={<ShieldCheck className="h-4 w-4" />}
                    badge={<WorkspaceStatusBadge tone="orange">Review</WorkspaceStatusBadge>}
                    onClick={onOpenSecurity}
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="No security rules"
                description="Security rules will appear after architecture analysis."
              />
            )}
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Next actions"
          description="Recommended steps before publishing."
          badge={<WorkspaceStatusBadge>Workflow</WorkspaceStatusBadge>}
        >
          <div className="grid gap-2">
            <WorkspaceActionRow
              title="Review generated code"
              description="Open the code workspace and inspect important generated files."
              icon={<FileCode2 className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="blue">Code</WorkspaceStatusBadge>}
              onClick={onOpenCode}
            />

            <WorkspaceActionRow
              title="Export SQL migration"
              description="Generate a starter Supabase migration from planned database tables."
              icon={<Database className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="purple">SQL</WorkspaceStatusBadge>}
              onClick={onExportSql}
            />

            <WorkspaceActionRow
              title="Review launch readiness"
              description="Open publish readiness and check blockers before deployment."
              icon={<Upload className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="green">Publish</WorkspaceStatusBadge>}
              onClick={onOpenPublish}
            />

            <WorkspaceActionRow
              title="Commit architecture checkpoint"
              description="Save a stable Git checkpoint before major structural changes."
              icon={<GitBranch className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge>Recommended</WorkspaceStatusBadge>}
            />
          </div>
        </WorkspaceCard>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}