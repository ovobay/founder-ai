"use client";
import type { WorkspaceView } from "@/types/workspace";

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  ChevronsUpDown,
  Clock3,
  Cloud,
  Code2,
  File,
  FileText,
  GitBranch,
  Globe2,
  History,
  Loader2,
  LogOut,
  Menu,
  Mic,
  Monitor,
  MoreHorizontal,
  PanelLeft,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Share,
  Shield,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  KeyboardEvent,
  UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createDesignTastePromptBlock,
  getDesignTasteProfile,
  inferDesignTasteProfileId,
} from "@/lib/design/design-taste-profiles";
import { PremiumWorkspaceToolbar } from "@/components/workspace/PremiumWorkspaceToolbar";
import { AnalyticsWorkspace } from "@/components/workspace/AnalyticsWorkspace";
import { CloudWorkspace } from "@/components/workspace/CloudWorkspace";
import { SecurityWorkspace } from "@/components/workspace/SecurityWorkspace";
import { HistoryWorkspace as PremiumHistoryWorkspace } from "@/components/workspace/HistoryWorkspace";
import { PublishWorkspace as PremiumPublishWorkspace } from "@/components/workspace/PublishWorkspace";
import { FilesWorkspace as PremiumFilesWorkspace } from "@/components/workspace/FilesWorkspace";
import { CodeWorkspacePanel as PremiumCodeWorkspacePanel } from "@/components/workspace/CodeWorkspacePanel";
import { ArchitectureWorkspacePanel as PremiumArchitectureWorkspacePanel } from "@/components/workspace/ArchitectureWorkspacePanel";
import { PreviewCanvas } from "@/components/workspace/PreviewCanvas";
import {
  WorkspaceToolCard,
  WorkspaceToolEmpty,
  WorkspaceToolNav,
  WorkspaceToolShell,
} from "@/components/workspace/WorkspaceToolShell";

type Mode = "build" | "visual-edits";

type ProjectType = string;

type BuildClassification = {
  primaryCategory: string;
  secondaryCategories: string[];
  industry: string | null;
  platformTargets: string[];
  complexity: "simple" | "standard" | "advanced" | "enterprise";
};

type BuildStepStatus = "pending" | "active" | "complete";
type AssistantStatus = "building" | "completed";

type BuildStep = {
  id: string;
  label: string;
  detail: string;
  status: BuildStepStatus;
};

type EnvironmentVariableReadiness = {
  key: string;
  label: string;
  required: boolean;
  scope: "client" | "server";
  reason: string;
  example: string;
};

type PublishGateDecision =
  | "blocked"
  | "can-preview"
  | "can-stage"
  | "can-publish";

type PublishGateRequirement = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

type PublishGateReport = {
  decision: PublishGateDecision;
  label: string;
  score: number;
  summary: string;
  requirements: PublishGateRequirement[];
  nextActions: string[];
};

type LaunchReadinessStatus =
  | "ready"
  | "nearly-ready"
  | "needs-work"
  | "blocked";

type LaunchReadinessSignal = {
  id: string;
  label: string;
  status: LaunchReadinessStatus;
  score: number;
  detail: string;
};

type LaunchReadinessReport = {
  status: LaunchReadinessStatus;
  label: string;
  score: number;
  summary: string;
  signals: LaunchReadinessSignal[];
  blockers: string[];
  nextActions: string[];
};

type VisualQaHealthStatus = "ready" | "needs-review" | "missing";

type VisualQaHealthFinding = {
  id: string;
  label: string;
  status: VisualQaHealthStatus;
  detail: string;
};

type VisualQaHealthReport = {
  status: VisualQaHealthStatus;
  label: string;
  score: number;
  summary: string;
  findings: VisualQaHealthFinding[];
};

type VisualBuilderCompetitiveStatus =
  | "competitive"
  | "promising"
  | "behind";

type VisualBuilderFinding = {
  id: string;
  label: string;
  status: VisualBuilderCompetitiveStatus;
  detail: string;
  recommendation: string;
};

type VisualBuilderCompetitivenessReport = {
  status: VisualBuilderCompetitiveStatus;
  label: string;
  score: number;
  summary: string;
  findings: VisualBuilderFinding[];
};

type DesignQualityStatus = "strong" | "needs-review" | "weak";

type DesignQualityFinding = {
  id: string;
  label: string;
  status: DesignQualityStatus;
  detail: string;
};

type DesignQualityReport = {
  status: DesignQualityStatus;
  label: string;
  score: number;
  summary: string;
  findings: DesignQualityFinding[];
};

type SecurityHealthStatus = "ready" | "needs-review" | "blocked";

type SecurityHealthFinding = {
  id: string;
  label: string;
  status: SecurityHealthStatus;
  detail: string;
};

type SecurityHealthReport = {
  status: SecurityHealthStatus;
  label: string;
  score: number;
  summary: string;
  findings: SecurityHealthFinding[];
};

type BuildPackHealth = {
  status: "complete" | "mostly-complete" | "partial" | "missing";
  label: string;
  score: number;
  summary: string;
  missingFiles: string[];
};

type BuildPackFileStatus = {
  path: string;
  label: string;
  purpose: string;
  exists: boolean;
  fileId: string | null;
};

type DeployReadinessItem = {
  id: string;
  label: string;
  status: "ready" | "needs-setup" | "blocked";
  detail: string;
  checklist: string[];
};

type PublishReadinessStatus = "ready" | "needs-setup" | "blocked";

type PublishReadinessItem = {
  id: string;
  label: string;
  status: PublishReadinessStatus;
  detail: string;
  checklist: string[];
};

type PublishReadinessReport = {
  status: PublishReadinessStatus;
  score: number;
  summary: string;
  items: PublishReadinessItem[];
};

type IntegrationReadiness = {
  id: string;
  label: string;
  description?: string;
  provider: string;
  required: boolean;
  status: "ready" | "needs-setup" | "optional";
  reason: string;
  checklist: string[];
};

type DetectedModule = {
  id: string;
  label: string;
  description: string;
};

type SchemaTable = {
  id: string;
  name: string;
  purpose: string;
  fields: string[];
};

type ApiEndpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
};

type SecurityRule = {
  id: string;
  label: string;
  description: string;
};

type ArchitecturePlan = {
  tables: SchemaTable[];
  endpoints: ApiEndpoint[];
  securityRules: SecurityRule[];
};

type ChangedFile = {
  id: string;
  path: string;
  status: "created" | "updated" | "checked";
  description: string;
  contents: string;
};

type PreviewState = {
  title: string;
  subtitle: string;
  projectType: string;
  classification?: BuildClassification;
  fileCount: number;
  status: string;
  lastUpdatedLabel: string;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
};

type FounderProject = {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

type DatabaseProjectFile = {
  id: string;
  project_id: string;
  owner_user_id: string;
  path: string;
  contents: string;
  description: string | null;
  status: "created" | "updated" | "checked" | "deleted";
  last_build_id: string | null;
  created_at: string;
  updated_at: string;
};

type DatabaseBuild = {
  id: string;
  project_id: string;
  owner_user_id: string;
  prompt: string;
  project_type: string;
  classification?: unknown;
  modules: unknown;
  architecture: unknown;
  files: unknown;
  preview_state: unknown;
  status: "completed" | "restored" | "failed";
  created_at: string;
  restored_at: string | null;
};

type BuildHistoryItem = {
  id: string;
  prompt: string;
  projectType: ProjectType;
  classification?: BuildClassification;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  previewState: PreviewState;
  createdAt: string;
  status: "completed" | "restored" | "failed";
  source: "local" | "database";
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type AiGeneratedBuild = {
  projectType: ProjectType;
  classification?: BuildClassification;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  previewState: PreviewState;
  summary: string;
  changes: string[];
};

type FeedItem =
  | {
      id: string;
      role: "user";
      body: string;
      projectType: ProjectType;
      classification?: BuildClassification;
    }
  | {
      id: string;
      role: "assistant";
      title: string;
      status: AssistantStatus;
      summary: string;
      steps: BuildStep[];
      changes: string[];
      files: ChangedFile[];
      modules: DetectedModule[];
      architecture: ArchitecturePlan;
      projectType: ProjectType;
      classification?: BuildClassification;
    }
  | {
      id: string;
      role: "plan";
      title: string;
      prompt: string;
      summary: string;
      steps: BuildStep[];
      changes: string[];
      files: ChangedFile[];
      modules: DetectedModule[];
      architecture: ArchitecturePlan;
      approved: boolean;
      projectType: ProjectType;
      classification?: BuildClassification;
    };

type QueuedItem = {
  id: string;
  label: string;
};

type SecurityFinding = {
  id: string;
  label: string;
};

function getProjectTypeLabel(projectType: ProjectType): string {
  const labels: Record<string, string> = {
    "marketing-site": "Marketing site",
    saas: "SaaS",
    "web-app": "Web app",
    crm: "CRM",
    "shopify-store": "Shopify store",
    "shopify-app": "Shopify app",
    "marketing-engine": "Marketing engine",
    "mobile-app": "Mobile app",
  };

  if (labels[projectType]) {
    return labels[projectType];
  }

  return projectType
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Custom product";
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function normalizeTableName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function formatBuildTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDatabaseBuildTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown time";

  return formatBuildTime(date);
}

function isProjectType(value: string): value is ProjectType {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModules(value: unknown): DetectedModule[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is DetectedModule => {
    return (
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      typeof item.description === "string"
    );
  });
}

function parseChangedFiles(value: unknown): ChangedFile[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is ChangedFile => {
    return (
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.path === "string" &&
      typeof item.description === "string" &&
      typeof item.contents === "string" &&
      typeof item.status === "string" &&
      ["created", "updated", "checked"].includes(item.status)
    );
  });
}

function parseClassification(
  value: unknown,
  projectType: string
): BuildClassification {
  if (!isRecord(value)) {
    return {
      primaryCategory: getProjectTypeLabel(projectType),
      secondaryCategories: [],
      industry: null,
      platformTargets: ["web"],
      complexity: "standard",
    };
  }

  const secondaryCategories = Array.isArray(value.secondaryCategories)
    ? value.secondaryCategories.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  const platformTargets = Array.isArray(value.platformTargets)
    ? value.platformTargets.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  const complexity =
    value.complexity === "simple" ||
    value.complexity === "standard" ||
    value.complexity === "advanced" ||
    value.complexity === "enterprise"
      ? value.complexity
      : "standard";

  return {
    primaryCategory:
      typeof value.primaryCategory === "string" &&
      value.primaryCategory.trim().length > 0
        ? value.primaryCategory
        : getProjectTypeLabel(projectType),
    secondaryCategories,
    industry:
      typeof value.industry === "string" && value.industry.trim().length > 0
        ? value.industry
        : null,
    platformTargets: platformTargets.length > 0 ? platformTargets : ["web"],
    complexity,
  };
}

function parseProjectFiles(value: unknown): DatabaseProjectFile[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is DatabaseProjectFile => {
    return (
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.project_id === "string" &&
      typeof item.owner_user_id === "string" &&
      typeof item.path === "string" &&
      typeof item.contents === "string" &&
      typeof item.status === "string" &&
      ["created", "updated", "checked", "deleted"].includes(item.status) &&
      typeof item.created_at === "string" &&
      typeof item.updated_at === "string"
    );
  });
}

function mapProjectFileToChangedFile(file: DatabaseProjectFile): ChangedFile {
  const status =
    file.status === "deleted"
      ? "updated"
      : (file.status as "created" | "updated" | "checked");

  return {
    id: file.id,
    path: file.path,
    status,
    description: file.description ?? "Database-backed project file.",
    contents: file.contents,
  };
}

function parseArchitecture(value: unknown): ArchitecturePlan {
  if (!isRecord(value)) {
    return {
      tables: [],
      endpoints: [],
      securityRules: [],
    };
  }

  const tables = Array.isArray(value.tables)
    ? value.tables.filter((item): item is SchemaTable => {
        return (
          isRecord(item) &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.purpose === "string" &&
          Array.isArray(item.fields)
        );
      })
    : [];

  const endpoints = Array.isArray(value.endpoints)
    ? value.endpoints.filter((item): item is ApiEndpoint => {
        return (
          isRecord(item) &&
          typeof item.id === "string" &&
          typeof item.method === "string" &&
          ["GET", "POST", "PATCH", "DELETE"].includes(item.method) &&
          typeof item.path === "string" &&
          typeof item.purpose === "string"
        );
      })
    : [];

  const securityRules = Array.isArray(value.securityRules)
    ? value.securityRules.filter((item): item is SecurityRule => {
        return (
          isRecord(item) &&
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.description === "string"
        );
      })
    : [];

  return {
    tables,
    endpoints,
    securityRules,
  };
}

function parsePreviewState(value: unknown): PreviewState | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.title !== "string" ||
    typeof value.subtitle !== "string" ||
    typeof value.projectType !== "string" ||
    typeof value.fileCount !== "number" ||
    typeof value.status !== "string" ||
    typeof value.lastUpdatedLabel !== "string"
  ) {
    return null;
  }

  return {
    title: value.title,
    subtitle: value.subtitle,
    projectType: value.projectType,
    classification: {
      primaryCategory: getProjectTypeLabel(value.projectType),
      secondaryCategories: [],
      industry: null,
      platformTargets: ["web"],
      complexity: "standard",
    },
    fileCount: value.fileCount,
    status: value.status,
    lastUpdatedLabel: value.lastUpdatedLabel,
    modules: parseModules(value.modules),
    architecture: parseArchitecture(value.architecture),
  };
}

function mapDatabaseBuildToHistoryItem(build: DatabaseBuild): BuildHistoryItem {
  const projectType = isProjectType(build.project_type)
    ? build.project_type
    : "saas";

  const classification = parseClassification(
    build.classification,
    projectType
  );
  const modules = parseModules(build.modules);
  const architecture = parseArchitecture(build.architecture);
  const files = parseChangedFiles(build.files);
  const parsedPreviewState = parsePreviewState(build.preview_state);

  const previewState =
    parsedPreviewState
      ? {
          ...parsedPreviewState,
          classification,
        }
      : {
          ...createPreviewState(
            build.prompt,
            projectType,
            files.length,
            modules,
            architecture
          ),
          classification,
        };

  return {
    id: build.id,
    prompt: build.prompt,
    projectType,
    modules,
    architecture,
    files,
    previewState,
    createdAt: formatDatabaseBuildTime(build.created_at),
    status: build.status,
    source: "database",
  };
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      ok: false,
      error: "Invalid server response.",
    };
  }
}

function inferProjectType(prompt: string): ProjectType {
  const lower = prompt.toLowerCase();

  if (includesAny(lower, ["iphone", "android", "ios", "mobile app", "react native", "expo"])) {
    return "mobile-app";
  }

  if (includesAny(lower, ["shopify app", "embedded shopify", "shopify admin", "admin api", "shopify webhook", "shopify billing", "merchant app"])) {
    return "shopify-app";
  }

  if (includesAny(lower, ["shopify store", "online store", "ecommerce store", "e-commerce store", "product page", "collection page", "storefront", "shopify theme"])) {
    return "shopify-store";
  }

  if (includesAny(lower, ["linkedin", "facebook", "instagram", "meta ads", "lead generation", "marketing leads", "sales leads", "campaign", "outreach", "lead scoring", "sales sequence", "marketing engine", "generate leads"])) {
    return "marketing-engine";
  }

  if (includesAny(lower, ["crm", "customer relationship", "pipeline", "deals", "contacts", "sales pipeline", "client portal", "customer portal"])) {
    return "crm";
  }

  if (includesAny(lower, ["saas", "subscription", "billing", "stripe", "tenant", "multi tenant", "multi-tenant", "dashboard", "admin dashboard", "user roles", "auth", "login", "signup"])) {
    return "saas";
  }

  if (includesAny(lower, ["web app", "application", "platform", "portal", "booking system", "inventory", "management system", "backend", "database", "api", "workflow"])) {
    return "web-app";
  }

  if (includesAny(lower, ["marketing site", "landing page", "website", "homepage", "sales page", "waitlist", "lead magnet", "brochure site"])) {
    return "marketing-site";
  }

  return "saas";
}

function inferModules(prompt: string, projectType: ProjectType): DetectedModule[] {
  const lower = prompt.toLowerCase();
  const modules: DetectedModule[] = [];

  function addModule(id: string, label: string, description: string) {
    if (modules.some((module) => module.id === id)) return;

    modules.push({
      id,
      label,
      description,
    });
  }

  if (projectType === "saas" || includesAny(lower, ["auth", "login", "signup", "sign up", "users"])) {
    addModule("auth", "Authentication", "User registration, login, sessions, and account access.");
  }

  if (projectType === "saas" || includesAny(lower, ["stripe", "billing", "subscription", "payments", "pricing"])) {
    addModule("billing", "Billing", "Stripe-ready pricing, subscriptions, payment states, and plan access.");
  }

  if (includesAny(lower, ["dashboard", "admin", "admin panel", "analytics", "reports", "metrics"])) {
    addModule("dashboard", "Dashboard", "Operational dashboard with metrics, activity, and admin controls.");
  }

  if (includesAny(lower, ["database", "backend", "api", "server", "workflow", "automation"])) {
    addModule("backend", "Backend/API", "API routes, data model planning, backend actions, and workflow handlers.");
  }

  if (projectType === "crm" || includesAny(lower, ["crm", "contacts", "companies", "deals", "pipeline", "tasks", "notes"])) {
    addModule("crm", "CRM", "Contacts, companies, deals, pipeline stages, notes, tasks, and activity.");
  }

  if (includesAny(lower, ["booking", "appointment", "calendar", "schedule", "availability"])) {
    addModule("booking", "Booking", "Appointment scheduling, calendar availability, booking states, and reminders.");
  }

  if (includesAny(lower, ["inventory", "stock", "warehouse", "products", "orders"])) {
    addModule("inventory", "Inventory", "Products, stock states, orders, fulfilment, and item tracking.");
  }

  if (projectType === "shopify-store" || includesAny(lower, ["product page", "collection", "cart", "checkout", "storefront"])) {
    addModule("storefront", "Storefront", "Product pages, collection sections, trust blocks, cart flow, and conversion layout.");
  }

  if (projectType === "shopify-app" || includesAny(lower, ["shopify admin", "admin api", "webhook", "merchant"])) {
    addModule("shopify-app", "Shopify app logic", "OAuth, Admin API, merchant dashboard, webhook handlers, and billing hooks.");
  }

  if (projectType === "marketing-engine" || includesAny(lower, ["leads", "lead generation", "linkedin", "facebook", "instagram", "campaign", "outreach", "sales"])) {
    addModule("lead-engine", "Lead engine", "Lead sourcing, scoring, campaign planning, outreach sequences, and sales tracking.");
  }

  if (includesAny(lower, ["ai", "chatbot", "agent", "copilot", "assistant", "openai", "generate"])) {
    addModule("ai", "AI assistant", "AI generation, assistant workflows, prompt handling, and content/action suggestions.");
  }

  if (includesAny(lower, ["email", "newsletter", "campaign email", "sequence", "resend", "postmark"])) {
    addModule("email", "Email workflows", "Email campaigns, transactional messages, sequences, and delivery states.");
  }

  if (projectType === "marketing-site" || includesAny(lower, ["landing page", "website", "homepage", "marketing site", "lead capture", "waitlist"])) {
    addModule("marketing-page", "Marketing page", "Hero, proof blocks, benefits, pricing, FAQ, lead capture, and conversion CTA.");
  }

  if (modules.length === 0) {
    addModule("core-app", "Core app", "Base project structure with preview, generated files, and implementation plan.");
  }

  return modules;
}

function createArchitecturePlan(
  projectType: ProjectType,
  modules: DetectedModule[]
): ArchitecturePlan {
  const tables: SchemaTable[] = [];
  const endpoints: ApiEndpoint[] = [];
  const securityRules: SecurityRule[] = [];

  function addTable(id: string, name: string, purpose: string, fields: string[]) {
    if (tables.some((table) => table.id === id)) return;

    tables.push({
      id,
      name,
      purpose,
      fields,
    });
  }

  function addEndpoint(
    id: string,
    method: ApiEndpoint["method"],
    path: string,
    purpose: string
  ) {
    if (endpoints.some((endpoint) => endpoint.id === id)) return;

    endpoints.push({
      id,
      method,
      path,
      purpose,
    });
  }

  function addSecurityRule(id: string, label: string, description: string) {
    if (securityRules.some((rule) => rule.id === id)) return;

    securityRules.push({
      id,
      label,
      description,
    });
  }

  addTable("users", "users", "Stores registered users and account ownership.", [
    "id",
    "email",
    "name",
    "role",
    "created_at",
  ]);

  addSecurityRule(
    "authenticated-access",
    "Authenticated access",
    "Private project data requires a signed-in user session."
  );

  modules.forEach((module) => {
    if (module.id === "auth") {
      addTable("sessions", "sessions", "Tracks active user sessions.", [
        "id",
        "user_id",
        "expires_at",
        "created_at",
      ]);

      addEndpoint("auth-login", "POST", "/api/auth/login", "Authenticate user.");
      addEndpoint("auth-session", "GET", "/api/auth/session", "Read current session.");
      addSecurityRule("session-validation", "Session validation", "Every protected API route validates the current user session.");
    }

    if (module.id === "billing") {
      addTable("subscriptions", "subscriptions", "Stores customer subscription state.", [
        "id",
        "user_id",
        "stripe_customer_id",
        "stripe_subscription_id",
        "plan",
        "status",
      ]);

      addEndpoint("billing-checkout", "POST", "/api/billing/checkout", "Create Stripe checkout session.");
      addEndpoint("billing-webhook", "POST", "/api/billing/webhook", "Handle Stripe webhook events.");
      addSecurityRule("billing-webhook-signature", "Webhook signature verification", "Stripe webhook payloads must be verified before updating subscription state.");
    }

    if (module.id === "dashboard") {
      addTable("dashboard_metrics", "dashboard_metrics", "Stores dashboard snapshot metrics.", [
        "id",
        "workspace_id",
        "metric_key",
        "metric_value",
        "captured_at",
      ]);

      addEndpoint("dashboard-summary", "GET", "/api/dashboard/summary", "Load dashboard metrics and activity.");
    }

    if (module.id === "backend") {
      addTable("workflows", "workflows", "Stores backend workflow definitions.", [
        "id",
        "workspace_id",
        "name",
        "status",
        "trigger",
        "created_at",
      ]);

      addEndpoint("workflow-run", "POST", "/api/workflows/run", "Execute a backend workflow.");
    }

    if (module.id === "crm") {
      addTable("contacts", "contacts", "Stores people and customer records.", [
        "id",
        "workspace_id",
        "name",
        "email",
        "phone",
        "status",
      ]);

      addTable("deals", "deals", "Stores CRM opportunities and pipeline state.", [
        "id",
        "contact_id",
        "title",
        "value",
        "stage",
        "close_date",
      ]);

      addEndpoint("contacts-list", "GET", "/api/crm/contacts", "List CRM contacts.");
      addEndpoint("deals-create", "POST", "/api/crm/deals", "Create CRM deal.");
      addSecurityRule("crm-workspace-access", "Workspace access control", "CRM records are scoped to the user workspace.");
    }

    if (module.id === "booking") {
      addTable("bookings", "bookings", "Stores appointment bookings.", [
        "id",
        "user_id",
        "customer_name",
        "start_time",
        "end_time",
        "status",
      ]);

      addEndpoint("booking-create", "POST", "/api/bookings", "Create booking request.");
      addEndpoint("booking-availability", "GET", "/api/bookings/availability", "Fetch available booking slots.");
    }

    if (module.id === "inventory") {
      addTable("products", "products", "Stores product and stock data.", [
        "id",
        "sku",
        "name",
        "stock_quantity",
        "price",
        "status",
      ]);

      addEndpoint("products-list", "GET", "/api/products", "List products.");
      addEndpoint("products-update", "PATCH", "/api/products/:id", "Update product.");
    }

    if (module.id === "storefront") {
      addTable("storefront_sections", "storefront_sections", "Stores storefront content sections.", [
        "id",
        "section_type",
        "title",
        "content",
        "sort_order",
      ]);

      addEndpoint("storefront-content", "GET", "/api/storefront/content", "Load storefront content.");
    }

    if (module.id === "shopify-app") {
      addTable("shopify_shops", "shopify_shops", "Stores connected Shopify shops.", [
        "id",
        "shop_domain",
        "access_token_encrypted",
        "scope",
        "installed_at",
      ]);

      addEndpoint("shopify-oauth", "GET", "/api/shopify/oauth", "Start Shopify OAuth.");
      addEndpoint("shopify-webhooks", "POST", "/api/shopify/webhooks", "Receive Shopify webhooks.");
      addSecurityRule("shopify-hmac", "Shopify HMAC validation", "Shopify webhook and OAuth requests require HMAC validation.");
    }

    if (module.id === "lead-engine") {
      addTable("leads", "leads", "Stores leads and qualification data.", [
        "id",
        "source",
        "name",
        "company",
        "email",
        "score",
        "status",
      ]);

      addTable("campaigns", "campaigns", "Stores marketing campaigns.", [
        "id",
        "name",
        "channel",
        "goal",
        "status",
        "created_at",
      ]);

      addEndpoint("leads-search", "POST", "/api/leads/search", "Search approved lead sources.");
      addEndpoint("campaigns-create", "POST", "/api/campaigns", "Create campaign.");
      addSecurityRule("platform-api-permissions", "Platform API permissions", "LinkedIn, Meta, and other marketing data must use approved OAuth/API access.");
    }

    if (module.id === "ai") {
      addTable("ai_runs", "ai_runs", "Stores AI generation and assistant action logs.", [
        "id",
        "user_id",
        "prompt",
        "model",
        "status",
        "created_at",
      ]);

      addEndpoint("ai-generate", "POST", "/api/ai/generate", "Run AI generation.");
    }

    if (module.id === "email") {
      addTable("email_sequences", "email_sequences", "Stores outbound email sequences.", [
        "id",
        "workspace_id",
        "name",
        "status",
        "created_at",
      ]);

      addEndpoint("email-send", "POST", "/api/email/send", "Send transactional or campaign email.");
    }

    if (module.id === "marketing-page") {
      addTable("landing_pages", "landing_pages", "Stores marketing page configuration.", [
        "id",
        "slug",
        "headline",
        "subheadline",
        "cta_label",
        "published",
      ]);

      addEndpoint("landing-page-load", "GET", "/api/pages/:slug", "Load landing page content.");
    }

    if (module.id === "core-app") {
      const tableName = normalizeTableName(getProjectTypeLabel(projectType));

      addTable(
        `${tableName}_records`,
        `${tableName}_records`,
        "Stores primary application records.",
        ["id", "workspace_id", "name", "status", "created_at"]
      );

      addEndpoint("core-records", "GET", "/api/records", "Load primary application records.");
    }
  });

  if (projectType === "marketing-site") {
    addSecurityRule(
      "lead-capture-consent",
      "Lead capture consent",
      "Lead capture forms must clearly state consent and usage purpose."
    );
  }

  if (projectType === "mobile-app") {
    addSecurityRule(
      "mobile-pipeline-disabled",
      "Mobile pipeline disabled",
      "Mobile builds are planned for a later phase and should not generate deployment credentials yet."
    );
  }

  return {
    tables,
    endpoints,
    securityRules,
  };
}

function buildChangeList(
  prompt: string,
  projectType: ProjectType,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): string[] {
  const lower = prompt.toLowerCase();
  const changes: string[] = [];

  changes.push(`Detected the request as a ${getProjectTypeLabel(projectType)} build from the prompt.`);
  changes.push(`Detected ${modules.length} product ${modules.length === 1 ? "module" : "modules"}: ${modules.map((module) => module.label).join(", ")}.`);
  changes.push(`Planned ${architecture.tables.length} database ${architecture.tables.length === 1 ? "table" : "tables"}, ${architecture.endpoints.length} API ${architecture.endpoints.length === 1 ? "route" : "routes"}, and ${architecture.securityRules.length} security ${architecture.securityRules.length === 1 ? "rule" : "rules"}.`);
  changes.push("Saved the build into the database-backed project workspace.");
  changes.push("Updated the real project file tree from generated files.");

  if (projectType === "marketing-site") {
    changes.push("Prepare marketing site structure with hero section, proof blocks, feature sections, lead capture, pricing, and conversion-focused copy.");
  }

  if (projectType === "saas") {
    changes.push("Prepare SaaS structure with landing page, authentication, dashboard, billing, subscriptions, and database-ready sections.");
  }

  if (projectType === "web-app") {
    changes.push("Prepare full-stack web application structure with frontend views, backend routes, API layer, database planning, and role-aware workflows.");
  }

  if (projectType === "crm") {
    changes.push("Prepare CRM structure with contacts, companies, pipeline, notes, tasks, deals, and activity tracking.");
  }

  if (projectType === "shopify-store") {
    changes.push("Prepare Shopify store structure with storefront sections, product merchandising, collection logic, trust blocks, and conversion-focused layout.");
  }

  if (projectType === "shopify-app") {
    changes.push("Prepare Shopify app structure with embedded admin UI, OAuth, webhook handling, billing, and Admin API integration points.");
  }

  if (projectType === "marketing-engine") {
    changes.push("Prepare marketing engine structure with campaign planning, lead capture, lead scoring, outreach sequences, sales workflows, and performance tracking.");
  }

  if (projectType === "mobile-app") {
    changes.push("Mobile app generation detected, but the iPhone and Android build pipeline is planned for a later phase.");
  }

  if (includesAny(lower, ["scroll", "blur", "fade"])) {
    changes.push("Preserve the current scroll fade and scroll-to-bottom behavior.");
  }

  if (includesAny(lower, ["send", "button", "mic", "composer"])) {
    changes.push("Keep composer button styling separated so send, mic, and plus controls stay independent.");
  }

  if (includesAny(lower, ["output", "generated", "build", "process"])) {
    changes.push("Render generated assistant output as a structured build process instead of plain chat text.");
  }

  if (includesAny(lower, ["preview", "toolbar", "files", "code"])) {
    changes.push("Keep preview controls compact while preserving the right-side preview workspace.");
  }

  if (includesAny(lower, ["css", "leave", "current"])) {
    changes.push("Leave the existing CSS changes untouched and continue using the current class structure.");
  }

  return changes;
}

function createFileContents(
  path: string,
  prompt: string,
  projectType: ProjectType,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): string {
  const moduleList = modules.map((module) => module.id).join(", ");

  if (path.endsWith("app/page.tsx")) {
    return `// ${path}
"use client";

// Founder AI builder shell
// Detected project type: ${getProjectTypeLabel(projectType)}
// Detected modules: ${moduleList}
// Database tables planned: ${architecture.tables.length}
// API routes planned: ${architecture.endpoints.length}
// Security rules planned: ${architecture.securityRules.length}
// Latest instruction:
// ${prompt}

export default function Page() {
  return (
    <main>
      <CommandPanel />
      <PreviewWorkspace />
    </main>
  );
}`;
  }

  if (path.endsWith("app/globals.css")) {
    return `/* ${path}
   Current user styling preserved.
   No overrides applied in this build.
*/

:root {
  --bg: #ffffff;
  --line: #e5e7eb;
}`;
  }

  if (path.includes("project-inference")) {
    return `// ${path}

export function inferProjectType(prompt: string) {
  const value = prompt.toLowerCase();

  if (value.includes("shopify app")) return "shopify-app";
  if (value.includes("shopify store")) return "shopify-store";
  if (value.includes("crm")) return "crm";
  if (value.includes("linkedin") || value.includes("facebook")) return "marketing-engine";
  if (value.includes("mobile") || value.includes("iphone")) return "mobile-app";
  if (value.includes("landing page") || value.includes("marketing site")) return "marketing-site";
  if (value.includes("backend") || value.includes("api")) return "web-app";

  return "saas";
}`;
  }

  if (path.includes("module-inference")) {
    return `// ${path}

export const detectedModules = [
${modules
  .map(
    (module) => `  {
    id: "${module.id}",
    label: "${module.label}",
    description: "${module.description}",
  }`
  )
  .join(",\n")}
];`;
  }

  if (path.includes("database-schema")) {
    return `// ${path}

export const databaseSchema = [
${architecture.tables
  .map(
    (table) => `  {
    name: "${table.name}",
    purpose: "${table.purpose}",
    fields: [${table.fields.map((field) => `"${field}"`).join(", ")}],
  }`
  )
  .join(",\n")}
];`;
  }

  if (path.includes("api-routes")) {
    return `// ${path}

export const apiRoutes = [
${architecture.endpoints
  .map(
    (endpoint) => `  {
    method: "${endpoint.method}",
    path: "${endpoint.path}",
    purpose: "${endpoint.purpose}",
  }`
  )
  .join(",\n")}
];`;
  }

  if (path.includes("security-rules")) {
    return `// ${path}

export const securityRules = [
${architecture.securityRules
  .map(
    (rule) => `  {
    label: "${rule.label}",
    description: "${rule.description}",
  }`
  )
  .join(",\n")}
];`;
  }

  if (path.includes("build-history")) {
    return `// ${path}

export type BuildHistoryItem = {
  id: string;
  prompt: string;
  projectType: string;
  createdAt: string;
  status: "completed" | "restored" | "failed";
};

export function restoreBuild(buildId: string) {
  return {
    restoredBuildId: buildId,
    restoredAt: new Date().toISOString(),
  };
}`;
  }

  if (path.includes("preview-workspace")) {
    return `// ${path}

export function PreviewWorkspace() {
  return (
    <section>
      <PreviewToolbar   onOpenPublishCenter={openPublishCenter}
              previewState={previewState}
              files={changedFiles}
            />
      <LivePreview />
      <FilesDrawer />
      <ArchitectureView />
      <BuildHistory />
    </section>
  );
}`;
  }

  if (path.includes("command-composer")) {
    return `// ${path}

export function CommandComposer() {
  return (
    <form>
      <textarea suppressHydrationWarning placeholder="Describe what you want to build..." />
      <button suppressHydrationWarning type="submit">Send</button>
    </form>
  );
}`;
  }

  if (path.includes("integrations")) {
    return `// ${path}

export const integrations = [
  "openai",
  "stripe",
  "supabase",
  "github",
  "vercel",
  "shopify",
  "meta-marketing",
  "linkedin-marketing"
];`;
  }

  return `// ${path}

export const generated = true;`;
}

function createChangedFiles(
  prompt: string,
  projectType: ProjectType,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): ChangedFile[] {
  const lower = prompt.toLowerCase();

  const files: ChangedFile[] = [
    {
      id: "file-page",
      path: "app/page.tsx",
      status: "updated",
      description: "Updated command center behavior and preview state.",
      contents: createFileContents("app/page.tsx", prompt, projectType, modules, architecture),
    },
    {
      id: "file-globals",
      path: "app/globals.css",
      status: "checked",
      description: "Preserved current styling without overriding user changes.",
      contents: createFileContents("app/globals.css", prompt, projectType, modules, architecture),
    },
    {
      id: "file-project-inference",
      path: "lib/project-inference.ts",
      status: "created",
      description: "Added prompt-based project type inference so users do not need to manually select a type.",
      contents: createFileContents("lib/project-inference.ts", prompt, projectType, modules, architecture),
    },
    {
      id: "file-module-inference",
      path: "lib/module-inference.ts",
      status: "created",
      description: "Added automatic feature/module detection based on the user prompt.",
      contents: createFileContents("lib/module-inference.ts", prompt, projectType, modules, architecture),
    },
    {
      id: "file-database-schema",
      path: "config/database-schema.ts",
      status: "created",
      description: "Added a database planning scaffold based on detected product modules.",
      contents: createFileContents("config/database-schema.ts", prompt, projectType, modules, architecture),
    },
    {
      id: "file-api-routes",
      path: "config/api-routes.ts",
      status: "created",
      description: "Added API route plan based on detected project modules.",
      contents: createFileContents("config/api-routes.ts", prompt, projectType, modules, architecture),
    },
    {
      id: "file-security-rules",
      path: "config/security-rules.ts",
      status: "created",
      description: "Added security rule plan for auth, data access, and integrations.",
      contents: createFileContents("config/security-rules.ts", prompt, projectType, modules, architecture),
    },
    {
      id: "file-build-history",
      path: "lib/build-history.ts",
      status: "created",
      description: "Added build history planning so users can restore previous generated states.",
      contents: createFileContents("lib/build-history.ts", prompt, projectType, modules, architecture),
    },
  ];

  if (includesAny(lower, ["preview", "toolbar", "files", "drawer", "code"])) {
    files.push({
      id: "file-preview",
      path: "components/preview-workspace.tsx",
      status: "updated",
      description: "Adjusted preview workspace structure and file drawer data.",
      contents: createFileContents("components/preview-workspace.tsx", prompt, projectType, modules, architecture),
    });
  }

  if (includesAny(lower, ["send", "composer", "button", "mic"])) {
    files.push({
      id: "file-composer",
      path: "components/command-composer.tsx",
      status: "updated",
      description: "Refined composer interactions and button state handling.",
      contents: createFileContents("components/command-composer.tsx", prompt, projectType, modules, architecture),
    });
  }

  if (projectType === "marketing-engine") {
    files.push({
      id: "file-integrations",
      path: "config/integrations.ts",
      status: "created",
      description: "Added integration list for OpenAI, Stripe, Supabase, Shopify, Meta, and LinkedIn marketing workflows.",
      contents: createFileContents("config/integrations.ts", prompt, projectType, modules, architecture),
    });
  }

  return files;
}

function createPreviewState(
  _prompt: string,
  projectType: ProjectType,
  fileCount: number,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): PreviewState {
  if (projectType === "marketing-site") {
    return {
      title: "Marketing Site Builder",
      subtitle: "Create high-converting landing pages, marketing websites, lead capture flows, proof sections, pricing blocks, and conversion-focused copy.",
      projectType: "Marketing site",
      fileCount,
      status: "Marketing site ready",
      lastUpdatedLabel: "Marketing site detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  if (projectType === "saas") {
    return {
      title: "SaaS Builder Workspace",
      subtitle: "Generate SaaS products with landing pages, authentication, dashboards, subscriptions, admin controls, and database-ready architecture.",
      projectType: "SaaS",
      fileCount,
      status: "SaaS structure ready",
      lastUpdatedLabel: "SaaS detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  if (projectType === "web-app") {
    return {
      title: "Full-Stack Web App Workspace",
      subtitle: "Build complete web applications with frontend screens, backend routes, API logic, database planning, roles, and integrations.",
      projectType: "Web app",
      fileCount,
      status: "App structure ready",
      lastUpdatedLabel: "Web app detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  if (projectType === "crm") {
    return {
      title: "CRM Builder Workspace",
      subtitle: "Build CRM systems with contacts, companies, pipelines, deals, notes, tasks, reminders, activity timelines, and sales workflows.",
      projectType: "CRM",
      fileCount,
      status: "CRM scaffold ready",
      lastUpdatedLabel: "CRM detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  if (projectType === "shopify-store") {
    return {
      title: "Shopify Store Builder",
      subtitle: "Create conversion-focused Shopify stores with storefront sections, products, collections, trust blocks, and sales-focused layouts.",
      projectType: "Shopify store",
      fileCount,
      status: "Storefront ready",
      lastUpdatedLabel: "Shopify store detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  if (projectType === "shopify-app") {
    return {
      title: "Shopify App Builder",
      subtitle: "Develop Shopify apps with embedded admin UI, OAuth, Admin API workflows, webhooks, billing, and merchant-facing dashboards.",
      projectType: "Shopify app",
      fileCount,
      status: "App scaffold ready",
      lastUpdatedLabel: "Shopify app detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  if (projectType === "marketing-engine") {
    return {
      title: "AI Marketing Engine",
      subtitle: "Plan campaigns, generate leads, score prospects, create outreach sequences, track performance, and build sales workflows that actually point at revenue.",
      projectType: "Marketing engine",
      fileCount,
      status: "Marketing system ready",
      lastUpdatedLabel: "Marketing engine detected",
      classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,
    };
  }

  return {
    title: "Mobile App Builder",
    subtitle: "iPhone and Android app generation is planned for a later phase. The platform detected a mobile request, but mobile builds are not enabled yet.",
    projectType: "Mobile app",
    fileCount,
    status: "Coming soon",
    lastUpdatedLabel: "Mobile app detected",
    modules,
    architecture,
  };
}

function inferRequiredIntegrations({
  modules,
  architecture,
  projectType,
  classification,
}: {
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  projectType: ProjectType;
  classification?: BuildClassification;
}) {
  const haystack = [
    projectType,
    classification?.primaryCategory ?? "",
    classification?.industry ?? "",
    ...(classification?.secondaryCategories ?? []),
    ...(classification?.platformTargets ?? []),
    ...modules.map((module) => module.id),
    ...modules.map((module) => module.label),
    ...architecture.endpoints.map((endpoint) => endpoint.path),
    ...architecture.endpoints.map((endpoint) => endpoint.purpose),
  ]
    .join(" ")
    .toLowerCase();

  const integrations = new Set<string>();

  if (
    haystack.includes("stripe") ||
    haystack.includes("billing") ||
    haystack.includes("subscription") ||
    haystack.includes("payment")
  ) {
    integrations.add("Stripe");
  }

  if (
    haystack.includes("openai") ||
    haystack.includes("ai") ||
    haystack.includes("generate") ||
    haystack.includes("assistant") ||
    haystack.includes("agent")
  ) {
    integrations.add("OpenAI");
  }

  if (
    haystack.includes("supabase") ||
    haystack.includes("database") ||
    haystack.includes("auth") ||
    haystack.includes("storage")
  ) {
    integrations.add("Supabase");
  }

  if (
    haystack.includes("shopify") ||
    haystack.includes("merchant") ||
    haystack.includes("storefront") ||
    haystack.includes("admin api")
  ) {
    integrations.add("Shopify");
  }

  if (
    haystack.includes("linkedin") ||
    haystack.includes("lead") ||
    haystack.includes("outreach") ||
    haystack.includes("sales")
  ) {
    integrations.add("LinkedIn API / approved lead source");
  }

  if (
    haystack.includes("facebook") ||
    haystack.includes("instagram") ||
    haystack.includes("meta")
  ) {
    integrations.add("Meta API");
  }

  if (
    haystack.includes("email") ||
    haystack.includes("newsletter") ||
    haystack.includes("sequence")
  ) {
    integrations.add("Transactional email provider");
  }

  if (integrations.size === 0) {
    integrations.add("Supabase");
  }

  return Array.from(integrations);
}

function textIncludesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getBuildTextSignal({
  projectType,
  modules,
  architecture,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}) {
  return [
    projectType,
    getProjectTypeLabel(projectType),
    classification?.primaryCategory ?? "",
    classification?.industry ?? "",
    ...(classification?.secondaryCategories ?? []),
    ...(classification?.platformTargets ?? []),
    ...modules.map((module) => module.id),
    ...modules.map((module) => module.label),
    ...modules.map((module) => module.description),
    ...architecture.tables.map((table) => table.name),
    ...architecture.tables.map((table) => table.purpose),
    ...architecture.endpoints.map((endpoint) => endpoint.path),
    ...architecture.endpoints.map((endpoint) => endpoint.purpose),
    ...architecture.securityRules.map((rule) => rule.label),
    ...architecture.securityRules.map((rule) => rule.description),
  ]
    .join(" ")
    .toLowerCase();
}

function getEnvironmentVariableReadiness({
  projectType,
  modules,
  architecture,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}): EnvironmentVariableReadiness[] {
  const integrations = getIntegrationReadiness({
    projectType,
    modules,
    architecture,
    classification,
  });

  const requiredIntegrationIds = new Set(
    integrations
      .filter((integration) => integration.required)
      .map((integration) => integration.id)
  );

  const variables: EnvironmentVariableReadiness[] = [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "Supabase project URL",
      required: requiredIntegrationIds.has("supabase"),
      scope: "client",
      reason: "Required by the browser client to connect to Supabase Auth, database, and storage.",
      example: "https://your-project.supabase.co",
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      label: "Supabase anon key",
      required: requiredIntegrationIds.has("supabase"),
      scope: "client",
      reason: "Required by the browser client for safe public Supabase access with Row Level Security.",
      example: "eyJhbGciOi...",
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "Supabase service role key",
      required: requiredIntegrationIds.has("supabase"),
      scope: "server",
      reason: "Required for trusted server-side project/build/file operations. Never expose this to the browser.",
      example: "eyJhbGciOi...",
    },
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI API key",
      required: requiredIntegrationIds.has("openai"),
      scope: "server",
      reason: "Required for AI build generation, assistant workflows, content generation, and agent features.",
      example: "sk-...",
    },
    {
      key: "STRIPE_SECRET_KEY",
      label: "Stripe secret key",
      required: requiredIntegrationIds.has("stripe"),
      scope: "server",
      reason: "Required for checkout sessions, subscriptions, invoices, and billing operations.",
      example: "sk_test_...",
    },
    {
      key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      label: "Stripe publishable key",
      required: requiredIntegrationIds.has("stripe"),
      scope: "client",
      reason: "Required by client-side Stripe checkout/payment components.",
      example: "pk_test_...",
    },
    {
      key: "STRIPE_WEBHOOK_SECRET",
      label: "Stripe webhook secret",
      required: requiredIntegrationIds.has("stripe"),
      scope: "server",
      reason: "Required to verify Stripe webhook events before changing billing state.",
      example: "whsec_...",
    },
    {
      key: "SHOPIFY_API_KEY",
      label: "Shopify API key",
      required: requiredIntegrationIds.has("shopify"),
      scope: "server",
      reason: "Required for Shopify OAuth and embedded app installation.",
      example: "your_shopify_api_key",
    },
    {
      key: "SHOPIFY_API_SECRET",
      label: "Shopify API secret",
      required: requiredIntegrationIds.has("shopify"),
      scope: "server",
      reason: "Required for Shopify OAuth verification and HMAC validation.",
      example: "your_shopify_api_secret",
    },
    {
      key: "SHOPIFY_APP_URL",
      label: "Shopify app URL",
      required: requiredIntegrationIds.has("shopify"),
      scope: "server",
      reason: "Required for OAuth redirects, webhook callbacks, and embedded app configuration.",
      example: "https://app.yourdomain.com",
    },
    {
      key: "META_APP_ID",
      label: "Meta app ID",
      required: requiredIntegrationIds.has("meta"),
      scope: "server",
      reason: "Required for Meta OAuth and Marketing API workflows.",
      example: "1234567890",
    },
    {
      key: "META_APP_SECRET",
      label: "Meta app secret",
      required: requiredIntegrationIds.has("meta"),
      scope: "server",
      reason: "Required for trusted Meta API calls and token exchange.",
      example: "your_meta_app_secret",
    },
    {
      key: "LINKEDIN_CLIENT_ID",
      label: "LinkedIn client ID",
      required: requiredIntegrationIds.has("linkedin"),
      scope: "server",
      reason: "Required for LinkedIn OAuth or approved lead data provider workflows.",
      example: "your_linkedin_client_id",
    },
    {
      key: "LINKEDIN_CLIENT_SECRET",
      label: "LinkedIn client secret",
      required: requiredIntegrationIds.has("linkedin"),
      scope: "server",
      reason: "Required for LinkedIn OAuth token exchange. Do not expose it to the client.",
      example: "your_linkedin_client_secret",
    },
    {
      key: "EMAIL_PROVIDER_API_KEY",
      label: "Email provider API key",
      required: requiredIntegrationIds.has("email"),
      scope: "server",
      reason: "Required for transactional email, invites, notifications, or email campaigns.",
      example: "re_... / sg_... / postmark_...",
    },
    {
      key: "NEXT_PUBLIC_APP_URL",
      label: "Public app URL",
      required: true,
      scope: "client",
      reason: "Required for redirects, share links, auth callbacks, preview links, and production routing.",
      example: "https://yourdomain.com",
    },
  ];

  return variables;
}

function getRequiredEnvironmentVariables(args: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}) {
  return getEnvironmentVariableReadiness(args).filter(
    (variable) => variable.required
  );
}

function getBuildPackHealth(files: ChangedFile[]): BuildPackHealth {
  const buildPackFiles = getBuildPackFileStatuses(files);
  const totalFiles = buildPackFiles.length;
  const existingFiles = buildPackFiles.filter((file) => file.exists);
  const missingFiles = buildPackFiles
    .filter((file) => !file.exists)
    .map((file) => file.path);

  const score =
    totalFiles > 0 ? Math.round((existingFiles.length / totalFiles) * 100) : 0;

  if (score === 100) {
    return {
      status: "complete",
      label: "Complete",
      score,
      summary:
        "All core build pack files exist. Review them before using them for deployment or handoff.",
      missingFiles,
    };
  }

  if (score >= 75) {
    return {
      status: "mostly-complete",
      label: "Mostly complete",
      score,
      summary:
        "Most build pack files exist, but at least one key file is missing. Export the full build pack to close the gap.",
      missingFiles,
    };
  }

  if (score > 0) {
    return {
      status: "partial",
      label: "Partial",
      score,
      summary:
        "Some build pack files exist, but the handoff is incomplete. Export the full build pack before launch planning.",
      missingFiles,
    };
  }

  return {
    status: "missing",
    label: "Missing",
    score,
    summary:
      "No core build pack files exist yet. Export the full build pack before pretending this is ready for anyone with a pulse.",
    missingFiles,
  };
}

function getBuildPackFileStatuses(files: ChangedFile[]): BuildPackFileStatus[] {
  const expectedFiles = [
    {
      path: "config/project-brief.md",
      label: "Project brief",
      purpose:
        "Readable summary of the generated product, architecture, modules, integrations, and next implementation steps.",
    },
    {
      path: "config/deploy-checklist.md",
      label: "Deployment checklist",
      purpose:
        "Launch checklist covering GitHub, Vercel, environment variables, migrations, security, and post-deploy tests.",
    },
    {
      path: "config/env.example",
      label: "Environment example",
      purpose:
        "Template for local and production environment variables. Real secrets do not belong here, because we are not animals.",
    },
    {
      path: "config/developer-instructions.md",
      label: "Developer instructions",
      purpose:
        "Technical setup guide with local commands, environment variables, Supabase migration steps, Vercel deployment steps, and smoke tests.",
    },
    {
      path: "config/security-rules.md",
      label: "Security rules",
      purpose:
        "Implementation checklist for authentication, authorization, API protection, database/RLS, secrets, integrations, deployment security, and smoke tests.",
    },
    {
      path: "config/design-review.md",
      label: "Design review",
      purpose:
        "Design critique and upgrade checklist covering layout, typography, spacing, responsiveness, CTA clarity, visual polish, and Visual builder competitiveness.",
    },
    {
      path: "config/visual-builder-competitiveness.md",
      label: "Visual builder competitiveness review",
      purpose:
        "Competitive analysis for visual/prototype quality, builder differentiation, handoff quality, realistic content, responsive polish, and design-system maturity.",
    },
    {
      path: "config/visual-qa-checklist.md",
      label: "Visual QA checklist",
      purpose:
        "Systematic visual review checklist for first impression, layout, typography, spacing, CTAs, forms, responsiveness, accessibility, interaction states, and launch polish.",
    },
    {
      path: "config/launch-readiness-report.md",
      label: "Launch readiness report",
      purpose:
        "Overall launch verdict combining build pack, deployment, security, design quality, visual builder competitiveness, Visual QA, blockers, and next actions.",
    },
    {
      path: "config/publish-gate-report.md",
      label: "Publish gate report",
      purpose:
        "Simple publish decision report showing whether the build is blocked, preview-ready, staging-ready, or publish-ready.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",
      purpose:
        "Starter Supabase migration generated from planned database tables and Row Level Security scaffolding.",
    },
  ];

  return expectedFiles.map((expectedFile) => {
    const matchingFile = files.find((file) => file.path === expectedFile.path);

    return {
      ...expectedFile,
      exists: Boolean(matchingFile),
      fileId: matchingFile?.id ?? null,
    };
  });
}

function getDeployReadinessItems({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): DeployReadinessItem[] {
  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const hasPackageJson = files.some((file) => file.path === "package.json");
  const hasNextApp =
    files.some((file) => file.path.startsWith("app/")) ||
    files.some((file) => file.path.startsWith("components/"));

  const hasEnvExample = files.some((file) => file.path === "config/env.example");
  const hasMigration = files.some(
    (file) => file.path === "supabase/migrations/generated_architecture.sql"
  );

  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasSecurityRules = previewState.architecture.securityRules.length > 0;

  return [
    {
      id: "git-repository",
      label: "Git repository",
      status: files.length > 0 ? "needs-setup" : "blocked",
      detail:
        files.length > 0
          ? "Generated files exist and should be committed to a Git repository before deployment."
          : "No generated files exist yet.",
      checklist:
        files.length > 0
          ? [
              "Create or select a GitHub repository.",
              "Commit generated files.",
              "Push the repository to GitHub.",
              "Keep generated backups out of production commits if they are only local safety files.",
            ]
          : ["Generate a build before creating a deployment repository."],
    },
    {
      id: "framework",
      label: "Framework detection",
      status: hasNextApp ? "ready" : "needs-setup",
      detail: hasNextApp
        ? "Next.js App Router style files were detected."
        : "No obvious Next.js app files were detected.",
      checklist: hasNextApp
        ? [
            "Use npm run build as the production build check.",
            "Use npm run dev for local development.",
            "Confirm app routes and API routes compile successfully.",
          ]
        : [
            "Confirm framework type.",
            "Add framework configuration before deployment.",
            "Confirm build command manually.",
          ],
    },
    {
      id: "package-json",
      label: "Package configuration",
      status: hasPackageJson ? "ready" : "needs-setup",
      detail: hasPackageJson
        ? "package.json exists in the project file tree."
        : "package.json was not detected in generated files.",
      checklist: hasPackageJson
        ? [
            "Confirm dependencies are installed.",
            "Confirm scripts include dev, build, and start where relevant.",
            "Run npm install before deployment.",
          ]
        : [
            "Create or verify package.json.",
            "Add required dependencies.",
            "Add dev/build/start scripts.",
          ],
    },
    {
      id: "environment",
      label: "Production environment",
      status: requiredEnvVars.length > 0 ? "needs-setup" : "ready",
      detail:
        requiredEnvVars.length > 0
          ? `${requiredEnvVars.length} required environment variable${requiredEnvVars.length === 1 ? "" : "s"} must be added to Vercel.`
          : "No required environment variables were detected.",
      checklist:
        requiredEnvVars.length > 0
          ? [
              "Open Vercel project settings.",
              "Go to Environment Variables.",
              ...requiredEnvVars.map((variable) => `Add ${variable.key}.`),
              "Redeploy after adding production secrets.",
            ]
          : ["Confirm no external secrets are needed for this build."],
    },
    {
      id: "env-example",
      label: "Environment example file",
      status: hasEnvExample ? "ready" : "needs-setup",
      detail: hasEnvExample
        ? "config/env.example exists in the project file tree."
        : "config/env.example has not been exported yet.",
      checklist: hasEnvExample
        ? [
            "Review config/env.example.",
            "Do not commit real secret values.",
            "Use it as the template for local and production environment setup.",
          ]
        : [
            "Open Publish readiness.",
            "Click Export or update config/env.example.",
            "Review the generated file in Code view.",
          ],
    },
    {
      id: "database",
      label: "Database migration",
      status:
        hasDatabaseTables && hasMigration
          ? "needs-setup"
          : hasDatabaseTables
            ? "needs-setup"
            : "ready",
      detail:
        hasDatabaseTables && hasMigration
          ? "A SQL migration file exists, but it still needs to be reviewed and run in Supabase."
          : hasDatabaseTables
            ? "Database tables are planned, but no generated SQL migration file was detected."
            : "No planned database tables detected.",
      checklist:
        hasDatabaseTables && hasMigration
          ? [
              "Open supabase/migrations/generated_architecture.sql.",
              "Review fields, indexes, and RLS policies.",
              "Run the SQL in Supabase SQL Editor.",
              "Test database access from the app.",
            ]
          : hasDatabaseTables
            ? [
                "Open Architecture.",
                "Click Export SQL migration.",
                "Review and run the migration in Supabase.",
              ]
            : ["No database migration required for the current build."],
    },
    {
      id: "security",
      label: "Security before deploy",
      status: hasSecurityRules ? "needs-setup" : "blocked",
      detail: hasSecurityRules
        ? "Security rules were generated, but they need review before production."
        : "No security rules were generated. That is not deploy-ready unless the product is imaginary, which investors prefer but users do not.",
      checklist: hasSecurityRules
        ? [
            "Review authentication requirements.",
            "Check server-only secrets are never exposed to client code.",
            "Confirm API routes validate ownership and authorization.",
            "Confirm RLS policies match the product model.",
          ]
        : [
            "Generate or add security rules.",
            "Add authorization checks to API routes.",
            "Add RLS policies for user-owned data.",
          ],
    },
    {
      id: "vercel",
      label: "Vercel deployment",
      status: "needs-setup",
      detail:
        "The project still needs a Vercel deployment target and production build verification.",
      checklist: [
        "Import the GitHub repository into Vercel.",
        "Set framework preset to Next.js if detected.",
        "Set build command to npm run build.",
        "Set install command to npm install.",
        "Add production environment variables.",
        "Deploy and inspect build logs.",
      ],
    },
    {
      id: "domain",
      label: "Domain and routing",
      status: "needs-setup",
      detail:
        "A production domain or preview URL must be configured before launch.",
      checklist: [
        "Use the default Vercel preview URL for testing.",
        "Add a custom domain when ready.",
        "Update NEXT_PUBLIC_APP_URL to the production URL.",
        "Check auth redirect URLs and webhook callback URLs.",
      ],
    },
    {
      id: "post-deploy",
      label: "Post-deploy checks",
      status: "needs-setup",
      detail:
        "The first deployment needs a basic smoke test. Revolutionary concept: clicking things before announcing launch.",
      checklist: [
        "Open the deployed site.",
        "Test sign-in/sign-up.",
        "Test generated core workflow.",
        "Check browser console for errors.",
        "Check Vercel function logs.",
        "Test API routes that require authentication.",
      ],
    },
  ];
}

function getPublishReadinessReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): PublishReadinessReport {
  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredEnvironmentVariables = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = integrations.filter(
    (integration) => integration.required
  );

  const requiredIntegrationsNeedSetup = requiredIntegrations.filter(
    (integration) => integration.status !== "ready"
  );

  const isMobileTarget =
    previewState.classification?.platformTargets.some((target) =>
      target.toLowerCase().includes("mobile")
    ) ?? false;

  const items: PublishReadinessItem[] = [
    {
      id: "files",
      label: "Generated files",
      status: files.length > 0 ? "ready" : "blocked",
      detail:
        files.length > 0
          ? `${files.length} generated file${files.length === 1 ? "" : "s"} available in the project file tree.`
          : "No generated files exist yet.",
      checklist:
        files.length > 0
          ? [
              "Review generated files in Code view.",
              "Save any edits before publishing.",
              "Remove unused placeholder files.",
            ]
          : ["Generate at least one build before publishing."],
    },
    {
      id: "database",
      label: "Database and migrations",
      status:
        previewState.architecture.tables.length > 0
          ? "needs-setup"
          : "ready",
      detail:
        previewState.architecture.tables.length > 0
          ? `${previewState.architecture.tables.length} database table${previewState.architecture.tables.length === 1 ? "" : "s"} planned. Migrations still need to be created or confirmed.`
          : "No database tables were detected for this build.",
      checklist:
        previewState.architecture.tables.length > 0
          ? [
              "Generate SQL migrations for planned tables.",
              "Run migrations in Supabase SQL Editor or Supabase CLI.",
              "Review Row Level Security policies.",
              "Test authenticated and unauthenticated access paths.",
            ]
          : ["Confirm this build does not require persistence."],
    },
    {
      id: "security",
      label: "Security review",
      status:
        previewState.architecture.securityRules.length > 0
          ? "needs-setup"
          : "blocked",
      detail:
        previewState.architecture.securityRules.length > 0
          ? `${previewState.architecture.securityRules.length} security rule${previewState.architecture.securityRules.length === 1 ? "" : "s"} planned and waiting for review.`
          : "No security rules were generated. That is not publish-ready unless this is a toy, and even toys have choking hazards.",
      checklist:
        previewState.architecture.securityRules.length > 0
          ? [
              "Review generated security rules.",
              "Confirm auth boundaries.",
              "Confirm API route authorization.",
              "Verify secrets are server-side only.",
            ]
          : [
              "Add security rules for auth, data access, API protection, and secrets.",
            ],
    },
    {
      id: "integrations",
      label: "Required integrations",
      status:
        requiredIntegrationsNeedSetup.length === 0 ? "ready" : "needs-setup",
      detail:
        requiredIntegrationsNeedSetup.length === 0
          ? "No required integrations are currently marked as needing setup."
          : `${requiredIntegrationsNeedSetup.length} required integration${requiredIntegrationsNeedSetup.length === 1 ? "" : "s"} still need setup.`,
      checklist:
        requiredIntegrationsNeedSetup.length === 0
          ? ["Confirm production environment variables are configured."]
          : requiredIntegrationsNeedSetup.map(
              (integration) => `Configure ${integration.label}.`
            ),
    },
    {
      id: "environment",
      label: "Environment variables",
      status:
        requiredEnvironmentVariables.length > 0 ? "needs-setup" : "ready",
      detail:
        requiredEnvironmentVariables.length > 0
          ? `${requiredEnvironmentVariables.length} required environment variable${requiredEnvironmentVariables.length === 1 ? "" : "s"} detected for this build.`
          : "No required environment variables were detected.",
      checklist:
        requiredEnvironmentVariables.length > 0
          ? requiredEnvironmentVariables.map(
              (variable) => `${variable.key} · ${variable.scope}`
            )
          : ["No environment setup required."],
    },
    {
      id: "deployment",
      label: "Deployment",
      status: "needs-setup",
      detail:
        "The generated project needs a production deployment target and production build check.",
      checklist: [
        "Connect GitHub repository to Vercel.",
        "Add production environment variables.",
        "Run production build.",
        "Check deployment logs.",
        "Configure custom domain if needed.",
      ],
    },
    {
      id: "mobile",
      label: "Mobile/native support",
      status: isMobileTarget ? "blocked" : "ready",
      detail: isMobileTarget
        ? "Mobile target detected. Native iOS/Android generation is planned for a later phase."
        : "No native mobile blocker detected.",
      checklist: isMobileTarget
        ? [
            "Decide whether this should be a web app first.",
            "Plan React Native/Expo generation later.",
            "Add App Store and Play Store deployment pipeline later.",
          ]
        : ["No mobile-specific action required."],
    },
  ];

  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const needsSetupCount = items.filter(
    (item) => item.status === "needs-setup"
  ).length;
  const readyCount = items.filter((item) => item.status === "ready").length;

  const score = Math.round((readyCount / items.length) * 100);

  const status: PublishReadinessStatus =
    blockedCount > 0 ? "blocked" : needsSetupCount > 0 ? "needs-setup" : "ready";

  const summary =
    status === "ready"
      ? "This build is publish-ready after final human review."
      : status === "blocked"
        ? "This build has blockers that must be resolved before publishing."
        : "This build is structurally useful, but setup is still required before publishing.";

  return {
    status,
    score,
    summary,
    items,
  };
}

function getIntegrationReadiness({
  projectType,
  modules,
  architecture,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  classification?: BuildClassification;
}): IntegrationReadiness[] {
  const signal = getBuildTextSignal({
    projectType,
    modules,
    architecture,
    classification,
  });

  const needsAi = textIncludesAny(signal, [
    "ai",
    "openai",
    "assistant",
    "agent",
    "generate",
    "generation",
    "prompt",
    "ugc",
    "video",
    "image",
    "script",
  ]);

  const needsBilling = textIncludesAny(signal, [
    "stripe",
    "billing",
    "subscription",
    "payment",
    "checkout",
    "invoice",
    "pricing",
    "plan",
  ]);

  const needsShopify = textIncludesAny(signal, [
    "shopify",
    "merchant",
    "storefront",
    "admin api",
    "webhook",
    "theme",
    "checkout",
  ]);

  const needsMeta = textIncludesAny(signal, [
    "facebook",
    "instagram",
    "meta",
    "ads",
    "campaign",
    "creative",
    "marketing",
  ]);

  const needsLinkedIn = textIncludesAny(signal, [
    "linkedin",
    "lead",
    "leads",
    "prospect",
    "outreach",
    "sales",
    "crm",
  ]);

  const needsEmail = textIncludesAny(signal, [
    "email",
    "newsletter",
    "sequence",
    "invite",
    "magic link",
    "notification",
    "transactional",
  ]);

  const needsDatabase =
    architecture.tables.length > 0 ||
    textIncludesAny(signal, [
      "auth",
      "database",
      "storage",
      "workspace",
      "dashboard",
      "user",
      "team",
      "supabase",
    ]);

  const needsDeployment = true;

  return [
    {
      id: "openai",
      label: "OpenAI",
      provider: "OpenAI API",
      required: needsAi,
      status: needsAi ? "needs-setup" : "optional",
      reason: needsAi
        ? "Required for AI generation, assistants, prompts, creative output, or agent workflows."
        : "Optional unless the product uses AI generation or assistant workflows.",
      checklist: [
        "Add OPENAI_API_KEY to .env.local and production environment.",
        "Choose the model for build generation and product features.",
        "Set usage limits, logging, and abuse safeguards.",
        "Decide which generated outputs need moderation or review.",
      ],
    },
    {
      id: "supabase",
      label: "Supabase",
      provider: "Supabase Auth, Postgres, Storage",
      required: needsDatabase,
      status: needsDatabase ? "needs-setup" : "optional",
      reason: needsDatabase
        ? "Required for authentication, database tables, project files, workspaces, and stored build history."
        : "Optional for static-only projects, but useful for auth, storage, and persistence.",
      checklist: [
        "Confirm NEXT_PUBLIC_SUPABASE_URL is configured.",
        "Confirm NEXT_PUBLIC_SUPABASE_ANON_KEY is configured.",
        "Confirm SUPABASE_SERVICE_ROLE_KEY is configured server-side only.",
        "Run migrations for generated tables.",
        "Review Row Level Security policies before production.",
      ],
    },
    {
      id: "stripe",
      label: "Stripe",
      provider: "Stripe Billing",
      required: needsBilling,
      status: needsBilling ? "needs-setup" : "optional",
      reason: needsBilling
        ? "Required for paid plans, checkout, subscriptions, invoices, and customer billing."
        : "Optional unless the project sells plans, credits, services, or subscriptions.",
      checklist: [
        "Add STRIPE_SECRET_KEY and publishable key.",
        "Create products and prices in Stripe.",
        "Configure checkout/session route.",
        "Add webhook endpoint and STRIPE_WEBHOOK_SECRET.",
        "Test subscription lifecycle events.",
      ],
    },
    {
      id: "shopify",
      label: "Shopify",
      provider: "Shopify Admin API / Storefront",
      required: needsShopify,
      status: needsShopify ? "needs-setup" : "optional",
      reason: needsShopify
        ? "Required for Shopify apps, store integrations, merchant dashboards, webhooks, and storefront workflows."
        : "Optional unless the project connects to Shopify stores or merchant data.",
      checklist: [
        "Create Shopify Partner app.",
        "Configure app URL and redirect URLs.",
        "Set OAuth scopes.",
        "Implement HMAC validation.",
        "Register required webhook topics.",
        "Add billing flow if this is a paid Shopify app.",
      ],
    },
    {
      id: "meta",
      label: "Meta",
      provider: "Meta Marketing API",
      required: needsMeta,
      status: needsMeta ? "needs-setup" : "optional",
      reason: needsMeta
        ? "Required for Facebook/Instagram marketing workflows, campaign data, or ad creative publishing."
        : "Optional unless the product manages Facebook, Instagram, or Meta ad workflows.",
      checklist: [
        "Use approved Meta APIs and OAuth.",
        "Request only necessary permissions.",
        "Avoid scraping or unauthorized automation.",
        "Add campaign/ad account connection flow.",
        "Store access tokens securely.",
      ],
    },
    {
      id: "linkedin",
      label: "LinkedIn / approved lead source",
      provider: "LinkedIn API or compliant lead provider",
      required: needsLinkedIn,
      status: needsLinkedIn ? "needs-setup" : "optional",
      reason: needsLinkedIn
        ? "Required for compliant lead sourcing, prospect workflows, CRM enrichment, or sales outreach."
        : "Optional unless the product handles lead generation, prospecting, or sales data.",
      checklist: [
        "Use approved LinkedIn APIs or licensed lead data providers.",
        "Do not scrape LinkedIn pages or bypass platform limits.",
        "Add OAuth or provider connection flow.",
        "Track consent, source, and lawful basis for leads.",
        "Add unsubscribe/suppression handling for outreach.",
      ],
    },
    {
      id: "email",
      label: "Email provider",
      provider: "Resend, Postmark, SendGrid, or SES",
      required: needsEmail,
      status: needsEmail ? "needs-setup" : "optional",
      reason: needsEmail
        ? "Required for notifications, magic links, invites, transactional messages, or campaigns."
        : "Optional unless the product sends emails.",
      checklist: [
        "Choose an email provider.",
        "Verify sending domain.",
        "Add API key to environment variables.",
        "Create transactional email templates.",
        "Add unsubscribe handling for marketing emails.",
      ],
    },
    {
      id: "deployment",
      label: "Deployment",
      provider: "Vercel / production hosting",
      required: needsDeployment,
      status: "needs-setup",
      reason: "Required to publish the generated project outside the local development environment.",
      checklist: [
        "Connect repository to Vercel.",
        "Add production environment variables.",
        "Configure custom domain if needed.",
        "Run production build before publishing.",
        "Check logs after first deploy.",
      ],
    },
  ];
}

function createBuildSummary({
  projectType,
  modules,
  architecture,
  files,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  classification?: BuildClassification;
}) {
  const requiredIntegrations = inferRequiredIntegrations({
    modules,
    architecture,
    projectType,
    classification,
  });

  const created = [
    `${files.length} project file${files.length === 1 ? "" : "s"}`,
    `${modules.length} product module${modules.length === 1 ? "" : "s"}`,
    `${architecture.tables.length} database table${architecture.tables.length === 1 ? "" : "s"}`,
    `${architecture.endpoints.length} API route${architecture.endpoints.length === 1 ? "" : "s"}`,
    `${architecture.securityRules.length} security rule${architecture.securityRules.length === 1 ? "" : "s"}`,
  ];

  const missing = [];

  if (requiredIntegrations.includes("Stripe")) {
    missing.push("Connect Stripe keys and webhook secret before paid checkout can work.");
  }

  if (requiredIntegrations.includes("OpenAI")) {
    missing.push("Confirm OpenAI key, model, usage limits, and safety handling.");
  }

  if (requiredIntegrations.includes("Shopify")) {
    missing.push("Configure Shopify OAuth, webhook topics, app URL, scopes, and billing.");
  }

  if (
    requiredIntegrations.includes("LinkedIn API / approved lead source") ||
    requiredIntegrations.includes("Meta API")
  ) {
    missing.push("Use approved platform APIs/OAuth for lead and marketing data. No scraping nonsense in a hat.");
  }

  if (architecture.tables.length > 0) {
    missing.push("Run or generate database migrations for the planned tables.");
  }

  if (architecture.securityRules.length > 0) {
    missing.push("Review security rules before publishing.");
  }

  if (missing.length === 0) {
    missing.push("Review generated files and connect production environment variables.");
  }

  const publishReady =
    files.length > 0 &&
    architecture.securityRules.length > 0 &&
    !classification?.platformTargets.includes("mobile");

  return {
    primaryCategory:
      classification?.primaryCategory ?? getProjectTypeLabel(projectType),
    requiredIntegrations,
    created,
    missing,
    publishReadiness: publishReady
      ? "Draft-ready after review"
      : "Needs setup before publish",
  };
}

function createBuildSteps(
  files: ChangedFile[],
  projectType: ProjectType,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): BuildStep[] {
  return [
    {
      id: "step-1",
      label: "Detect project type",
      detail: `Detected the prompt as a ${getProjectTypeLabel(projectType)} build.`,
      status: "active",
    },
    {
      id: "step-2",
      label: "Extract product modules",
      detail: `Detected ${modules.length} product ${modules.length === 1 ? "module" : "modules"}: ${modules.map((module) => module.label).join(", ")}.`,
      status: "pending",
    },
    {
      id: "step-3",
      label: "Plan architecture",
      detail: `Planned ${architecture.tables.length} tables, ${architecture.endpoints.length} API routes, and ${architecture.securityRules.length} security rules.`,
      status: "pending",
    },
    {
      id: "step-4",
      label: "Resolve file changes",
      detail: `Prepared ${files.length} file ${files.length === 1 ? "operation" : "operations"} for the update.`,
      status: "pending",
    },
    {
      id: "step-5",
      label: "Save build and files",
      detail: "Saving the build record and syncing generated files into the project file tree.",
      status: "pending",
    },
    {
      id: "step-6",
      label: "Verify result",
      detail: "Checked project workspace, database build history, generated files, preview, and architecture state.",
      status: "pending",
    },
  ];
}

function createPlanItem(
  prompt: string,
  projectType: ProjectType,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): Extract<FeedItem, { role: "plan" }> {
  const files = createChangedFiles(prompt, projectType, modules, architecture);

  return {
    id: `plan-${Date.now()}`,
    role: "plan",
    title: "Implementation plan",
    prompt,
    projectType,
    modules,
    architecture,
    approved: false,
    summary: `Detected this as a ${getProjectTypeLabel(projectType)} request with ${modules.length} product ${modules.length === 1 ? "module" : "modules"}. Review the proposed build before applying it.`,
    steps: [
      {
        id: "plan-1",
        label: "Infer project type",
        detail: `Detected ${getProjectTypeLabel(projectType)} from the prompt instead of asking the user to select it manually.`,
        status: "complete",
      },
      {
        id: "plan-2",
        label: "Detect modules",
        detail: modules.map((module) => module.label).join(", "),
        status: "complete",
      },
      {
        id: "plan-3",
        label: "Plan architecture",
        detail: `${architecture.tables.length} tables, ${architecture.endpoints.length} API routes, ${architecture.securityRules.length} security rules.`,
        status: "complete",
      },
      {
        id: "plan-4",
        label: "Prepare file operations",
        detail: `Prepare ${files.length} file ${files.length === 1 ? "operation" : "operations"} for the build.`,
        status: "complete",
      },
    ],
    changes: buildChangeList(prompt, projectType, modules, architecture),
    files,
  };
}

function createInitialAssistantUpdate(
  prompt: string,
  projectType: ProjectType,
  modules: DetectedModule[],
  architecture: ArchitecturePlan
): Extract<FeedItem, { role: "assistant" }> {
  const files = createChangedFiles(prompt, projectType, modules, architecture);

  return {
    id: `assistant-${Date.now() + 1}`,
    role: "assistant",
    title: "Build update",
    status: "building",
    projectType,
    modules,
    architecture,
    summary: `Detected a ${getProjectTypeLabel(projectType)} request with ${modules.length} product ${modules.length === 1 ? "module" : "modules"}. Planning architecture, files, API routes, preview, build history, and project file tree.`,
    steps: createBuildSteps(files, projectType, modules, architecture),
    changes: buildChangeList(prompt, projectType, modules, architecture),
    files,
  };
}

function advanceAssistantUpdate(
  item: Extract<FeedItem, { role: "assistant" }>,
  activeStepIndex: number,
  isComplete = false
): Extract<FeedItem, { role: "assistant" }> {
  return {
    ...item,
    status: isComplete ? "completed" : "building",
    summary: isComplete
      ? `${getProjectTypeLabel(item.projectType)} implementation complete. The preview, file drawer, code view, modules, architecture plan, project files, and database build history now reflect the latest build.`
      : "Applying changes and validating the command center interaction flow.",
    steps: item.steps.map((step, index) => {
      if (isComplete) {
        return {
          ...step,
          status: "complete",
        };
      }

      if (index < activeStepIndex) {
        return {
          ...step,
          status: "complete",
        };
      }

      if (index === activeStepIndex) {
        return {
          ...step,
          status: "active",
        };
      }

      return {
        ...step,
        status: "pending",
      };
    }),
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

const initialModules: DetectedModule[] = [
  {
    id: "auth",
    label: "Authentication",
    description: "User registration, login, sessions, and account access.",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Operational dashboard with metrics, activity, and admin controls.",
  },
];

const initialArchitecture = createArchitecturePlan("saas", initialModules);

const initialFiles: ChangedFile[] = [
  {
    id: "file-page-initial",
    path: "app/page.tsx",
    status: "checked",
    description: "Loaded command center workspace.",
    contents: createFileContents(
      "app/page.tsx",
      "Initial command center workspace.",
      "saas",
      initialModules,
      initialArchitecture
    ),
  },
  {
    id: "file-css-initial",
    path: "app/globals.css",
    status: "checked",
    description: "Current user styling preserved.",
    contents: createFileContents(
      "app/globals.css",
      "Initial command center workspace.",
      "saas",
      initialModules,
      initialArchitecture
    ),
  },
];

const initialPreviewState: PreviewState = {
  title: "SaaS Builder Workspace",
  subtitle:
    "Generate SaaS products with landing pages, authentication, dashboards, subscriptions, admin controls, and database-ready architecture.",
  projectType: "SaaS",
  classification: {
    primaryCategory: "SaaS Builder Workspace",
    secondaryCategories: ["AI builder", "Developer tools"],
    industry: "Software",
    platformTargets: ["web", "api", "admin-dashboard"],
    complexity: "advanced",
  },
  fileCount: 2,
  status: "Preview ready",
  lastUpdatedLabel: "Prompt-based builder",
  modules: initialModules,
  architecture: initialArchitecture,
};

export default function Page() {
  const activityScrollRef = useRef<HTMLDivElement | null>(null);
  const publishCenterRef = useRef<HTMLDivElement | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<Mode>("build");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("preview");
  const [prompt, setPrompt] = useState(
    "Build a SaaS for managing tickets, assets, SLA risks, burnout signals, automation workflows, and knowledge base suggestions."
  );
  const [filesOpen, setFilesOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState("file-page-initial");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [currentProject, setCurrentProject] = useState<FounderProject | null>(null);
  const [projectFiles, setProjectFiles] = useState<DatabaseProjectFile[]>([]);

  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>(initialFiles);
  const [previewState, setPreviewState] = useState<PreviewState>(initialPreviewState);
  const [buildHistory, setBuildHistory] = useState<BuildHistoryItem[]>([
    {
      id: "history-initial",
      prompt: "Initial command center workspace.",
      projectType: "saas",
      classification: initialPreviewState.classification,
      modules: initialModules,
      architecture: initialArchitecture,
      files: initialFiles,
      previewState: initialPreviewState,
      createdAt: formatBuildTime(new Date()),
      status: "completed",
      source: "local",
    },
  ]);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: "assistant-initial",
      role: "assistant",
      title: "Build update",
      status: "completed",
      projectType: "saas",
      modules: initialModules,
      architecture: initialArchitecture,
      summary:
        "The workspace is ready. Type what you want to build and the system will infer the project type, product modules, architecture, project files, and database build history automatically.",
      steps: [
        {
          id: "initial-1",
          label: "Initialize layout",
          detail:
            "Loaded the command panel, preview toolbar, embedded preview frame, code view, architecture view, history view, and database file drawer.",
          status: "complete",
        },
        {
          id: "initial-2",
          label: "Enable prompt inference",
          detail:
            "Project type, modules, database tables, API routes, and security rules are inferred from what the user types.",
          status: "complete",
        },
        {
          id: "initial-3",
          label: "Enable database files",
          detail:
            "Builds now save generated files into Supabase project file records, and selected files can be edited and saved.",
          status: "complete",
        },
      ],
      changes: [
        "Prompt-based project detection enabled.",
        "Automatic product module detection enabled.",
        "Architecture planning enabled.",
        "Database-backed build history enabled.",
        "Database-backed project files enabled.",
        "File editing and saving enabled.",
      ],
      files: initialFiles,
    },
  ]);

  const [queuedItems] = useState<QueuedItem[]>([]);
  const [securityFindings] = useState<SecurityFinding[]>([]);

  const canSend =
    prompt.trim().length > 0 && !isBuilding && !isLoadingWorkspace;

  const fileCountLabel = useMemo(() => {
    return changedFiles.length === 1
      ? "1 file"
      : `${changedFiles.length} files`;
  }, [changedFiles.length]);

  const selectedFile = useMemo(() => {
    return (
      changedFiles.find((file) => file.id === selectedFileId) ??
      changedFiles[0]
    );
  }, [changedFiles, selectedFileId]);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      setIsLoadingWorkspace(true);
      setWorkspaceError("");

      const response = await fetch("/api/projects/current", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const result = await readApiResponse<{
        project: FounderProject;
        builds: DatabaseBuild[];
        projectFiles?: DatabaseProjectFile[];
      }>(response);

      if (!active) return;

      if (!response.ok || !result.ok || !result.data) {
        setWorkspaceError(result.error ?? "Failed to load database workspace.");
        setIsLoadingWorkspace(false);
        return;
      }

      const mappedHistory = result.data.builds.map(mapDatabaseBuildToHistoryItem);
      const databaseFiles = parseProjectFiles(result.data.projectFiles ?? []);
      const mappedProjectFiles = databaseFiles
        .filter((file) => file.status !== "deleted")
        .map(mapProjectFileToChangedFile);

      setCurrentProject(result.data.project);
      setProjectFiles(databaseFiles);

      if (mappedProjectFiles.length > 0) {
        setChangedFiles(mappedProjectFiles);
        setSelectedFileId(mappedProjectFiles[0]?.id ?? "");
      } else if (mappedHistory.length > 0) {
        const latestBuild = mappedHistory[0];
        setChangedFiles(latestBuild.files);
        setSelectedFileId(latestBuild.files[0]?.id ?? "");
        setPreviewState(latestBuild.previewState);
      }

      if (mappedHistory.length > 0) {
        setBuildHistory(mappedHistory);
        setPreviewState(mappedHistory[0].previewState);
      }

      setIsLoadingWorkspace(false);
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  function updateScrollState() {
    const element = activityScrollRef.current;
    if (!element) return;

    const maxScrollTop = element.scrollHeight - element.clientHeight;

    setCanScrollUp(element.scrollTop > 12);
    setCanScrollDown(element.scrollTop < maxScrollTop - 12);
  }

  function handleActivityScroll(_event: UIEvent<HTMLDivElement>) {
    updateScrollState();
  }


  useEffect(() => {
    // Auto-scroll to Publish Center when Publish readiness opens.
    if (workspaceView !== "publish-readiness") return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        publishCenterRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }, [workspaceView]);

  function scrollToBottom() {
    const element = activityScrollRef.current;
    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }

  function scheduleScrollUpdate() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToBottom();
        updateScrollState();
      });
    });
  }

  async function refreshProjectFiles(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}/files`, {
      method: "GET",
      credentials: "include",
    });

    const result = await readApiResponse<{
      files: DatabaseProjectFile[];
    }>(response);

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to refresh project files.");
    }

    const databaseFiles = parseProjectFiles(result.data.files);
    const mappedFiles = databaseFiles
      .filter((file) => file.status !== "deleted")
      .map(mapProjectFileToChangedFile);

    setProjectFiles(databaseFiles);
    setChangedFiles(mappedFiles);
    setSelectedFileId((current) => {
      if (mappedFiles.some((file) => file.id === current)) return current;

      return mappedFiles[0]?.id ?? "";
    });

    return mappedFiles;
  }

  async function createProjectFile(path: string, contents = "") {
    if (!currentProject) {
      throw new Error("No active project workspace loaded.");
    }

    const response = await fetch(`/api/projects/${currentProject.id}/files`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        contents,
        description: "Manually created project file.",
        status: "created",
      }),
    });

    const result = await readApiResponse<{
      files: DatabaseProjectFile[];
    }>(response);

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to create project file.");
    }

    const databaseFiles = parseProjectFiles(result.data.files);
    const mappedFiles = databaseFiles
      .filter((file) => file.status !== "deleted")
      .map(mapProjectFileToChangedFile);

    setProjectFiles(databaseFiles);
    setChangedFiles(mappedFiles);

    const createdFile = databaseFiles.find((file) => file.path === path);

    if (createdFile) {
      setSelectedFileId(createdFile.id);
      setWorkspaceView("code");
    }

    return createdFile;
  }

  async function saveSelectedFile(fileId: string, path: string, contents: string) {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        contents,
        status: "updated",
      }),
    });

    const result = await readApiResponse<{
      file: DatabaseProjectFile;
    }>(response);

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to save file.");
    }

    const updatedFile = result.data.file;

    setProjectFiles((current) =>
      current.map((file) => (file.id === updatedFile.id ? updatedFile : file))
    );

    setChangedFiles((current) =>
      current.map((file) =>
        file.id === updatedFile.id ? mapProjectFileToChangedFile(updatedFile) : file
      )
    );

    return updatedFile;
  }

  async function deleteSelectedFile(fileId: string) {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const result = await readApiResponse<{
      file: DatabaseProjectFile;
    }>(response);

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to delete file.");
    }

    setProjectFiles((current) =>
      current.map((file) =>
        file.id === result.data?.file.id ? result.data.file : file
      )
    );

    setChangedFiles((current) => {
      const nextFiles = current.filter((file) => file.id !== fileId);
      setSelectedFileId(nextFiles[0]?.id ?? "");
      return nextFiles;
    });
  }

  async function saveBuildToDatabase(
    promptValue: string,
    projectType: ProjectType,
    classification: BuildClassification,
    modules: DetectedModule[],
    architecture: ArchitecturePlan,
    files: ChangedFile[],
    nextPreviewState: PreviewState
  ) {
    if (!currentProject) {
      throw new Error("No active project workspace loaded.");
    }

    const response = await fetch(`/api/projects/${currentProject.id}/builds`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: promptValue,
        projectType,
        classification,
        modules,
        architecture,
        files,
        previewState: nextPreviewState,
      }),
    });

    const result = await readApiResponse<{
      build: DatabaseBuild;
      projectFiles?: DatabaseProjectFile[];
    }>(response);

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to save build.");
    }

    const returnedProjectFiles = parseProjectFiles(result.data.projectFiles ?? []);

    if (returnedProjectFiles.length > 0) {
      const mappedFiles = returnedProjectFiles
        .filter((file) => file.status !== "deleted")
        .map(mapProjectFileToChangedFile);

      setProjectFiles(returnedProjectFiles);
      setChangedFiles(mappedFiles);
      setSelectedFileId(mappedFiles[0]?.id ?? "");
    } else {
      await refreshProjectFiles(currentProject.id);
    }

    return mapDatabaseBuildToHistoryItem(result.data.build);
  }

  function addBuildHistoryItem(historyItem: BuildHistoryItem) {
    setBuildHistory((current) => {
      return [historyItem, ...current]
        .filter((item, index, array) => {
          return array.findIndex((candidate) => candidate.id === item.id) === index;
        })
        .slice(0, 50);
    });
  }

  async function restoreBuild(historyItem: BuildHistoryItem) {
    setChangedFiles(historyItem.files);
    setSelectedFileId(historyItem.files[0]?.id ?? "");
    setPreviewState({
      ...historyItem.previewState,
      status: "Restored preview",
      lastUpdatedLabel: "Build restored",
    });

    if (historyItem.source === "database") {
      const response = await fetch(`/api/builds/${historyItem.id}/restore`, {
        method: "POST",
        credentials: "include",
      });

      const result = await readApiResponse<{
        build: DatabaseBuild;
      }>(response);

      if (response.ok && result.ok && result.data) {
        const restoredItem = mapDatabaseBuildToHistoryItem(result.data.build);

        setBuildHistory((current) =>
          current.map((item) =>
            item.id === restoredItem.id ? restoredItem : item
          )
        );
      }
    }

    const restoreMessage: FeedItem = {
      id: `assistant-restore-${Date.now()}`,
      role: "assistant",
      title: "Build restored",
      status: "completed",
      projectType: historyItem.projectType,
      modules: historyItem.modules,
      architecture: historyItem.architecture,
      summary: `Restored a previous ${getProjectTypeLabel(
        historyItem.projectType
      )} build from database history.`,
      steps: [
        {
          id: "restore-1",
          label: "Load history record",
          detail: `Loaded build created at ${historyItem.createdAt}.`,
          status: "complete",
        },
        {
          id: "restore-2",
          label: "Restore files",
          detail: `Restored ${historyItem.files.length} files from the selected build.`,
          status: "complete",
        },
        {
          id: "restore-3",
          label: "Restore preview",
          detail:
            "Restored preview state, modules, architecture, and selected file data.",
          status: "complete",
        },
        {
          id: "restore-4",
          label: "Update database status",
          detail: "Marked the selected database build as restored.",
          status: "complete",
        },
      ],
      changes: [
        "Restored previous preview state.",
        "Restored previous changed files.",
        "Restored previous architecture plan.",
        "Updated database build status.",
      ],
      files: historyItem.files,
    };

    setFeedItems((current) => [...current, restoreMessage]);
    setWorkspaceView("preview");
    scheduleScrollUpdate();
  }


  function openPublishCenter() {
    // Open Publish readiness. The scroll effect focuses the Publish Center.
    setWorkspaceView("publish-readiness");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  async function runBuild(
    promptValue: string,
    buildProjectType: ProjectType,
    buildModules: DetectedModule[],
    buildArchitecture: ArchitecturePlan,
    existingAssistantId?: string,
    generationPromptOverride?: string
  ) {
    const assistantMessage = createInitialAssistantUpdate(
      promptValue,
      buildProjectType,
      buildModules,
      buildArchitecture
    );

    const assistantId = existingAssistantId ?? assistantMessage.id;

    setIsBuilding(true);
    setWorkspaceError("");

    if (existingAssistantId) {
      setFeedItems((current) =>
        current.map((item) =>
          item.id === existingAssistantId
            ? {
                ...assistantMessage,
                id: assistantId,
              }
            : item
        )
      );
    } else {
      setFeedItems((current) => [
        ...current,
        {
          ...assistantMessage,
          id: assistantId,
        },
      ]);
    }

    scheduleScrollUpdate();

    await wait(450);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 1)
          : item
      )
    );

    scheduleScrollUpdate();

    let generatedBuild: AiGeneratedBuild | null = null;
    const aiPrompt = generationPromptOverride ?? promptValue;

    try {
      const response = await fetch("/api/ai/generate-build", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
        }),
      });

      const result = await readApiResponse<{
        build: AiGeneratedBuild;
      }>(response);

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error ?? "Failed to generate AI build.");
      }

      generatedBuild = result.data.build;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI generation failed. Falling back to local planner.";

      setWorkspaceError(message);

      const fallbackFiles = createChangedFiles(
        promptValue,
        buildProjectType,
        buildModules,
        buildArchitecture
      );

      generatedBuild = {
        projectType: buildProjectType,
        classification: {
          primaryCategory: getProjectTypeLabel(buildProjectType),
          secondaryCategories: [],
          industry: null,
          platformTargets: ["web"],
          complexity: "standard",
        },
        modules: buildModules,
        architecture: buildArchitecture,
        files: fallbackFiles,
        previewState: createPreviewState(
          promptValue,
          buildProjectType,
          fallbackFiles.length,
          buildModules,
          buildArchitecture
        ),
        summary:
          "AI generation failed, so the local project planner created a fallback build.",
        changes: [
          "Generated fallback build from local planner.",
          "Kept project type inference, modules, architecture, files, and preview state available.",
        ],
      };
    }

    const generatedProjectType =
      generatedBuild.projectType || buildProjectType;

    const generatedClassification =
      generatedBuild.classification ?? {
        primaryCategory: getProjectTypeLabel(generatedProjectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      };

    const generatedModules =
      generatedBuild.modules.length > 0
        ? generatedBuild.modules
        : buildModules;

    const generatedArchitecture =
      generatedBuild.architecture ?? buildArchitecture;

    const generatedFiles =
      generatedBuild.files.length > 0
        ? generatedBuild.files
        : createChangedFiles(
            promptValue,
            generatedProjectType,
            generatedModules,
            generatedArchitecture
          );

    const generatedPreviewState: PreviewState = {
      ...generatedBuild.previewState,
      classification: generatedClassification,
      fileCount: generatedFiles.length,
      modules: generatedModules,
      architecture: generatedArchitecture,
    };

    const generatedChanges =
      generatedBuild.changes.length > 0
        ? generatedBuild.changes
        : buildChangeList(
            promptValue,
            generatedProjectType,
            generatedModules,
            generatedArchitecture
          );

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                classification: generatedClassification,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              2
            )
          : item
      )
    );

    scheduleScrollUpdate();

    await wait(500);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              3
            )
          : item
      )
    );

    scheduleScrollUpdate();

    await wait(500);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              4
            )
          : item
      )
    );

    setChangedFiles(generatedFiles);
    setSelectedFileId(generatedFiles[0]?.id ?? "");
    setPreviewState(generatedPreviewState);

    scheduleScrollUpdate();

    await wait(500);

    try {
      const savedHistoryItem = await saveBuildToDatabase(
        promptValue,
        generatedProjectType,
        generatedClassification,
        generatedModules,
        generatedArchitecture,
        generatedFiles,
        generatedPreviewState
      );

      addBuildHistoryItem(savedHistoryItem);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save build.";

      setWorkspaceError(message);
    }

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              5
            )
          : item
      )
    );

    scheduleScrollUpdate();

    await wait(420);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary:
                  generatedBuild.summary ||
                  `${getProjectTypeLabel(
                    generatedProjectType
                  )} implementation complete.`,
                changes: generatedChanges,
              },
              6,
              true
            )
          : item
      )
    );

    setIsBuilding(false);
    scheduleScrollUpdate();
  }

  async function handleSendPrompt() {
    const value = prompt.trim();
    if (!value || isBuilding || isLoadingWorkspace) return;

    const detectedProjectType = inferProjectType(value);

    const designTasteProfile = getDesignTasteProfile(
      inferDesignTasteProfileId({
        projectType: detectedProjectType,
        industry: previewState.classification?.industry,
        prompt: value,
      })
    );

    const designTasteBlock = createDesignTastePromptBlock(designTasteProfile);

    const generationPrompt = `${value}

${designTasteBlock}`;

    const detectedModules = inferModules(value, detectedProjectType);
    const detectedArchitecture = createArchitecturePlan(
      detectedProjectType,
      detectedModules
    );

    if (detectedProjectType === "mobile-app") {
      const userMessage: FeedItem = {
        id: `user-${Date.now()}`,
        role: "user",
        body: value,
        projectType: detectedProjectType,
      };

      const unavailableMessage: FeedItem = {
        id: `assistant-mobile-${Date.now() + 1}`,
        role: "assistant",
        title: "Build update",
        status: "completed",
        projectType: detectedProjectType,
        modules: detectedModules,
        architecture: detectedArchitecture,
        summary:
          "Mobile app generation was detected, but the iPhone and Android build pipeline is planned for a later phase.",
        steps: [
          {
            id: "mobile-1",
            label: "Detect project type",
            detail: "Detected Mobile app from the prompt.",
            status: "complete",
          },
          {
            id: "mobile-2",
            label: "Pause build",
            detail:
              "Mobile generation is disabled until the iPhone and Android pipeline is added.",
            status: "complete",
          },
        ],
        changes: [
          "No mobile files generated.",
          "Use SaaS, Web app, CRM, Shopify, Marketing site, or Marketing engine builds for now.",
        ],
        files: changedFiles,
      };

      setFeedItems((current) => [...current, userMessage, unavailableMessage]);
      setPrompt("");
      setPreviewState(
        createPreviewState(
          value,
          detectedProjectType,
          changedFiles.length,
          detectedModules,
          detectedArchitecture
        )
      );
      scheduleScrollUpdate();
      return;
    }

    const userMessage: FeedItem = {
      id: `user-${Date.now()}`,
      role: "user",
      body: value,
      projectType: detectedProjectType,
    };

    setFeedItems((current) => [...current, userMessage]);
    setPrompt("");
    scheduleScrollUpdate();

    if (mode === "visual-edits") {
      const planItem = createPlanItem(
        value,
        detectedProjectType,
        detectedModules,
        detectedArchitecture
      );
      setFeedItems((current) => [...current, planItem]);
      scheduleScrollUpdate();
      return;
    }

    await runBuild(
      value,
      detectedProjectType,
      detectedModules,
      detectedArchitecture,
      undefined,
      generationPrompt
    );
  }

  function approvePlan(planId: string) {
    if (isBuilding || isLoadingWorkspace) return;

    const planItem = feedItems.find(
      (item): item is Extract<FeedItem, { role: "plan" }> =>
        item.id === planId && item.role === "plan"
    );

    if (!planItem) return;

    const assistantReplacementId = `assistant-approved-${Date.now()}`;

    setFeedItems((current) =>
      current.map((item) =>
        item.id === planId && item.role === "plan"
          ? {
              ...item,
              approved: true,
            }
          : item
      )
    );

    window.requestAnimationFrame(() => {
      setFeedItems((current) =>
        current.map((item) =>
          item.id === planId
            ? {
                id: assistantReplacementId,
                role: "assistant",
                title: "Build update",
                status: "building",
                projectType: planItem.projectType,
                modules: planItem.modules,
                architecture: planItem.architecture,
                summary: `Plan approved. Applying the requested ${getProjectTypeLabel(
                  planItem.projectType
                )} changes to the command center.`,
                steps: createBuildSteps(
                  planItem.files,
                  planItem.projectType,
                  planItem.modules,
                  planItem.architecture
                ),
                changes: planItem.changes,
                files: planItem.files,
              }
            : item
        )
      );

      runBuild(
        planItem.prompt,
        planItem.projectType,
        planItem.modules,
        planItem.architecture,
        assistantReplacementId
      );
    });
  }

  function dismissPlan(planId: string) {
    if (isBuilding) return;

    setFeedItems((current) => current.filter((item) => item.id !== planId));
    scheduleScrollUpdate();
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendPrompt();
    }
  }

  useEffect(() => {
    updateScrollState();

    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [feedItems.length]);

  return (
    <section className="builder-shell">
      <div className="builder-grid">
        <aside className="command-panel">
          <CommandHeader
            project={currentProject}
            isLoading={isLoadingWorkspace}
            onSignOut={signOut}
          />

          <div className="activity-area">
            <div
              ref={activityScrollRef}
              className="activity-scroll"
              onScroll={handleActivityScroll}
            >
              <div className="feed-meta">Today</div>

              {workspaceError ? (
                <article className="assistant-build-card">
                  <div className="assistant-build-top">
                    <div className="assistant-build-badge">Workspace issue</div>
                    <div className="assistant-build-status">Needs attention</div>
                  </div>
                  <h3 className="assistant-build-heading">
                    Database workspace warning
                  </h3>
                  <p className="assistant-build-summary">{workspaceError}</p>
                </article>
              ) : null}

              <div className="feed-list">
                {feedItems.map((item) => {
                  if (isAssistantBuildWorking(item)) {
                    return <BackgroundWorkingCard key={item.id} item={item} />;
                  }

                  return (
                    <FeedMessage
                    key={item.id}
                    item={item}
                    onApprovePlan={approvePlan}
                    onDismissPlan={dismissPlan}
                    isBuilding={isBuilding}
                  />
                  );
                })}
              </div>

              {queuedItems.length > 0 ? (
                <QueueCard queuedItems={queuedItems} />
              ) : null}

              {securityFindings.length > 0 ? (
                <SecurityCard findings={securityFindings} />
              ) : null}

              <div className="scroll-bottom-space" />
            </div>

            {canScrollUp ? (
              <div className="activity-fade activity-fade-top" aria-hidden="true" />
            ) : null}

            {canScrollDown ? (
              <>
                <div
                  className="activity-fade activity-fade-bottom"
                  aria-hidden="true"
                />
                <button suppressHydrationWarning
                  type="button"
                  className="scroll-to-bottom-button"
                  aria-label="Scroll to bottom"
                  onClick={scrollToBottom}
                >
                  <ArrowDown className="icon" />
                </button>
              </>
            ) : null}
          </div>

          <Composer
            prompt={prompt}
            setPrompt={setPrompt}
            mode={mode}
            setMode={setMode}
            onSend={handleSendPrompt}
            onPromptKeyDown={handlePromptKeyDown}
            canSend={canSend}
            isBuilding={isBuilding}
            isLoadingWorkspace={isLoadingWorkspace}
          />
        </aside>

        <main className="preview-column">
          <PreviewToolbar
            filesOpen={filesOpen}
            setFilesOpen={setFilesOpen}
            fileCountLabel={fileCountLabel}
            workspaceView={workspaceView}
            setWorkspaceView={setWorkspaceView}
            onOpenPublishCenter={openPublishCenter}
            previewState={previewState}
            files={changedFiles}
          />
          <PreviewContent
            filesOpen={filesOpen}
            setFilesOpen={setFilesOpen}
            files={changedFiles}
            projectFiles={projectFiles}
            previewState={previewState}
            selectedFile={selectedFile}
            selectedFileId={selectedFileId}
            setSelectedFileId={setSelectedFileId}
            workspaceView={workspaceView}
            buildHistory={buildHistory}
            onRestoreBuild={restoreBuild}
            isLoadingWorkspace={isLoadingWorkspace}
            onSaveFile={saveSelectedFile}
            onDeleteFile={deleteSelectedFile}
            onCreateFile={createProjectFile}
            setWorkspaceError={setWorkspaceError}
            setWorkspaceView={setWorkspaceView}
            publishCenterRef={publishCenterRef}
            onOpenPublishCenter={openPublishCenter}
            />
        </main>
      </div>
    </section>
  );
}

function CommandHeader({
  project,
  isLoading,
  onSignOut,
}: {
  project: FounderProject | null;
  isLoading: boolean;
  onSignOut: () => void;
}) {
  return (
    <header className="command-header">
      <div className="brand">
        <div className="app-logo" aria-hidden="true">
          <svg
            viewBox="0 0 48 48"
            role="img"
            aria-label="Founder AI logo"
            className="app-logo"
          >
            <defs>
              <linearGradient id="founderLogo" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff4f9a" />
                <stop offset="100%" stopColor="#7c3cff" />
              </linearGradient>
            </defs>

            <path
              fill="url(#founderLogo)"
              d="M8 8h17.5C35.7 8 42 14.1 42 23.1C42 32.2 35.7 38 25.5 38H18v-9h7.2c4.6 0 7.4-2.2 7.4-5.9c0-3.6-2.8-6-7.4-6H17v21H8V8Z"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="brand-title">
            <span>{project?.name ?? "Founder AI Command Center"}</span>
            <ChevronDown className="chevron-icon" />
          </div>

          <p>{isLoading ? "Loading workspace..." : "Database workspace active"}</p>
        </div>
      </div>

      <div className="header-actions">
        <button suppressHydrationWarning type="button" aria-label="Refresh preview">
          <RefreshCcw className="icon" />
        </button>

        <button suppressHydrationWarning type="button" aria-label="Toggle panel">
          <PanelLeft className="icon" />
        </button>

        <button suppressHydrationWarning type="button" aria-label="Sign out" onClick={onSignOut}>
          <LogOut className="icon" />
        </button>
      </div>
    </header>
  );
}

function BuildSummaryPanel({
  projectType,
  modules,
  architecture,
  files,
  classification,
}: {
  projectType: ProjectType;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  classification?: BuildClassification;
}) {
  const summary = createBuildSummary({
    projectType,
    modules,
    architecture,
    files,
    classification,
  });

  return (
    <div className="assistant-build-section">
      <div className="assistant-build-section-title">Build summary</div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            border: "1px solid #eef0f3",
            borderRadius: "16px",
            background: "#f9fafb",
            padding: "13px",
          }}
        >
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "13px",
              marginBottom: "5px",
            }}
          >
            {summary.primaryCategory}
          </strong>

          <span
            style={{
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Publish readiness: {summary.publishReadiness}
          </span>
        </div>

        <BuildSummaryList title="Created" items={summary.created} />
        <BuildSummaryList
          title="Required integrations"
          items={summary.requiredIntegrations}
        />
        <BuildSummaryList title="Still needed" items={summary.missing} />
      </div>
    </div>
  );
}

function BuildSummaryList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#ffffff",
        padding: "13px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "11px",
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#111827",
        }}
      >
        {items.map((item) => (
          <li
            key={item}
            style={{
              marginBottom: "6px",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeedMessage({
  item,
  onApprovePlan,
  onDismissPlan,
  isBuilding,
}: {
  item: FeedItem;
  onApprovePlan: (planId: string) => void;
  onDismissPlan: (planId: string) => void;
  isBuilding: boolean;
}) {
  if (item.role === "user") {
    return (
      <article className="feed-message feed-message-user">
        <p>{item.body}</p>
      </article>
    );
  }

  if (item.role === "plan") {
    return (
      <article className="assistant-build-card">
        <div className="assistant-build-top">
          <div className="assistant-build-badge">{item.title}</div>
          <div className="assistant-build-status">
            {item.approved ? "Approved" : "Review"}
          </div>
        </div>

        <h3 className="assistant-build-heading">
          Detected {getProjectTypeLabel(item.projectType)}
        </h3>

        <p className="assistant-build-summary">{item.summary}</p>

        <div className="assistant-build-section">
          <div className="assistant-build-section-title">Detected modules</div>

          <ul className="assistant-change-list">
            {item.modules.map((module) => (
              <li key={module.id}>
                {module.label} · {module.description}
              </li>
            ))}
          </ul>
        </div>

        <div className="assistant-build-section">
          <div className="assistant-build-section-title">Architecture</div>

          <ul className="assistant-change-list">
            <li>{item.architecture.tables.length} database tables planned</li>
            <li>{item.architecture.endpoints.length} API routes planned</li>
            <li>{item.architecture.securityRules.length} security rules planned</li>
          </ul>
        </div>

        <div className="assistant-build-section">
          <div className="assistant-build-section-title">Plan</div>

          <div className="assistant-step-list">
            {item.steps.map((step) => (
              <div key={step.id} className="assistant-step-row">
                <div className="assistant-step-dot" />
                <div className="assistant-step-copy">
                  <strong>✓ {step.label}</strong>
                  <span>{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BuildSummaryPanel
          projectType={item.projectType}
          modules={item.modules}
          architecture={item.architecture}
          files={item.files}
          classification={item.classification}
        />

        <div className="assistant-build-section">
          <div className="assistant-build-section-title">Expected changes</div>

          <ul className="assistant-change-list">
            {item.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
            marginTop: "14px",
          }}
        >
          <button suppressHydrationWarning
            type="button"
            className="findings-button"
            onClick={() => onDismissPlan(item.id)}
            disabled={isBuilding}
            style={{
              margin: 0,
              minHeight: "32px",
            }}
          >
            Dismiss
          </button>

          <button suppressHydrationWarning
            type="button"
            className="findings-button"
            onClick={() => onApprovePlan(item.id)}
            disabled={isBuilding}
            style={{
              margin: 0,
              minHeight: "32px",
              background: "#111111",
              color: "#ffffff",
              borderColor: "#111111",
            }}
          >
            Approve & build
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="assistant-build-card">
      <div className="assistant-build-top">
        <div className="assistant-build-badge">{item.title}</div>
        <div className="assistant-build-status">
          {item.status === "completed" ? "Completed" : "Building"}
        </div>
      </div>

      <h3 className="assistant-build-heading">
        {item.status === "completed"
          ? `${getProjectTypeLabel(item.projectType)} changes applied`
          : `Detected ${getProjectTypeLabel(item.projectType)}`}
      </h3>

      <p className="assistant-build-summary">{item.summary}</p>

      <div className="assistant-build-section">
        <div className="assistant-build-section-title">Detected modules</div>

        <ul className="assistant-change-list">
          {item.modules.map((module) => (
            <li key={module.id}>
              {module.label} · {module.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="assistant-build-section">
        <div className="assistant-build-section-title">Architecture</div>

        <ul className="assistant-change-list">
          <li>{item.architecture.tables.length} database tables planned</li>
          <li>{item.architecture.endpoints.length} API routes planned</li>
          <li>{item.architecture.securityRules.length} security rules planned</li>
        </ul>
      </div>

      <div className="assistant-build-section">
        <div className="assistant-build-section-title">Process</div>

        <div className="assistant-step-list">
          {item.steps.map((step) => (
            <div key={step.id} className="assistant-step-row">
              <div className="assistant-step-dot" />
              <div className="assistant-step-copy">
                <strong>
                  {step.status === "complete"
                    ? "✓ "
                    : step.status === "active"
                      ? "• "
                      : ""}
                  {step.label}
                </strong>
                <span>{step.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BuildSummaryPanel
        projectType={item.projectType}
        modules={item.modules}
        architecture={item.architecture}
        files={item.files}
        classification={item.classification}
      />

      <div className="assistant-build-section">
        <div className="assistant-build-section-title">Changes applied</div>

        <ul className="assistant-change-list">
          {item.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      </div>

      <div className="assistant-build-section">
        <div className="assistant-build-section-title">Files touched</div>

        <ul className="assistant-change-list">
          {item.files.map((file) => (
            <li key={file.id}>
              {file.path} · {file.status}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function QueueCard({ queuedItems }: { queuedItems: QueuedItem[] }) {
  return (
    <section className="queue-card">
      <div className="queue-left">
        <span>Queue</span>
        <strong>{queuedItems.length}</strong>
      </div>

      <div className="queue-actions">
        <button suppressHydrationWarning type="button" aria-label="Close queue">
          <X className="icon" />
        </button>

        <button suppressHydrationWarning type="button" aria-label="Run queue">
          <Play className="icon" />
        </button>

        <button suppressHydrationWarning type="button" aria-label="Expand queue">
          <ChevronsUpDown className="icon" />
        </button>
      </div>
    </section>
  );
}

function SecurityCard({ findings }: { findings: SecurityFinding[] }) {
  return (
    <section className="security-card animate-slide-up">
      <div className="security-top">
        <div className="security-title">
          <Shield className="icon" />
          <span>Security</span>
          <strong>
            {findings.length} {findings.length === 1 ? "Issue" : "Issues"}
          </strong>
        </div>

        <button suppressHydrationWarning type="button" aria-label="Close security">
          <X className="icon" />
        </button>
      </div>

      <button suppressHydrationWarning type="button" className="findings-button">
        View findings
      </button>
    </section>
  );
}

function Composer({
  prompt,
  setPrompt,
  mode,
  setMode,
  onSend,
  onPromptKeyDown,
  canSend,
  isBuilding,
  isLoadingWorkspace,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  mode: Mode;
  setMode: (value: Mode) => void;
  onSend: () => void;
  onPromptKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  canSend: boolean;
  isBuilding: boolean;
  isLoadingWorkspace: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const composerDisabled = Boolean(isBuilding || isLoadingWorkspace);

  return (
    <section className="composer">
      <textarea
        suppressHydrationWarning
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={onPromptKeyDown}
        placeholder={
          isLoadingWorkspace
            ? "Loading workspace..."
            : isBuilding
              ? "Building changes..."
              : "Describe what you want to build..."
        }
        disabled={composerDisabled}
      />

      <div className="composer-row">
        <button suppressHydrationWarning type="button" className="composer-plus-button" aria-label="Add">
          <Plus className="icon" />
        </button>

        <button suppressHydrationWarning
          type="button"
          className="visual-button"
          onClick={() => setMode("visual-edits")}
          disabled={composerDisabled}
        >
          <Sparkles className="icon" />
          <span>Visual edits</span>
        </button>

        <div className="mode-wrapper">
          <button suppressHydrationWarning
            type="button"
            className="mode-button"
            onClick={() => setMenuOpen((current) => !current)}
            disabled={composerDisabled}
          >
            {mode === "build" ? "Build" : "Visual edits"}
            <ChevronDown className="chevron-icon" />
          </button>

          {menuOpen ? (
            <div className="mode-menu">
              <button suppressHydrationWarning
                type="button"
                className={mode === "build" ? "active" : ""}
                onClick={() => {
                  setMode("build");
                  setMenuOpen(false);
                }}
              >
                Build
              </button>

              <button suppressHydrationWarning
                type="button"
                className={mode === "visual-edits" ? "active" : ""}
                onClick={() => {
                  setMode("visual-edits");
                  setMenuOpen(false);
                }}
              >
                Visual edits
              </button>
            </div>
          ) : null}
        </div>

        <button suppressHydrationWarning
          type="button"
          className="composer-mic-button"
          aria-label="Voice input"
        >
          <Mic className="icon" />
        </button>

        <button suppressHydrationWarning
          type="button"
          className={
            canSend ? "composer-send-button is-active" : "composer-send-button"
          }
          aria-label="Send prompt"
          onClick={onSend}
          disabled={!canSend}
          title="Send"
        >
          {isBuilding ? <Loader2 className="icon" /> : <ArrowUp className="icon" />}
        </button>
      </div>
    </section>
  );
}

function getCompactPublishUrl(previewState?: PreviewState) {
  // Creates a stable generated preview URL for the current build.
  const title = previewState?.title || "founder-ai-build";

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `https://${slug || "founder-ai-build"}.founder-ai.app`;
}

function getCompactPublishSecurityCount(files?: ChangedFile[]) {
  // Counts security-related generated reports.
  const currentFiles = files ?? [];

  return [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => currentFiles.some((file) => file.path === filePath)).length;
}

function PublishRevealPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared wrapper for compact dropdown panels.
  // It gives inline publish panels a gentle entrance animation.
  return <div className="publish-reveal-panel">{children}</div>;
}

function PublishDropdownSummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  // Compact label/value row used inside publish dropdown details.
  return (
    <div>
      <strong style={{ color: "#111827" }}>{label}:</strong> {value}
    </div>
  );
}

function PublishDropdownChecklistRow({
  label,
  done,
}: {
  label: string;
  done: boolean;
}) {
  // Compact checklist row used in publish security/settings panels.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        color: "#374151",
        fontSize: "12px",
        lineHeight: 1.35,
      }}
    >
      <span>{label}</span>
      <strong style={{ color: done ? "#166534" : "#9a3412" }}>
        {done ? "Ready" : "Missing"}
      </strong>
    </div>
  );
}



function getGeneratedPreviewUrl(previewState: PreviewState): string {
  const rawProjectType =
    typeof previewState.projectType === "string" && previewState.projectType.trim()
      ? previewState.projectType
      : "founder-ai-build";

  const slug = rawProjectType
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52);

  return `https://${slug || "founder-ai-build"}.founder-ai.app`;
}


function getPublishGateReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): PublishGateReport {
  const createdOrUpdatedFiles = files.filter(
    (file) => file.status === "created" || file.status === "updated"
  );

  const hasFiles = files.length > 0;
  const hasGeneratedChanges = createdOrUpdatedFiles.length > 0;
  const hasArchitecture = previewState.architecture.endpoints.length > 0;
  const hasSecurityRules = previewState.architecture.securityRules.length > 0;
  const hasDatabasePlan = previewState.architecture.tables.length > 0;
  const hasModules = previewState.modules.length > 0;

  const requirements: PublishGateRequirement[] = [
    {
      id: "files",
      label: "Generated files",
      passed: hasFiles,
      detail: hasFiles
        ? `${files.length} file${files.length === 1 ? "" : "s"} available for review.`
        : "Generate or load files before publishing.",
    },
    {
      id: "changes",
      label: "Build changes",
      passed: hasGeneratedChanges,
      detail: hasGeneratedChanges
        ? `${createdOrUpdatedFiles.length} changed file${
            createdOrUpdatedFiles.length === 1 ? "" : "s"
          } detected.`
        : "No created or updated files detected yet.",
    },
    {
      id: "modules",
      label: "Detected modules",
      passed: hasModules,
      detail: hasModules
        ? `${previewState.modules.length} module${
            previewState.modules.length === 1 ? "" : "s"
          } detected from the prompt.`
        : "No modules detected yet.",
    },
    {
      id: "architecture",
      label: "Architecture plan",
      passed: hasArchitecture || hasDatabasePlan,
      detail:
        hasArchitecture || hasDatabasePlan
          ? `${previewState.architecture.endpoints.length} API route${
              previewState.architecture.endpoints.length === 1 ? "" : "s"
            } and ${previewState.architecture.tables.length} table${
              previewState.architecture.tables.length === 1 ? "" : "s"
            } planned.`
          : "No API routes or database tables detected yet.",
    },
    {
      id: "security",
      label: "Security review",
      passed: hasSecurityRules,
      detail: hasSecurityRules
        ? `${previewState.architecture.securityRules.length} security rule${
            previewState.architecture.securityRules.length === 1 ? "" : "s"
          } generated for review.`
        : "No generated security rules found yet.",
    },
  ];

  const passedCount = requirements.filter((requirement) => requirement.passed).length;
  const score = Math.round((passedCount / requirements.length) * 100);

  const nextActions = requirements
    .filter((requirement) => !requirement.passed)
    .map((requirement) => requirement.detail);

  if (!hasFiles || !hasGeneratedChanges) {
    return {
      decision: "blocked",
      label: "Blocked",
      score,
      summary:
        "This build needs generated files and changed output before it can be prepared for publish.",
      requirements,
      nextActions:
        nextActions.length > 0
          ? nextActions
          : ["Generate a build before opening publish readiness."],
    };
  }

  if (score >= 90) {
    return {
      decision: "can-publish",
      label: "Ready to publish",
      score,
      summary:
        "The build has files, generated changes, architecture coverage, and security review items ready.",
      requirements,
      nextActions:
        nextActions.length > 0
          ? nextActions
          : ["Run a final manual review before production deployment."],
    };
  }

  if (score >= 70) {
    return {
      decision: "can-stage",
      label: "Ready for staging",
      score,
      summary:
        "The build is suitable for staging, but still needs a final production review.",
      requirements,
      nextActions,
    };
  }

  return {
    decision: "can-preview",
    label: "Preview only",
    score,
    summary:
      "The build can be previewed, but more readiness checks are needed before staging or publish.",
    requirements,
    nextActions,
  };
}


function PublishDropdownPopover({
  previewState,
  files,
  onClose,
  onOpenReadiness,
}: {
  previewState?: PreviewState;
  files?: ChangedFile[];
  onClose: () => void;
  onOpenReadiness: () => void;
}) {
  // Compact publish control surface.
  // Primary publish controls stay visible. Deeper diagnostics remain behind explicit actions.
  const currentFiles = files ?? [];
  const hasFiles = currentFiles.length > 0;

  const gateReport =
    previewState && hasFiles
      ? getPublishGateReport({
          previewState,
          files: currentFiles,
        })
      : null;

  const generatedUrl = previewState
    ? getGeneratedPreviewUrl(previewState)
    : "https://founder-ai-build.founder-ai.app";

  const publishStorageKey = `founder-ai:publish:${
    previewState?.title
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "default-project"
  }`;

  const [customDomain, setCustomDomain] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDnsSettingsOpen, setIsDnsSettingsOpen] = useState(false);
  const [isSecurityPanelOpen, setIsSecurityPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [domainStatus, setDomainStatus] = useState<
    "none" | "needs-dns" | "verifying" | "verified"
  >("none");
  const [hasLoadedPublishState, setHasLoadedPublishState] = useState(false);
  const [hasPublishedSnapshot, setHasPublishedSnapshot] = useState(false);
  const [publishVersion, setPublishVersion] = useState(0);
  const [lastPublishedLabel, setLastPublishedLabel] = useState("Never");
  const [publishedFileCount, setPublishedFileCount] = useState(0);
  const [publishActionFeedback, setPublishActionFeedback] = useState("");
  const [isPublishingAction, setIsPublishingAction] = useState(false);

  useEffect(() => {
    // Load saved publish dropdown state for this project.
    try {
      const savedState = window.localStorage.getItem(publishStorageKey);

      if (!savedState) {
        setHasLoadedPublishState(true);
        return;
      }

      const parsed = JSON.parse(savedState) as {
        customDomain?: string;
        visibility?: "public" | "private";
        domainStatus?: "none" | "needs-dns" | "verifying" | "verified";
        lastUpdatedLabel?: string;
        hasPublishedSnapshot?: boolean;
        publishVersion?: number;
        lastPublishedLabel?: string;
        publishedFileCount?: number;
      };

      setCustomDomain(parsed.customDomain ?? "");
      setVisibility(parsed.visibility === "private" ? "private" : "public");
      setDomainStatus(parsed.domainStatus ?? "none");
      setLastUpdatedLabel(parsed.lastUpdatedLabel ?? "Not updated yet");
      setHasPublishedSnapshot(Boolean(parsed.hasPublishedSnapshot));
      setPublishVersion(parsed.publishVersion ?? 0);
      setLastPublishedLabel(parsed.lastPublishedLabel ?? "Never");
      setPublishedFileCount(parsed.publishedFileCount ?? 0);
      setHasLoadedPublishState(true);
    } catch {
      setHasLoadedPublishState(true);
    }
  }, [publishStorageKey]);

  useEffect(() => {
    // Persist publish dropdown state for this project.
    if (!hasLoadedPublishState) return;

    const stateToSave = {
      customDomain,
      visibility,
      domainStatus,
      lastUpdatedLabel,
      hasPublishedSnapshot,
      publishVersion,
      lastPublishedLabel,
      publishedFileCount,
    };

    try {
      window.localStorage.setItem(publishStorageKey, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage failures. Some browsers block storage because joy is apparently optional.
    }
  }, [
    customDomain,
    visibility,
    domainStatus,
    lastUpdatedLabel,
    hasPublishedSnapshot,
    publishVersion,
    lastPublishedLabel,
    publishedFileCount,
    hasLoadedPublishState,
    publishStorageKey,
  ]);

  const cleanCustomDomain = customDomain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const dnsRecordName = cleanCustomDomain || "app.yourdomain.com";
  const dnsRecordValue = "cname.founder-ai.app";

  const securityCount = [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => currentFiles.some((file) => file.path === filePath)).length;

  const settingsCount = [
    "config/env.example",
    "config/deploy-checklist.md",
    "config/developer-instructions.md",
    "config/launch-readiness-report.md",
  ].filter((filePath) => currentFiles.some((file) => file.path === filePath)).length;

  const activeUrl = cleanCustomDomain ? `https://${cleanCustomDomain}` : generatedUrl;

  const hasUnpublishedChanges =
    hasPublishedSnapshot && currentFiles.length !== publishedFileCount;

  const deploymentStage =
    hasPublishedSnapshot && !hasUnpublishedChanges
      ? "published"
      : !hasFiles || !gateReport
        ? "draft"
        : gateReport.decision === "can-publish" || gateReport.decision === "can-stage"
          ? "staging"
          : gateReport.decision === "can-preview"
            ? "preview"
            : "draft";

  const deploymentTimeline = [
    {
      id: "draft",
      label: "Draft",
      detail: "Build generated",
    },
    {
      id: "preview",
      label: "Preview",
      detail: "Internal review",
    },
    {
      id: "staging",
      label: "Staging",
      detail: "Ready to test",
    },
    {
      id: "published",
      label: "Published",
      detail: "Live snapshot",
    },
  ] as const;

  const deploymentStageIndex = deploymentTimeline.findIndex(
    (item) => item.id === deploymentStage
  );

  const publishStage =
    !hasFiles || !gateReport
      ? {
          label: "Draft",
          description: "Build something first before publishing.",
        }
      : gateReport.decision === "can-publish"
        ? {
            label: hasPublishedSnapshot
              ? hasUnpublishedChanges
                ? "Changes ready"
                : "Published"
              : "Ready",
            description: hasPublishedSnapshot
              ? hasUnpublishedChanges
                ? "New changes are ready to republish after final review."
                : "This snapshot is already published locally."
              : "Checks look healthy. Final human review still matters.",
          }
        : gateReport.decision === "can-stage"
          ? {
              label: "Review",
              description: "Good enough for staging, not production-perfect yet.",
            }
          : gateReport.decision === "can-preview"
            ? {
                label: "Preview",
                description: "Internal preview is fine. More setup is still required.",
              }
            : {
                label: "Blocked",
                description: "Fix blockers before pretending this should go live.",
              };

  const tone =
    !hasFiles || !gateReport
      ? {
          background: "#fff7ed",
          border: "#fdba74",
          badgeBackground: "#ffedd5",
          badgeColor: "#9a3412",
        }
      : gateReport.decision === "can-publish"
        ? {
            background: "#ecfdf5",
            border: "#86efac",
            badgeBackground: "#dcfce7",
            badgeColor: "#166534",
          }
        : gateReport.decision === "can-stage"
          ? {
              background: "#eff6ff",
              border: "#93c5fd",
              badgeBackground: "#dbeafe",
              badgeColor: "#1d4ed8",
            }
          : gateReport.decision === "can-preview"
            ? {
                background: "#f5f3ff",
                border: "#c4b5fd",
                badgeBackground: "#ede9fe",
                badgeColor: "#6d28d9",
              }
            : {
                background: "#fef2f2",
                border: "#fca5a5",
                badgeBackground: "#fee2e2",
                badgeColor: "#991b1b",
              };

  const domainTone =
    domainStatus === "verified"
      ? {
          label: "Verified",
          background: "#ecfdf5",
          color: "#166534",
          border: "#bbf7d0",
        }
      : domainStatus === "verifying"
        ? {
            label: "Verifying",
            background: "#eff6ff",
            color: "#1d4ed8",
            border: "#bfdbfe",
          }
        : domainStatus === "needs-dns"
          ? {
              label: "Needs DNS",
              background: "#fff7ed",
              color: "#9a3412",
              border: "#fed7aa",
            }
          : {
              label: "No domain",
              background: "#f9fafb",
              color: "#4b5563",
              border: "#e5e7eb",
            };

  const securityTone =
    securityCount >= 3
      ? {
          label: "Ready",
          background: "#ecfdf5",
          color: "#166534",
          border: "#bbf7d0",
        }
      : securityCount > 0
        ? {
            label: "Partial",
            background: "#fff7ed",
            color: "#9a3412",
            border: "#fed7aa",
          }
        : {
            label: "Missing",
            background: "#fef2f2",
            color: "#991b1b",
            border: "#fecaca",
          };

  const settingsTone =
    settingsCount >= 4
      ? {
          label: "Ready",
          background: "#ecfdf5",
          color: "#166534",
          border: "#bbf7d0",
        }
      : settingsCount > 0
        ? {
            label: "Partial",
            background: "#fff7ed",
            color: "#9a3412",
            border: "#fed7aa",
          }
        : {
            label: "Missing",
            background: "#fef2f2",
            color: "#991b1b",
            border: "#fecaca",
          };

  const mainPublishActionLabel =
    !hasFiles || !gateReport
      ? "Update snapshot"
      : gateReport.decision === "blocked"
        ? "Update snapshot"
        : !hasPublishedSnapshot
          ? "Publish"
          : hasUnpublishedChanges
            ? "Republish"
            : "Update";

  const securityChecklist = [
    {
      label: "Security review exported",
      done: currentFiles.some((file) => file.path === "config/security-review.md"),
    },
    {
      label: "Security rules exported",
      done: currentFiles.some((file) => file.path === "config/security-rules.md"),
    },
    {
      label: "Publish gate report exported",
      done: currentFiles.some((file) => file.path === "config/publish-gate-report.md"),
    },
  ];

  const settingsChecklist = [
    {
      label: "Environment example exported",
      done: currentFiles.some((file) => file.path === "config/env.example"),
    },
    {
      label: "Deployment checklist exported",
      done: currentFiles.some((file) => file.path === "config/deploy-checklist.md"),
    },
    {
      label: "Developer instructions exported",
      done: currentFiles.some((file) => file.path === "config/developer-instructions.md"),
    },
    {
      label: "Launch readiness report exported",
      done: currentFiles.some((file) => file.path === "config/launch-readiness-report.md"),
    },
  ];

  const secondaryButtonStyle: React.CSSProperties = {
    minHeight: "38px",
    borderRadius: "13px",
    border: "1px solid #d7dbe3",
    background: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    fontWeight: 750,
    padding: "0 12px",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  };

  function getPublishBadgeStyle(toneValue: {
    background: string;
    color: string;
    border: string;
  }): React.CSSProperties {
    // Shared badge style for domain, security, and settings status pills.
    return {
      borderRadius: "999px",
      border: `1px solid ${toneValue.border}`,
      background: toneValue.background,
      color: toneValue.color,
      fontSize: "11px",
      fontWeight: 850,
      padding: "6px 9px",
      whiteSpace: "nowrap",
    };
  }

  function getPublishCardStyle(): React.CSSProperties {
    // Shared compact card shell for grouped publish controls.
    return {
      border: "1px solid #eef1f4",
      borderRadius: "17px",
      padding: "12px",
      display: "grid",
      gap: "9px",
    };
  }

  function getPublishPanelStyle(): React.CSSProperties {
    // Shared inset panel shell for expanded dropdown panels.
    return {
      border: "1px solid #eef1f4",
      borderRadius: "16px",
      background: "#f9fafb",
      padding: "12px",
      display: "grid",
      gap: "10px",
    };
  }

  function getPublishChecklistStatusStyle(done: boolean): React.CSSProperties {
    // Shared status text for readiness checklist rows.
    return {
      color: done ? "#166534" : "#9a3412",
    };
  }

  function getPublishTinyLabelStyle(): React.CSSProperties {
    // Shared tiny uppercase label style.
    return {
      color: "#6b7280",
      fontSize: "10px",
      fontWeight: 900,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      marginBottom: "5px",
    };
  }

  function getPublishSectionHeadingStyle(): React.CSSProperties {
    // Shared compact section heading style.
    return {
      color: "#111827",
      fontSize: "14px",
      fontWeight: 850,
    };
  }

  function getPublishMetaTextStyle(): React.CSSProperties {
    // Shared muted helper text style.
    return {
      color: "#4b5563",
      fontSize: "12px",
      lineHeight: 1.35,
    };
  }

  function getPublishChecklistRowStyle(): React.CSSProperties {
    // Shared checklist row layout style.
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      color: "#374151",
      fontSize: "12px",
      lineHeight: 1.35,
    };
  }

  function showPublishToast(value: string) {
    // Show compact feedback without increasing dropdown height.
    setMessage(value);
    setToastMessage(value);

    window.setTimeout(() => {
      setToastMessage((current) => (current === value ? "" : current));
    }, 2600);
  }

  function closeOtherPublishPanels(panel: "dns" | "security" | "settings" | "details") {
    // Keep only one compact publish panel open at a time.
    if (panel !== "dns") setIsDnsSettingsOpen(false);
    if (panel !== "security") setIsSecurityPanelOpen(false);
    if (panel !== "settings") setIsSettingsPanelOpen(false);
    if (panel !== "details") setIsDetailsOpen(false);
  }

  function runPublishActionFeedback({
    loadingLabel,
    successLabel,
  }: {
    loadingLabel: string;
    successLabel: string;
  }) {
    // Briefly show action feedback on the main publish button.
    setIsPublishingAction(true);
    setPublishActionFeedback(loadingLabel);

    window.setTimeout(() => {
      setPublishActionFeedback(successLabel);

      window.setTimeout(() => {
        setIsPublishingAction(false);
        setPublishActionFeedback("");
      }, 700);
    }, 450);
  }

  async function copyText(value: string, successMessage: string) {
    // Generic clipboard helper for URL and DNS records.
    try {
      await navigator.clipboard.writeText(value);
      showPublishToast(successMessage);
    } catch {
      showPublishToast("Could not copy. Select the value and copy it manually.");
    }
  }

  async function copyPublishUrl() {
    // Copy the currently visible publish URL.
    await copyText(activeUrl, "Website URL copied.");
  }

  function updateSnapshot() {
    // Main publish action. It simulates publish/update/republish locally for now.
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setLastUpdatedLabel(timestamp);

    if (!hasFiles || !gateReport) {
      runPublishActionFeedback({
        loadingLabel: "Checking...",
        successLabel: "Not ready",
      });
      showPublishToast("No generated files yet. Build something first.");
      return;
    }

    if (gateReport.decision === "blocked") {
      runPublishActionFeedback({
        loadingLabel: "Checking...",
        successLabel: "Blocked",
      });
      showPublishToast("Snapshot updated. Publishing is still blocked.");
      return;
    }

    if (gateReport.decision === "can-preview") {
      runPublishActionFeedback({
        loadingLabel: "Updating...",
        successLabel: "Preview updated",
      });
      showPublishToast("Preview snapshot updated. Review before staging.");
      return;
    }

    if (gateReport.decision === "can-stage") {
      runPublishActionFeedback({
        loadingLabel: "Updating...",
        successLabel: "Staging updated",
      });
      showPublishToast("Staging snapshot updated. Run tests before production.");
      return;
    }

    setHasPublishedSnapshot(true);
    setPublishedFileCount(currentFiles.length);
    setPublishVersion((current) => current + 1);
    setLastPublishedLabel(timestamp);

    if (!hasPublishedSnapshot) {
      runPublishActionFeedback({
        loadingLabel: "Publishing...",
        successLabel: "Published",
      });
      showPublishToast("Published locally. Wire real deployment provider next.");
      return;
    }

    if (hasUnpublishedChanges) {
      runPublishActionFeedback({
        loadingLabel: "Republishing...",
        successLabel: "Republished",
      });
      showPublishToast("Republished locally with the latest generated files.");
      return;
    }

    runPublishActionFeedback({
      loadingLabel: "Updating...",
      successLabel: "Updated",
    });

    showPublishToast("Published snapshot updated.");
  }

  function reviewSecurity() {
    // Toggle the compact security panel and close the other compact panels.
    closeOtherPublishPanels("security");
    setIsSecurityPanelOpen((current) => !current);

    if (securityCount >= 3) {
      showPublishToast("Security checks are ready for manual review.");
      return;
    }

    showPublishToast("Security checks are incomplete. Open full publish center for exports.");
  }

  function editSettings() {
    // Toggle the compact settings panel and close the other compact panels.
    closeOtherPublishPanels("settings");
    setIsSettingsPanelOpen((current) => !current);

    if (settingsCount >= 4) {
      showPublishToast("Core publish settings are present.");
      return;
    }

    showPublishToast("Publish settings are incomplete. Open full publish center for setup exports.");
  }

  function handleCustomDomainChange(value: string) {
    // Reset domain verification whenever the entered domain changes.
    setCustomDomain(value);

    const nextDomain = value.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

    if (!nextDomain) {
      setDomainStatus("none");
      return;
    }

    setDomainStatus("needs-dns");
  }

  function openDnsSettings() {
    // Open compact DNS verification instructions inside this dropdown.
    closeOtherPublishPanels("dns");
    setIsDnsSettingsOpen((current) => !current);

    if (!cleanCustomDomain) {
      showPublishToast("Enter a custom domain first.");
      setDomainStatus("none");
      return;
    }

    if (domainStatus === "none") {
      setDomainStatus("needs-dns");
    }

    showPublishToast("Add the DNS record shown below, then verify the domain.");
  }

  function verifyDomain() {
    // Simulated verification. Real DNS lookup/provider verification comes later.
    if (!cleanCustomDomain) {
      showPublishToast("Enter a custom domain first.");
      setDomainStatus("none");
      return;
    }

    setDomainStatus("verifying");
    showPublishToast("Checking DNS record...");

    window.setTimeout(() => {
      setDomainStatus("verified");
      showPublishToast("Domain verified locally. Wire real DNS verification next.");
    }, 650);
  }

  function resetPublishState() {
    // Reset saved local publish state for this project.
    setCustomDomain("");
    setVisibility("public");
    setDomainStatus("none");
    setLastUpdatedLabel("Not updated yet");
    setHasPublishedSnapshot(false);
    setPublishVersion(0);
    setLastPublishedLabel("Never");
    setPublishedFileCount(0);
    setPublishActionFeedback("");
    setIsPublishingAction(false);
    showPublishToast("Publish settings reset.");
    setIsDnsSettingsOpen(false);
    setIsDetailsOpen(false);
    setIsSecurityPanelOpen(false);
    setIsSettingsPanelOpen(false);

    try {
      window.localStorage.removeItem(publishStorageKey);
    } catch {
      // Ignore storage failures. The UI has already reset itself.
    }
  }

  function openFullPublishCenter() {
    // Open deeper publish diagnostics and close the dropdown.
    onOpenReadiness();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Publish options"
      className="publish-dropdown-shell"
      style={{
        position: "fixed",
        top: "58px",
        right: "18px",
        width: "min(420px, calc(100vw - 32px))",
        maxHeight: "min(76vh, 620px)",
        overflowY: "auto",
        borderRadius: "22px",
        border: "1px solid #dde2ea",
        background: "#ffffff",
        boxShadow: "0 26px 60px rgba(15, 23, 42, 0.16)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "16px 16px 13px",
          borderBottom: "1px solid #eef1f4",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "7px",
            }}
          >
            Publish
          </div>

          <h2
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "18px",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {publishStage.label}
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.4,
            }}
          >
            {publishStage.description}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close publish panel"
          onClick={onClose}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            border: "1px solid #d7dbe3",
            background: "#f9fafb",
            color: "#111827",
            fontSize: "22px",
            lineHeight: 1,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "14px 16px 16px", display: "grid", gap: "12px" }}>
        <div
          style={{
            border: `1px solid ${tone.border}`,
            background: tone.background,
            borderRadius: "17px",
            padding: "12px",
            display: "grid",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={getPublishTinyLabelStyle()}
              >
                Status
              </div>

              <div
                style={{
                  color: "#111827",
                  fontSize: "14px",
                  fontWeight: 850,
                  lineHeight: 1.25,
                }}
              >
                {gateReport ? `${gateReport.label} · ${gateReport.score}%` : "Draft · 0%"}
              </div>

              <div
                style={{
                  ...getPublishMetaTextStyle(),
                  marginTop: "4px",
                }}
              >
                Published: {hasPublishedSnapshot ? `v${publishVersion} · ${lastPublishedLabel}` : "Never"}
              </div>
            </div>

            <div
              style={{
                alignSelf: "flex-start",
                borderRadius: "999px",
                background: tone.badgeBackground,
                color: tone.badgeColor,
                fontSize: "12px",
                fontWeight: 850,
                padding: "7px 11px",
                whiteSpace: "nowrap",
              }}
            >
              {publishStage.label}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "6px",
              alignItems: "center",
            }}
          >
            {deploymentTimeline.map((item, index) => {
              const isCurrent = item.id === deploymentStage;
              const isComplete = index < deploymentStageIndex;

              return (
                <div
                  key={item.id}
                  title={item.detail}
                  style={{
                    display: "grid",
                    gap: "5px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      height: "5px",
                      borderRadius: "999px",
                      background: isCurrent
                        ? "#2563eb"
                        : isComplete
                          ? "#16a34a"
                          : "rgba(148, 163, 184, 0.45)",
                    }}
                  />
                  <div
                    style={{
                      color: isCurrent ? "#111827" : "#6b7280",
                      fontSize: "10px",
                      fontWeight: isCurrent ? 900 : 750,
                      lineHeight: 1.1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={getPublishCardStyle()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div
              style={getPublishSectionHeadingStyle()}
            >
              Website URL
            </div>

            <button
              type="button"
              onClick={copyPublishUrl}
              style={secondaryButtonStyle}
            >
              Copy
            </button>
          </div>

          <div
            style={{
              minHeight: "46px",
              borderRadius: "14px",
              border: "1px solid #d7dbe3",
              background: "#f9fafb",
              padding: "0 13px",
              display: "flex",
              alignItems: "center",
              color: "#111827",
              fontSize: "13px",
              fontWeight: 750,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={activeUrl}
          >
            {activeUrl}
          </div>
        </div>

        <div
          style={getPublishCardStyle()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div
              style={getPublishSectionHeadingStyle()}
            >
              Custom domain
            </div>

            <span
              style={getPublishBadgeStyle(domainTone)}
            >
              {domainTone.label}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "8px",
            }}
          >
            <input
              value={customDomain}
              onChange={(event) => handleCustomDomainChange(event.target.value)}
              placeholder="app.yourdomain.com"
              suppressHydrationWarning
              style={{
                width: "100%",
                minHeight: "44px",
                borderRadius: "14px",
                border: "1px solid #d7dbe3",
                background: "#ffffff",
                color: "#111827",
                fontSize: "13px",
                fontWeight: 650,
                padding: "0 13px",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={openDnsSettings}
              style={{
                ...secondaryButtonStyle,
                minHeight: "44px",
              }}
            >
              DNS
            </button>
          </div>

          {isDnsSettingsOpen ? (
            <PublishRevealPanel>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "15px",
                  background: "#f9fafb",
                  padding: "11px",
                  display: "grid",
                  gap: "9px",
                }}
              >
              <div
                style={{
                  color: "#374151",
                  fontSize: "12px",
                  lineHeight: 1.4,
                }}
              >
                Add this CNAME record where your domain DNS is managed.
              </div>

              <div style={{ display: "grid", gap: "7px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <strong style={{ color: "#111827", fontSize: "12px" }}>Name</strong>
                  <code
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      background: "#ffffff",
                      padding: "7px 8px",
                      color: "#111827",
                      fontSize: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dnsRecordName}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(dnsRecordName, "CNAME name copied.")}
                    style={{
                      ...secondaryButtonStyle,
                      minHeight: "32px",
                      fontSize: "12px",
                      padding: "0 9px",
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <strong style={{ color: "#111827", fontSize: "12px" }}>Value</strong>
                  <code
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      background: "#ffffff",
                      padding: "7px 8px",
                      color: "#111827",
                      fontSize: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dnsRecordValue}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(dnsRecordValue, "CNAME value copied.")}
                    style={{
                      ...secondaryButtonStyle,
                      minHeight: "32px",
                      fontSize: "12px",
                      padding: "0 9px",
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={verifyDomain}
                style={{
                  ...secondaryButtonStyle,
                  width: "100%",
                  minHeight: "38px",
                  background: domainStatus === "verified" ? "#ecfdf5" : "#ffffff",
                  color: domainStatus === "verified" ? "#166534" : "#111827",
                }}
              >
                {domainStatus === "verified"
                  ? "Domain verified"
                  : domainStatus === "verifying"
                    ? "Verifying..."
                    : "Verify domain"}
              </button>
            </div>
          </PublishRevealPanel>
          ) : null}
        </div>

        <div
          style={getPublishCardStyle()}
        >
          <div
            style={{
              color: "#111827",
              fontSize: "14px",
              fontWeight: 850,
            }}
          >
            Visibility
          </div>

          <div style={{ display: "flex", gap: "9px" }}>
            {(["public", "private"] as const).map((option) => {
              const isActive = visibility === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVisibility(option)}
                  style={{
                    flex: 1,
                    minHeight: "66px",
                    borderRadius: "15px",
                    border: isActive ? "1px solid #2563eb" : "1px solid #d7dbe3",
                    background: isActive ? "#eff6ff" : "#ffffff",
                    padding: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      color: "#111827",
                      fontSize: "13px",
                      fontWeight: 850,
                      marginBottom: "4px",
                      textTransform: "capitalize",
                    }}
                  >
                    {option}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "11px",
                      lineHeight: 1.35,
                    }}
                  >
                    {option === "public" ? "Anyone with URL." : "Internal only."}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "9px",
          }}
        >
          <button
            type="button"
            onClick={reviewSecurity}
            style={{
              ...secondaryButtonStyle,
              border: isSecurityPanelOpen
                ? "1px solid #2563eb"
                : secondaryButtonStyle.border,
              background: isSecurityPanelOpen ? "#eff6ff" : "#ffffff",
            }}
          >
            Security · {securityCount}
          </button>

          <button
            type="button"
            onClick={editSettings}
            style={{
              ...secondaryButtonStyle,
              border: isSettingsPanelOpen
                ? "1px solid #2563eb"
                : secondaryButtonStyle.border,
              background: isSettingsPanelOpen ? "#eff6ff" : "#ffffff",
            }}
          >
            Settings
          </button>
        </div>

        {isSecurityPanelOpen ? (
          <PublishRevealPanel>
            <div
              style={{
                border: "1px solid #eef1f4",
                borderRadius: "16px",
                background: "#f9fafb",
                padding: "12px",
                display: "grid",
                gap: "10px",
              }}
            >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <strong
                style={{
                  color: "#111827",
                  fontSize: "13px",
                }}
              >
                Security readiness
              </strong>

              <span
                style={getPublishBadgeStyle(securityTone)}
              >
                {securityTone.label}
              </span>
            </div>

            <div style={{ display: "grid", gap: "7px" }}>
              {securityChecklist.map((item) => (
                <PublishDropdownChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={openFullPublishCenter}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open security review
            </button>
          </div>
        </PublishRevealPanel>
        ) : null}

        {isSettingsPanelOpen ? (
          <PublishRevealPanel>
            <div
              style={{
                border: "1px solid #eef1f4",
                borderRadius: "16px",
                background: "#f9fafb",
                padding: "12px",
                display: "grid",
                gap: "10px",
              }}
            >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <strong
                style={{
                  color: "#111827",
                  fontSize: "13px",
                }}
              >
                Publish settings
              </strong>

              <span
                style={getPublishBadgeStyle(settingsTone)}
              >
                {settingsTone.label}
              </span>
            </div>

            <div style={{ display: "grid", gap: "7px" }}>
              {settingsChecklist.map((item) => (
                <PublishDropdownChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}
            </div>

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "8px",
                display: "grid",
                gap: "6px",
                color: "#4b5563",
                fontSize: "12px",
                lineHeight: 1.35,
              }}
            >
              <div>Visibility: {visibility === "public" ? "Public" : "Private"}</div>
              <div>Domain: {domainTone.label}</div>
            </div>

            <button
              type="button"
              onClick={openFullPublishCenter}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open publish settings
            </button>
          </div>
        </PublishRevealPanel>
        ) : null}

        <button
          type="button"
          onClick={updateSnapshot}
          disabled={isPublishingAction}
          aria-busy={isPublishingAction}
          className="publish-button"
          style={{
            width: "100%",
            minHeight: "44px",
            borderRadius: "15px",
            opacity: isPublishingAction ? 0.86 : 1,
            cursor: isPublishingAction ? "wait" : "pointer",
          }}
        >
          {publishActionFeedback || mainPublishActionLabel}
        </button>

        <div style={{ display: "flex", gap: "9px" }}>
          <button
            type="button"
            onClick={openFullPublishCenter}
            style={{
              ...secondaryButtonStyle,
              flex: 1,
            }}
          >
            Full publish center
          </button>

          <button
            type="button"
            onClick={() => {
              closeOtherPublishPanels("details");
              setIsDetailsOpen((current) => !current);
            }}
            style={{
              ...secondaryButtonStyle,
              minWidth: "112px",
            }}
          >
            {isDetailsOpen ? "Less" : "Details"}
          </button>
        </div>

        {isDetailsOpen ? (
          <PublishRevealPanel>
            <div
              style={{
                border: "1px solid #eef1f4",
                borderRadius: "16px",
                background: "#f9fafb",
                padding: "12px",
                display: "grid",
                gap: "10px",
                color: "#4b5563",
                fontSize: "12px",
                lineHeight: 1.45,
              }}
            >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {deploymentTimeline.map((item, index) => {
                const isCurrent = item.id === deploymentStage;
                const isComplete = index < deploymentStageIndex;

                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: "13px",
                      border: isCurrent
                        ? "1px solid #2563eb"
                        : isComplete
                          ? "1px solid #bbf7d0"
                          : "1px solid #e5e7eb",
                      background: isCurrent
                        ? "#eff6ff"
                        : isComplete
                          ? "#ecfdf5"
                          : "#ffffff",
                      padding: "9px",
                    }}
                  >
                    <div
                      style={{
                        color: "#111827",
                        fontSize: "11px",
                        fontWeight: 900,
                        marginBottom: "3px",
                      }}
                    >
                      {item.label}
                    </div>

                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "10px",
                        lineHeight: 1.25,
                      }}
                    >
                      {item.detail}
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <strong style={{ color: "#111827" }}>Gate:</strong>{" "}
              {gateReport ? gateReport.summary : "No publish gate available yet."}
            </div>
            <PublishDropdownSummaryRow
              label="Security files"
              value={`${securityCount}/3`}
            />
            <PublishDropdownSummaryRow
              label="Settings files"
              value={`${settingsCount}/4`}
            />
            <PublishDropdownSummaryRow
              label="Visibility"
              value={visibility === "public" ? "Public" : "Private"}
            />
            <PublishDropdownSummaryRow
              label="Domain"
              value={domainTone.label}
            />
            <PublishDropdownSummaryRow
              label="Version"
              value={hasPublishedSnapshot ? `v${publishVersion}` : "Not published"}
            />
            <PublishDropdownSummaryRow
              label="Unpublished changes"
              value={hasUnpublishedChanges ? "Yes" : "No"}
            />
          </div>
        </PublishRevealPanel>
        ) : null}

        <button
          type="button"
          onClick={resetPublishState}
          style={{
            border: "none",
            background: "transparent",
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            padding: "2px 0",
          }}
        >
          Reset publish settings
        </button>


      </div>

      {toastMessage ? (
        <div
          className="publish-dropdown-toast"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

function PreviewToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
  previewState,
  files,
}: {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  fileCountLabel: string;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
  onOpenPublishCenter: () => void;
  previewState?: PreviewState;
  files?: ChangedFile[];
}) {
  void previewState;
  void files;

  return (
    <PremiumWorkspaceToolbar
      filesOpen={filesOpen}
      setFilesOpen={setFilesOpen}
      fileCountLabel={fileCountLabel}
      workspaceView={workspaceView}
      setWorkspaceView={setWorkspaceView}
      onOpenPublishCenter={onOpenPublishCenter}
    />
  );
}


function isBuildStepLike(value: unknown): value is BuildStep {
  if (!value || typeof value !== "object") return false;

  const step = value as {
    label?: unknown;
    status?: unknown;
  };

  return (
    typeof step.label === "string" &&
    (step.status === "pending" ||
      step.status === "active" ||
      step.status === "complete")
  );
}

function getFeedItemBuildSteps(item: FeedItem): BuildStep[] {
  const steps = (item as { steps?: unknown }).steps;

  return Array.isArray(steps) ? steps.filter(isBuildStepLike) : [];
}

function getFeedItemBuildStatus(item: FeedItem): string | null {
  const status = (item as { status?: unknown }).status;

  return typeof status === "string" ? status : null;
}


function isAssistantBuildWorking(item: FeedItem) {
  const itemStatus = getFeedItemBuildStatus(item);

  return item.role === "assistant" && itemStatus !== "completed";
}




function getBackgroundBuildPhase(item: FeedItem) {
  const itemSteps = getFeedItemBuildSteps(item);
  const itemStatus = getFeedItemBuildStatus(item);

  const activeStep =
    itemSteps.find((step) => step.status === "active") ??
    [...itemSteps].reverse().find((step) => step.status !== "complete");

  if (activeStep) return activeStep.label;

  if (itemStatus === "building") return "Building project";
  if (itemStatus === "thinking") return "Planning build";
  if (itemStatus === "queued") return "Queued";

  return "Working";
}




function getBackgroundBuildProgress(item: FeedItem) {
  const itemSteps = getFeedItemBuildSteps(item);
  const itemStatus = getFeedItemBuildStatus(item);

  if (itemStatus === "completed") return 100;

  if (itemSteps.length === 0) {
    if (itemStatus === "queued") return 8;
    if (itemStatus === "thinking") return 16;
    if (itemStatus === "building") return 42;

    return item.role === "assistant" ? 12 : 0;
  }

  const completedSteps = itemSteps.filter(
    (step) => step.status === "complete"
  ).length;
  const hasActiveStep = itemSteps.some((step) => step.status === "active");
  const activeBonus = hasActiveStep ? 0.5 : 0;

  const progress = Math.round(
    ((completedSteps + activeBonus) / itemSteps.length) * 100
  );

  return Math.max(8, Math.min(100, progress));
}



function BackgroundWorkingCard({
  item,
}: {
  item: FeedItem;
}) {
  const progress = getBackgroundBuildProgress(item);
  const phase = getBackgroundBuildPhase(item);

  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(250,247,241,0.94))",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        padding: "18px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-44px",
          top: "-44px",
          width: "140px",
          height: "140px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(37, 99, 235, 0.16), rgba(37, 99, 235, 0))",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "14px",
          position: "relative",
        }}
      >
        <div>
          <div
            style={{
              color: "#2563eb",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Working in background
          </div>

          <h3
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "18px",
              lineHeight: 1.2,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            {"Building your project"}
          </h3>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "28px",
            padding: "0 11px",
            borderRadius: "999px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          Running
        </span>
      </div>

      <p
        style={{
          margin: "0 0 14px",
          color: "#4b5563",
          fontSize: "14px",
          lineHeight: 1.55,
          position: "relative",
        }}
      >
        Founder AI is planning, generating, and checking the build. Details will
        appear when the run is complete.
      </p>

      <div
        style={{
          border: "1px solid #eef0f3",
          borderRadius: "16px",
          background: "#ffffff",
          padding: "13px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <strong
            style={{
              color: "#111827",
              fontSize: "13px",
              lineHeight: 1.35,
            }}
          >
            {phase}
          </strong>

          <span
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {progress}%
          </span>
        </div>

        <div
          style={{
            height: "8px",
            borderRadius: "999px",
            background: "#eef2ff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(37,99,235,0.85), rgba(124,58,237,0.85))",
              transition: "width 260ms ease",
            }}
          />
        </div>
      </div>
    </article>
  );
}


function PreviewContent({
  filesOpen,
  setFilesOpen,
  files,
  projectFiles,
  previewState,
  selectedFile,
  selectedFileId,
  setSelectedFileId,
  workspaceView,
  buildHistory,
  onRestoreBuild,
  isLoadingWorkspace,
  onSaveFile,
  onDeleteFile,
  onCreateFile,
  setWorkspaceError,
  setWorkspaceView,
  publishCenterRef,
  onOpenPublishCenter,
}: {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  files: ChangedFile[];
  projectFiles: DatabaseProjectFile[];
  previewState: PreviewState;
  selectedFile: ChangedFile;
  selectedFileId: string;
  setSelectedFileId: (fileId: string) => void;
  workspaceView: WorkspaceView;
  buildHistory: BuildHistoryItem[];
  onRestoreBuild: (historyItem: BuildHistoryItem) => void;
  isLoadingWorkspace: boolean;
  onSaveFile: (
    fileId: string,
    path: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
  publishCenterRef?: React.RefObject<HTMLDivElement | null>;
  onOpenPublishCenter: () => void;
}) {
  return (
    <div className="preview-content">
      {filesOpen ? (
        <div className="preview-frame-wrap">
          <div className="preview-frame">
            <PremiumFilesWorkspace
              projectName={previewState.title}
              lastUpdatedLabel={previewState.lastUpdatedLabel}
              selectedFileId={selectedFileId}
              files={files.map((file) => {
                const databaseFile = projectFiles.find((item) => item.id === file.id);

                return {
                  id: file.id,
                  path: file.path,
                  description: file.description,
                  status: file.status,
                  source: databaseFile ? "database" : "generated",
                  contents: file.contents,
                };
              })}
              onClose={() => {
                setFilesOpen(false);
                setWorkspaceView("preview");
              }}
              onSelectFile={(fileId) => setSelectedFileId(fileId)}
              onCreateFile={() => {
                setFilesOpen(false);
                setWorkspaceView("code");
              }}
              onOpenCode={() => {
                setFilesOpen(false);
                setWorkspaceView("code");
              }}
              onRefresh={() => setSelectedFileId(selectedFileId)}
            />
          </div>
        </div>
      ) : (
        <div className="preview-frame-wrap">
          <div className="preview-frame">
          {isLoadingWorkspace ? <LoadingWorkspace /> : null}

          {!isLoadingWorkspace && filesOpen ? (
            <FilesWorkspace
              files={files}
              projectFiles={projectFiles}
              selectedFile={selectedFile}
              selectedFileId={selectedFileId}
              setSelectedFileId={setSelectedFileId}
              onCreateFile={onCreateFile}
              setWorkspaceError={setWorkspaceError}
              onClose={() => setFilesOpen(false)}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "preview" ? (
            <PreviewCanvas
              title={previewState.title}
              generatedUrl={getGeneratedPreviewUrl(previewState)}
              isLoading={isLoadingWorkspace}
              onRefresh={() => setWorkspaceView("preview")}
              onOpenCode={() => setWorkspaceView("code")}
              onOpenFiles={() => setFilesOpen(true)}
              onOpenPublish={() => setWorkspaceView("publish-readiness")}
              onOpenSecurity={() => setWorkspaceView("security")}
            >
              <PreviewWebsite previewState={previewState} />
            </PreviewCanvas>
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "code" ? (
            <PremiumCodeWorkspacePanel
              projectName={previewState.title}
              lastUpdatedLabel={previewState.lastUpdatedLabel}
              selectedFile={
                selectedFile
                  ? {
                      id: selectedFile.id,
                      path: selectedFile.path,
                      contents: selectedFile.contents,
                      description: selectedFile.description,
                      status: selectedFile.status,
                      source: projectFiles.some((file) => file.id === selectedFile.id)
                        ? "database"
                        : "generated",
                      isDatabaseBacked: projectFiles.some(
                        (file) => file.id === selectedFile.id
                      ),
                    }
                  : null
              }
              onClose={() => setWorkspaceView("preview")}
              onOpenFiles={() => {
                setWorkspaceView("preview");
                setFilesOpen(true);
              }}
              onRefresh={() => setSelectedFileId(selectedFileId)}
              onSaveFile={async (fileId, path, contents) => {
                try {
                  await onSaveFile(fileId, path, contents);
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Failed to save file.";

                  setWorkspaceError(message);
                  throw error;
                }
              }}
              onDeleteFile={async (fileId) => {
                try {
                  await onDeleteFile(fileId);
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Failed to delete file.";

                  setWorkspaceError(message);
                  throw error;
                }
              }}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "architecture" ? (
            <PremiumArchitectureWorkspacePanel
              projectName={previewState.title}
              projectType={previewState.projectType}
              lastUpdatedLabel={previewState.lastUpdatedLabel}
              classification={previewState.classification}
              architecture={{
                modules: previewState.modules,
                tables: previewState.architecture.tables,
                endpoints: previewState.architecture.endpoints,
                securityRules: previewState.architecture.securityRules,
              }}
              onClose={() => setWorkspaceView("preview")}
              onOpenCode={() => setWorkspaceView("code")}
              onOpenSecurity={() => setWorkspaceView("security")}
              onOpenPublish={() => setWorkspaceView("publish-readiness")}
              onExportSql={async () => {
                const filePath = "supabase/migrations/generated_architecture.sql";
                const contents = createSqlMigrationContents(previewState.architecture);
                const existingFile = files.find((file) => file.path === filePath);

                try {
                  if (existingFile) {
                    await onSaveFile(existingFile.id, filePath, contents);
                    setSelectedFileId(existingFile.id);
                  } else {
                    const createdFile = await onCreateFile(filePath, contents);

                    if (createdFile?.id) {
                      setSelectedFileId(createdFile.id);
                    }
                  }

                  setWorkspaceView("code");
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Failed to export SQL migration.";

                  setWorkspaceError(message);
                }
              }}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "integrations" ? (
            <IntegrationsWorkspace
              previewState={previewState}
              onClose={() => setWorkspaceView("preview")}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "security" ? (
            <SecurityWorkspace
              projectName={previewState.title}
              lastCheckedLabel={previewState.lastUpdatedLabel}
              onClose={() => setWorkspaceView("preview")}
              onOpenPublish={() => setWorkspaceView("publish-readiness")}
              onGenerateSecurityDoc={() => setWorkspaceView("publish-readiness")}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "analytics" ? (
            <AnalyticsWorkspace
              projectName={previewState.title}
              lastUpdatedLabel={previewState.lastUpdatedLabel}
              onClose={() => setWorkspaceView("preview")}
              onRefresh={() => setWorkspaceView("analytics")}
              onOpenReports={() => setWorkspaceView("analytics")}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "publish-readiness" ? (
            <PremiumPublishWorkspace
              projectName={previewState.title}
              generatedUrl={getGeneratedPreviewUrl(previewState)}
              lastCheckedLabel={previewState.lastUpdatedLabel}
              fileCount={files.length}
              changedFileCount={files.filter((file) => file.status === "created" || file.status === "updated").length}
              environmentVariableCount={getRequiredEnvironmentVariables({
                projectType: previewState.projectType,
                modules: previewState.modules,
                architecture: previewState.architecture,
                classification: previewState.classification,
              }).length}
              integrationCount={getIntegrationReadiness({
                projectType: previewState.projectType,
                modules: previewState.modules,
                architecture: previewState.architecture,
                classification: previewState.classification,
              }).length}
              requirements={getPublishGateReport({
                previewState,
                files,
              }).requirements.map((requirement) => ({
                id: requirement.id,
                title: requirement.label,
                description: requirement.detail,
                status: requirement.passed ? "passed" : "warning",
                area:
                  requirement.id === "security"
                    ? "security"
                    : requirement.id === "architecture"
                      ? "database"
                      : requirement.id === "files" || requirement.id === "changes"
                        ? "files"
                        : "review",
              }))}
              onClose={() => setWorkspaceView("preview")}
              onOpenCloud={() => setWorkspaceView("integrations")}
              onOpenSecurity={() => setWorkspaceView("security")}
              onCreateChecklist={() => setWorkspaceView("publish-readiness")}
              onContinuePublish={onOpenPublishCenter}
            />
          ) : null}

          {!isLoadingWorkspace && !filesOpen && workspaceView === "history" ? (
            <PremiumHistoryWorkspace
              projectName={previewState.title}
              lastUpdatedLabel={previewState.lastUpdatedLabel}
              historyItems={buildHistory.map((item) => ({
                id: item.id,
                title: `${item.projectType} build`,
                prompt: item.prompt,
                projectType: item.projectType,
                createdAtLabel: new Date(item.createdAt).toLocaleString(),
                status: item.status,
                changedFiles: files.length,
                modules: previewState.modules.length,
              }))}
              onClose={() => setWorkspaceView("preview")}
              onOpenPreview={() => setWorkspaceView("preview")}
              onRestoreBuild={(historyItem) => {
                const build = buildHistory.find((item) => item.id === historyItem.id);

                if (build) {
                  onRestoreBuild(build);
                }
              }}
            />
          ) : null}
        </div>
      </div>
      )}
    </div>
  );
}


function HistoryToolWorkspace({
  buildHistory,
  onRestoreBuild,
  onClose,
}: {
  buildHistory: BuildHistoryItem[];
  onRestoreBuild: (historyItem: BuildHistoryItem) => void;
  onClose?: () => void;
}) {
  const [activeHistoryFilter, setActiveHistoryFilter] = useState("all");

  const completedCount = buildHistory.filter(
    (item) => item.status === "completed"
  ).length;
  const restoredCount = buildHistory.filter(
    (item) => item.status === "restored"
  ).length;
  const failedCount = buildHistory.filter(
    (item) => item.status === "failed"
  ).length;

  const filteredBuildHistory = buildHistory.filter((item) => {
    if (activeHistoryFilter === "all") return true;
    return item.status === activeHistoryFilter;
  });

  const historyNavItems = [
    {
      id: "all",
      label: "All builds",
      icon: <History className="icon" />,
      badge: <span className="workspace-tool-pill">{buildHistory.length}</span>,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <Clock3 className="icon" />,
      badge: <span className="workspace-tool-pill green">{completedCount}</span>,
    },
    {
      id: "restored",
      label: "Restored",
      icon: <RefreshCcw className="icon" />,
      badge: <span className="workspace-tool-pill blue">{restoredCount}</span>,
    },
    {
      id: "failed",
      label: "Failed",
      icon: <X className="icon" />,
      badge: <span className="workspace-tool-pill red">{failedCount}</span>,
    },
  ];

  const historyActions = (
    <>
      <span className="workspace-tool-pill blue">
        {buildHistory.length} build{buildHistory.length === 1 ? "" : "s"}
      </span>

      <button
        suppressHydrationWarning
        type="button"
        className="workspace-tool-action-button"
      >
        <RefreshCcw className="icon" />
        Refresh
      </button>
    </>
  );

  return (
    <WorkspaceToolShell
      title="History"
      sidebar={
        <WorkspaceToolNav
          items={historyNavItems}
          activeItemId={activeHistoryFilter}
          onSelectItem={setActiveHistoryFilter}
        />
      }
      actions={historyActions}
      onClose={onClose}
    >
      <div className="history-tool-workspace">
        <section className="history-tool-hero">
          <div>
            <span>Build history</span>
            <h2>Previous generated workspaces</h2>
            <p>
              Restore previous builds, review what changed, and keep track of
              project direction without trusting memory, humanity’s most
              unreliable storage layer.
            </p>
          </div>

          <div className="history-tool-summary">
            <span>Total</span>
            <strong>{buildHistory.length}</strong>
          </div>
        </section>

        <section className="history-tool-metrics" aria-label="Build history metrics">
          <article>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>

          <article>
            <span>Restored</span>
            <strong>{restoredCount}</strong>
          </article>

          <article>
            <span>Failed</span>
            <strong>{failedCount}</strong>
          </article>

          <article>
            <span>Viewing</span>
            <strong>{filteredBuildHistory.length}</strong>
          </article>
        </section>

        <WorkspaceToolCard
          title="Builds"
          description="Select a previous build to restore it into the current workspace."
          action={<span className="workspace-tool-pill">{activeHistoryFilter}</span>}
        >
          {filteredBuildHistory.length > 0 ? (
            <div className="history-tool-list">
              {filteredBuildHistory.map((historyItem) => {
                const createdDate = new Date(historyItem.createdAt);
                const isValidDate = !Number.isNaN(createdDate.getTime());

                return (
                  <article key={historyItem.id} className="history-tool-row">
                    <div className="history-tool-row-main">
                      <span className="history-tool-row-icon" aria-hidden="true">
                        <History className="icon" />
                      </span>

                      <div>
                        <h4>{historyItem.projectType || "Generated project"}</h4>
                        <p>{historyItem.prompt}</p>

                        <small>
                          {isValidDate
                            ? createdDate.toLocaleString()
                            : "Date unavailable"}
                        </small>
                      </div>
                    </div>

                    <div className="history-tool-row-actions">
                      <span
                        className={[
                          "workspace-tool-pill",
                          historyItem.status === "completed" ? "green" : "",
                          historyItem.status === "restored" ? "blue" : "",
                          historyItem.status === "failed" ? "red" : "",
                        ].join(" ")}
                      >
                        {historyItem.status}
                      </span>

                      <button
                        suppressHydrationWarning
                        type="button"
                        className="history-tool-restore-button"
                        onClick={() => onRestoreBuild(historyItem)}
                      >
                        <RefreshCcw className="icon" />
                        Restore
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <WorkspaceToolEmpty
              icon={<History className="icon-large" />}
              title="No builds found"
              body={
                activeHistoryFilter === "all"
                  ? "Generated builds will appear here after you run prompts."
                  : "There are no builds matching this filter."
              }
            />
          )}
        </WorkspaceToolCard>
      </div>
    </WorkspaceToolShell>
  );
}



function PreviewToolWorkspace({
  previewState,
}: {
  previewState: PreviewState;
}) {
  const previewActions = (
    <>
      <span className="workspace-tool-pill blue">
        {previewState.projectType}
      </span>

      <button
        suppressHydrationWarning
        type="button"
        className="workspace-tool-action-button"
      >
        <RefreshCcw className="icon" />
        Refresh
      </button>
    </>
  );

  return (
    <WorkspaceToolShell title="Preview" actions={previewActions}>
      <div className="preview-tool-workspace">
        <section className="preview-tool-hero">
          <div>
            <span>Live preview</span>
            <h2>{previewState.projectType} workspace preview</h2>
            <p>
              This is the generated product preview for the current build. Use
              the toolbar to inspect files, code, cloud setup, security, and
              analytics.
            </p>
          </div>

          <div className="preview-tool-summary">
            <span>Modules</span>
            <strong>{previewState.modules.length}</strong>
          </div>
        </section>

        <section className="preview-tool-frame-card">
          <PreviewWebsite previewState={previewState} />
        </section>
      </div>
    </WorkspaceToolShell>
  );
}




function PublishToolWorkspace({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setSelectedFileId,
  setWorkspaceView,
  setWorkspaceError,
  publishCenterRef,
  onClose,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    path: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
  setWorkspaceError: (value: string) => void;
  publishCenterRef?: React.RefObject<HTMLDivElement | null>;
  onClose?: () => void;
}) {
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  const requiredEnvironmentVariables = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const integrationReadiness = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = integrationReadiness.filter(
    (integration) => integration.required
  );
  const setupRequiredCount = integrationReadiness.filter(
    (integration) => integration.status === "needs-setup"
  ).length;
  const securityRuleCount = previewState.architecture.securityRules.length;
  const tableCount = previewState.architecture.tables.length;
  const apiRouteCount = previewState.architecture.endpoints.length;

  const readinessIssues = [
    requiredEnvironmentVariables.length > 0
      ? `${requiredEnvironmentVariables.length} environment variable${
          requiredEnvironmentVariables.length === 1 ? "" : "s"
        } required`
      : "",
    setupRequiredCount > 0
      ? `${setupRequiredCount} integration${setupRequiredCount === 1 ? "" : "s"} need setup`
      : "",
    securityRuleCount > 0
      ? `${securityRuleCount} security rule${securityRuleCount === 1 ? "" : "s"} need review`
      : "",
    tableCount > 0 ? `${tableCount} database table${tableCount === 1 ? "" : "s"} planned` : "",
  ].filter(Boolean);

  const readinessStatus =
    readinessIssues.length === 0
      ? "ready"
      : setupRequiredCount > 0 || requiredEnvironmentVariables.length > 0
        ? "blocked"
        : "review";

  const readinessLabel =
    readinessStatus === "ready"
      ? "Ready"
      : readinessStatus === "blocked"
        ? "Needs setup"
        : "Review";

  async function handleCreatePublishChecklist() {
    setIsCreatingChecklist(true);
    setPublishMessage("");
    setWorkspaceError("");

    const filePath = "docs/publish-readiness.md";
    const contents = `# Publish readiness

## Project
- Type: ${previewState.projectType}
- Complexity: ${previewState.classification?.complexity ?? "unknown"}
- Modules: ${previewState.modules.length}
- Files: ${files.length}
- Tables: ${tableCount}
- API routes: ${apiRouteCount}
- Security rules: ${securityRuleCount}

## Required environment variables
${
  requiredEnvironmentVariables.length > 0
    ? requiredEnvironmentVariables
        .map((variable) => `- \`${variable.key}\` (${variable.scope}) — ${variable.reason}`)
        .join("\n")
    : "- None detected"
}

## Required integrations
${
  requiredIntegrations.length > 0
    ? requiredIntegrations
        .map((integration) => `- ${integration.label}: ${integration.status}`)
        .join("\n")
    : "- None detected"
}

## Security review
${
  previewState.architecture.securityRules.length > 0
    ? previewState.architecture.securityRules
        .map((rule) => `- ${rule.label}: ${rule.description}`)
        .join("\n")
    : "- No generated security rules detected"
}

## Final checks
- Review generated SQL before running it.
- Confirm RLS and policies.
- Confirm server-only secrets are not exposed to the browser.
- Confirm integrations are configured in production.
- Run a final deployment smoke test.
`;

    const existingFile = files.find((file) => file.path === filePath);

    try {
      const savedFile = existingFile
        ? await onSaveFile(existingFile.id, filePath, contents)
        : await onCreateFile(filePath, contents);

      if (savedFile?.id) {
        setSelectedFileId(savedFile.id);
      } else if (existingFile?.id) {
        setSelectedFileId(existingFile.id);
      }

      setPublishMessage(existingFile ? "Publish checklist updated." : "Publish checklist created.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create publish checklist.";

      setWorkspaceError(message);
      setPublishMessage(message);
    } finally {
      setIsCreatingChecklist(false);
    }
  }

  const publishActions = (
    <>
      <span
        className={[
          "workspace-tool-pill",
          readinessStatus === "ready" ? "green" : "",
          readinessStatus === "blocked" ? "red" : "",
          readinessStatus === "review" ? "orange" : "",
        ].join(" ")}
      >
        {readinessLabel}
      </span>

      <button
        suppressHydrationWarning
        type="button"
        className="workspace-tool-action-button"
        onClick={handleCreatePublishChecklist}
        disabled={isCreatingChecklist}
      >
        {isCreatingChecklist ? <Loader2 className="icon" /> : <FileText className="icon" />}
        {isCreatingChecklist ? "Creating" : "Checklist"}
      </button>
    </>
  );

  return (
    <WorkspaceToolShell title="Publish" actions={publishActions} onClose={onClose}>
      <div className="publish-tool-workspace" ref={publishCenterRef}>
        <section className="publish-tool-hero">
          <div>
            <span>Publish readiness</span>
            <h2>Prepare this build for launch</h2>
            <p>
              Review generated files, environment requirements, integrations,
              database plans, and security checks before shipping this into the
              internet’s cheerful wood chipper.
            </p>
          </div>

          <div className="publish-tool-summary">
            <span>Status</span>
            <strong>{readinessLabel}</strong>
          </div>
        </section>

        {publishMessage ? (
          <div
            className={[
              "workspace-tool-alert",
              publishMessage.toLowerCase().includes("failed") ? "danger" : "",
            ].join(" ")}
          >
            <span>{publishMessage}</span>
          </div>
        ) : null}

        <section className="publish-tool-metrics" aria-label="Publish metrics">
          <article>
            <span>Files</span>
            <strong>{files.length}</strong>
          </article>

          <article>
            <span>Env vars</span>
            <strong>{requiredEnvironmentVariables.length}</strong>
          </article>

          <article>
            <span>Integrations</span>
            <strong>{requiredIntegrations.length}</strong>
          </article>

          <article>
            <span>Security</span>
            <strong>{securityRuleCount}</strong>
          </article>
        </section>

        <div className="publish-tool-grid">
          <WorkspaceToolCard
            title="Readiness issues"
            description="Items to resolve before production launch."
            action={<span className="workspace-tool-pill">{readinessIssues.length}</span>}
          >
            <div className="publish-tool-list">
              {readinessIssues.length > 0 ? (
                readinessIssues.map((issue) => (
                  <article key={issue} className="workspace-tool-list-row">
                    <span>{issue}</span>
                    <span className="workspace-tool-pill orange">Review</span>
                  </article>
                ))
              ) : (
                <WorkspaceToolEmpty
                  icon={<Upload className="icon-large" />}
                  title="No blockers detected"
                  body="No generated blockers were detected, but manual review is still required before production."
                />
              )}
            </div>
          </WorkspaceToolCard>

          <WorkspaceToolCard
            title="Environment variables"
            description="Production secrets and public configuration required by this build."
            action={<span className="workspace-tool-pill blue">{requiredEnvironmentVariables.length}</span>}
          >
            <div className="publish-tool-list">
              {requiredEnvironmentVariables.length > 0 ? (
                requiredEnvironmentVariables.map((variable) => (
                  <article key={variable.key} className="workspace-tool-list-row">
                    <div>
                      <strong>{variable.key}</strong>
                      <p>{variable.reason}</p>
                    </div>

                    <span className="workspace-tool-pill">{variable.scope}</span>
                  </article>
                ))
              ) : (
                <WorkspaceToolEmpty
                  icon={<Code2 className="icon-large" />}
                  title="No env vars detected"
                  body="This build does not currently require environment variables."
                />
              )}
            </div>
          </WorkspaceToolCard>

          <WorkspaceToolCard
            title="Deployment checklist"
            description="Production checks before publish."
            action={
              <button
                suppressHydrationWarning
                type="button"
                className="workspace-tool-action-button"
                onClick={() => setWorkspaceView("security")}
              >
                <Shield className="icon" />
                Security
              </button>
            }
          >
            <div className="publish-tool-list">
              {[
                "Review generated SQL and database policies.",
                "Confirm server-side auth and protected routes.",
                "Confirm production environment variables.",
                "Confirm integrations are configured with live keys.",
                "Run smoke tests after deployment.",
              ].map((item) => (
                <article key={item} className="workspace-tool-list-row">
                  <span>{item}</span>
                  <span className="workspace-tool-pill">Check</span>
                </article>
              ))}
            </div>
          </WorkspaceToolCard>
        </div>
      </div>
    </WorkspaceToolShell>
  );
}




function LoadingWorkspace() {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "grid",
        placeItems: "center",
        background: "#ffffff",
        color: "#111827",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Loader2 className="icon-large" />
        <p
          style={{
            margin: "14px 0 0",
            color: "#4b5563",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Loading database workspace...
        </p>
      </div>
    </div>
  );
}


function FilesWorkspace({
  files,
  projectFiles,
  selectedFile,
  selectedFileId,
  setSelectedFileId,
  onCreateFile,
  setWorkspaceError,
  onClose,
}: {
  files: ChangedFile[];
  projectFiles: DatabaseProjectFile[];
  selectedFile: ChangedFile;
  selectedFileId: string;
  setSelectedFileId: (fileId: string) => void;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
  onClose?: () => void;
}) {
  const [newFilePath, setNewFilePath] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const databaseFileIds = useMemo(
    () => new Set(projectFiles.map((file) => file.id)),
    [projectFiles]
  );

  const generatedCount = files.filter((file) => file.status !== "checked").length;
  const syncedCount = files.filter((file) => databaseFileIds.has(file.id)).length;
  const selectedDatabaseFile = projectFiles.find((file) => file.id === selectedFile?.id);

  async function handleCreateFile() {
    const normalizedPath = newFilePath.trim();

    if (!normalizedPath) {
      setCreateMessage("Enter a file path.");
      return;
    }

    setIsCreatingFile(true);
    setCreateMessage("");
    setWorkspaceError("");

    try {
      const createdFile = await onCreateFile(
        normalizedPath,
        `// ${normalizedPath}\n\nexport const created = true;\n`
      );

      if (createdFile?.id) {
        setSelectedFileId(createdFile.id);
      }

      setNewFilePath("");
      setCreateMessage("File created.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create file.";

      setCreateMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsCreatingFile(false);
    }
  }

  const fileActions = (
    <>
      <span className="workspace-tool-pill blue">{files.length} files</span>
      <span className="workspace-tool-pill green">{syncedCount} synced</span>
    </>
  );

  const sidebar = (
    <div className="files-tool-sidebar-inner">
      <div className="files-tool-create">
        <label htmlFor="files-tool-new-path">New file</label>

        <div className="files-tool-create-row">
          <input
            suppressHydrationWarning
            id="files-tool-new-path"
            value={newFilePath}
            onChange={(event) => setNewFilePath(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreateFile();
              }
            }}
            placeholder="components/new-file.tsx"
            disabled={isCreatingFile}
            spellCheck={false}
          />

          <button
            suppressHydrationWarning
            type="button"
            onClick={handleCreateFile}
            disabled={isCreatingFile}
            aria-label="Create file"
            title="Create file"
          >
            {isCreatingFile ? <Loader2 className="icon" /> : <Plus className="icon" />}
          </button>
        </div>

        <p
          className={[
            "files-tool-create-message",
            createMessage.toLowerCase().includes("failed") ||
            createMessage.toLowerCase().includes("enter") ||
            createMessage.toLowerCase().includes("invalid") ||
            createMessage.toLowerCase().includes("already")
              ? "error"
              : createMessage
                ? "success"
                : "",
          ].join(" ")}
        >
          {createMessage || "Create a database-backed project file."}
        </p>
      </div>

      <div className="files-tool-sidebar-stats">
        <article>
          <span>Total</span>
          <strong>{files.length}</strong>
        </article>

        <article>
          <span>Changed</span>
          <strong>{generatedCount}</strong>
        </article>
      </div>

      <div className="files-tool-list" role="list">
        {files.length > 0 ? (
          files.map((file) => {
            const databaseFile = projectFiles.find((item) => item.id === file.id);
            const isSelected = selectedFileId === file.id;
            const statusLabel = databaseFile ? "db" : file.status;

            return (
              <button
                suppressHydrationWarning
                type="button"
                key={file.id}
                className={[
                  "files-tool-row",
                  isSelected ? "is-selected" : "",
                  file.status === "checked" ? "is-muted" : "",
                ].join(" ")}
                title={
                  databaseFile
                    ? `Database file · Updated ${new Date(
                        databaseFile.updated_at
                      ).toLocaleString()}`
                    : file.description
                }
                onClick={() => setSelectedFileId(file.id)}
              >
                <span className="files-tool-row-icon" aria-hidden="true">
                  <File className="icon" />
                </span>

                <span className="files-tool-row-text">
                  <strong>{file.path}</strong>
                  <small>{databaseFile ? "Database-backed file" : file.description}</small>
                </span>

                <span className="workspace-tool-pill">{statusLabel}</span>
              </button>
            );
          })
        ) : (
          <WorkspaceToolEmpty
            icon={<File className="icon-large" />}
            title="No files yet"
            body="Create a file or generate a build to populate this drawer."
          />
        )}
      </div>
    </div>
  );

  return (
    <WorkspaceToolShell
      title="Files"
      sidebar={sidebar}
      actions={fileActions}
      onClose={onClose}
    >
      {selectedFile ? (
        <div className="files-tool-detail">
          <section className="files-tool-detail-hero">
            <div>
              <span>Selected file</span>
              <h2>{selectedFile.path}</h2>
              <p>
                {selectedDatabaseFile
                  ? `Database-backed file · Updated ${new Date(
                      selectedDatabaseFile.updated_at
                    ).toLocaleString()}`
                  : selectedFile.description}
              </p>
            </div>

            <span
              className={[
                "workspace-tool-pill",
                selectedDatabaseFile ? "green" : selectedFile.status === "updated" ? "orange" : "blue",
              ].join(" ")}
            >
              {selectedDatabaseFile ? "database" : selectedFile.status}
            </span>
          </section>

          <WorkspaceToolCard
            title="File preview"
            description="Read-only preview of the selected generated file."
            action={<span className="workspace-tool-pill">{selectedFile.contents.split("\\n").length} lines</span>}
          >
            <pre className="files-tool-code-preview">
              <code>{selectedFile.contents || "// Empty file"}</code>
            </pre>
          </WorkspaceToolCard>
        </div>
      ) : (
        <WorkspaceToolEmpty
          icon={<File className="icon-large" />}
          title="File preview unavailable"
          body="Select a file from the list to preview its contents."
        />
      )}
    </WorkspaceToolShell>
  );
}

function FilesDrawer({
  files,
  projectFiles,
  selectedFileId,
  setSelectedFileId,
  onCreateFile,
  setWorkspaceError,
}: {
  files: ChangedFile[];
  projectFiles: DatabaseProjectFile[];
  selectedFileId: string;
  setSelectedFileId: (fileId: string) => void;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
}) {
  const [newFilePath, setNewFilePath] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const databaseFileIds = useMemo(
    () => new Set(projectFiles.map((file) => file.id)),
    [projectFiles]
  );

  const selectedFile = files.find((file) => file.id === selectedFileId);
  const generatedCount = files.filter((file) => file.status !== "checked").length;
  const syncedCount = files.filter((file) => databaseFileIds.has(file.id)).length;

  async function handleCreateFile() {
    const normalizedPath = newFilePath.trim();

    if (!normalizedPath) {
      setCreateMessage("Enter a file path.");
      return;
    }

    setIsCreatingFile(true);
    setCreateMessage("");
    setWorkspaceError("");

    try {
      const createdFile = await onCreateFile(
        normalizedPath,
        `// ${normalizedPath}\n\nexport const created = true;\n`
      );

      if (createdFile?.id) {
        setSelectedFileId(createdFile.id);
      }

      setNewFilePath("");
      setCreateMessage("File created.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create file.";

      setCreateMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsCreatingFile(false);
    }
  }

  const messageType =
    createMessage.toLowerCase().includes("failed") ||
    createMessage.toLowerCase().includes("enter") ||
    createMessage.toLowerCase().includes("invalid") ||
    createMessage.toLowerCase().includes("already")
      ? "error"
      : createMessage
        ? "success"
        : "neutral";

  return (
    <section className="files-drawer premium-files-drawer animate-slide-up">
      <div className="premium-files-header">
        <div className="premium-files-title-row">
          <span className="premium-files-icon" aria-hidden="true">
            <File className="icon" />
          </span>

          <div>
            <h3>Project files</h3>
            <p>
              {files.length} {files.length === 1 ? "file" : "files"} loaded ·{" "}
              {syncedCount} synced · {generatedCount} changed
            </p>
          </div>
        </div>

        <span
          className={[
            "premium-files-sync-pill",
            projectFiles.length > 0 ? "is-synced" : "is-empty",
          ].join(" ")}
        >
          {projectFiles.length > 0 ? "Synced" : "No DB files"}
        </span>
      </div>

      <div className="premium-file-create-card">
        <label className="premium-file-create-label" htmlFor="new-file-path">
          New file
        </label>

        <div className="premium-file-create-row">
          <input
            suppressHydrationWarning
            id="new-file-path"
            value={newFilePath}
            onChange={(event) => setNewFilePath(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreateFile();
              }
            }}
            placeholder="components/new-file.tsx"
            disabled={isCreatingFile}
            spellCheck={false}
            className="premium-file-create-input"
          />

          <button
            suppressHydrationWarning
            type="button"
            className="premium-file-create-button"
            onClick={handleCreateFile}
            disabled={isCreatingFile}
          >
            {isCreatingFile ? (
              <>
                <Loader2 className="icon" />
                Creating
              </>
            ) : (
              <>
                <Plus className="icon" />
                Create
              </>
            )}
          </button>
        </div>

        <p className={`premium-file-create-message ${messageType}`}>
          {createMessage || "Create a database-backed project file."}
        </p>
      </div>

      {selectedFile ? (
        <div className="premium-selected-file-card">
          <span>Selected</span>
          <strong>{selectedFile.path}</strong>
        </div>
      ) : null}

      <div className="premium-files-list" role="list">
        {files.length > 0 ? (
          files.map((file) => {
            const databaseFile = projectFiles.find((item) => item.id === file.id);
            const isSelected = selectedFileId === file.id;
            const isMuted = file.status === "checked";
            const statusLabel = databaseFile ? "db" : file.status;

            return (
              <button
                suppressHydrationWarning
                type="button"
                key={file.id}
                className={[
                  "premium-file-row",
                  isSelected ? "is-selected" : "",
                  isMuted ? "is-muted" : "",
                ].join(" ")}
                title={
                  databaseFile
                    ? `Database file · Updated ${new Date(
                        databaseFile.updated_at
                      ).toLocaleString()}`
                    : file.description
                }
                onClick={() => setSelectedFileId(file.id)}
              >
                <span className="premium-file-row-main">
                  <span className="premium-file-row-icon" aria-hidden="true">
                    <File className="icon" />
                  </span>

                  <span className="premium-file-row-text">
                    <strong>{file.path}</strong>
                    <small>{databaseFile ? "Database-backed file" : file.description}</small>
                  </span>
                </span>

                <span
                  className={[
                    "premium-file-status",
                    databaseFile ? "is-db" : "",
                    file.status === "created" ? "is-created" : "",
                    file.status === "updated" ? "is-updated" : "",
                    file.status === "checked" ? "is-checked" : "",
                  ].join(" ")}
                >
                  {statusLabel}
                </span>
              </button>
            );
          })
        ) : (
          <div className="premium-files-empty">
            <File className="icon-large" />
            <strong>No files yet</strong>
            <p>Create a file or generate a build to populate this drawer.</p>
          </div>
        )}
      </div>
    </section>
  );
}


function CodeWorkspace({
  selectedFile,
  projectFiles,
  onSaveFile,
  onDeleteFile,
  setWorkspaceError,
  onClose,
}: {
  selectedFile: ChangedFile;
  projectFiles: DatabaseProjectFile[];
  onSaveFile: (
    fileId: string,
    path: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  onDeleteFile: (fileId: string) => Promise<void>;
  setWorkspaceError: (value: string) => void;
  onClose?: () => void;
}) {
  const [draftPath, setDraftPath] = useState(selectedFile?.path ?? "");
  const [draftContents, setDraftContents] = useState(selectedFile?.contents ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const databaseFile = projectFiles.find((file) => file.id === selectedFile?.id);
  const isDatabaseBacked = Boolean(databaseFile);
  const isPathDirty = draftPath !== (selectedFile?.path ?? "");
  const isContentDirty = draftContents !== (selectedFile?.contents ?? "");
  const isDirty = isPathDirty || isContentDirty;
  const statusType = statusMessage.toLowerCase().includes("failed")
    ? "error"
    : statusMessage
      ? "success"
      : "neutral";

  useEffect(() => {
    setDraftPath(selectedFile?.path ?? "");
    setDraftContents(selectedFile?.contents ?? "");
    setStatusMessage("");
  }, [selectedFile?.id, selectedFile?.path, selectedFile?.contents]);

  async function handleSave() {
    if (!selectedFile || !isDatabaseBacked || !isDirty) return;

    setIsSaving(true);
    setStatusMessage("");
    setWorkspaceError("");

    try {
      await onSaveFile(selectedFile.id, draftPath, draftContents);
      setStatusMessage("Saved to database.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save file.";

      setWorkspaceError(message);
      setStatusMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedFile || !isDatabaseBacked) return;

    const confirmed = window.confirm(
      `Delete ${selectedFile.path}? This will mark it as deleted in the database.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setStatusMessage("");
    setWorkspaceError("");

    try {
      await onDeleteFile(selectedFile.id);
      setStatusMessage("File deleted.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete file.";

      setWorkspaceError(message);
      setStatusMessage(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!selectedFile) {
    return (
      <WorkspaceToolShell title="Code" onClose={onClose}>
        <WorkspaceToolEmpty
          icon={<Code2 className="icon-large" />}
          title="No file selected"
          body="Select a file from the Files drawer to inspect and edit its contents."
        />
      </WorkspaceToolShell>
    );
  }

  const codeActions = (
    <>
      <span className={`premium-code-status ${statusType}`}>
        {statusMessage
          ? statusMessage
          : isDirty
            ? "Unsaved changes"
            : isDatabaseBacked
              ? "Saved"
              : "Preview only"}
      </span>

      <button
        suppressHydrationWarning
        type="button"
        className="premium-code-button secondary"
        onClick={handleDelete}
        disabled={!isDatabaseBacked || isSaving || isDeleting}
      >
        <Trash2 className="icon" />
        {isDeleting ? "Deleting" : "Delete"}
      </button>

      <button
        suppressHydrationWarning
        type="button"
        className="premium-code-button primary"
        onClick={handleSave}
        disabled={!isDatabaseBacked || !isDirty || isSaving || isDeleting}
      >
        {isSaving ? <Loader2 className="icon" /> : <Save className="icon" />}
        {isSaving ? "Saving" : "Save"}
      </button>
    </>
  );

  return (
    <WorkspaceToolShell title="Code" actions={codeActions} onClose={onClose}>
      <div className="premium-code-workspace compact">
        <section className="premium-code-shell">
          <header className="premium-code-header">
            <div className="premium-code-title-block">
              <span className="premium-code-icon" aria-hidden="true">
                <Code2 className="icon" />
              </span>

              <div className="premium-code-title-text">
                <h3>{selectedFile.path}</h3>
                <p>
                  {isDatabaseBacked
                    ? `Database-backed file · ${selectedFile.description}`
                    : "Generated preview file · save disabled until synced"}
                </p>
              </div>
            </div>
          </header>

          <div className="premium-code-path-card">
            <label htmlFor="code-file-path">File path</label>
            <input
              suppressHydrationWarning
              id="code-file-path"
              value={draftPath}
              onChange={(event) => setDraftPath(event.target.value)}
              disabled={!isDatabaseBacked || isSaving || isDeleting}
              spellCheck={false}
              aria-label="File path"
              title={
                isDatabaseBacked
                  ? "Rename file path"
                  : "Only database-backed files can be renamed"
              }
            />
          </div>

          <div className="premium-code-editor-card">
            <div className="premium-code-editor-toolbar">
              <span>{selectedFile.path.split(".").pop() || "code"}</span>
              <span>{draftContents.split("\\n").length} lines</span>
            </div>

            <textarea
              suppressHydrationWarning
              className="premium-code-editor code-editor"
              value={draftContents}
              onChange={(event) => setDraftContents(event.target.value)}
              disabled={!isDatabaseBacked || isSaving || isDeleting}
              spellCheck={false}
              aria-label="File contents"
            />
          </div>
        </section>
      </div>
    </WorkspaceToolShell>
  );
}

function RunMigrationInstructionsPanel({
  tableCount,
}: {
  tableCount: number;
}) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 6px",
              color: "#111827",
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Run migration instructions
          </h3>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {tableCount > 0
              ? `${tableCount} planned database table${tableCount === 1 ? "" : "s"} detected. Export the SQL migration, review it, then run it in Supabase.`
              : "No planned database tables detected yet. Generate a build with database-backed features first."}
          </p>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "26px",
            padding: "0 10px",
            borderRadius: "999px",
            background: tableCount > 0 ? "#fff7ed" : "#f3f4f6",
            color: tableCount > 0 ? "#9a3412" : "#4b5563",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {tableCount > 0 ? "Needs review" : "No tables"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        <MigrationInstructionStep
          number="1"
          title="Export the generated SQL"
          body="Click Export SQL migration in this Architecture view. The generated file will appear in the project file tree."
        />

        <MigrationInstructionStep
          number="2"
          title="Open the generated file"
          body="Open Code view and select supabase/migrations/generated_architecture.sql. Review the tables, fields, indexes, and RLS policies."
        />

        <MigrationInstructionStep
          number="3"
          title="Run it in Supabase"
          body="Go to Supabase Dashboard → SQL Editor → New Query, paste the SQL, then click Run."
        />

        <MigrationInstructionStep
          number="4"
          title="Verify production safety"
          body="Confirm Row Level Security is enabled, policies are appropriate, and no server-only secrets are exposed to the browser."
        />
      </div>

      <div
        style={{
          marginTop: "14px",
          border: "1px solid #fee2e2",
          borderRadius: "16px",
          background: "#fef2f2",
          padding: "13px",
          color: "#991b1b",
          fontSize: "13px",
          lineHeight: 1.55,
          fontWeight: 700,
        }}
      >
        Review the SQL before running it. Generated migrations are starter scaffolds, not divine tablets carried down from Mount Production.
      </div>
    </section>
  );
}

function MigrationInstructionStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "13px",
        display: "flex",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "999px",
          background: "#111827",
          color: "#ffffff",
          display: "grid",
          placeItems: "center",
          fontSize: "12px",
          fontWeight: 900,
          flex: "0 0 auto",
        }}
      >
        {number}
      </div>

      <div>
        <strong
          style={{
            display: "block",
            color: "#111827",
            fontSize: "13px",
            lineHeight: 1.35,
            marginBottom: "4px",
          }}
        >
          {title}
        </strong>

        <span
          style={{
            color: "#4b5563",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {body}
        </span>
      </div>
    </article>
  );
}



function createSqlIdentifier(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

  const fallback = normalized || "generated_table";

  return `"${fallback.replace(/"/g, '""')}"`;
}

function inferSqlColumnType(fieldName: string): string {
  const normalized = fieldName.toLowerCase();

  if (
    normalized.endsWith("_at") ||
    normalized.includes("created") ||
    normalized.includes("updated") ||
    normalized.includes("date") ||
    normalized.includes("time")
  ) {
    return "timestamptz";
  }

  if (
    normalized.startsWith("is_") ||
    normalized.startsWith("has_") ||
    normalized.includes("enabled") ||
    normalized.includes("active")
  ) {
    return "boolean";
  }

  if (
    normalized.includes("count") ||
    normalized.includes("quantity") ||
    normalized.includes("number")
  ) {
    return "integer";
  }

  if (
    normalized.includes("amount") ||
    normalized.includes("price") ||
    normalized.includes("total") ||
    normalized.includes("balance")
  ) {
    return "numeric(12, 2)";
  }

  return "text";
}

function createSqlMigrationContents(architecture: ArchitecturePlan): string {
  const tables = architecture.tables ?? [];

  if (tables.length === 0) {
    return `-- Generated architecture migration
-- No database tables were detected for this build yet.

-- Generate a build with database-backed features, then export again.
`;
  }

  const tableStatements = tables
    .map((table) => {
      const tableName = createSqlIdentifier(table.name || table.id || "generated_table");
      const uniqueFields = Array.from(
        new Set(
          (table.fields ?? [])
            .map((field) => field.trim())
            .filter(Boolean)
        )
      );

      const columnLines = uniqueFields.map((field) => {
        const columnName = createSqlIdentifier(field);
        const columnType = inferSqlColumnType(field);

        return `  ${columnName} ${columnType}`;
      });

      const columns =
        columnLines.length > 0
          ? ["  id uuid primary key default gen_random_uuid()", ...columnLines]
          : ["  id uuid primary key default gen_random_uuid()"];

      const timestampColumns = [
        "  created_at timestamptz not null default now()",
        "  updated_at timestamptz not null default now()",
      ];

      return `-- ${table.purpose || `Table for ${table.name}`}
create table if not exists public.${tableName} (
${[...columns, ...timestampColumns].join(",\n")}
);

alter table public.${tableName} enable row level security;

create policy "${(table.name || "generated_table").replace(/"/g, "")}_owner_select"
on public.${tableName}
for select
using (auth.uid() is not null);

create policy "${(table.name || "generated_table").replace(/"/g, "")}_owner_insert"
on public.${tableName}
for insert
with check (auth.uid() is not null);
`;
    })
    .join("\n");

  return `-- Generated architecture migration
-- Review before running in Supabase SQL Editor.
-- This is starter scaffolding, not a sacred production tablet.

create extension if not exists "pgcrypto";

${tableStatements}
`;
}


function ArchitectureWorkspace({
  previewState,
  files,
  onSaveFile,
  onCreateFile,
  setWorkspaceError,
  onClose,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onSaveFile: (
    fileId: string,
    path: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
  onClose?: () => void;
}) {
  const [isExportingMigration, setIsExportingMigration] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  const architecture = previewState.architecture;
  const moduleCount = previewState.modules.length;
  const tableCount = architecture.tables.length;
  const endpointCount = architecture.endpoints.length;
  const securityRuleCount = architecture.securityRules.length;

  const migrationMessageType =
    migrationMessage.toLowerCase().includes("failed") ||
    migrationMessage.toLowerCase().includes("already")
      ? "error"
      : migrationMessage
        ? "success"
        : "neutral";

  async function handleExportSqlMigration() {
    setIsExportingMigration(true);
    setMigrationMessage("");
    setWorkspaceError("");

    const filePath = "supabase/migrations/generated_architecture.sql";
    const contents = `-- Generated migration
-- Architecture: ${JSON.stringify(architecture, null, 2)}
`;
    const existingFile = files.find((file) => file.path === filePath);

    try {
      if (existingFile) {
        await onSaveFile(existingFile.id, filePath, contents);
        setMigrationMessage("SQL migration updated.");
      } else {
        await onCreateFile(filePath, contents);
        setMigrationMessage("SQL migration exported.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export SQL migration.";

      setMigrationMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingMigration(false);
    }
  }

  const buildActions = (
    <>
      <span className={`premium-architecture-message ${migrationMessageType}`}>
        {migrationMessage || "SQL migration scaffold"}
      </span>

      <button
        suppressHydrationWarning
        type="button"
        className="premium-architecture-export-button"
        onClick={handleExportSqlMigration}
        disabled={isExportingMigration}
      >
        {isExportingMigration ? <Loader2 className="icon" /> : <Save className="icon" />}
        {isExportingMigration ? "Exporting" : "Export SQL"}
      </button>
    </>
  );

  return (
    <WorkspaceToolShell title="Build" actions={buildActions} onClose={onClose}>
      <div className="premium-architecture-workspace compact">
        <section className="premium-architecture-metrics" aria-label="Architecture metrics">
          <article>
            <span>Modules</span>
            <strong>{moduleCount}</strong>
          </article>

          <article>
            <span>Tables</span>
            <strong>{tableCount}</strong>
          </article>

          <article>
            <span>API routes</span>
            <strong>{endpointCount}</strong>
          </article>

          <article>
            <span>Security</span>
            <strong>{securityRuleCount}</strong>
          </article>
        </section>

        <div className="premium-architecture-grid">
          <div className="premium-architecture-main-column">
            <WorkspaceToolCard
              title={`${previewState.projectType} architecture plan`}
              description="Structured build plan generated from your prompt."
            >
              <p className="tool-shell-copy">
                {moduleCount} modules, {tableCount} tables, {endpointCount} API
                routes, and {securityRuleCount} security rules planned.
              </p>
            </WorkspaceToolCard>

            <ClassificationWorkspaceSummary
              classification={previewState.classification}
            />

            <ArchitectureSection
              title="Detected modules"
              items={previewState.modules.map((module) => ({
                id: module.id,
                title: module.label,
                body: module.description,
              }))}
            />

            <ArchitectureSection
              title="Database tables"
              items={architecture.tables.map((table) => ({
                id: table.id,
                title: table.name,
                body: `${table.purpose} Fields: ${table.fields.join(", ")}.`,
              }))}
            />

            <ArchitectureSection
              title="API routes"
              items={architecture.endpoints.map((endpoint) => ({
                id: endpoint.id,
                title: `${endpoint.method} ${endpoint.path}`,
                body: endpoint.purpose,
              }))}
            />

            <ArchitectureSection
              title="Security rules"
              items={architecture.securityRules.map((rule) => ({
                id: rule.id,
                title: rule.label,
                body: rule.description,
              }))}
            />
          </div>

          <aside className="premium-architecture-side-column">
            <RunMigrationInstructionsPanel tableCount={tableCount} />

            <section className="premium-architecture-safety-card">
              <div>
                <Shield className="icon" />
                <h3>Production reminder</h3>
              </div>

              <p>
                Review generated migrations, RLS policies, indexes, and exposed
                fields before running anything in Supabase.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </WorkspaceToolShell>
  );
}

function IntegrationsWorkspace({
  previewState,
  onClose,
}: {
  previewState: PreviewState;
  onClose?: () => void;
}) {
  const [activeCloudSection, setActiveCloudSection] = useState("overview");

  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredEnvironmentVariables = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const required = integrations.filter((integration) => integration.required);
  const optional = integrations.filter((integration) => !integration.required);
  const readyCount = integrations.filter(
    (integration) => integration.status === "ready"
  ).length;
  const needsSetupCount = integrations.filter(
    (integration) => integration.status === "needs-setup"
  ).length;

  const cloudNavItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="icon" />,
    },
    {
      id: "ai",
      label: "AI",
      icon: <Sparkles className="icon" />,
    },
    {
      id: "emails",
      label: "Emails",
      icon: <File className="icon" />,
      badge: <span className="workspace-tool-pill blue">Pro</span>,
    },
    {
      id: "database",
      label: "Database",
      icon: <Cloud className="icon" />,
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="icon" />,
    },
    {
      id: "secrets",
      label: "Secrets",
      icon: <Code2 className="icon" />,
    },
    {
      id: "logs",
      label: "Logs",
      icon: <History className="icon" />,
    },
    {
      id: "usage",
      label: "Usage",
      icon: <MoreHorizontal className="icon" />,
    },
  ];

  const cloudActions = (
    <>
      <button suppressHydrationWarning type="button" className="workspace-tool-action-button">
        <RefreshCcw className="icon" />
        Update scan
      </button>

      <button suppressHydrationWarning type="button" className="workspace-tool-action-button">
        Add context
      </button>
    </>
  );

  return (
    <WorkspaceToolShell
      title="Cloud"
      sidebar={
        <WorkspaceToolNav
          items={cloudNavItems}
          activeItemId={activeCloudSection}
          onSelectItem={setActiveCloudSection}
        />
      }
      actions={cloudActions}
      onClose={onClose}
    >
      {activeCloudSection === "overview" ? (
        <div className="cloud-tool-grid">
          {needsSetupCount > 0 ? (
            <div className="workspace-tool-alert danger">
              <span>
                Security issues detected. Fix critical setup items before publish.
              </span>
              <button suppressHydrationWarning type="button" className="workspace-tool-action-button">
                View issues
              </button>
            </div>
          ) : (
            <div className="workspace-tool-alert">
              <span>Cloud setup looks healthy. Continue reviewing before publish.</span>
              <button suppressHydrationWarning type="button" className="workspace-tool-action-button">
                Review
              </button>
            </div>
          )}

          <section className="cloud-tool-metrics">
            <article>
              <span>Required</span>
              <strong>{required.length}</strong>
            </article>

            <article>
              <span>Optional</span>
              <strong>{optional.length}</strong>
            </article>

            <article>
              <span>Ready</span>
              <strong>{readyCount}</strong>
            </article>

            <article>
              <span>Env vars</span>
              <strong>{requiredEnvironmentVariables.length}</strong>
            </article>
          </section>

          <WorkspaceToolCard
            title="AI"
            description="View AI usage, model readiness, and setup requirements."
            action={<span className="workspace-tool-pill blue">Connected</span>}
          >
            <div className="cloud-tool-card-row">
              <span>OpenAI setup</span>
              <strong>{requiredEnvironmentVariables.some((item) => item.key.includes("OPENAI")) ? "Required" : "Ready"}</strong>
            </div>
          </WorkspaceToolCard>

          <WorkspaceToolCard
            title="Emails"
            description="Send branded emails from your domain."
            action={<span className="workspace-tool-pill">Optional</span>}
          >
            <div className="cloud-tool-card-row">
              <span>Domain email</span>
              <strong>{optional.length > 0 ? "Available" : "Not detected"}</strong>
            </div>
          </WorkspaceToolCard>

          <WorkspaceToolCard
            title="Database"
            description="View planned tables and storage-backed data."
            action={<span className="workspace-tool-pill green">{previewState.architecture.tables.length} tables</span>}
          >
            <div className="cloud-tool-table-list">
              {previewState.architecture.tables.length > 0 ? (
                previewState.architecture.tables.slice(0, 5).map((table) => (
                  <div key={table.id} className="workspace-tool-list-row">
                    <span>{table.name}</span>
                    <span className="workspace-tool-pill">{table.fields.length} fields</span>
                  </div>
                ))
              ) : (
                <WorkspaceToolEmpty
                  icon={<Cloud className="icon-large" />}
                  title="No database tables"
                  body="Generate a build with database-backed features to populate this area."
                />
              )}
            </div>
          </WorkspaceToolCard>
        </div>
      ) : null}

      {activeCloudSection === "ai" ? (
        <WorkspaceToolCard
          title="AI setup"
          description="Review AI-related configuration for this project."
          action={<span className="workspace-tool-pill blue">AI</span>}
        >
          <div className="cloud-tool-list">
            {requiredEnvironmentVariables
              .filter((variable) => variable.key.toLowerCase().includes("openai"))
              .map((variable) => (
                <div key={variable.key} className="workspace-tool-list-row">
                  <span>{variable.key}</span>
                  <span className="workspace-tool-pill orange">{variable.scope}</span>
                </div>
              ))}

            {requiredEnvironmentVariables.filter((variable) =>
              variable.key.toLowerCase().includes("openai")
            ).length === 0 ? (
              <WorkspaceToolEmpty
                icon={<Sparkles className="icon-large" />}
                title="No AI secrets detected"
                body="This build does not currently require AI-specific environment variables."
              />
            ) : null}
          </div>
        </WorkspaceToolCard>
      ) : null}

      {activeCloudSection === "emails" ? (
        <WorkspaceToolCard
          title="Emails"
          description="Email providers, sender domains, and notification setup."
          action={<span className="workspace-tool-pill blue">Pro</span>}
        >
          <WorkspaceToolEmpty
            icon={<File className="icon-large" />}
            title="Email setup not connected"
            body="Add a mail provider such as Resend, Postmark, or SendGrid when transactional email is needed."
          />
        </WorkspaceToolCard>
      ) : null}

      {activeCloudSection === "database" ? (
        <WorkspaceToolCard
          title="Database"
          description="Tables detected from the generated architecture."
          action={<span className="workspace-tool-pill green">{previewState.architecture.tables.length} tables</span>}
        >
          <div className="cloud-tool-list">
            {previewState.architecture.tables.map((table) => (
              <div key={table.id} className="workspace-tool-list-row">
                <span>{table.name}</span>
                <span className="workspace-tool-pill">{table.fields.length} fields</span>
              </div>
            ))}

            {previewState.architecture.tables.length === 0 ? (
              <WorkspaceToolEmpty
                icon={<Cloud className="icon-large" />}
                title="No tables planned"
                body="Database tables will appear here when your build requires stored data."
              />
            ) : null}
          </div>
        </WorkspaceToolCard>
      ) : null}

      {activeCloudSection === "security" ? (
        <WorkspaceToolCard
          title="Security"
          description="Security rules detected for this build."
          action={<span className="workspace-tool-pill red">{previewState.architecture.securityRules.length} rules</span>}
        >
          <div className="cloud-tool-list">
            {previewState.architecture.securityRules.map((rule) => (
              <div key={rule.id} className="workspace-tool-list-row">
                <span>{rule.label}</span>
                <span className="workspace-tool-pill red">Review</span>
              </div>
            ))}

            {previewState.architecture.securityRules.length === 0 ? (
              <WorkspaceToolEmpty
                icon={<Shield className="icon-large" />}
                title="No security rules"
                body="Security rules will appear here when your architecture requires them."
              />
            ) : null}
          </div>
        </WorkspaceToolCard>
      ) : null}

      {activeCloudSection === "secrets" ? (
        <WorkspaceToolCard
          title="Secrets"
          description="Required environment variables for this project."
          action={<span className="workspace-tool-pill blue">{requiredEnvironmentVariables.length} required</span>}
        >
          <div className="cloud-tool-list">
            {requiredEnvironmentVariables.map((variable) => (
              <div key={variable.key} className="workspace-tool-list-row">
                <span>{variable.key}</span>
                <span className="workspace-tool-pill">{variable.scope}</span>
              </div>
            ))}

            {requiredEnvironmentVariables.length === 0 ? (
              <WorkspaceToolEmpty
                icon={<Code2 className="icon-large" />}
                title="No secrets required"
                body="This project does not currently require environment variables."
              />
            ) : null}
          </div>
        </WorkspaceToolCard>
      ) : null}

      {activeCloudSection === "logs" ? (
        <WorkspaceToolCard
          title="Logs"
          description="Deployment and runtime logs will appear here."
          action={<span className="workspace-tool-pill">Coming soon</span>}
        >
          <WorkspaceToolEmpty
            icon={<History className="icon-large" />}
            title="No logs yet"
            body="Logs will appear after deployments, background jobs, or runtime events are connected."
          />
        </WorkspaceToolCard>
      ) : null}

      {activeCloudSection === "usage" ? (
        <WorkspaceToolCard
          title="Usage"
          description="Resource usage, limits, and activity."
          action={<span className="workspace-tool-pill">Local</span>}
        >
          <section className="cloud-tool-metrics">
            <article>
              <span>Modules</span>
              <strong>{previewState.modules.length}</strong>
            </article>

            <article>
              <span>Routes</span>
              <strong>{previewState.architecture.endpoints.length}</strong>
            </article>

            <article>
              <span>Tables</span>
              <strong>{previewState.architecture.tables.length}</strong>
            </article>

            <article>
              <span>Rules</span>
              <strong>{previewState.architecture.securityRules.length}</strong>
            </article>
          </section>
        </WorkspaceToolCard>
      ) : null}
    </WorkspaceToolShell>
  );
}

function IntegrationGroup({
  title,
  integrations,
}: {
  title: string;
  integrations: IntegrationReadiness[];
}) {
  if (integrations.length === 0) {
    return null;
  }

  return (
    <section className="premium-integration-group">
      <div className="premium-integration-group-header">
        <h3>{title}</h3>
        <span>
          {integrations.length} integration{integrations.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="premium-integration-grid">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </section>
  );
}

function IntegrationCard({
  integration,
}: {
  integration: IntegrationReadiness;
}) {
  const statusLabel =
    integration.status === "ready"
      ? "Ready"
      : integration.status === "optional"
        ? "Optional"
        : "Needs setup";

  return (
    <article
      className={[
        "premium-integration-card",
        integration.status === "ready" ? "is-ready" : "",
        integration.status === "optional" ? "is-optional" : "",
        integration.status === "needs-setup" ? "is-needed" : "",
      ].join(" ")}
    >
      <div className="premium-integration-card-top">
        <span className="premium-integration-icon" aria-hidden="true">
          <Cloud className="icon" />
        </span>

        <span className="premium-integration-status">{statusLabel}</span>
      </div>

      <h4>{integration.label}</h4>
      <p>{integration.description ?? "Integration setup details and production readiness."}</p>

      <div className="premium-integration-footer">
        <span>{integration.required ? "Required" : "Optional"}</span>
        <span>{integration.status}</span>
      </div>
    </article>
  );
}

function ClassificationWorkspaceSummary({
  classification,
}: {
  classification?: BuildClassification;
}) {
  if (!classification) {
    return null;
  }

  const secondary =
    classification.secondaryCategories.length > 0
      ? classification.secondaryCategories.join(", ")
      : "None";

  const targets =
    classification.platformTargets.length > 0
      ? classification.platformTargets.join(", ")
      : "web";

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px",
          color: "#111827",
          fontSize: "16px",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        AI classification
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <ClassificationTile
          label="Primary category"
          value={classification.primaryCategory}
        />
        <ClassificationTile
          label="Industry"
          value={classification.industry ?? "General"}
        />
        <ClassificationTile
          label="Platform targets"
          value={targets}
        />
        <ClassificationTile
          label="Complexity"
          value={classification.complexity}
        />
      </div>

      <div
        style={{
          marginTop: "10px",
        }}
      >
        <ClassificationTile
          label="Secondary categories"
          value={secondary}
        />
      </div>
    </section>
  );
}

function ClassificationTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "11px",
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display: "block",
          color: "#111827",
          fontSize: "13px",
          lineHeight: 1.45,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ArchitectureSection({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    body: string;
  }>;
}) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px",
          color: "#111827",
          fontSize: "16px",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        {items.map((item) => (
          <article
            key={item.id}
            style={{
              border: "1px solid #eef0f3",
              borderRadius: "16px",
              background: "#f9fafb",
              padding: "14px",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "13px",
                marginBottom: "5px",
              }}
            >
              {item.title}
            </strong>

            <span
              style={{
                color: "#4b5563",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              {item.body}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function PreviewWebsite({ previewState }: { previewState: PreviewState }) {
  return (
    <div className="preview-site">
      <nav className="preview-site-nav">
        <div className="preview-site-brand">
          <div>DW</div>
          <strong>{previewState.title}</strong>
        </div>

        <div className="preview-site-links">
          <a href="#explore">Explore</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#build">Build</a>
        </div>

        <button suppressHydrationWarning type="button" aria-label="Open menu">
          <Menu className="icon-large" />
        </button>
      </nav>

      <div className="preview-site-main">
        <section className="hero-card">
          <div className="hero-kicker">{previewState.lastUpdatedLabel}</div>

          <h2>{previewState.title}</h2>

          <p>{previewState.subtitle}</p>

          <div
            style={{
              marginTop: "26px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {previewState.modules.map((module) => (
              <span
                key={module.id}
                title={module.description}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "30px",
                  padding: "0 12px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "rgba(255, 255, 255, 0.82)",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                {module.label}
              </span>
            ))}
          </div>

          <div className="hero-actions">
            <button suppressHydrationWarning type="button">Start workspace</button>
            <button suppressHydrationWarning type="button">View workflow</button>
          </div>
        </section>

        <section className="preview-stats">
          <PreviewStat label="Project type" value={previewState.projectType} />
          <PreviewStat label="Files" value={String(previewState.fileCount)} />
          <PreviewStat
            label="Tables"
            value={String(previewState.architecture.tables.length)}
          />
        </section>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="preview-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
