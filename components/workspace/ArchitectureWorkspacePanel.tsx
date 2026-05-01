"use client";

import {
  Boxes,
  Braces,
  CheckCircle2,
  Database,
  FileCode2,
  GitBranch,
  Network,
  Route,
  ShieldCheck,
  Table2,
  Upload,
} from "lucide-react";

import {
  WorkspaceActionRow,
  WorkspaceAlert,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceStatusPill,
} from "./tool-system/WorkspacePanel";

import styles from "./ArchitectureWorkspacePanel.module.css";

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

function getComplexityTone(complexity?: ArchitectureClassification["complexity"]) {
  if (complexity === "enterprise" || complexity === "advanced") return "purple" as const;
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
    <WorkspacePanel
      title="Build"
      eyebrow="Architecture plan"
      description="Review generated modules, data model, API routes, and security architecture."
      icon={<Boxes size={17} strokeWidth={2.3} />}
      badge={<WorkspaceStatusPill tone={getComplexityTone(complexity)}>{complexity}</WorkspaceStatusPill>}
      onClose={onClose}
    >
      <div className={styles.architectureWorkspace}>
        <WorkspaceHero
          eyebrow="System blueprint"
          title={`${projectName} architecture`}
          description="A structured view of what the build is supposed to contain, before it becomes a nest of files and brave assumptions."
          icon={<Network size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone="blue">
              Updated · {lastUpdatedLabel}
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Modules",
            value: moduleCount,
            tone: moduleCount > 0 ? "blue" : "default",
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onExportSql}
              >
                <Database size={14} strokeWidth={2.3} />
                Export SQL
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onOpenCode}
              >
                <FileCode2 size={14} strokeWidth={2.3} />
                Open code
              </button>
            </>
          }
        />

        <WorkspaceAlert title="Architecture review recommended" tone="info">
          Review the generated structure before publishing. A confident architecture plan is useful. A wrong confident architecture plan is just theatre with endpoints.
        </WorkspaceAlert>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Modules"
            value={moduleCount}
            detail="Detected build areas."
            icon={<Boxes size={15} strokeWidth={2.25} />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Tables"
            value={tableCount}
            detail="Database tables planned."
            icon={<Table2 size={15} strokeWidth={2.25} />}
            tone={tableCount > 0 ? "purple" : "default"}
          />

          <WorkspaceMetricCard
            label="API routes"
            value={endpointCount}
            detail="Backend endpoints planned."
            icon={<Route size={15} strokeWidth={2.25} />}
            tone={endpointCount > 0 ? "green" : "default"}
          />

          <WorkspaceMetricCard
            label="Security"
            value={securityRuleCount}
            detail="Generated review rules."
            icon={<ShieldCheck size={15} strokeWidth={2.25} />}
            tone={securityRuleCount > 0 ? "orange" : "default"}
          />
        </WorkspaceMetricGrid>

        <div className={styles.architectureGrid}>
          <WorkspaceCard
            title="Classification"
            description="Detected project category, platform, and complexity."
            badge={<WorkspaceStatusPill tone={getComplexityTone(complexity)}>{complexity}</WorkspaceStatusPill>}
          >
            <div className={styles.classificationCard}>
              <div>
                <span>Primary category</span>
                <strong>{primaryCategory}</strong>
              </div>

              <div>
                <span>Project type</span>
                <strong>{projectType}</strong>
              </div>

              <div>
                <span>Platforms</span>
                <strong>{platformTargets.join(", ")}</strong>
              </div>

              <div>
                <span>Industry</span>
                <strong>{classification?.industry ?? "General"}</strong>
              </div>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Detected modules"
            description="Major product areas generated from the prompt."
            badge={<WorkspaceStatusPill tone="blue">{moduleCount} modules</WorkspaceStatusPill>}
          >
            {architecture.modules.length > 0 ? (
              <div className={styles.itemList}>
                {architecture.modules.map((module) => (
                  <WorkspaceActionRow
                    key={module.id}
                    title={module.label}
                    description={module.description}
                    icon={<Boxes size={15} strokeWidth={2.25} />}
                    badge={<WorkspaceStatusPill tone="blue">Module</WorkspaceStatusPill>}
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Boxes size={22} strokeWidth={2.2} />}
                title="No modules detected"
                description="Generate a build to populate architecture modules."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Database tables"
            description="Planned schema and table responsibilities."
            badge={<WorkspaceStatusPill tone={tableCount > 0 ? "purple" : "default"}>{tableCount} tables</WorkspaceStatusPill>}
          >
            {architecture.tables.length > 0 ? (
              <div className={styles.schemaList}>
                {architecture.tables.map((table) => (
                  <article key={table.id} className={styles.schemaCard}>
                    <div className={styles.schemaTop}>
                      <span className={styles.schemaIcon}>
                        <Table2 size={15} strokeWidth={2.25} />
                      </span>

                      <div>
                        <h4>{table.name}</h4>
                        <p>{table.purpose}</p>
                      </div>
                    </div>

                    <div className={styles.fieldList}>
                      {table.fields.map((field) => (
                        <span key={field}>{field}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Database size={22} strokeWidth={2.2} />}
                title="No tables planned"
                description="Database tables will appear when the build requires persistence."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="API routes"
            description="Planned endpoint surface for the generated app."
            badge={<WorkspaceStatusPill tone={endpointCount > 0 ? "green" : "default"}>{endpointCount} routes</WorkspaceStatusPill>}
          >
            {architecture.endpoints.length > 0 ? (
              <div className={styles.itemList}>
                {architecture.endpoints.map((endpoint) => (
                  <WorkspaceActionRow
                    key={endpoint.id}
                    title={`${endpoint.method.toUpperCase()} ${endpoint.path}`}
                    description={endpoint.purpose}
                    icon={<Braces size={15} strokeWidth={2.25} />}
                    badge={
                      <WorkspaceStatusPill tone={getMethodTone(endpoint.method)}>
                        {endpoint.method.toUpperCase()}
                      </WorkspaceStatusPill>
                    }
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Route size={22} strokeWidth={2.2} />}
                title="No API routes planned"
                description="API routes will appear when backend functionality is detected."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Security rules"
            description="Generated architecture-level security checks."
            badge={<WorkspaceStatusPill tone={securityRuleCount > 0 ? "orange" : "default"}>{securityRuleCount} rules</WorkspaceStatusPill>}
          >
            {architecture.securityRules.length > 0 ? (
              <div className={styles.itemList}>
                {architecture.securityRules.map((rule) => (
                  <WorkspaceActionRow
                    key={rule.id}
                    title={rule.label}
                    description={rule.description}
                    icon={<ShieldCheck size={15} strokeWidth={2.25} />}
                    badge={<WorkspaceStatusPill tone="orange">Review</WorkspaceStatusPill>}
                    onClick={onOpenSecurity}
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<ShieldCheck size={22} strokeWidth={2.2} />}
                title="No security rules"
                description="Security rules will appear after architecture analysis."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Next actions"
            description="Recommended steps before publishing."
            badge={<WorkspaceStatusPill>Workflow</WorkspaceStatusPill>}
          >
            <div className={styles.itemList}>
              <WorkspaceActionRow
                title="Review generated code"
                description="Open the code workspace and inspect important generated files."
                icon={<FileCode2 size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Code</WorkspaceStatusPill>}
                onClick={onOpenCode}
              />

              <WorkspaceActionRow
                title="Export SQL migration"
                description="Generate a starter Supabase migration from planned database tables."
                icon={<Database size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="purple">SQL</WorkspaceStatusPill>}
                onClick={onExportSql}
              />

              <WorkspaceActionRow
                title="Review launch readiness"
                description="Open publish readiness and check blockers before deployment."
                icon={<Upload size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="green">Publish</WorkspaceStatusPill>}
                onClick={onOpenPublish}
              />

              <WorkspaceActionRow
                title="Commit architecture checkpoint"
                description="Save a stable Git checkpoint before major structural changes."
                icon={<GitBranch size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill>Recommended</WorkspaceStatusPill>}
              />
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}