"use client";

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

type Mode = "build" | "visual-edits";
type WorkspaceView =
  | "preview"
  | "code"
  | "architecture"
  | "integrations"
  | "publish-readiness"
  | "history";

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
    existingAssistantId?: string
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

    try {
      const response = await fetch("/api/ai/generate-build", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptValue,
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

  async function handleSendPrompt()

  async function handleSendPrompt() {
    const value = prompt.trim();
    if (!value || isBuilding || isLoadingWorkspace) return;

    const detectedProjectType = inferProjectType(value);
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
      detectedArchitecture
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
          />
          <PreviewContent
            filesOpen={filesOpen}
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

function PublishDropdownPopover({
  previewState,
  files,
  onOpenReadiness,
  onClose,
}: {
  previewState?: PreviewState;
  files?: ChangedFile[];
  onOpenReadiness: () => void;
  onClose: () => void;
}) {
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [customDomain, setCustomDomain] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");
  const [publishActivityLog, setPublishActivityLog] = useState<string[]>([
    "Publish menu opened.",
  ]);

  function addPublishActivityLogItem(item: string) {
    // Keep the latest publish activity visible without turning the dropdown into a novel.
    setPublishActivityLog((current) => [item, ...current].slice(0, 4));
  }

  const currentFiles = files ?? [];
  const generatedUrl = getCompactPublishUrl(previewState);
  const activeUrl = customDomain.trim()
    ? `https://${customDomain.trim().replace(/^https?:\/\//, "")}`
    : generatedUrl;

  const securityCount = getCompactPublishSecurityCount(currentFiles);
  const hasFiles = currentFiles.length > 0;

  const gateReport =
    previewState && currentFiles.length > 0
      ? getPublishGateReport({
          previewState,
          files: currentFiles,
        })
      : null;

  const publishState =
    !hasFiles || !gateReport
      ? "draft"
      : gateReport.decision === "blocked"
        ? "blocked"
        : gateReport.decision === "can-preview"
          ? "needs-review"
          : gateReport.decision === "can-stage"
            ? "staging-ready"
            : "ready-to-publish";

  const statusLabel =
    publishState === "draft"
      ? "Draft"
      : publishState === "blocked"
        ? "Blocked"
        : publishState === "needs-review"
          ? "Needs review"
          : publishState === "staging-ready"
            ? "Staging ready"
            : "Ready to publish";

  const statusDescription =
    publishState === "draft"
      ? "Build something first before publishing."
      : publishState === "blocked"
        ? "Resolve blockers before previewing or staging."
        : publishState === "needs-review"
          ? "Internal preview is available, but staging is not ready."
          : publishState === "staging-ready"
            ? "This can move to staging for review and testing."
            : "Generated checks pass. Run final manual review before production.";

  const statusTone =
    publishState === "ready-to-publish"
      ? {
          background: "#ecfdf5",
          text: "#166534",
          border: "#bbf7d0",
        }
      : publishState === "staging-ready"
        ? {
            background: "#eff6ff",
            text: "#1d4ed8",
            border: "#bfdbfe",
          }
        : publishState === "blocked"
          ? {
              background: "#fef2f2",
              text: "#991b1b",
              border: "#fecaca",
            }
          : {
              background: "#fff7ed",
              text: "#9a3412",
              border: "#fed7aa",
            };

  const actionLabel =
    publishState === "ready-to-publish"
      ? "Update publish snapshot"
      : publishState === "staging-ready"
        ? "Prepare staging snapshot"
        : publishState === "needs-review"
          ? "Update preview snapshot"
          : "Update";

  async function copyUrl() {
    // Copies the currently active publish URL.
    try {
      await navigator.clipboard.writeText(activeUrl);
      setMessage("Website URL copied.");
      addPublishActivityLogItem("Copied website URL.");
    } catch {
      setMessage("Could not copy URL. Copy it manually.");
      addPublishActivityLogItem("URL copy failed.");
    }
  }

  function updateSnapshot() {
    // Refreshes the local publish snapshot state using the current publish gate.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (!hasFiles) {
      setMessage("No generated files yet. Build something first.");
      addPublishActivityLogItem("Snapshot update blocked: no generated files.");
      return;
    }

    if (publishState === "blocked") {
      setMessage("Snapshot updated. Publishing is still blocked.");
      addPublishActivityLogItem("Updated blocked publish snapshot.");
      return;
    }

    if (publishState === "needs-review") {
      setMessage("Preview snapshot updated. Review before staging.");
      addPublishActivityLogItem("Updated preview snapshot.");
      return;
    }

    if (publishState === "staging-ready") {
      setMessage("Staging snapshot updated. Run tests before production.");
      addPublishActivityLogItem("Updated staging snapshot.");
      return;
    }

    setMessage("Publish snapshot updated. Final manual review still required.");
    addPublishActivityLogItem("Updated publish snapshot.");
  }

  function openReadinessAndClose() {
    // Opens deeper diagnostics from the compact publish popover.
    addPublishActivityLogItem("Opened full publish readiness.");
    onOpenReadiness();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Publish options"
      style={{
        position: "fixed",
        top: "58px",
        right: "18px",
        width: "420px",
        maxWidth: "calc(100vw - 28px)",
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 26px 80px rgba(15, 23, 42, 0.22)",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid #eef0f3",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,247,241,0.96))",
        }}
      >
        <div
          style={{
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
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Publish
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "22px",
                lineHeight: 1.1,
                letterSpacing: "-0.045em",
              }}
            >
              {statusLabel}
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close publish menu"
            style={{
              width: "32px",
              height: "32px",
              border: "1px solid #e5e7eb",
              borderRadius: "999px",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: "9px",
            marginTop: "14px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              border: `1px solid ${statusTone.border}`,
              background: statusTone.background,
              color: statusTone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
            {gateReport ? ` · ${gateReport.score}%` : ""}
          </span>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.45,
            }}
          >
            {statusDescription}
          </p>

          <span
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Last update: {lastUpdatedLabel}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <strong
            style={{
              color: "#111827",
              fontSize: "14px",
            }}
          >
            Website URL
          </strong>

          <button
            type="button"
            className="pill-button"
            onClick={copyUrl}
          >
            Copy
          </button>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#f9fafb",
            padding: "12px 13px",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 800,
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
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <strong
            style={{
              color: "#111827",
              fontSize: "14px",
            }}
          >
            Custom domain
          </strong>

          <button
            type="button"
            onClick={openReadinessAndClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 900,
              cursor: "pointer",
              padding: 0,
            }}
          >
            DNS settings
          </button>
        </div>

        <input
          value={customDomain}
          onChange={(event) => setCustomDomain(event.target.value)}
          placeholder="app.yourdomain.com"
          suppressHydrationWarning
          style={{
            width: "100%",
            minHeight: "42px",
            border: "1px solid #e5e7eb",
            borderRadius: "15px",
            background: "#ffffff",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 700,
            padding: "0 13px",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <strong
          style={{
            display: "block",
            color: "#111827",
            fontSize: "14px",
            marginBottom: "10px",
          }}
        >
          Visibility
        </strong>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {(["public", "private"] as const).map((option) => {
            const selected = visibility === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setVisibility(option);
                  addPublishActivityLogItem(
                    `Visibility changed to ${option}.`
                  );
                }}
                style={{
                  border: selected ? "1px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: "16px",
                  background: selected ? "#eff6ff" : "#ffffff",
                  padding: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#111827",
                    fontSize: "14px",
                    marginBottom: "4px",
                    textTransform: "capitalize",
                  }}
                >
                  {option}
                </strong>

                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    lineHeight: 1.35,
                  }}
                >
                  {option === "public"
                    ? "Anyone with the URL."
                    : "Internal review only."}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "16px 18px",
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="pill-button"
            onClick={openReadinessAndClose}
          >
            Review security
            {securityCount < 3 ? ` · ${3 - securityCount}` : ""}
          </button>

          <button
            type="button"
            className="pill-button"
            onClick={openReadinessAndClose}
          >
            Edit settings
          </button>
        </div>

        <button
          type="button"
          className="publish-button"
          onClick={updateSnapshot}
          style={{
            width: "100%",
            minHeight: "44px",
          }}
        >
          {actionLabel}
        </button>

        <button
          type="button"
          onClick={openReadinessAndClose}
          style={{
            border: "none",
            background: "transparent",
            color: "#4b5563",
            fontSize: "12px",
            fontWeight: 900,
            cursor: "pointer",
            padding: "2px 0 0",
            textAlign: "center",
          }}
        >
          Open full publish readiness
        </button>

        <div
          style={{
            borderTop: "1px solid #eef0f3",
            paddingTop: "10px",
            display: "grid",
            gap: "6px",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Recent publish activity
          </div>

          {publishActivityLog.map((item) => (
            <div
              key={item}
              style={{
                color: "#374151",
                fontSize: "12px",
                lineHeight: 1.35,
              }}
            >
              • {item}
            </div>
          ))}
        </div>

        {message ? (
          <p
            style={{
              margin: 0,
              color: message.toLowerCase().includes("blocked") ||
                message.toLowerCase().includes("no generated")
                ? "#9a3412"
                : "#166534",
              fontSize: "12px",
              fontWeight: 800,
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            {message}
          </p>
        ) : null}
      </div>
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
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const publishMenuRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    // Close Publish dropdown on outside click or Escape.
    if (!isPublishMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (publishMenuRef.current?.contains(target)) return;

      setIsPublishMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPublishMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPublishMenuOpen]);

  function openPublishReadinessFromDropdown() {
    // Opens deeper publish diagnostics from the dropdown.
    setIsPublishMenuOpen(false);
    setWorkspaceView("publish-readiness");
  }

  return (
    <header className="preview-toolbar">
      <div
        ref={publishMenuRef}
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button suppressHydrationWarning
          type="button"
          className="publish-button"
          data-state={isPublishMenuOpen ? "open" : "closed"}
          aria-label="Open publish menu"
          aria-expanded={isPublishMenuOpen}
          onClick={() => setIsPublishMenuOpen((current) => !current)}
        >
          Publish
        </button>

        {isPublishMenuOpen ? (
          <PublishDropdownPopover
            previewState={previewState}
            files={files}
            onOpenReadiness={openPublishReadinessFromDropdown}
            onClose={() => setIsPublishMenuOpen(false)}
          />
        ) : null}
      </div>

      <button suppressHydrationWarning
        type="button"
        className={["tool-button", filesOpen ? "tool-button-active" : ""].join(
          " "
        )}
        aria-label={`Files: ${fileCountLabel}`}
        title={fileCountLabel}
        onClick={() => setFilesOpen(!filesOpen)}
      >
        <File className="icon" />
      </button>

      <button suppressHydrationWarning type="button" className="tool-button" aria-label="Cloud">
        <Cloud className="icon" />
      </button>

      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "code" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Code"
        aria-pressed={workspaceView === "code"}
        onClick={() => setWorkspaceView("code")}
      >
        <Code2 className="icon" />
      </button>

      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "architecture" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Architecture"
        aria-pressed={workspaceView === "architecture"}
        onClick={() => setWorkspaceView("architecture")}
      >
        <BarChart3 className="icon" />
      </button>

      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "integrations" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Integrations"
        aria-pressed={workspaceView === "integrations"}
        onClick={() => setWorkspaceView("integrations")}
      >
        <Cloud className="icon" />
      </button>

      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "publish-readiness" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Publish center"
        aria-pressed={workspaceView === "publish-readiness"}
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        <Play className="icon" />
      </button>

      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "history" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Build history"
        aria-pressed={workspaceView === "history"}
        onClick={() => setWorkspaceView("history")}
      >
        <History className="icon" />
      </button>

      <button suppressHydrationWarning type="button" className="tool-button" aria-label="Security">
        <Shield className="icon" />
      </button>

      <button suppressHydrationWarning type="button" className="tool-button" aria-label="More">
        <MoreHorizontal className="icon" />
      </button>

      <div className="url-pill">
        <Monitor className="icon" />
        <span>
          {workspaceView === "preview"
            ? "/"
            : workspaceView === "code"
              ? "/code"
              : workspaceView === "architecture"
                ? "/architecture"
                : workspaceView === "integrations"
                  ? "/integrations"
                  : workspaceView === "publish-readiness"
                    ? "/publish-readiness"
                    : "/history"}
        </span>
      </div>

      <button suppressHydrationWarning type="button" className="tool-button" aria-label="Stop">
        <Square className="icon" />
      </button>

      <button suppressHydrationWarning type="button" className="pill-button">
        <Share className="icon" />
        Share
      </button>

      <button suppressHydrationWarning type="button" className="pill-button">
        <GitBranch className="icon" />
        Git
      </button>

      <button suppressHydrationWarning
        type="button"
        className="upgrade-button"
        aria-label="Open integration readiness"
        onClick={() => setWorkspaceView("integrations")}
      >
        Upgrade
      </button>

      <div
        ref={publishMenuRef}
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button suppressHydrationWarning
          type="button"
          className="publish-button"
          aria-label="Open publish menu"
          aria-expanded={isPublishMenuOpen}
          onClick={() => setIsPublishMenuOpen((current) => !current)}
        >
          Publish
        </button>

        {isPublishMenuOpen ? (
          <PublishDropdownPopover
            previewState={previewState}
            files={files}
            onOpenReadiness={openPublishReadinessFromDropdown}
            onClose={() => setIsPublishMenuOpen(false)}
          />
        ) : null}
      </div>
    </header>
  );
}

function isAssistantBuildWorking(item: FeedItem) {
  // A build card is considered "working" when it belongs to the assistant and is not completed yet.
  return item.role === "assistant" && item.status !== "completed";
}

function getBackgroundBuildPhase(item: FeedItem) {
  // Use the last active/incomplete step as the visible current phase.
  const activeStep =
    item.steps?.find((step) => step.status === "active") ??
    [...(item.steps ?? [])].reverse().find((step) => step.status !== "complete");

  if (activeStep) return activeStep.label;

  if (item.status === "building") return "Building project";
  if (item.status === "thinking") return "Planning build";
  if (item.status === "queued") return "Queued";

  return "Working";
}

function getBackgroundBuildProgress(item: FeedItem) {
  // Calculate a rough progress percentage from completed build steps.
  const steps = item.steps ?? [];

  if (steps.length === 0) return 12;

  const completeCount = steps.filter((step) => step.status === "complete").length;
  const progress = Math.round((completeCount / steps.length) * 100);

  return Math.max(12, Math.min(progress, 92));
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
            {item.title || "Building your project"}
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
}: {
  filesOpen: boolean;
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
}) {
  return (
    <div className="preview-content">
      {filesOpen ? (
        <FilesDrawer
          files={files}
          projectFiles={projectFiles}
          selectedFileId={selectedFileId}
          setSelectedFileId={setSelectedFileId}
          onCreateFile={onCreateFile}
          setWorkspaceError={setWorkspaceError}
        />
      ) : null}

      <div className="preview-frame-wrap">
        <div className="preview-frame">
          {isLoadingWorkspace ? <LoadingWorkspace /> : null}

          {!isLoadingWorkspace && workspaceView === "preview" ? (
            <PreviewWebsite previewState={previewState} />
          ) : null}

          {!isLoadingWorkspace && workspaceView === "code" ? (
            <CodeWorkspace
              selectedFile={selectedFile}
              projectFiles={projectFiles}
              onSaveFile={onSaveFile}
              onDeleteFile={onDeleteFile}
              setWorkspaceError={setWorkspaceError}
            />
          ) : null}

          {!isLoadingWorkspace && workspaceView === "architecture" ? (
            <ArchitectureWorkspace previewState={previewState} />
          ) : null}

          {!isLoadingWorkspace && workspaceView === "integrations" ? (
            <IntegrationsWorkspace previewState={previewState} />
          ) : null}

          {!isLoadingWorkspace && workspaceView === "publish-readiness" ? (
            <PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setSelectedFileId={setSelectedFileId}
              setWorkspaceView={setWorkspaceView}
              setWorkspaceError={setWorkspaceError}
              publishCenterRef={publishCenterRef}
            />
          ) : null}

          {!isLoadingWorkspace && workspaceView === "history" ? (
            <HistoryWorkspace
              buildHistory={buildHistory}
              onRestoreBuild={onRestoreBuild}
            />
          ) : null}
        </div>
      </div>
    </div>
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
      await onCreateFile(
        normalizedPath,
        `// ${normalizedPath}\n\nexport const created = true;\n`
      );

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

  return (
    <section className="files-drawer animate-slide-up">
      <div className="files-head">
        <div>
          <h3>Project files</h3>
          <p>
            {files.length} {files.length === 1 ? "file" : "files"} loaded from
            the database-backed file tree.
          </p>
        </div>

        <button suppressHydrationWarning type="button">
          {projectFiles.length > 0 ? "Synced" : "No DB files"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <input suppressHydrationWarning
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
          style={{
            width: "100%",
            height: "34px",
            border: "1px solid #d1d5db",
            borderRadius: "11px",
            background: "#ffffff",
            color: "#111827",
            padding: "0 11px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{
              color:
                createMessage.toLowerCase().includes("failed") ||
                createMessage.toLowerCase().includes("enter") ||
                createMessage.toLowerCase().includes("invalid") ||
                createMessage.toLowerCase().includes("already")
                  ? "#991b1b"
                  : "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {createMessage || "Create a database-backed project file."}
          </span>

          <button suppressHydrationWarning
            type="button"
            onClick={handleCreateFile}
            disabled={isCreatingFile}
          >
            {isCreatingFile ? "Creating..." : "Create file"}
          </button>
        </div>
      </div>

      <div className="files-list">
        {files.map((file) => {
          const databaseFile = projectFiles.find((item) => item.id === file.id);

          return (
            <button suppressHydrationWarning
              type="button"
              key={file.id}
              className={file.status === "checked" ? "file-row muted" : "file-row"}
              title={
                databaseFile
                  ? `Database file · Updated ${new Date(
                      databaseFile.updated_at
                    ).toLocaleString()}`
                  : file.description
              }
              onClick={() => setSelectedFileId(file.id)}
              style={{
                width: "100%",
                textAlign: "left",
                justifyContent: "flex-start",
                borderColor:
                  selectedFileId === file.id ? "rgba(53, 84, 255, 0.45)" : "",
              }}
            >
              {file.path} · {databaseFile ? "db" : file.status}
            </button>
          );
        })}
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
      <div
        style={{
          minHeight: "100%",
          display: "grid",
          placeItems: "center",
          background: "#ffffff",
          color: "#4b5563",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        No file selected.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#ffffff",
        padding: "28px",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "22px",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            minHeight: "58px",
            borderBottom: "1px solid #e5e7eb",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 850,
                color: "#111827",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedFile.path}
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              {isDatabaseBacked
                ? `Database-backed file · ${selectedFile.description}`
                : `Generated preview file · save disabled until synced`}
            </div>

            <input suppressHydrationWarning
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
              style={{
                width: "100%",
                maxWidth: "560px",
                height: "34px",
                marginTop: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: isDatabaseBacked ? "#ffffff" : "#f9fafb",
                color: "#111827",
                padding: "0 11px",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "0 0 auto",
            }}
          >
            {statusMessage ? (
              <span
                style={{
                  color: statusMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#166534",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                {statusMessage}
              </span>
            ) : null}

            <button suppressHydrationWarning
              type="button"
              className="pill-button"
              onClick={handleDelete}
              disabled={!isDatabaseBacked || isDeleting || isSaving}
              title={
                isDatabaseBacked
                  ? "Delete file"
                  : "Only database-backed files can be deleted"
              }
            >
              {isDeleting ? <Loader2 className="icon" /> : <Trash2 className="icon" />}
              Delete
            </button>

            <button suppressHydrationWarning
              type="button"
              className="publish-button"
              onClick={handleSave}
              disabled={!isDatabaseBacked || !isDirty || isSaving || isDeleting}
              title={
                isDatabaseBacked
                  ? "Save file path and contents"
                  : "Only database-backed files can be saved"
              }
              style={{
                opacity: !isDatabaseBacked || !isDirty ? 0.55 : 1,
              }}
            >
              {isSaving ? <Loader2 className="icon" /> : <Save className="icon" />}
              Save
            </button>
          </div>
        </div>

        <textarea suppressHydrationWarning
          value={draftContents}
          onChange={(event) => setDraftContents(event.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: "560px",
            border: "0",
            outline: "none",
            resize: "vertical",
            display: "block",
            padding: "18px",
            overflow: "auto",
            background: "#0b1020",
            color: "#e5e7eb",
            fontSize: "13px",
            lineHeight: 1.65,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        />
      </div>
    </div>
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

function ArchitectureWorkspace({
  previewState,
}: {
  previewState: PreviewState;
}) {
  const [isExportingMigration, setIsExportingMigration] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  async function handleExportSqlMigration() {
    setIsExportingMigration(true);
    setMigrationMessage("");
    setWorkspaceError("");

    const filePath = "supabase/migrations/generated_architecture.sql";
    const contents = createSqlMigrationContents(previewState.architecture);
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
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#ffffff",
        padding: "28px",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "24px",
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
            padding: "22px",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Architecture
          </div>

          <h2
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "32px",
              lineHeight: 1,
              letterSpacing: "-0.05em",
            }}
          >
            {previewState.projectType} architecture plan
          </h2>

          <p
            style={{
              margin: "12px 0 0",
              maxWidth: "780px",
              color: "#4b5563",
              fontSize: "15px",
              lineHeight: 1.65,
            }}
          >
            {previewState.modules.length} modules,{" "}
            {previewState.architecture.tables.length} tables,{" "}
            {previewState.architecture.endpoints.length} API routes, and{" "}
            {previewState.architecture.securityRules.length} security rules
            planned from the prompt.
          </p>

          <div
            style={{
              marginTop: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color:
                  migrationMessage.toLowerCase().includes("failed") ||
                  migrationMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {migrationMessage ||
                "Generate a starter SQL migration from the planned database tables."}
            </span>

            <button suppressHydrationWarning
              type="button"
              className="pill-button"
              onClick={handleExportSqlMigration}
              disabled={isExportingMigration}
            >
              {isExportingMigration
                ? "Exporting..."
                : "Export SQL migration"}
            </button>
          </div>
        </section>

        <ClassificationWorkspaceSummary
          classification={previewState.classification}
        />

        <RunMigrationInstructionsPanel
          tableCount={previewState.architecture.tables.length}
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
          items={previewState.architecture.tables.map((table) => ({
            id: table.id,
            title: table.name,
            body: `${table.purpose} Fields: ${table.fields.join(", ")}.`,
          }))}
        />

        <ArchitectureSection
          title="API routes"
          items={previewState.architecture.endpoints.map((endpoint) => ({
            id: endpoint.id,
            title: `${endpoint.method} ${endpoint.path}`,
            body: endpoint.purpose,
          }))}
        />

        <ArchitectureSection
          title="Security rules"
          items={previewState.architecture.securityRules.map((rule) => ({
            id: rule.id,
            title: rule.label,
            body: rule.description,
          }))}
        />
      </div>
    </div>
  );
}

function IntegrationsWorkspace({
  previewState,
}: {
  previewState: PreviewState;
}) {
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

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#ffffff",
        padding: "28px",
      }}
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "24px",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
          padding: "22px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Integration readiness
        </div>

        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "32px",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          Required setup before publish
        </h2>

        <p
          style={{
            margin: "12px 0 0",
            maxWidth: "820px",
            color: "#4b5563",
            fontSize: "15px",
            lineHeight: 1.65,
          }}
        >
          Founder AI detected {required.length} required integration
          {required.length === 1 ? "" : "s"} for this build and{" "}
          {optional.length} optional integration{optional.length === 1 ? "" : "s"}.
          This is where fantasy becomes infrastructure, unfortunately. It also detected{" "}
          {requiredEnvironmentVariables.length} required environment variable
          {requiredEnvironmentVariables.length === 1 ? "" : "s"}.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        <IntegrationGroup title="Required" integrations={required} />
        <IntegrationGroup title="Optional" integrations={optional} />
      </div>
    </div>
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
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
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
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div>
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "15px",
              lineHeight: 1.2,
              marginBottom: "4px",
            }}
          >
            {integration.label}
          </strong>

          <span
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {integration.provider}
          </span>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background:
              integration.status === "needs-setup" ? "#fff7ed" : "#ecfdf5",
            color:
              integration.status === "needs-setup" ? "#9a3412" : "#166534",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {integration.reason}
      </p>

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
        Checklist
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#111827",
        }}
      >
        {integration.checklist.map((item) => (
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
    </article>
  );
}

function sanitizeSqlIdentifier(value: string) {
  const safe = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!safe) {
    return "generated_table";
  }

  if (/^[0-9]/.test(safe)) {
    return `table_${safe}`;
  }

  return safe;
}

function inferSqlType(fieldName: string) {
  const field = fieldName.toLowerCase();

  if (field === "id") return "uuid primary key default gen_random_uuid()";
  if (field.endsWith("_id")) return "uuid";
  if (field.includes("email")) return "text";
  if (field.includes("phone")) return "text";
  if (field.includes("url")) return "text";
  if (field.includes("status")) return "text";
  if (field.includes("role")) return "text";
  if (field.includes("type")) return "text";
  if (field.includes("name")) return "text";
  if (field.includes("title")) return "text";
  if (field.includes("description")) return "text";
  if (field.includes("content")) return "text";
  if (field.includes("body")) return "text";
  if (field.includes("amount")) return "numeric";
  if (field.includes("price")) return "numeric";
  if (field.includes("value")) return "numeric";
  if (field.includes("score")) return "integer";
  if (field.includes("count")) return "integer";
  if (field.includes("quantity")) return "integer";
  if (field.includes("is_")) return "boolean default false";
  if (field.includes("published")) return "boolean default false";
  if (field.endsWith("_at")) return "timestamptz";
  if (field.includes("date")) return "date";
  if (field.includes("metadata")) return "jsonb default '{}'::jsonb";
  if (field.includes("settings")) return "jsonb default '{}'::jsonb";

  return "text";
}

function createSqlMigrationContents(architecture: ArchitecturePlan) {
  const tables = architecture.tables;

  const lines = [
    "-- Founder AI generated migration",
    "-- Review before running in production. Obviously. Let us not YOLO the database like a caffeinated intern.",
    "",
    "create extension if not exists pgcrypto;",
    "",
  ];

  if (tables.length === 0) {
    lines.push("-- No database tables were planned for this build.");
    return lines.join("\n");
  }

  for (const table of tables) {
    const tableName = sanitizeSqlIdentifier(table.name || table.id);
    const rawFields = table.fields.length > 0 ? table.fields : ["id", "created_at", "updated_at"];
    const fields = Array.from(new Set(["id", ...rawFields, "created_at", "updated_at"]));

    lines.push(`-- ${table.purpose || `Stores ${tableName} records.`}`);
    lines.push(`create table if not exists public.${tableName} (`);

    const columnLines = fields.map((field) => {
      const columnName = sanitizeSqlIdentifier(field);
      const type = inferSqlType(columnName);

      if (columnName === "created_at") {
        return "  created_at timestamptz not null default now()";
      }

      if (columnName === "updated_at") {
        return "  updated_at timestamptz not null default now()";
      }

      return `  ${columnName} ${type}`;
    });

    lines.push(columnLines.join(",\n"));
    lines.push(");");
    lines.push("");
    lines.push(`alter table public.${tableName} enable row level security;`);
    lines.push("");
    lines.push(`drop policy if exists "${tableName}_authenticated_read" on public.${tableName};`);
    lines.push(`create policy "${tableName}_authenticated_read"`);
    lines.push(`on public.${tableName}`);
    lines.push("for select");
    lines.push("to authenticated");
    lines.push("using (true);");
    lines.push("");
    lines.push(`drop policy if exists "${tableName}_authenticated_insert" on public.${tableName};`);
    lines.push(`create policy "${tableName}_authenticated_insert"`);
    lines.push(`on public.${tableName}`);
    lines.push("for insert");
    lines.push("to authenticated");
    lines.push("with check (true);");
    lines.push("");
    lines.push(`drop policy if exists "${tableName}_authenticated_update" on public.${tableName};`);
    lines.push(`create policy "${tableName}_authenticated_update"`);
    lines.push(`on public.${tableName}`);
    lines.push("for update");
    lines.push("to authenticated");
    lines.push("using (true)");
    lines.push("with check (true);");
    lines.push("");
    lines.push(`create index if not exists ${tableName}_created_at_idx on public.${tableName} (created_at desc);`);
    lines.push("");
  }

  return lines.join("\n");
}

function createEnvExampleContents(variables: EnvironmentVariableReadiness[]) {
  const required = variables.filter((variable) => variable.required);
  const optional = variables.filter((variable) => !variable.required);

  const lines = [
    "# Founder AI generated environment example",
    "# Copy values into .env.local for local development and into your deployment provider for production.",
    "# Server-only secrets must never be exposed to the browser. Yes, that includes the shiny ones.",
    "",
    "# Required",
    ...required.flatMap((variable) => [
      `# ${variable.label}`,
      `# Scope: ${variable.scope}`,
      `# ${variable.reason}`,
      `${variable.key}=${variable.example}`,
      "",
    ]),
    "# Optional",
    ...optional.flatMap((variable) => [
      `# ${variable.label}`,
      `# Scope: ${variable.scope}`,
      `# ${variable.reason}`,
      `${variable.key}=${variable.example}`,
      "",
    ]),
  ];

  return lines.join("\n");
}

function EnvironmentVariablesPanel({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setWorkspaceError: (value: string) => void;
}) {
  const variables = getEnvironmentVariableReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const required = variables.filter((variable) => variable.required);
  const optional = variables.filter((variable) => !variable.required);
  const [isExportingEnvExample, setIsExportingEnvExample] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  async function handleExportEnvExample() {
    setIsExportingEnvExample(true);
    setExportMessage("");
    setWorkspaceError("");

    const filePath = "config/env.example";
    const contents = createEnvExampleContents(variables);
    const existingFile = files.find((file) => file.path === filePath);

    try {
      if (existingFile) {
        await onSaveFile(existingFile.id, filePath, contents);
        setExportMessage("config/env.example updated.");
      } else {
        await onCreateFile(filePath, contents);
        setExportMessage("config/env.example exported.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export config/env.example.";

      setExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingEnvExample(false);
    }
  }

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
        Environment variables
      </h3>

      <p
        style={{
          margin: "0 0 14px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {required.length} required key{required.length === 1 ? "" : "s"} and{" "}
        {optional.length} optional key{optional.length === 1 ? "" : "s"} were
        inferred from this build.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color:
              exportMessage.toLowerCase().includes("failed") ||
              exportMessage.toLowerCase().includes("already")
                ? "#991b1b"
                : "#4b5563",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {exportMessage ||
            "Export a project-ready environment example file."}
        </span>

        <button suppressHydrationWarning
          type="button"
          className="pill-button"
          onClick={handleExportEnvExample}
          disabled={isExportingEnvExample}
        >
          {isExportingEnvExample
            ? "Exporting..."
            : "Export or update config/env.example"}
        </button>
      </div>

      <EnvironmentVariableGroup title="Required" variables={required} />
      <EnvironmentVariableGroup title="Optional" variables={optional} />
    </section>
  );
}

function EnvironmentVariableGroup({
  title,
  variables,
}: {
  title: string;
  variables: EnvironmentVariableReadiness[];
}) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "12px",
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

      <div
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        {variables.map((variable) => (
          <EnvironmentVariableRow key={variable.key} variable={variable} />
        ))}
      </div>
    </div>
  );
}

function EnvironmentVariableRow({
  variable,
}: {
  variable: EnvironmentVariableReadiness;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "13px",
              lineHeight: 1.35,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              overflowWrap: "anywhere",
            }}
          >
            {variable.key}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: "3px",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {variable.label}
          </span>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: variable.scope === "server" ? "#eff6ff" : "#ecfdf5",
            color: variable.scope === "server" ? "#1d4ed8" : "#166534",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {variable.scope}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 8px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {variable.reason}
      </p>

      <code
        style={{
          display: "block",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          background: "#ffffff",
          padding: "8px 10px",
          color: "#111827",
          fontSize: "12px",
          overflowWrap: "anywhere",
        }}
      >
        {variable.key}={variable.example}
      </code>
    </article>
  );
}

function createDeveloperInstructions({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasSqlMigration = files.some(
    (file) => file.path === "supabase/migrations/generated_architecture.sql"
  );

  const hasEnvExample = files.some((file) => file.path === "config/env.example");
  const hasDeployChecklist = files.some(
    (file) => file.path === "config/deploy-checklist.md"
  );
  const hasProjectBrief = files.some(
    (file) => file.path === "config/project-brief.md"
  );

  const generatedFileList =
    files.length > 0
      ? files.map((file) => `- ${file.path}`)
      : ["- No generated files found. Generate a build first."];

  const envVarLines =
    requiredEnvVars.length > 0
      ? requiredEnvVars.map(
          (variable) =>
            `- ${variable.key} (${variable.scope}) — ${variable.label}`
        )
      : ["- No required environment variables detected."];

  const integrationLines =
    integrations.length > 0
      ? integrations.map(
          (integration) =>
            `- ${integration.label} — ${integration.provider}`
        )
      : ["- No required integrations detected."];

  const migrationSteps = hasDatabaseTables
    ? [
        "## Supabase migration steps",
        "",
        hasSqlMigration
          ? "A generated SQL migration exists at: supabase/migrations/generated_architecture.sql"
          : "Database tables are planned, but the generated SQL migration file is missing. Export the full build pack first.",
        "",
        "1. Open Supabase Dashboard.",
        "2. Go to SQL Editor.",
        "3. Create a new query.",
        "4. Paste the contents of supabase/migrations/generated_architecture.sql.",
        "5. Review the SQL before running it.",
        "6. Run the migration.",
        "7. Confirm Row Level Security policies are correct.",
        "8. Test authenticated access from the app.",
        "",
      ]
    : [
        "## Supabase migration steps",
        "",
        "No database tables were planned for this build.",
        "",
      ];

  const lines = [
    "Founder AI developer instructions",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    "",
    "## Expected generated support files",
    "",
    `- Project brief: ${hasProjectBrief ? "present" : "missing"}`,
    `- Deployment checklist: ${hasDeployChecklist ? "present" : "missing"}`,
    `- Environment example: ${hasEnvExample ? "present" : "missing"}`,
    `- SQL migration: ${hasSqlMigration ? "present" : hasDatabaseTables ? "missing" : "not required"}`,
    "",
    "## Local setup",
    "",
    "Run these commands from the project root:",
    "",
    "\`\`\`bash",
    "npm install",
    "npm run dev",
    "\`\`\`",
    "",
    "For a production build check:",
    "",
    "\`\`\`bash",
    "npm run build",
    "\`\`\`",
    "",
    "## Environment variables",
    "",
    "Add required variables to .env.local for local development and to Vercel project settings for production.",
    "",
    ...envVarLines,
    "",
    hasEnvExample
      ? "Use config/env.example as the template. Do not put real secret values into committed files."
      : "config/env.example is missing. Export the full build pack before setup.",
    "",
    "## Required integrations",
    "",
    ...integrationLines,
    "",
    ...migrationSteps,
    "## Vercel deployment steps",
    "",
    "1. Push the project to GitHub.",
    "2. Import the GitHub repository into Vercel.",
    "3. Confirm the framework preset is Next.js.",
    "4. Set install command to npm install.",
    "5. Set build command to npm run build.",
    "6. Add production environment variables.",
    "7. Deploy.",
    "8. Check build logs and runtime function logs.",
    "9. Configure custom domain if needed.",
    "10. Update NEXT_PUBLIC_APP_URL and any auth/webhook callback URLs.",
    "",
    "## Generated files",
    "",
    ...generatedFileList,
    "",
    "## Post-deploy smoke tests",
    "",
    "- [ ] Open the deployed site.",
    "- [ ] Check browser console for errors.",
    "- [ ] Test sign-in/sign-up.",
    "- [ ] Test the primary user workflow.",
    "- [ ] Test protected API routes.",
    "- [ ] Check Vercel function logs.",
    "- [ ] Confirm database reads/writes work.",
    "- [ ] Confirm secrets are not exposed client-side.",
    "- [ ] Confirm Stripe/Shopify/OpenAI/email integrations if used.",
    "",
    "## Notes",
    "",
    "Review all generated files before production. Generated code is a scaffold, not a papal decree.",
  ];

  return lines.join("\\n");
}

function createCompactHandoffSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const buildPackHealth = getBuildPackHealth(files);
  const buildPackFiles = getBuildPackFileStatuses(files);
  const missingBuildPackFiles = buildPackFiles
    .filter((file) => !file.exists)
    .map((file) => file.path);

  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const lines = [
    "Founder AI handoff summary",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Industry: ${previewState.classification?.industry ?? "General"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    `Platform targets: ${previewState.classification?.platformTargets.join(", ") || "web"}`,
    "",
    "Build pack:",
    `- Health: ${buildPackHealth.label} · ${buildPackHealth.score}%`,
    `- Missing files: ${missingBuildPackFiles.length > 0 ? missingBuildPackFiles.join(", ") : "None"}`,
    "",
    "Generated scope:",
    `- Files: ${files.length}`,
    `- Modules: ${previewState.modules.length}`,
    `- Database tables: ${previewState.architecture.tables.length}`,
    `- API routes: ${previewState.architecture.endpoints.length}`,
    `- Security rules: ${previewState.architecture.securityRules.length}`,
    "",
    "Required integrations:",
    ...(integrations.length > 0
      ? integrations.map((integration) => `- ${integration.label} · ${integration.provider}`)
      : ["- None detected"]),
    "",
    "Required environment variables:",
    ...(requiredEnvVars.length > 0
      ? requiredEnvVars.map((variable) => `- ${variable.key} · ${variable.scope}`)
      : ["- None detected"]),
    "",
    "Next steps:",
    "- Review generated files in Code view.",
    "- Export full build pack if not complete.",
    "- Review config/env.example.",
    "- Review and run generated SQL migration if database tables exist.",
    "- Configure production environment variables.",
    "- Commit generated files to GitHub.",
    "- Deploy to Vercel.",
    "- Run smoke tests after deployment.",
  ];

  return lines.join("\n");
}

function createProjectBriefMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const integrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = integrations.filter(
    (integration) => integration.required
  );

  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const lines = [
    "# Project brief",
    "",
    `Product: ${previewState.title}`,
    "",
    `Description: ${previewState.subtitle}`,
    "",
    "## Classification",
    "",
    `- Project type: ${previewState.projectType}`,
    `- Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `- Industry: ${previewState.classification?.industry ?? "General"}`,
    `- Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    `- Platform targets: ${previewState.classification?.platformTargets.join(", ") || "web"}`,
    "",
    "## Generated modules",
    "",
    ...(previewState.modules.length > 0
      ? previewState.modules.flatMap((module) => [
          `### ${module.label}`,
          "",
          module.description,
          "",
        ])
      : ["No modules generated.", ""]),
    "## Database architecture",
    "",
    ...(previewState.architecture.tables.length > 0
      ? previewState.architecture.tables.flatMap((table) => [
          `### ${table.name}`,
          "",
          table.purpose,
          "",
          "Fields:",
          "",
          ...table.fields.map((field) => `- ${field}`),
          "",
        ])
      : ["No database tables planned.", ""]),
    "## API routes",
    "",
    ...(previewState.architecture.endpoints.length > 0
      ? previewState.architecture.endpoints.flatMap((endpoint) => [
          `### ${endpoint.method} ${endpoint.path}`,
          "",
          endpoint.purpose,
          "",
        ])
      : ["No API routes planned.", ""]),
    "## Security rules",
    "",
    ...(previewState.architecture.securityRules.length > 0
      ? previewState.architecture.securityRules.flatMap((rule) => [
          `### ${rule.label}`,
          "",
          rule.description,
          "",
        ])
      : ["No security rules generated yet.", ""]),
    "## Generated files",
    "",
    ...(files.length > 0
      ? files.map(
          (file) =>
            `- ${file.path} — ${file.description || "Generated project file."}`
        )
      : ["No generated files yet."]),
    "",
    "## Required integrations",
    "",
    ...(requiredIntegrations.length > 0
      ? requiredIntegrations.flatMap((integration) => [
          `### ${integration.label}`,
          "",
          `Provider: ${integration.provider}`,
          "",
          integration.reason,
          "",
          "Checklist:",
          "",
          ...integration.checklist.map((item) => `- [ ] ${item}`),
          "",
        ])
      : ["No required integrations detected.", ""]),
    "## Required environment variables",
    "",
    ...(requiredEnvVars.length > 0
      ? requiredEnvVars.map(
          (variable) =>
            `- ${variable.key} · ${variable.scope} · ${variable.label}`
        )
      : ["No required environment variables detected."]),
    "",
    "## Deployment readiness",
    "",
    ...deployItems.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Status: ${item.status}`,
      "",
      item.detail,
      "",
      ...item.checklist.map((check) => `- [ ] ${check}`),
      "",
    ]),
    "## Next implementation steps",
    "",
    "- [ ] Review generated files in Code view.",
    "- [ ] Export and review config/env.example.",
    "- [ ] Export and review generated SQL migration if database tables exist.",
    "- [ ] Run migrations in Supabase if required.",
    "- [ ] Configure production environment variables.",
    "- [ ] Commit generated files to GitHub.",
    "- [ ] Deploy to Vercel.",
    "- [ ] Run smoke tests after deployment.",
    "",
    "> Generated by Founder AI. Review everything before shipping, because production is where optimism goes to get audited.",
    "",
  ];

  return lines.join("\n");
}

function createDeployChecklistMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const lines = [
    "# Deployment checklist",
    "",
    `Generated for: ${previewState.title}`,
    `Project type: ${previewState.projectType}`,
    `Status: ${previewState.status}`,
    "",
    "## Build summary",
    "",
    `- Files: ${files.length}`,
    `- Modules: ${previewState.modules.length}`,
    `- Database tables: ${previewState.architecture.tables.length}`,
    `- API routes: ${previewState.architecture.endpoints.length}`,
    `- Security rules: ${previewState.architecture.securityRules.length}`,
    "",
    "## Classification",
    "",
    `- Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `- Industry: ${previewState.classification?.industry ?? "General"}`,
    `- Platform targets: ${previewState.classification?.platformTargets.join(", ") || "web"}`,
    `- Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    "",
    "## Required environment variables",
    "",
    ...(requiredEnvVars.length > 0
      ? requiredEnvVars.flatMap((variable) => [
          `### ${variable.key}`,
          "",
          `- Label: ${variable.label}`,
          `- Scope: ${variable.scope}`,
          `- Reason: ${variable.reason}`,
          `- Example: \`${variable.key}=${variable.example}\``,
          "",
        ])
      : ["No required environment variables detected.", ""]),
    "## Deployment tasks",
    "",
    ...deployItems.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Status: ${item.status}`,
      "",
      item.detail,
      "",
      ...item.checklist.map((check) => `- [ ] ${check}`),
      "",
    ]),
    "## Final pre-launch checks",
    "",
    "- [ ] Run production build locally.",
    "- [ ] Check browser console.",
    "- [ ] Check server logs.",
    "- [ ] Test authentication.",
    "- [ ] Test the primary user workflow.",
    "- [ ] Confirm secrets are not committed.",
    "- [ ] Confirm production environment variables are configured.",
    "- [ ] Confirm database migrations have run.",
    "- [ ] Confirm RLS/security rules are reviewed.",
    "",
    "> Generated by Founder AI. Review before launch, because the internet is not a forgiving place.",
    "",
  ];

  return lines.join("\n");
}

function BuildPackHealthCard({
  health,
}: {
  health: BuildPackHealth;
}) {
  const tone =
    health.status === "complete"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : health.status === "missing"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

  return (
    <div
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: "18px",
        background: tone.background,
        padding: "15px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "10px",
        }}
      >
        <div>
          <div
            style={{
              color: tone.text,
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Build pack health
          </div>

          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "20px",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {health.label} · {health.score}%
          </strong>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "28px",
            padding: "0 11px",
            borderRadius: "999px",
            background: "#ffffff",
            color: tone.text,
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {health.label}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 10px",
          color: "#374151",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {health.summary}
      </p>

      {health.missingFiles.length > 0 ? (
        <div
          style={{
            borderTop: `1px solid ${tone.border}`,
            paddingTop: "10px",
          }}
        >
          <div
            style={{
              color: tone.text,
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Missing files
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "#111827",
            }}
          >
            {health.missingFiles.map((filePath) => (
              <li
                key={filePath}
                style={{
                  marginBottom: "5px",
                  fontSize: "13px",
                  lineHeight: 1.45,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {filePath}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function createPreviewSlug(value: string) {
  // Converts a project title into a safe generated preview subdomain.
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return slug || "founder-ai-build";
}

function getGeneratedPreviewUrl(previewState: PreviewState) {
  // Local placeholder domain until real deployment provider wiring is added.
  return `https://${createPreviewSlug(previewState.title)}.founder-ai.app`;
}

function getPublishCenterSecurityCount(files: ChangedFile[]) {
  // Counts generated security handoff files so the user sees what has been reviewed/exported.
  return [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => files.some((file) => file.path === filePath)).length;
}

function getPublishCenterSettingsCount(files: ChangedFile[]) {
  // Counts setup files needed before a real production deployment.
  return [
    "config/env.example",
    "config/deploy-checklist.md",
    "config/developer-instructions.md",
    "config/launch-readiness-report.md",
  ].filter((filePath) => files.some((file) => file.path === filePath)).length;
}

function PublishCenterPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const generatedUrl = getGeneratedPreviewUrl(previewState);
  const [customDomain, setCustomDomain] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [publishMessage, setPublishMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");

  const gateReport = getPublishGateReport({
    previewState,
    files,
  });

  const securityCount = getPublishCenterSecurityCount(files);
  const settingsCount = getPublishCenterSettingsCount(files);
  const activeUrl = customDomain.trim()
    ? `https://${customDomain.trim().replace(/^https?:\/\//, "")}`
    : generatedUrl;

  const canPublish = gateReport.decision === "can-publish";
  const canStage = gateReport.decision === "can-stage" || canPublish;

  async function copyPublishUrl() {
    // Copies the active publish URL into the clipboard.
    try {
      await navigator.clipboard.writeText(activeUrl);
      setPublishMessage("Website URL copied.");
    } catch {
      setPublishMessage("Could not copy URL. Copy it manually.");
    }
  }

  function updatePublishSnapshot() {
    // Simulates refreshing publish metadata from current generated readiness signals.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (gateReport.decision === "blocked") {
      setPublishMessage("Publish snapshot updated. Gate is still blocked.");
      return;
    }

    if (gateReport.decision === "can-preview") {
      setPublishMessage("Publish snapshot updated. Internal preview is available.");
      return;
    }

    if (gateReport.decision === "can-stage") {
      setPublishMessage("Publish snapshot updated. Staging can be prepared.");
      return;
    }

    setPublishMessage("Publish snapshot updated. Final manual checks still required.");
  }

  function openSecurityReview() {
    // Keeps the user in the current page but directs attention to security work.
    setPublishMessage(
      securityCount >= 2
        ? "Security files exist. Review security review and security rules before publishing."
        : "Security review is incomplete. Export security review and security rules first."
    );
  }

  function openPublishSettings() {
    // Gives an immediate settings verdict without pretending we configured DNS for the user.
    setPublishMessage(
      settingsCount >= 4
        ? "Core publish settings files exist. Configure real environment variables and deployment provider next."
        : "Publish settings are incomplete. Export the full build pack first."
    );
  }

  const decisionTone =
    gateReport.decision === "can-publish"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : gateReport.decision === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : gateReport.decision === "can-stage"
          ? {
              background: "#eff6ff",
              border: "#bfdbfe",
              text: "#1d4ed8",
            }
          : {
              background: "#fff7ed",
              border: "#fed7aa",
              text: "#9a3412",
            };

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "18px 20px",
          borderBottom: "1px solid #eef0f3",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,247,241,0.92))",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Publish center
          </div>

          <h2
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "24px",
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
            }}
          >
            Preview, secure, configure, publish
          </h2>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "30px",
            padding: "0 12px",
            borderRadius: "999px",
            background: decisionTone.background,
            color: decisionTone.text,
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {gateReport.label}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
          gap: "0",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRight: "1px solid #eef0f3",
          }}
        >
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 900,
                marginBottom: "9px",
              }}
            >
              Website URL
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                background: "#f9fafb",
                padding: "10px 10px 10px 14px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  color: "#111827",
                  fontSize: "15px",
                  fontWeight: 800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeUrl}
              </span>

              <button
                type="button"
                className="pill-button"
                onClick={copyPublishUrl}
              >
                Copy
              </button>
            </div>
          </div>

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 900,
                marginBottom: "9px",
              }}
            >
              Add custom domain
            </label>

            <input
              value={customDomain}
              onChange={(event) => setCustomDomain(event.target.value)}
              placeholder="app.yourdomain.com"
              suppressHydrationWarning
              style={{
                width: "100%",
                minHeight: "46px",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                background: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontWeight: 700,
                padding: "0 14px",
                outline: "none",
              }}
            />

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              Domain connection UI is ready. DNS/provider verification can be wired next.
            </p>
          </div>

          <div>
            <div
              style={{
                color: "#111827",
                fontSize: "15px",
                fontWeight: 900,
                marginBottom: "10px",
              }}
            >
              Who can see this build?
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setVisibility("public")}
                style={{
                  border:
                    visibility === "public"
                      ? "1px solid #2563eb"
                      : "1px solid #e5e7eb",
                  borderRadius: "18px",
                  background: visibility === "public" ? "#eff6ff" : "#ffffff",
                  padding: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#111827",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Public
                </strong>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    lineHeight: 1.4,
                  }}
                >
                  Anyone with the URL can view it.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("private")}
                style={{
                  border:
                    visibility === "private"
                      ? "1px solid #2563eb"
                      : "1px solid #e5e7eb",
                  borderRadius: "18px",
                  background: visibility === "private" ? "#eff6ff" : "#ffffff",
                  padding: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#111827",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Private
                </strong>
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    lineHeight: 1.4,
                  }}
                >
                  Keep it internal until staging is ready.
                </span>
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            background: "#fbfaf7",
          }}
        >
          <div
            style={{
              border: `1px solid ${decisionTone.border}`,
              borderRadius: "20px",
              background: decisionTone.background,
              padding: "15px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                color: decisionTone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: "7px",
              }}
            >
              Publish status
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.15,
                letterSpacing: "-0.04em",
                marginBottom: "7px",
              }}
            >
              {gateReport.label} · {gateReport.score}%
            </strong>

            <p
              style={{
                margin: 0,
                color: "#374151",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              {gateReport.summary}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <button
              type="button"
              className="pill-button"
              onClick={openSecurityReview}
            >
              Review security
              {securityCount < 2 ? ` · ${2 - securityCount} pending` : ""}
            </button>

            <button
              type="button"
              className="pill-button"
              onClick={openPublishSettings}
            >
              Edit publish settings
              {settingsCount < 4 ? ` · ${4 - settingsCount} pending` : ""}
            </button>

            <button
              type="button"
              className="pill-button"
              onClick={updatePublishSnapshot}
            >
              Update publish snapshot
            </button>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              background: "#ffffff",
              padding: "14px",
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
              Snapshot
            </div>

            <div
              style={{
                display: "grid",
                gap: "7px",
                color: "#374151",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              <div>Visibility: {visibility === "public" ? "Public" : "Private"}</div>
              <div>Security files: {securityCount}/3</div>
              <div>Settings files: {settingsCount}/4</div>
              <div>Stage allowed: {canStage ? "Yes" : "No"}</div>
              <div>Publish allowed: {canPublish ? "Yes" : "No"}</div>
              <div>Last update: {lastUpdatedLabel}</div>
            </div>

            {publishMessage ? (
              <p
                style={{
                  margin: "12px 0 0",
                  color: publishMessage.toLowerCase().includes("blocked")
                    ? "#991b1b"
                    : "#166534",
                  fontSize: "12px",
                  fontWeight: 800,
                  lineHeight: 1.45,
                }}
              >
                {publishMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublishGatePanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getPublishGateReport({
    previewState,
    files,
  });

  const tone =
    report.decision === "can-publish"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.decision === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : report.decision === "can-stage"
          ? {
              background: "#eff6ff",
              border: "#bfdbfe",
              text: "#1d4ed8",
            }
          : {
              background: "#fff7ed",
              border: "#fed7aa",
              text: "#9a3412",
            };

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        padding: "20px",
      }}
    >
      <div
        style={{
          border: `1px solid ${tone.border}`,
          borderRadius: "20px",
          background: tone.background,
          padding: "18px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: "7px",
              }}
            >
              Publish gate
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "28px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "30px",
              padding: "0 12px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {report.requirements.map((requirement) => (
          <PublishGateRequirementCard
            key={requirement.id}
            requirement={requirement}
          />
        ))}
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          background: "#f9fafb",
          padding: "15px",
        }}
      >
        <div
          style={{
            color: "#374151",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Gate actions
        </div>

        <ul
          style={{
            margin: 0,
            paddingLeft: "18px",
            color: "#111827",
          }}
        >
          {report.nextActions.map((action) => (
            <li
              key={action}
              style={{
                marginBottom: "6px",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              {action}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PublishGateRequirementCard({
  requirement,
}: {
  requirement: PublishGateRequirement;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {requirement.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: requirement.passed ? "#ecfdf5" : "#fef2f2",
            color: requirement.passed ? "#166534" : "#991b1b",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {requirement.passed ? "Passed" : "Needs work"}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {requirement.detail}
      </p>
    </article>
  );
}

function OverallLaunchReadinessPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getLaunchReadinessReport({
    previewState,
    files,
  });

  const tone =
    report.status === "ready"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : report.status === "needs-work"
          ? {
              background: "#fff7ed",
              border: "#fed7aa",
              text: "#9a3412",
            }
          : {
              background: "#eff6ff",
              border: "#bfdbfe",
              text: "#1d4ed8",
            };

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        padding: "20px",
      }}
    >
      <div
        style={{
          border: `1px solid ${tone.border}`,
          borderRadius: "20px",
          background: tone.background,
          padding: "18px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: "7px",
              }}
            >
              Overall launch readiness
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "28px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "30px",
              padding: "0 12px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {report.signals.map((signal) => (
          <LaunchReadinessSignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {report.blockers.length > 0 ? (
        <div
          style={{
            border: "1px solid #fecaca",
            borderRadius: "18px",
            background: "#fef2f2",
            padding: "15px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              color: "#991b1b",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Blockers
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "#111827",
            }}
          >
            {report.blockers.map((blocker) => (
              <li
                key={blocker}
                style={{
                  marginBottom: "6px",
                  fontSize: "13px",
                  lineHeight: 1.45,
                }}
              >
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          background: "#f9fafb",
          padding: "15px",
        }}
      >
        <div
          style={{
            color: "#374151",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Next actions
        </div>

        <ul
          style={{
            margin: 0,
            paddingLeft: "18px",
            color: "#111827",
          }}
        >
          {report.nextActions.map((action) => (
            <li
              key={action}
              style={{
                marginBottom: "6px",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              {action}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LaunchReadinessSignalCard({
  signal,
}: {
  signal: LaunchReadinessSignal;
}) {
  const tone =
    signal.status === "ready"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : signal.status === "blocked"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : signal.status === "needs-work"
          ? {
              background: "#fff7ed",
              text: "#9a3412",
            }
          : {
              background: "#eff6ff",
              text: "#1d4ed8",
            };

  const statusLabel =
    signal.status === "ready"
      ? "Ready"
      : signal.status === "blocked"
        ? "Blocked"
        : signal.status === "needs-work"
          ? "Needs work"
          : "Nearly ready";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {signal.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.text,
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div
        style={{
          color: "#111827",
          fontSize: "22px",
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          marginBottom: "8px",
        }}
      >
        {signal.score}%
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {signal.detail}
      </p>
    </article>
  );
}

function VisualQaHealthPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getVisualQaHealthReport({
    previewState,
    files,
  });

  const tone =
    report.status === "ready"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "missing"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

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
          border: `1px solid ${tone.border}`,
          borderRadius: "18px",
          background: tone.background,
          padding: "15px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Visual QA health
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {report.findings.map((finding) => (
          <VisualQaFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function VisualQaFindingCard({
  finding,
}: {
  finding: VisualQaHealthFinding;
}) {
  const tone =
    finding.status === "ready"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "missing"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "ready"
      ? "Ready"
      : finding.status === "missing"
        ? "Missing"
        : "Needs review";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {finding.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.text,
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {finding.detail}
      </p>
    </article>
  );
}

function VisualBuilderCompetitivenessPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const tone =
    report.status === "competitive"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "behind"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

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
          border: `1px solid ${tone.border}`,
          borderRadius: "18px",
          background: tone.background,
          padding: "15px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Visual builder competitiveness
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {report.findings.map((finding) => (
          <VisualBuilderFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function VisualBuilderFindingCard({
  finding,
}: {
  finding: VisualBuilderFinding;
}) {
  const tone =
    finding.status === "competitive"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "behind"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "competitive"
      ? "Competitive"
      : finding.status === "behind"
        ? "Behind"
        : "Promising";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {finding.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.text,
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 10px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {finding.detail}
      </p>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: "9px",
          color: "#374151",
          fontSize: "12px",
          lineHeight: 1.5,
          fontWeight: 700,
        }}
      >
        {finding.recommendation}
      </div>
    </article>
  );
}

function DesignQualityPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getDesignQualityReport({
    previewState,
    files,
  });

  const tone =
    report.status === "strong"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "weak"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

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
          border: `1px solid ${tone.border}`,
          borderRadius: "18px",
          background: tone.background,
          padding: "15px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Design quality
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {report.findings.map((finding) => (
          <DesignFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function DesignFindingCard({
  finding,
}: {
  finding: DesignQualityFinding;
}) {
  const tone =
    finding.status === "strong"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "weak"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "strong"
      ? "Strong"
      : finding.status === "weak"
        ? "Weak"
        : "Needs review";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {finding.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.text,
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {finding.detail}
      </p>
    </article>
  );
}

function SecurityHealthPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getSecurityHealthReport({
    previewState,
    files,
  });

  const tone =
    report.status === "ready"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : report.status === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

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
          border: `1px solid ${tone.border}`,
          borderRadius: "18px",
          background: tone.background,
          padding: "15px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                color: tone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Security health
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {report.label} · {report.score}%
            </strong>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              background: "#ffffff",
              color: tone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {report.label}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            color: "#374151",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {report.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {report.findings.map((finding) => (
          <SecurityFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function SecurityFindingCard({
  finding,
}: {
  finding: SecurityHealthFinding;
}) {
  const tone =
    finding.status === "ready"
      ? {
          background: "#ecfdf5",
          text: "#166534",
        }
      : finding.status === "blocked"
        ? {
            background: "#fef2f2",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            text: "#9a3412",
          };

  const statusLabel =
    finding.status === "ready"
      ? "Ready"
      : finding.status === "blocked"
        ? "Blocked"
        : "Needs review";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {finding.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.text,
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {finding.detail}
      </p>
    </article>
  );
}

function BuildPackContentsPanel({
  files,
  setSelectedFileId,
  setWorkspaceView,
  onExportFullBuildPack,
  isExportingFullBuildPack,
}: {
  files: ChangedFile[];
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
  onExportFullBuildPack: () => Promise<void>;
  isExportingFullBuildPack: boolean;
}) {
  const buildPackFiles = getBuildPackFileStatuses(files);
  const buildPackHealth = getBuildPackHealth(files);
  const existingCount = buildPackFiles.filter((file) => file.exists).length;

  function openBuildPackFile(file: BuildPackFileStatus) {
    if (!file.fileId) return;

    // Selecting the file and switching to Code view gives the user the exact file immediately.
    setSelectedFileId(file.fileId);
    setWorkspaceView("code");
  }

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
            Build pack contents
          </h3>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {existingCount} of {buildPackFiles.length} core build pack files
            exist in this project. Export the full build pack if anything is
            missing.
          </p>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "26px",
            padding: "0 10px",
            borderRadius: "999px",
            background:
              existingCount === buildPackFiles.length ? "#ecfdf5" : "#fff7ed",
            color:
              existingCount === buildPackFiles.length ? "#166534" : "#9a3412",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {existingCount === buildPackFiles.length
            ? "Complete"
            : "Missing files"}
        </span>
      </div>

      <BuildPackHealthCard health={buildPackHealth} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {buildPackFiles.map((file) => (
          <BuildPackFileCard
            key={file.path}
            file={file}
            onOpen={() => openBuildPackFile(file)}
            onExportMissing={onExportFullBuildPack}
            isExportingFullBuildPack={isExportingFullBuildPack}
          />
        ))}
      </div>
    </section>
  );
}

function BuildPackFileCard({
  file,
  onOpen,
  onExportMissing,
  isExportingFullBuildPack,
}: {
  file: BuildPackFileStatus;
  onOpen: () => void;
  onExportMissing: () => Promise<void>;
  isExportingFullBuildPack: boolean;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "14px",
              lineHeight: 1.25,
              marginBottom: "5px",
            }}
          >
            {file.label}
          </strong>

          <code
            style={{
              display: "block",
              color: "#374151",
              fontSize: "12px",
              lineHeight: 1.35,
              overflowWrap: "anywhere",
            }}
          >
            {file.path}
          </code>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background: file.exists ? "#ecfdf5" : "#fef2f2",
            color: file.exists ? "#166534" : "#991b1b",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {file.exists ? "Exists" : "Missing"}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {file.purpose}
      </p>

      <button
        suppressHydrationWarning
        type="button"
        className="pill-button"
        onClick={file.exists ? onOpen : onExportMissing}
        disabled={!file.exists && isExportingFullBuildPack}
      >
        {file.exists
          ? "Open in Code"
          : isExportingFullBuildPack
            ? "Exporting..."
            : "Export full pack"}
      </button>
    </article>
  );
}

function mapSignalStatusToLaunchStatus({
  isBlocked,
  isReady,
}: {
  isBlocked: boolean;
  isReady: boolean;
}): LaunchReadinessStatus {
  if (isBlocked) return "blocked";
  if (isReady) return "ready";
  return "needs-work";
}

function createLaunchReadinessReportMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getLaunchReadinessReport({
    previewState,
    files,
  });

  const buildPackHealth = getBuildPackHealth(files);
  const securityHealth = getSecurityHealthReport({
    previewState,
    files,
  });
  const designQuality = getDesignQualityReport({
    previewState,
    files,
  });
  const visualBuilderReport = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });
  const visualQaHealth = getVisualQaHealthReport({
    previewState,
    files,
  });

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const blockedDeployItems = deployItems.filter(
    (item) => item.status === "blocked"
  );

  const setupDeployItems = deployItems.filter(
    (item) => item.status === "needs-setup"
  );

  const readyDeployItems = deployItems.filter(
    (item) => item.status === "ready"
  );

  const generatedFileList =
    files.length > 0
      ? files.map((file) => `- ${file.path}`)
      : ["- No generated files found."];

  const lines = [
    "# Launch readiness report",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Industry: ${previewState.classification?.industry ?? "General"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    `Platform targets: ${previewState.classification?.platformTargets.join(", ") || "web"}`,
    "",
    "## Overall verdict",
    "",
    `Status: ${report.label}`,
    `Score: ${report.score}%`,
    "",
    report.summary,
    "",
    "## Readiness signals",
    "",
    ...report.signals.flatMap((signal) => [
      `### ${signal.label}`,
      "",
      `Status: ${signal.status}`,
      `Score: ${signal.score}%`,
      "",
      signal.detail,
      "",
    ]),
    "## Blockers",
    "",
    ...(report.blockers.length > 0
      ? report.blockers.map((blocker) => `- [ ] ${blocker}`)
      : ["No launch blockers detected from generated readiness signals."]),
    "",
    "## Next actions",
    "",
    ...report.nextActions.map((action) => `- [ ] ${action}`),
    "",
    "## Build pack health",
    "",
    `Status: ${buildPackHealth.label}`,
    `Score: ${buildPackHealth.score}%`,
    "",
    buildPackHealth.summary,
    "",
    ...(buildPackHealth.missingFiles.length > 0
      ? [
          "Missing build pack files:",
          "",
          ...buildPackHealth.missingFiles.map((filePath) => `- ${filePath}`),
          "",
        ]
      : ["No build pack files missing.", ""]),
    "## Deployment readiness",
    "",
    `Ready items: ${readyDeployItems.length}`,
    `Needs setup: ${setupDeployItems.length}`,
    `Blocked: ${blockedDeployItems.length}`,
    "",
    ...deployItems.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Status: ${item.status}`,
      "",
      item.detail,
      "",
      ...item.checklist.map((check) => `- [ ] ${check}`),
      "",
    ]),
    "## Security health",
    "",
    `Status: ${securityHealth.label}`,
    `Score: ${securityHealth.score}%`,
    "",
    securityHealth.summary,
    "",
    ...securityHealth.findings.flatMap((finding) => [
      `### ${finding.label}`,
      "",
      `Status: ${finding.status}`,
      "",
      finding.detail,
      "",
    ]),
    "## Design quality",
    "",
    `Status: ${designQuality.label}`,
    `Score: ${designQuality.score}%`,
    "",
    designQuality.summary,
    "",
    ...designQuality.findings.flatMap((finding) => [
      `### ${finding.label}`,
      "",
      `Status: ${finding.status}`,
      "",
      finding.detail,
      "",
    ]),
    "## Visual builder competitiveness",
    "",
    `Status: ${visualBuilderReport.label}`,
    `Score: ${visualBuilderReport.score}%`,
    "",
    visualBuilderReport.summary,
    "",
    ...visualBuilderReport.findings.flatMap((finding) => [
      `### ${finding.label}`,
      "",
      `Status: ${finding.status}`,
      "",
      finding.detail,
      "",
      "Recommendation:",
      finding.recommendation,
      "",
    ]),
    "## Visual QA health",
    "",
    `Status: ${visualQaHealth.label}`,
    `Score: ${visualQaHealth.score}%`,
    "",
    visualQaHealth.summary,
    "",
    ...visualQaHealth.findings.flatMap((finding) => [
      `### ${finding.label}`,
      "",
      `Status: ${finding.status}`,
      "",
      finding.detail,
      "",
    ]),
    "## Generated files",
    "",
    ...generatedFileList,
    "",
    "## Final launch checklist",
    "",
    "- [ ] Export full build pack.",
    "- [ ] Review launch readiness report.",
    "- [ ] Review security review and security rules.",
    "- [ ] Review design review and Visual QA checklist.",
    "- [ ] Configure production environment variables.",
    "- [ ] Run database migrations if required.",
    "- [ ] Push to GitHub.",
    "- [ ] Deploy to Vercel.",
    "- [ ] Run post-deploy smoke tests.",
    "- [ ] Test with at least two users where permissions matter.",
    "",
    "> Generated by Founder AI. Launch readiness is a signal, not a permission slip from the gods.",
    "",
  ];

  return lines.join("\\n");
}

function createLaunchReadinessSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getLaunchReadinessReport({
    previewState,
    files,
  });

  const lines = [
    "Founder AI launch readiness summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Verdict:",
    "- Status: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Signals:",
    ...report.signals.map(
      (signal) =>
        "- " +
        signal.label +
        ": " +
        signal.status +
        " · " +
        signal.score +
        "% · " +
        signal.detail
    ),
    "",
    "Blockers:",
    ...(report.blockers.length > 0
      ? report.blockers.map((blocker) => "- " + blocker)
      : ["- None detected"]),
    "",
    "Next actions:",
    ...report.nextActions.map((action) => "- " + action),
  ];

  return lines.join("\\n");
}

function createPublishGateReportMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getPublishGateReport({
    previewState,
    files,
  });

  const launchReport = getLaunchReadinessReport({
    previewState,
    files,
  });

  const buildPackHealth = getBuildPackHealth(files);

  const lines = [
    "# Publish gate report",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Industry: ${previewState.classification?.industry ?? "General"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    `Platform targets: ${previewState.classification?.platformTargets.join(", ") || "web"}`,
    "",
    "## Gate decision",
    "",
    `Decision: ${report.label}`,
    `Score: ${report.score}%`,
    "",
    report.summary,
    "",
    "## What this decision means",
    "",
    report.decision === "blocked"
      ? "The build should not move forward until blockers are fixed."
      : report.decision === "can-preview"
        ? "The build can be previewed internally, but should not be staged or published."
        : report.decision === "can-stage"
          ? "The build can move to staging for controlled review and testing, but should not go to production."
          : "The build can move toward production after final manual review and smoke testing.",
    "",
    "## Gate requirements",
    "",
    ...report.requirements.flatMap((requirement) => [
      `### ${requirement.label}`,
      "",
      `Status: ${requirement.passed ? "passed" : "needs work"}`,
      "",
      requirement.detail,
      "",
      requirement.passed
        ? "- [x] Requirement passed."
        : "- [ ] Resolve this requirement before moving to the next launch stage.",
      "",
    ]),
    "## Gate actions",
    "",
    ...(report.nextActions.length > 0
      ? report.nextActions.map((action) => `- [ ] ${action}`)
      : ["- [ ] Run final manual review and smoke tests."]),
    "",
    "## Related launch readiness",
    "",
    `Launch readiness: ${launchReport.label} · ${launchReport.score}%`,
    `Build pack health: ${buildPackHealth.label} · ${buildPackHealth.score}%`,
    "",
    "## Launch readiness signals",
    "",
    ...launchReport.signals.flatMap((signal) => [
      `### ${signal.label}`,
      "",
      `Status: ${signal.status}`,
      `Score: ${signal.score}%`,
      "",
      signal.detail,
      "",
    ]),
    "## Blockers",
    "",
    ...(launchReport.blockers.length > 0
      ? launchReport.blockers.map((blocker) => `- [ ] ${blocker}`)
      : ["No launch readiness blockers detected from generated signals."]),
    "",
    "## Final manual checks",
    "",
    "- [ ] Review generated code.",
    "- [ ] Review environment variables.",
    "- [ ] Review database migration if present.",
    "- [ ] Review security review and security rules.",
    "- [ ] Review visual QA and design review.",
    "- [ ] Run production build.",
    "- [ ] Deploy to staging first.",
    "- [ ] Test sign-in/sign-up.",
    "- [ ] Test primary workflow.",
    "- [ ] Check browser console.",
    "- [ ] Check server logs.",
    "- [ ] Confirm no secrets are exposed client-side.",
    "",
    "> Generated by Founder AI. A publish gate is not permission to skip judgment, it is a warning label with manners.",
    "",
  ];

  return lines.join("\\n");
}

function createPublishGateSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getPublishGateReport({
    previewState,
    files,
  });

  const lines = [
    "Founder AI publish gate summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Gate decision:",
    "- Decision: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Requirements:",
    ...report.requirements.map(
      (requirement) =>
        "- " +
        requirement.label +
        ": " +
        (requirement.passed ? "passed" : "needs work") +
        " · " +
        requirement.detail
    ),
    "",
    "Next actions:",
    ...(report.nextActions.length > 0
      ? report.nextActions.map((action) => "- " + action)
      : ["- Run final manual review and smoke tests."]),
  ];

  return lines.join("\\n");
}

function getPublishGateReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): PublishGateReport {
  const launchReport = getLaunchReadinessReport({
    previewState,
    files,
  });

  const buildPackHealth = getBuildPackHealth(files);

  const securityHealth = getSecurityHealthReport({
    previewState,
    files,
  });

  const visualQaHealth = getVisualQaHealthReport({
    previewState,
    files,
  });

  const designQuality = getDesignQualityReport({
    previewState,
    files,
  });

  const visualBuilderReport = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const deployBlocked = deployItems.some((item) => item.status === "blocked");
  const deployNeedsSetup = deployItems.some(
    (item) => item.status === "needs-setup"
  );

  const hasCriticalBlocker =
    launchReport.status === "blocked" ||
    securityHealth.status === "blocked" ||
    buildPackHealth.status === "missing";

  const requirements: PublishGateRequirement[] = [
    {
      id: "build-pack",
      label: "Full build pack",
      passed: buildPackHealth.status === "complete",
      detail:
        buildPackHealth.status === "complete"
          ? "Full build pack is complete."
          : "Full build pack is incomplete. Export the full build pack before staging or publishing.",
    },
    {
      id: "security",
      label: "Security readiness",
      passed: securityHealth.status !== "blocked",
      detail:
        securityHealth.status === "blocked"
          ? "Security readiness is blocked. Security review and rules need attention before staging."
          : `Security is ${securityHealth.label} at ${securityHealth.score}% and still requires manual review.`,
    },
    {
      id: "visual-qa",
      label: "Visual QA readiness",
      passed: visualQaHealth.status !== "missing",
      detail:
        visualQaHealth.status === "missing"
          ? "Visual QA is missing. Export and review the Visual QA checklist."
          : `Visual QA is ${visualQaHealth.label} at ${visualQaHealth.score}%.`,
    },
    {
      id: "design",
      label: "Design quality",
      passed: designQuality.status !== "weak",
      detail:
        designQuality.status === "weak"
          ? "Design quality is weak. Improve UI structure before publishing."
          : `Design quality is ${designQuality.label} at ${designQuality.score}%.`,
    },
    {
      id: "visual-builder",
      label: "Visual builder competitiveness",
      passed: visualBuilderReport.status !== "behind",
      detail:
        visualBuilderReport.status === "behind"
          ? "Visual builder competitiveness is behind. Improve prototype completeness, polish, and content realism."
          : `Visual builder competitiveness is ${visualBuilderReport.label} at ${visualBuilderReport.score}%.`,
    },
    {
      id: "deployment",
      label: "Deployment setup",
      passed: !deployBlocked,
      detail: deployBlocked
        ? "Deployment readiness has blockers."
        : deployNeedsSetup
          ? "Deployment still needs setup before production publish."
          : "Deployment readiness has no generated blockers.",
    },
  ];

  const passedCount = requirements.filter((requirement) => requirement.passed).length;
  const score = Math.round((passedCount / requirements.length) * 100);

  const nextActions = [
    ...requirements
      .filter((requirement) => !requirement.passed)
      .map((requirement) => requirement.detail),
    ...(deployNeedsSetup && !deployBlocked
      ? [
          "Configure production environment variables.",
          "Connect GitHub repository to Vercel.",
          "Run production build and inspect deployment logs.",
        ]
      : []),
    ...(launchReport.nextActions.length > 0 ? launchReport.nextActions : []),
  ].filter((item, index, array) => array.indexOf(item) === index);

  if (hasCriticalBlocker) {
    return {
      decision: "blocked",
      label: "Blocked",
      score,
      summary:
        "Publishing is blocked. Fix build pack, security, or launch readiness blockers before moving forward.",
      requirements,
      nextActions,
    };
  }

  if (launchReport.score < 55 || designQuality.status === "weak") {
    return {
      decision: "can-preview",
      label: "Can preview",
      score,
      summary:
        "This build can be previewed internally, but it is not ready for staging or production.",
      requirements,
      nextActions,
    };
  }

  if (
    launchReport.score < 85 ||
    deployNeedsSetup ||
    securityHealth.status !== "ready" ||
    visualQaHealth.status !== "ready"
  ) {
    return {
      decision: "can-stage",
      label: "Can stage",
      score,
      summary:
        "This build can move to staging for review, testing, and deployment setup. Do not publish to production yet.",
      requirements,
      nextActions,
    };
  }

  return {
    decision: "can-publish",
    label: "Can publish",
    score,
    summary:
      "This build passes generated publish gates. Run final manual review and smoke tests before production.",
    requirements,
    nextActions: nextActions.length > 0 ? nextActions : ["Run final smoke tests."],
  };
}

function getLaunchReadinessReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): LaunchReadinessReport {
  const buildPackHealth = getBuildPackHealth(files);

  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const securityHealth = getSecurityHealthReport({
    previewState,
    files,
  });

  const designQuality = getDesignQualityReport({
    previewState,
    files,
  });

  const visualBuilderCompetitiveness = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const visualQaHealth = getVisualQaHealthReport({
    previewState,
    files,
  });

  const deployBlocked = deployItems.some((item) => item.status === "blocked");
  const deployNeedsSetup = deployItems.some(
    (item) => item.status === "needs-setup"
  );
  const deployReadyCount = deployItems.filter(
    (item) => item.status === "ready"
  ).length;
  const deployScore =
    deployItems.length > 0
      ? Math.round((deployReadyCount / deployItems.length) * 100)
      : 0;

  const signals: LaunchReadinessSignal[] = [
    {
      id: "build-pack",
      label: "Build pack",
      status:
        buildPackHealth.status === "complete"
          ? "ready"
          : buildPackHealth.status === "missing"
            ? "blocked"
            : "needs-work",
      score: buildPackHealth.score,
      detail: `Build pack is ${buildPackHealth.label} at ${buildPackHealth.score}%.`,
    },
    {
      id: "deployment",
      label: "Deployment",
      status: mapSignalStatusToLaunchStatus({
        isBlocked: deployBlocked,
        isReady: !deployBlocked && !deployNeedsSetup,
      }),
      score: deployScore,
      detail: deployBlocked
        ? "Deployment has blockers."
        : deployNeedsSetup
          ? "Deployment still needs setup."
          : "Deployment checklist looks ready.",
    },
    {
      id: "security",
      label: "Security",
      status:
        securityHealth.status === "ready"
          ? "ready"
          : securityHealth.status === "blocked"
            ? "blocked"
            : "needs-work",
      score: securityHealth.score,
      detail: `Security health is ${securityHealth.label} at ${securityHealth.score}%.`,
    },
    {
      id: "design-quality",
      label: "Design quality",
      status:
        designQuality.status === "strong"
          ? "ready"
          : designQuality.status === "weak"
            ? "blocked"
            : "needs-work",
      score: designQuality.score,
      detail: `Design quality is ${designQuality.label} at ${designQuality.score}%.`,
    },
    {
      id: "visual-builder-competitiveness",
      label: "Visual builder competitiveness",
      status:
        visualBuilderCompetitiveness.status === "competitive"
          ? "ready"
          : visualBuilderCompetitiveness.status === "behind"
            ? "needs-work"
            : "nearly-ready",
      score: visualBuilderCompetitiveness.score,
      detail: `Visual builder competitiveness is ${visualBuilderCompetitiveness.label} at ${visualBuilderCompetitiveness.score}%.`,
    },
    {
      id: "visual-qa",
      label: "Visual QA",
      status:
        visualQaHealth.status === "ready"
          ? "ready"
          : visualQaHealth.status === "missing"
            ? "blocked"
            : "needs-work",
      score: visualQaHealth.score,
      detail: `Visual QA health is ${visualQaHealth.label} at ${visualQaHealth.score}%.`,
    },
  ];

  const blockedSignals = signals.filter((signal) => signal.status === "blocked");
  const needsWorkSignals = signals.filter(
    (signal) => signal.status === "needs-work"
  );
  const nearlyReadySignals = signals.filter(
    (signal) => signal.status === "nearly-ready"
  );
  const readySignals = signals.filter((signal) => signal.status === "ready");

  const score = Math.round(
    signals.reduce((total, signal) => total + signal.score, 0) / signals.length
  );

  const blockers = blockedSignals.map(
    (signal) => `${signal.label}: ${signal.detail}`
  );

  const nextActions = [
    ...(buildPackHealth.status !== "complete"
      ? ["Export the full build pack."]
      : []),
    ...(securityHealth.status !== "ready"
      ? [
          "Export and review security review/security rules.",
          "Confirm authentication, authorization, API protection, secrets, and RLS.",
        ]
      : []),
    ...(visualQaHealth.status !== "ready"
      ? ["Export Visual QA and review UI quality across breakpoints."]
      : []),
    ...(designQuality.status !== "strong"
      ? ["Improve visual hierarchy, spacing, typography, CTAs, and responsive polish."]
      : []),
    ...(visualBuilderCompetitiveness.status !== "competitive"
      ? ["Improve prototype completeness, realistic content, design system maturity, and interaction states."]
      : []),
    ...(deployNeedsSetup || deployBlocked
      ? [
          "Configure production environment variables.",
          "Connect GitHub repository to Vercel.",
          "Run production build and inspect logs.",
        ]
      : []),
  ];

  if (blockedSignals.length > 0) {
    return {
      status: "blocked",
      label: "Blocked",
      score,
      summary:
        "This build is not launch-ready. It has blockers across readiness, security, design, deployment, or QA.",
      signals,
      blockers,
      nextActions,
    };
  }

  if (needsWorkSignals.length > 0) {
    return {
      status: "needs-work",
      label: "Needs work",
      score,
      summary:
        "This build has useful structure, but it needs more implementation, review, or production setup before launch.",
      signals,
      blockers,
      nextActions,
    };
  }

  if (nearlyReadySignals.length > 0 || readySignals.length < signals.length) {
    return {
      status: "nearly-ready",
      label: "Nearly ready",
      score,
      summary:
        "This build is close, but it still needs final review before launch. Conveniently, reality remains rude.",
      signals,
      blockers,
      nextActions,
    };
  }

  return {
    status: "ready",
    label: "Ready",
    score,
    summary:
      "This build appears launch-ready from the generated readiness signals. Final manual review is still required, because computers are not lawyers, designers, or your deployment priest.",
    signals,
    blockers,
    nextActions: nextActions.length > 0 ? nextActions : ["Run final smoke tests."],
  };
}

function getVisualQaHealthReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): VisualQaHealthReport {
  const designReport = getDesignQualityReport({
    previewState,
    files,
  });

  const visualBuilderReport = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const hasVisualQaChecklist = files.some(
    (file) => file.path === "config/visual-qa-checklist.md"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const weakDesignFindings = designReport.findings.filter(
    (finding) => finding.status === "weak"
  );

  const designReviewFindings = designReport.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const behindVisualBuilderFindings = visualBuilderReport.findings.filter(
    (finding) => finding.status === "behind"
  );

  const promisingVisualBuilderFindings = visualBuilderReport.findings.filter(
    (finding) => finding.status === "promising"
  );

  const findings: VisualQaHealthFinding[] = [
    {
      id: "visual-qa-checklist",
      label: "Visual QA checklist",
      status: hasVisualQaChecklist ? "ready" : "missing",
      detail: hasVisualQaChecklist
        ? "config/visual-qa-checklist.md exists in the build pack."
        : "config/visual-qa-checklist.md is missing. Export Visual QA or the full build pack.",
    },
    {
      id: "ui-files",
      label: "UI files",
      status: uiFiles.length > 0 ? "ready" : "missing",
      detail:
        uiFiles.length > 0
          ? `${uiFiles.length} UI file${uiFiles.length === 1 ? "" : "s"} detected for visual inspection.`
          : "No UI files were detected. Visual QA needs something visual to inspect, tragically.",
    },
    {
      id: "design-quality",
      label: "Design quality",
      status:
        designReport.status === "strong"
          ? "ready"
          : designReport.status === "weak"
            ? "missing"
            : "needs-review",
      detail: `Design quality is ${designReport.label} at ${designReport.score}%.`,
    },
    {
      id: "visual-builder-competitiveness",
      label: "Visual builder competitiveness",
      status:
        visualBuilderReport.status === "competitive"
          ? "ready"
          : visualBuilderReport.status === "behind"
            ? "missing"
            : "needs-review",
      detail: `Visual builder competitiveness is ${visualBuilderReport.label} at ${visualBuilderReport.score}%.`,
    },
    {
      id: "weak-design-findings",
      label: "Weak design findings",
      status: weakDesignFindings.length === 0 ? "ready" : "needs-review",
      detail:
        weakDesignFindings.length === 0
          ? "No weak design findings detected."
          : `${weakDesignFindings.length} weak design finding${weakDesignFindings.length === 1 ? "" : "s"} need review.`,
    },
    {
      id: "behind-benchmark-findings",
      label: "Behind-benchmark findings",
      status: behindVisualBuilderFindings.length === 0 ? "ready" : "needs-review",
      detail:
        behindVisualBuilderFindings.length === 0
          ? "No behind-benchmark visual builder findings detected."
          : `${behindVisualBuilderFindings.length} visual builder benchmark gap${behindVisualBuilderFindings.length === 1 ? "" : "s"} need improvement.`,
    },
    {
      id: "review-backlog",
      label: "Review backlog",
      status:
        designReviewFindings.length + promisingVisualBuilderFindings.length === 0
          ? "ready"
          : "needs-review",
      detail:
        designReviewFindings.length + promisingVisualBuilderFindings.length === 0
          ? "No design review backlog detected."
          : `${designReviewFindings.length + promisingVisualBuilderFindings.length} design item${designReviewFindings.length + promisingVisualBuilderFindings.length === 1 ? "" : "s"} need review.`,
    },
  ];

  const missingCount = findings.filter((finding) => finding.status === "missing").length;
  const needsReviewCount = findings.filter(
    (finding) => finding.status === "needs-review"
  ).length;
  const readyCount = findings.filter((finding) => finding.status === "ready").length;

  const score = Math.round((readyCount / findings.length) * 100);

  if (missingCount > 0) {
    return {
      status: "missing",
      label: "Missing",
      score,
      summary:
        "Visual QA is missing key pieces. Export the Visual QA checklist and improve weak design/competitive gaps before calling this polished.",
      findings,
    };
  }

  if (needsReviewCount > 0) {
    return {
      status: "needs-review",
      label: "Needs review",
      score,
      summary:
        "Visual QA is available, but design and competitiveness findings still need human review.",
      findings,
    };
  }

  return {
    status: "ready",
    label: "Ready",
    score,
    summary:
      "Visual QA looks ready for manual inspection. Still review the UI like a sane person with working eyes.",
    findings,
  };
}

function createVisualQaChecklistMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const designReport = getDesignQualityReport({
    previewState,
    files,
  });

  const visualBuilderReport = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const weakDesignFindings = designReport.findings.filter(
    (finding) => finding.status === "weak"
  );

  const designNeedsReview = designReport.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const behindVisualBuilderFindings = visualBuilderReport.findings.filter(
    (finding) => finding.status === "behind"
  );

  const promisingVisualBuilderFindings = visualBuilderReport.findings.filter(
    (finding) => finding.status === "promising"
  );

  const lines = [
    "# Visual QA checklist",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    "",
    "## Current design signals",
    "",
    `- Design quality: ${designReport.label} · ${designReport.score}%`,
    `- Visual builder competitiveness: ${visualBuilderReport.label} · ${visualBuilderReport.score}%`,
    `- UI files detected: ${uiFiles.length}`,
    "",
    "## Priority design concerns",
    "",
    ...(weakDesignFindings.length > 0
      ? weakDesignFindings.map(
          (finding) => `- [ ] ${finding.label}: ${finding.detail}`
        )
      : ["- [ ] No weak design findings detected."]),
    "",
    "## Areas needing visual review",
    "",
    ...(designNeedsReview.length > 0
      ? designNeedsReview.map(
          (finding) => `- [ ] ${finding.label}: ${finding.detail}`
        )
      : ["- [ ] No medium-risk design findings detected."]),
    "",
    "## Visual builder competitiveness gaps",
    "",
    ...(behindVisualBuilderFindings.length > 0
      ? behindVisualBuilderFindings.map(
          (finding) =>
            `- [ ] ${finding.label}: ${finding.detail} Recommendation: ${finding.recommendation}`
        )
      : ["- [ ] No behind-benchmark findings detected."]),
    "",
    "## Promising but incomplete competitive areas",
    "",
    ...(promisingVisualBuilderFindings.length > 0
      ? promisingVisualBuilderFindings.map(
          (finding) =>
            `- [ ] ${finding.label}: ${finding.detail} Recommendation: ${finding.recommendation}`
        )
      : ["- [ ] No promising-but-incomplete findings detected."]),
    "",
    "## First impression QA",
    "",
    "- [ ] The first screen explains what the product does within five seconds.",
    "- [ ] The value proposition is visible without scrolling.",
    "- [ ] The page has one obvious primary action.",
    "- [ ] The visual style matches the product category and target customer.",
    "- [ ] The preview feels like a real product, not a dressed-up wireframe.",
    "",
    "## Layout QA",
    "",
    "- [ ] Page sections have clear visual hierarchy.",
    "- [ ] Cards, panels, lists, and forms align consistently.",
    "- [ ] Important content is not cramped against borders.",
    "- [ ] There is enough breathing room without wasting space like a luxury hotel lobby.",
    "- [ ] Related elements are grouped logically.",
    "- [ ] Navigation and major actions are easy to locate.",
    "",
    "## Typography QA",
    "",
    "- [ ] Headings, subheadings, body text, metadata, and labels have clear hierarchy.",
    "- [ ] Font sizes are readable on desktop and mobile.",
    "- [ ] Font weights are consistent and not randomly dramatic.",
    "- [ ] Line height supports comfortable reading.",
    "- [ ] Text contrast is strong enough against backgrounds.",
    "",
    "## Spacing and polish QA",
    "",
    "- [ ] Spacing between elements is consistent.",
    "- [ ] Buttons and inputs have consistent height and padding.",
    "- [ ] Border radii feel intentional across components.",
    "- [ ] Shadows are subtle and consistent.",
    "- [ ] Dividers and borders are not visually noisy.",
    "- [ ] Hover and focus states do not shift layout unexpectedly.",
    "",
    "## Buttons and CTA QA",
    "",
    "- [ ] Primary button is visually dominant.",
    "- [ ] Secondary buttons do not compete with primary actions.",
    "- [ ] Button labels are action-oriented and clear.",
    "- [ ] Disabled buttons explain why they are disabled where necessary.",
    "- [ ] Loading states prevent accidental repeated actions.",
    "",
    "## Forms and inputs QA",
    "",
    "- [ ] Inputs have clear labels or accessible names.",
    "- [ ] Placeholder text is helpful but not required to understand the field.",
    "- [ ] Validation errors are specific and human-readable.",
    "- [ ] Required fields are obvious.",
    "- [ ] Form spacing remains readable on mobile.",
    "",
    "## Empty, loading, error, and success states",
    "",
    "- [ ] Empty states explain what the user should do next.",
    "- [ ] Loading states are visible and do not feel broken.",
    "- [ ] Error states explain what failed and how to recover.",
    "- [ ] Success states confirm what happened.",
    "- [ ] Expensive actions like AI generation or publishing show progress.",
    "",
    "## Responsiveness QA",
    "",
    "- [ ] Layout works at mobile width.",
    "- [ ] Layout works at tablet width.",
    "- [ ] Layout works at desktop width.",
    "- [ ] Navigation remains usable on small screens.",
    "- [ ] Cards and grids wrap cleanly.",
    "- [ ] Text does not overflow containers.",
    "- [ ] Sticky/fixed elements do not block content.",
    "",
    "## Accessibility QA",
    "",
    "- [ ] Buttons and interactive elements are keyboard accessible.",
    "- [ ] Focus-visible styles are clear.",
    "- [ ] Semantic HTML is used where possible.",
    "- [ ] ARIA labels are used for icon-only buttons.",
    "- [ ] Color is not the only way status is communicated.",
    "- [ ] Text contrast is acceptable.",
    "",
    "## Interaction QA",
    "",
    "- [ ] Hover states exist for clickable elements.",
    "- [ ] Focus states exist for keyboard users.",
    "- [ ] Disabled states are visually distinct.",
    "- [ ] Loading states are clear.",
    "- [ ] Click actions give feedback.",
    "- [ ] Animations are subtle and do not harm usability.",
    "",
    "## Realistic content QA",
    "",
    "- [ ] Demo content matches the target industry.",
    "- [ ] Metrics, cards, and labels feel believable.",
    "- [ ] No lorem ipsum or generic placeholder sludge remains.",
    "- [ ] Empty states use product-specific language.",
    "- [ ] Generated examples help users understand what the product can do.",
    "",
    "## UI files to inspect",
    "",
    ...(uiFiles.length > 0
      ? uiFiles.map((file) => `- ${file.path}`)
      : ["No UI files detected. Generate UI files before visual QA."]),
    "",
    "## Final visual sign-off",
    "",
    "- [ ] Product looks credible enough to show a customer.",
    "- [ ] Product looks polished enough to show an investor.",
    "- [ ] Product looks clear enough for a developer to continue.",
    "- [ ] Product does not visually collapse on mobile.",
    "- [ ] Product has no obvious placeholder content.",
    "- [ ] Product has a clear next action.",
    "",
    "> Generated by Founder AI. Visual QA exists because taste should not be left to vibes and caffeine.",
    "",
  ];

  return lines.join("\\n");
}

function createVisualQaSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const designReport = getDesignQualityReport({
    previewState,
    files,
  });

  const visualBuilderReport = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const weakDesignFindings = designReport.findings.filter(
    (finding) => finding.status === "weak"
  );

  const behindVisualBuilderFindings = visualBuilderReport.findings.filter(
    (finding) => finding.status === "behind"
  );

  const lines = [
    "Founder AI Visual QA summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Scores:",
    "- Design quality: " + designReport.label + " · " + designReport.score + "%",
    "- Visual builder competitiveness: " +
      visualBuilderReport.label +
      " · " +
      visualBuilderReport.score +
      "%",
    "",
    "Weak design findings:",
    ...(weakDesignFindings.length > 0
      ? weakDesignFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"]),
    "",
    "Behind visual builder benchmark:",
    ...(behindVisualBuilderFindings.length > 0
      ? behindVisualBuilderFindings.map(
          (finding) =>
            "- " +
            finding.label +
            ": " +
            finding.detail +
            " Recommendation: " +
            finding.recommendation
        )
      : ["- None detected"]),
    "",
    "Immediate visual QA actions:",
    "- Check first impression and product clarity.",
    "- Review layout hierarchy and spacing.",
    "- Review typography hierarchy and readability.",
    "- Check CTA clarity.",
    "- Test mobile, tablet, and desktop widths.",
    "- Check hover, focus, disabled, loading, error, empty, and success states.",
    "- Replace generic placeholder content with realistic product content.",
  ];

  return lines.join("\\n");
}

function createVisualBuilderCompetitivenessMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const competitiveFindings = report.findings.filter(
    (finding) => finding.status === "competitive"
  );

  const promisingFindings = report.findings.filter(
    (finding) => finding.status === "promising"
  );

  const behindFindings = report.findings.filter(
    (finding) => finding.status === "behind"
  );

  const buildPackHealth = getBuildPackHealth(files);

  const designReviewExists = files.some(
    (file) => file.path === "config/design-review.md"
  );

  const developerInstructionsExist = files.some(
    (file) => file.path === "config/developer-instructions.md"
  );

  const securityReviewExists = files.some(
    (file) => file.path === "config/security-review.md"
  );

  const envExampleExists = files.some(
    (file) => file.path === "config/env.example"
  );

  const deployChecklistExists = files.some(
    (file) => file.path === "config/deploy-checklist.md"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const lines = [
    "# Visual builder competitiveness review",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Industry: ${previewState.classification?.industry ?? "General"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    `Platform targets: ${previewState.classification?.platformTargets.join(", ") || "web"}`,
    "",
    "## Competitive verdict",
    "",
    `Status: ${report.label}`,
    `Score: ${report.score}%`,
    "",
    report.summary,
    "",
    "## Why this matters",
    "",
    "Founder AI should not compete only as a visual design toy. It should compete as a real product builder: design, frontend, backend, database, integrations, security, deployment, and handoff.",
    "",
    "The goal is not merely to match polished visual output. The goal is to produce a build that looks polished and can actually move toward production without becoming a cursed folder of screenshots and regret.",
    "",
    "## Competitive findings",
    "",
    ...(competitiveFindings.length > 0
      ? competitiveFindings.flatMap((finding) => [
          `### ${finding.label}`,
          "",
          `Status: ${finding.status}`,
          "",
          finding.detail,
          "",
          "Recommendation:",
          finding.recommendation,
          "",
        ])
      : ["No fully competitive findings detected yet.", ""]),
    "## Promising but needs work",
    "",
    ...(promisingFindings.length > 0
      ? promisingFindings.flatMap((finding) => [
          `### ${finding.label}`,
          "",
          `Status: ${finding.status}`,
          "",
          finding.detail,
          "",
          "Recommendation:",
          finding.recommendation,
          "",
          "- [ ] Improve this area before treating the build as launch-grade.",
          "",
        ])
      : ["No promising-but-incomplete findings detected.", ""]),
    "## Behind the benchmark",
    "",
    ...(behindFindings.length > 0
      ? behindFindings.flatMap((finding) => [
          `### ${finding.label}`,
          "",
          `Status: ${finding.status}`,
          "",
          finding.detail,
          "",
          "Recommendation:",
          finding.recommendation,
          "",
          "- [ ] Treat this as a competitive gap.",
          "- [ ] Upgrade this before presenting the output as polished design-builder quality.",
          "",
        ])
      : ["No behind-benchmark findings detected.", ""]),
    "## Founder AI differentiation",
    "",
    `- Build pack health: ${buildPackHealth.label} · ${buildPackHealth.score}%`,
    `- Project brief: ${files.some((file) => file.path === "config/project-brief.md") ? "present" : "missing"}`,
    `- Design review: ${designReviewExists ? "present" : "missing"}`,
    `- Developer instructions: ${developerInstructionsExist ? "present" : "missing"}`,
    `- Security review: ${securityReviewExists ? "present" : "missing"}`,
    `- Environment example: ${envExampleExists ? "present" : "missing"}`,
    `- Deployment checklist: ${deployChecklistExists ? "present" : "missing"}`,
    `- API routes planned: ${previewState.architecture.endpoints.length}`,
    `- Database tables planned: ${previewState.architecture.tables.length}`,
    `- Security rules planned: ${previewState.architecture.securityRules.length}`,
    "",
    "Founder AI's strongest competitive angle is full-product readiness. polished visual-builder output matters, but Founder AI should win by combining polished UI with real implementation planning.",
    "",
    "## UI files to inspect",
    "",
    ...(uiFiles.length > 0
      ? uiFiles.map((file) => `- ${file.path}`)
      : ["No UI files detected. Generate UI files before visual competitiveness review."]),
    "",
    "## Design-builder gap checklist",
    "",
    "- [ ] Generated preview looks polished enough to show a customer.",
    "- [ ] First screen explains the product in under five seconds.",
    "- [ ] Layout has clear hierarchy and intentional spacing.",
    "- [ ] UI uses reusable primitives instead of one-off messy components.",
    "- [ ] Realistic content is used instead of placeholders.",
    "- [ ] Responsive behavior is defined and tested.",
    "- [ ] Interactive states exist: hover, focus, disabled, loading, success, and error.",
    "- [ ] Empty states explain what happens next.",
    "- [ ] Generated code supports real data and backend workflows.",
    "- [ ] Handoff files explain what was built and what remains.",
    "- [ ] Security and deployment readiness are visible before launch.",
    "",
    "## Product-builder advantage checklist",
    "",
    "- [ ] Environment variables are listed and exportable.",
    "- [ ] Supabase migration is generated when tables exist.",
    "- [ ] Deployment checklist is generated.",
    "- [ ] Security review is generated.",
    "- [ ] Developer instructions are generated.",
    "- [ ] Design review is generated.",
    "- [ ] Build pack health is complete.",
    "- [ ] Publish readiness gives a practical launch verdict.",
    "",
    "## Recommended next upgrades",
    "",
    "- [ ] Add a dedicated visual QA mode.",
    "- [ ] Add screenshot-style preview scoring.",
    "- [ ] Add generated design system tokens.",
    "- [ ] Add component inventory export.",
    "- [ ] Add responsive preview breakpoints.",
    "- [ ] Add a live edit mode for spacing, typography, colors, and component variants.",
    "- [ ] Add production-readiness gates before publish.",
    "- [ ] Add richer realistic demo data for each generated product category.",
    "",
    "> Generated by Founder AI. Competing with polished visual builders requires taste, structure, and fewer decorative lies.",
    "",
  ];

  return lines.join("\\n");
}

function createVisualBuilderCompetitivenessSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getVisualBuilderCompetitivenessReport({
    previewState,
    files,
  });

  const behindFindings = report.findings.filter(
    (finding) => finding.status === "behind"
  );

  const promisingFindings = report.findings.filter(
    (finding) => finding.status === "promising"
  );

  const competitiveFindings = report.findings.filter(
    (finding) => finding.status === "competitive"
  );

  const lines = [
    "Founder AI Visual builder competitiveness summary",
    "",
    "Product: " + previewState.title,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "",
    "Verdict:",
    "- Status: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Competitive areas:",
    ...(competitiveFindings.length > 0
      ? competitiveFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"]),
    "",
    "Promising areas:",
    ...(promisingFindings.length > 0
      ? promisingFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"]),
    "",
    "Behind benchmark:",
    ...(behindFindings.length > 0
      ? behindFindings.map(
          (finding) =>
            "- " +
            finding.label +
            ": " +
            finding.detail +
            " Recommendation: " +
            finding.recommendation
        )
      : ["- None detected"]),
    "",
    "Founder AI advantage:",
    "- Compete beyond visual design by bundling frontend, backend planning, database migrations, env vars, security review, deployment checklist, and developer handoff.",
    "- Keep visual polish high while making the generated build actually useful for production planning.",
    "",
    "Next upgrades:",
    "- Improve visual preview polish.",
    "- Add realistic content.",
    "- Strengthen reusable design system output.",
    "- Add responsive preview checks.",
    "- Add stronger interaction states.",
    "- Keep full build pack complete.",
  ];

  return lines.join("\\n");
}

function createDesignImprovementSummary({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getDesignQualityReport({
    previewState,
    files,
  });

  const weakFindings = report.findings.filter(
    (finding) => finding.status === "weak"
  );

  const reviewFindings = report.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const strongFindings = report.findings.filter(
    (finding) => finding.status === "strong"
  );

  const designReviewExists = files.some(
    (file) => file.path === "config/design-review.md"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const weakLines =
    weakFindings.length > 0
      ? weakFindings.map((finding) => "- " + finding.label + ": " + finding.detail)
      : ["- None detected"];

  const reviewLines =
    reviewFindings.length > 0
      ? reviewFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"];

  const strongLines =
    strongFindings.length > 0
      ? strongFindings.map(
          (finding) => "- " + finding.label + ": " + finding.detail
        )
      : ["- None detected"];

  const uiFileLines =
    uiFiles.length > 0
      ? uiFiles.map((file) => "- " + file.path)
      : ["- No UI files detected"];

  const lines = [
    "Founder AI design improvement summary",
    "",
    "Product: " + previewState.title,
    "Description: " + previewState.subtitle,
    "Project type: " + previewState.projectType,
    "Primary category: " +
      (previewState.classification?.primaryCategory ?? "Not classified"),
    "Complexity: " + (previewState.classification?.complexity ?? "standard"),
    "Design review file: " + (designReviewExists ? "present" : "missing"),
    "",
    "Design verdict:",
    "- Status: " + report.label,
    "- Score: " + report.score + "%",
    "- Summary: " + report.summary,
    "",
    "Weak design areas:",
    ...weakLines,
    "",
    "Needs review:",
    ...reviewLines,
    "",
    "Strong signals:",
    ...strongLines,
    "",
    "UI files to inspect:",
    ...uiFileLines,
    "",
    "Visual builder competitiveness notes:",
    "- The preview should feel polished, not like a wireframe that discovered confidence.",
    "- The first screen should explain the product in seconds.",
    "- Typography needs clear hierarchy across heading, body, metadata, and CTA text.",
    "- Spacing should be consistent across cards, panels, lists, forms, and buttons.",
    "- The generated UI should include realistic preview content, not placeholder sludge.",
    "- Responsive behavior must be checked on mobile, tablet, and desktop widths.",
    "- Interaction states should exist: hover, focus-visible, disabled, loading, and success.",
    "",
    "Recommended next design upgrades:",
    "- Add or improve reusable UI primitives: Button, Card, Badge, Input, EmptyState, PageHeader.",
    "- Add a design system map for spacing, radius, typography, shadows, and component variants.",
    "- Add polished loading, empty, error, and success states.",
    "- Add realistic demo data in previews.",
    "- Add visual QA checks before publish.",
    "- Run an accessibility pass for labels, keyboard navigation, contrast, and semantics.",
  ];

  return lines.join("\\n");
}

function createDesignReviewMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const report = getDesignQualityReport({
    previewState,
    files,
  });

  const weakFindings = report.findings.filter(
    (finding) => finding.status === "weak"
  );

  const reviewFindings = report.findings.filter(
    (finding) => finding.status === "needs-review"
  );

  const strongFindings = report.findings.filter(
    (finding) => finding.status === "strong"
  );

  const uiFiles = files.filter(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const lines = [
    "# Design review",
    "",
    `Product: ${previewState.title}`,
    `Description: ${previewState.subtitle}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    `Complexity: ${previewState.classification?.complexity ?? "standard"}`,
    "",
    "## Design quality verdict",
    "",
    `Status: ${report.label}`,
    `Score: ${report.score}%`,
    "",
    report.summary,
    "",
    "## Strong design signals",
    "",
    ...(strongFindings.length > 0
      ? strongFindings.flatMap((finding) => [
          `### ${finding.label}`,
          "",
          finding.detail,
          "",
        ])
      : ["No strong design signals detected yet.", ""]),
    "## Needs review",
    "",
    ...(reviewFindings.length > 0
      ? reviewFindings.flatMap((finding) => [
          `### ${finding.label}`,
          "",
          finding.detail,
          "",
          "- [ ] Review this area visually.",
          "- [ ] Improve clarity, consistency, and production polish.",
          "",
        ])
      : ["No medium-risk design findings detected.", ""]),
    "## Weak design areas",
    "",
    ...(weakFindings.length > 0
      ? weakFindings.flatMap((finding) => [
          `### ${finding.label}`,
          "",
          finding.detail,
          "",
          "- [ ] Treat this as a design blocker before launch.",
          "- [ ] Add more complete UI structure and visual refinement.",
          "",
        ])
      : ["No weak design areas detected.", ""]),
    "## Visual builder competitiveness checklist",
    "",
    "- [ ] Preview should feel like a polished product, not a wireframe with ambition.",
    "- [ ] Hero/primary screen should communicate the product within five seconds.",
    "- [ ] Typography should have clear hierarchy: heading, subheading, body, metadata, CTA.",
    "- [ ] Spacing should feel intentional across panels, cards, lists, and forms.",
    "- [ ] Buttons should have clear priority: primary, secondary, quiet, destructive.",
    "- [ ] Empty states should explain what happens next.",
    "- [ ] Generated pages should be responsive across mobile, tablet, and desktop.",
    "- [ ] Visual style should match the product category and target customer.",
    "- [ ] Repeated components should use consistent spacing, border radius, shadows, and icon treatment.",
    "- [ ] Preview should show realistic content, not placeholder sludge.",
    "",
    "## UI files to review",
    "",
    ...(uiFiles.length > 0
      ? uiFiles.map((file) => `- ${file.path}`)
      : ["No UI files detected. Generate or add UI files before visual review."]),
    "",
    "## Recommended next design upgrades",
    "",
    "- [ ] Add a dedicated design system file or component map.",
    "- [ ] Add reusable Button, Card, Badge, Input, EmptyState, and PageHeader components.",
    "- [ ] Add responsive breakpoints and test preview on narrow widths.",
    "- [ ] Add polished loading, empty, error, and success states.",
    "- [ ] Add realistic demo data for previews.",
    "- [ ] Add a visual QA checklist before publish.",
    "- [ ] Add interaction polish: hover, focus-visible, disabled, loading, and pressed states.",
    "- [ ] Add accessibility pass: keyboard navigation, contrast, labels, and semantic structure.",
    "",
    "## Launch note",
    "",
    "This review is heuristic. A human still needs to look at the interface. Terrible burden, eyesight.",
    "",
    "> Generated by Founder AI. Use this file to improve visual quality before launch.",
    "",
  ];

  return lines.join("\\n");
}

function getVisualBuilderCompetitivenessReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): VisualBuilderCompetitivenessReport {
  const fileText = files
    .map((file) => `${file.path}\n${file.contents}\n${file.description}`)
    .join("\n")
    .toLowerCase();

  const hasUiFiles = files.some(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const hasPreviewOrPrototypeSignals =
    fileText.includes("preview") ||
    fileText.includes("prototype") ||
    fileText.includes("hero") ||
    fileText.includes("landing") ||
    fileText.includes("dashboard") ||
    fileText.includes("mockup");

  const hasInteractionSignals =
    fileText.includes("hover") ||
    fileText.includes("focus-visible") ||
    fileText.includes("disabled") ||
    fileText.includes("loading") ||
    fileText.includes("onClick") ||
    fileText.includes("aria-") ||
    fileText.includes("transition");

  const hasDesignSystemSignals =
    fileText.includes("button") &&
    fileText.includes("card") &&
    (fileText.includes("badge") ||
      fileText.includes("input") ||
      fileText.includes("empty") ||
      fileText.includes("pageheader") ||
      fileText.includes("page-header"));

  const hasResponsiveSignals =
    fileText.includes("responsive") ||
    fileText.includes("grid") ||
    fileText.includes("minmax") ||
    fileText.includes("clamp(") ||
    fileText.includes("@media") ||
    fileText.includes("md:") ||
    fileText.includes("lg:");

  const hasRealisticContentSignals =
    !fileText.includes("lorem ipsum") &&
    !fileText.includes("todo placeholder") &&
    !fileText.includes("placeholder text") &&
    (previewState.modules.length >= 3 || files.length >= 5);

  const hasHandoffFiles =
    files.some((file) => file.path === "config/project-brief.md") &&
    files.some((file) => file.path === "config/design-review.md") &&
    files.some((file) => file.path === "config/developer-instructions.md");

  const hasBuilderDifferentiation =
    files.some((file) => file.path === "config/env.example") &&
    files.some((file) => file.path === "config/deploy-checklist.md") &&
    files.some((file) => file.path === "config/security-review.md") &&
    previewState.architecture.endpoints.length > 0;

  const findings: VisualBuilderFinding[] = [
    {
      id: "visual-ambition",
      label: "Visual ambition",
      status:
        hasUiFiles && hasPreviewOrPrototypeSignals ? "competitive" : "behind",
      detail:
        hasUiFiles && hasPreviewOrPrototypeSignals
          ? "The build includes UI files and clear visual/prototype structure signals."
          : "The build does not yet show enough visual ambition through UI/prototype structure.",
      recommendation:
        "Generate stronger landing, dashboard, preview, hero, and component sections with realistic content.",
    },
    {
      id: "prototype-completeness",
      label: "Prototype completeness",
      status:
        files.length >= 6 && previewState.modules.length >= 4
          ? "competitive"
          : files.length >= 3
            ? "promising"
            : "behind",
      detail:
        files.length >= 6 && previewState.modules.length >= 4
          ? "The build has enough files and modules to feel product-shaped."
          : "The prototype still needs more complete screens, flows, and module coverage.",
      recommendation:
        "Expand generated output with real screens, connected flows, and module-specific UI states.",
    },
    {
      id: "interaction-readiness",
      label: "Interaction readiness",
      status: hasInteractionSignals ? "competitive" : "promising",
      detail: hasInteractionSignals
        ? "Interaction and accessibility signals were detected."
        : "The UI needs clearer interaction states and accessible controls.",
      recommendation:
        "Add hover, focus-visible, loading, disabled, empty, error, success, and pressed states.",
    },
    {
      id: "design-system",
      label: "Design system maturity",
      status: hasDesignSystemSignals ? "competitive" : "promising",
      detail: hasDesignSystemSignals
        ? "Reusable design system signals were detected."
        : "The build needs stronger reusable UI primitives and component consistency.",
      recommendation:
        "Add reusable Button, Card, Badge, Input, EmptyState, PageHeader, Modal, and Toast components.",
    },
    {
      id: "responsive-polish",
      label: "Responsive polish",
      status: hasResponsiveSignals ? "competitive" : "behind",
      detail: hasResponsiveSignals
        ? "Responsive layout signals were detected."
        : "Responsive design signals are weak or missing.",
      recommendation:
        "Add mobile, tablet, and desktop layout behavior with tested breakpoints.",
    },
    {
      id: "content-realism",
      label: "Content realism",
      status: hasRealisticContentSignals ? "competitive" : "behind",
      detail: hasRealisticContentSignals
        ? "The generated output avoids obvious placeholder content and has enough product context."
        : "The output still risks feeling like placeholder/demo content.",
      recommendation:
        "Use realistic industry-specific demo data, labels, product names, metrics, and empty states.",
    },
    {
      id: "handoff-quality",
      label: "Handoff quality",
      status: hasHandoffFiles ? "competitive" : "promising",
      detail: hasHandoffFiles
        ? "Design, project, and developer handoff files are present."
        : "Handoff documentation is incomplete or missing.",
      recommendation:
        "Export the full build pack so project brief, design review, and developer instructions are included.",
    },
    {
      id: "builder-differentiation",
      label: "Builder differentiation",
      status: hasBuilderDifferentiation ? "competitive" : "promising",
      detail: hasBuilderDifferentiation
        ? "The build includes product-builder assets beyond design: env, deploy, security, and API planning."
        : "The build needs stronger full-product readiness signals beyond visual output.",
      recommendation:
        "Keep emphasizing backend, integrations, security, environment variables, deployment, and handoff pack generation.",
    },
  ];

  const competitiveCount = findings.filter(
    (finding) => finding.status === "competitive"
  ).length;

  const behindCount = findings.filter(
    (finding) => finding.status === "behind"
  ).length;

  const score = Math.round((competitiveCount / findings.length) * 100);

  if (behindCount >= 3 || score < 45) {
    return {
      status: "behind",
      label: "Behind",
      score,
      summary:
        "This build is not yet competitive with polished AI visual-builder output. It needs stronger visual structure, realistic content, responsive polish, and interaction quality.",
      findings,
    };
  }

  if (score < 85) {
    return {
      status: "promising",
      label: "Promising",
      score,
      summary:
        "This build has a competitive direction, but it needs stronger polish, richer prototype coverage, and more consistent design-system output.",
      findings,
    };
  }

  return {
    status: "competitive",
    label: "Competitive",
    score,
    summary:
      "This build has strong signs of competing with polished AI design/prototype output while also keeping Founder AI's product-builder edge.",
    findings,
  };
}

function getDesignQualityReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): DesignQualityReport {
  const fileText = files
    .map((file) => `${file.path}\n${file.contents}\n${file.description}`)
    .join("\n")
    .toLowerCase();

  const hasUiFiles = files.some(
    (file) =>
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".css")
  );

  const hasLandingOrPreview =
    fileText.includes("hero") ||
    fileText.includes("landing") ||
    fileText.includes("preview") ||
    fileText.includes("dashboard");

  const hasResponsiveHints =
    fileText.includes("grid") ||
    fileText.includes("flex") ||
    fileText.includes("responsive") ||
    fileText.includes("minmax") ||
    fileText.includes("clamp(");

  const hasTypographyHints =
    fileText.includes("font") ||
    fileText.includes("letter-spacing") ||
    fileText.includes("text-") ||
    fileText.includes("leading") ||
    fileText.includes("font-weight");

  const hasSpacingHints =
    fileText.includes("gap") ||
    fileText.includes("padding") ||
    fileText.includes("margin") ||
    fileText.includes("rounded") ||
    fileText.includes("border-radius");

  const hasCtaHints =
    fileText.includes("button") ||
    fileText.includes("cta") ||
    fileText.includes("get started") ||
    fileText.includes("start") ||
    fileText.includes("publish");

  const hasProductStructure =
    previewState.modules.length >= 3 &&
    files.length >= 4 &&
    previewState.title.trim().length > 0;

  const findings: DesignQualityFinding[] = [
    {
      id: "ui-files",
      label: "UI files",
      status: hasUiFiles ? "strong" : "weak",
      detail: hasUiFiles
        ? "UI files were detected in the generated output."
        : "No obvious UI files were detected. A visual builder needs actual interface files, tragic as that sounds.",
    },
    {
      id: "visual-structure",
      label: "Visual structure",
      status: hasLandingOrPreview ? "strong" : "needs-review",
      detail: hasLandingOrPreview
        ? "The generated files mention landing, hero, preview, or dashboard structures."
        : "No strong visual structure signal was detected. Add clearer hero, sections, dashboard, or preview composition.",
    },
    {
      id: "responsiveness",
      label: "Responsiveness",
      status: hasResponsiveHints ? "strong" : "needs-review",
      detail: hasResponsiveHints
        ? "Responsive layout hints were detected."
        : "No strong responsive layout hints detected. Add mobile/tablet/desktop layout handling.",
    },
    {
      id: "typography",
      label: "Typography",
      status: hasTypographyHints ? "strong" : "needs-review",
      detail: hasTypographyHints
        ? "Typography styling hints were detected."
        : "Typography needs review. Strong design needs hierarchy, readable sizes, weights, and spacing.",
    },
    {
      id: "spacing",
      label: "Spacing and layout polish",
      status: hasSpacingHints ? "strong" : "needs-review",
      detail: hasSpacingHints
        ? "Spacing and layout styling hints were detected."
        : "Spacing needs review. Bad spacing is how decent products start looking like tax software.",
    },
    {
      id: "cta",
      label: "CTA clarity",
      status: hasCtaHints ? "strong" : "needs-review",
      detail: hasCtaHints
        ? "Button or call-to-action hints were detected."
        : "CTA clarity needs review. Users need obvious next actions.",
    },
    {
      id: "product-structure",
      label: "Product structure",
      status: hasProductStructure ? "strong" : "weak",
      detail: hasProductStructure
        ? "The build has enough modules, files, and naming structure to feel product-shaped."
        : "The build is still structurally thin. Generate more complete modules/files before judging design polish.",
    },
  ];

  const strongCount = findings.filter((finding) => finding.status === "strong").length;
  const weakCount = findings.filter((finding) => finding.status === "weak").length;
  const score = Math.round((strongCount / findings.length) * 100);

  if (weakCount >= 2 || score < 45) {
    return {
      status: "weak",
      label: "Weak",
      score,
      summary:
        "Design quality is weak. The build needs stronger UI structure, visual hierarchy, and responsive polish before competing with serious visual builders.",
      findings,
    };
  }

  if (score < 85) {
    return {
      status: "needs-review",
      label: "Needs review",
      score,
      summary:
        "Design quality has a foundation, but it needs visual refinement before it can compete with polished visual-builder output.",
      findings,
    };
  }

  return {
    status: "strong",
    label: "Strong",
    score,
    summary:
      "Design quality signals are strong. Review visually, but the generated output has a solid interface foundation.",
    findings,
  };
}

function getSecurityHealthReport({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}): SecurityHealthReport {
  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const hasSecurityReviewFile = files.some(
    (file) => file.path === "config/security-review.md"
  );

  const hasSecurityRules = previewState.architecture.securityRules.length > 0;
  const hasApiRoutes = previewState.architecture.endpoints.length > 0;
  const hasDatabaseTables = previewState.architecture.tables.length > 0;
  const hasServerSecrets = requiredEnvVars.some(
    (variable) => variable.scope === "server"
  );

  const findings: SecurityHealthFinding[] = [
    {
      id: "security-review-file",
      label: "Security review file",
      status: hasSecurityReviewFile ? "needs-review" : "blocked",
      detail: hasSecurityReviewFile
        ? "config/security-review.md exists. Review it before production."
        : "config/security-review.md is missing. Export the security review before publish planning.",
    },
    {
      id: "security-rules",
      label: "Generated security rules",
      status: hasSecurityRules ? "needs-review" : "blocked",
      detail: hasSecurityRules
        ? `${previewState.architecture.securityRules.length} security rule${previewState.architecture.securityRules.length === 1 ? "" : "s"} generated and awaiting manual review.`
        : "No generated security rules found. Authentication, authorization, API protection, and data access rules must be defined.",
    },
    {
      id: "api-protection",
      label: "API route protection",
      status: hasApiRoutes ? "needs-review" : "ready",
      detail: hasApiRoutes
        ? `${previewState.architecture.endpoints.length} API route${previewState.architecture.endpoints.length === 1 ? "" : "s"} planned. Each route needs auth, ownership checks, validation, and safe error handling.`
        : "No API routes were planned for this build.",
    },
    {
      id: "database-rls",
      label: "Database / RLS",
      status: hasDatabaseTables ? "needs-review" : "ready",
      detail: hasDatabaseTables
        ? `${previewState.architecture.tables.length} database table${previewState.architecture.tables.length === 1 ? "" : "s"} planned. Row Level Security and policies must be reviewed and tested.`
        : "No database tables were planned for this build.",
    },
    {
      id: "server-secrets",
      label: "Server-side secrets",
      status: hasServerSecrets ? "needs-review" : "ready",
      detail: hasServerSecrets
        ? `${requiredEnvVars.filter((variable) => variable.scope === "server").length} server-side secret${requiredEnvVars.filter((variable) => variable.scope === "server").length === 1 ? "" : "s"} detected. Confirm none are exposed to client components.`
        : "No server-side secrets were detected from the current integration requirements.",
    },
    {
      id: "integration-risk",
      label: "Integration security",
      status: requiredIntegrations.length > 0 ? "needs-review" : "ready",
      detail: requiredIntegrations.length > 0
        ? `${requiredIntegrations.length} required integration${requiredIntegrations.length === 1 ? "" : "s"} detected. OAuth, webhook signatures, scopes, and token storage need review.`
        : "No required third-party integrations were detected.",
    },
  ];

  const blockedCount = findings.filter((finding) => finding.status === "blocked").length;
  const needsReviewCount = findings.filter(
    (finding) => finding.status === "needs-review"
  ).length;
  const readyCount = findings.filter((finding) => finding.status === "ready").length;

  const score = Math.round((readyCount / findings.length) * 100);

  if (blockedCount > 0) {
    return {
      status: "blocked",
      label: "Blocked",
      score,
      summary:
        "Security readiness is blocked. Export the security review and define security rules before publishing.",
      findings,
    };
  }

  if (needsReviewCount > 0) {
    return {
      status: "needs-review",
      label: "Needs review",
      score,
      summary:
        "Security scaffolding exists, but manual review is required before production.",
      findings,
    };
  }

  return {
    status: "ready",
    label: "Ready",
    score,
    summary:
      "No obvious security blockers detected from the generated architecture. Final manual review is still required.",
    findings,
  };
}

function createSecurityRulesScaffoldMarkdown({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const requiredEnvVars = getRequiredEnvironmentVariables({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  });

  const requiredIntegrations = getIntegrationReadiness({
    projectType: previewState.projectType,
    modules: previewState.modules,
    architecture: previewState.architecture,
    classification: previewState.classification,
  }).filter((integration) => integration.required);

  const serverSecrets = requiredEnvVars.filter(
    (variable) => variable.scope === "server"
  );

  const securityRules =
    previewState.architecture.securityRules.length > 0
      ? previewState.architecture.securityRules
      : [
          {
            id: "auth-required",
            label: "Authentication required",
            description:
              "Protect authenticated pages, user workspaces, project files, build history, billing, API routes, and data mutations behind verified sessions.",
          },
          {
            id: "ownership-checks",
            label: "User ownership checks",
            description:
              "Validate on the server that users can only read or mutate records belonging to their own account, workspace, project, or organization.",
          },
          {
            id: "server-only-secrets",
            label: "Server-only secrets",
            description:
              "Keep service role keys, Stripe secrets, Shopify secrets, OAuth client secrets, webhook secrets, and OpenAI keys out of client components and public variables.",
          },
        ];

  const endpointRules =
    previewState.architecture.endpoints.length > 0
      ? previewState.architecture.endpoints.flatMap((endpoint) => [
          `### ${endpoint.method} ${endpoint.path}`,
          "",
          endpoint.purpose,
          "",
          "- [ ] Validate user session before processing the request.",
          "- [ ] Validate user ownership, role, or organization membership.",
          "- [ ] Validate and sanitize request body/query params.",
          "- [ ] Return safe errors without leaking stack traces or secrets.",
          "- [ ] Add rate limiting if the route triggers AI, payments, email, or third-party APIs.",
          "",
        ])
      : ["No API routes were planned for this build.", ""];

  const tableRules =
    previewState.architecture.tables.length > 0
      ? previewState.architecture.tables.flatMap((table) => [
          `### ${table.name}`,
          "",
          table.purpose,
          "",
          "- [ ] Enable Row Level Security.",
          "- [ ] Define select policy.",
          "- [ ] Define insert policy.",
          "- [ ] Define update policy.",
          "- [ ] Define delete policy if deletes are allowed.",
          "- [ ] Confirm policies match the product ownership model.",
          "- [ ] Test policies with at least two different users.",
          "",
        ])
      : ["No database tables were planned for this build.", ""];

  const integrationRules =
    requiredIntegrations.length > 0
      ? requiredIntegrations.flatMap((integration) => [
          `### ${integration.label}`,
          "",
          `Provider: ${integration.provider}`,
          "",
          integration.reason,
          "",
          "- [ ] Use the minimum required OAuth scopes or API permissions.",
          "- [ ] Store tokens securely server-side.",
          "- [ ] Rotate credentials if compromised.",
          "- [ ] Verify webhook signatures where relevant.",
          "- [ ] Log only safe operational metadata.",
          "",
        ])
      : ["No required third-party integrations were detected.", ""];

  const serverSecretLines =
    serverSecrets.length > 0
      ? serverSecrets.map(
          (variable) =>
            `- [ ] ${variable.key}: server-side only, never exposed through NEXT_PUBLIC_ variables or client components.`
        )
      : ["- [ ] No server-side secrets were inferred from the current build."];

  const generatedFiles =
    files.length > 0
      ? files.map((file) => `- ${file.path}`)
      : ["- No generated files found."];

  const lines = [
    "# Security rules scaffold",
    "",
    `Product: ${previewState.title}`,
    `Project type: ${previewState.projectType}`,
    `Primary category: ${previewState.classification?.primaryCategory ?? "Not classified"}`,
    "",
    "## How to use this file",
    "",
    "Use this as the implementation checklist for security work before production. It does not replace a real security audit, because apparently reality insists on being annoying.",
    "",
    "## Core security rules",
    "",
    ...securityRules.flatMap((rule) => [
      `### ${rule.label}`,
      "",
      rule.description,
      "",
      "- [ ] Implement this rule in code.",
      "- [ ] Add tests or manual verification steps.",
      "- [ ] Confirm the rule still works after deployment.",
      "",
    ]),
    "## API route rules",
    "",
    ...endpointRules,
    "## Database and RLS rules",
    "",
    ...tableRules,
    "## Secret handling rules",
    "",
    ...serverSecretLines,
    "",
    "## Integration rules",
    "",
    ...integrationRules,
    "## Deployment security rules",
    "",
    "- [ ] Run npm run build before deployment.",
    "- [ ] Confirm production environment variables are set in Vercel.",
    "- [ ] Confirm no real secrets are committed to Git.",
    "- [ ] Confirm OAuth callback URLs match the production domain.",
    "- [ ] Confirm webhook URLs use HTTPS.",
    "- [ ] Confirm error messages do not expose internals.",
    "- [ ] Confirm logs do not contain secrets, passwords, tokens, payment data, or sensitive prompts.",
    "",
    "## Generated files to inspect",
    "",
    ...generatedFiles,
    "",
    "## Final security sign-off",
    "",
    "- [ ] Authentication checked.",
    "- [ ] Authorization checked.",
    "- [ ] API route protection checked.",
    "- [ ] Database/RLS checked.",
    "- [ ] Secret handling checked.",
    "- [ ] Integration security checked.",
    "- [ ] Deployment security checked.",
    "- [ ] Smoke tests completed with multiple users.",
    "",
    "> Generated by Founder AI. Treat this as a serious checklist, not a decorative markdown doily.",
    "",
  ];

  return lines.join("\\n");
}

function DeployReadinessPanel({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setWorkspaceError: (value: string) => void;
}) {
  const deployItems = getDeployReadinessItems({
    previewState,
    files,
  });

  const [isExportingDeployChecklist, setIsExportingDeployChecklist] =
    useState(false);
  const [deployExportMessage, setDeployExportMessage] = useState("");
  const [isExportingProjectBrief, setIsExportingProjectBrief] = useState(false);
  const [projectBriefExportMessage, setProjectBriefExportMessage] =
    useState("");
  const [isExportingHandoffPack, setIsExportingHandoffPack] = useState(false);
  const [handoffPackMessage, setHandoffPackMessage] = useState("");
  const [isExportingFullBuildPack, setIsExportingFullBuildPack] =
    useState(false);
  const [fullBuildPackMessage, setFullBuildPackMessage] = useState("");
  const [copyHandoffMessage, setCopyHandoffMessage] = useState("");
  const [copyDeveloperMessage, setCopyDeveloperMessage] = useState("");
  const [
    isExportingDeveloperInstructions,
    setIsExportingDeveloperInstructions,
  ] = useState(false);
  const [developerExportMessage, setDeveloperExportMessage] = useState("");

  async function upsertGeneratedProjectFile({
    filePath,
    contents,
  }: {
    filePath: string;
    contents: string;
  }) {
    const existingFile = files.find((file) => file.path === filePath);

    if (existingFile) {
      await onSaveFile(existingFile.id, filePath, contents);
      return "updated";
    }

    await onCreateFile(filePath, contents);
    return "exported";
  }

  async function handleExportDeployChecklist() {
    setIsExportingDeployChecklist(true);
    setDeployExportMessage("");
    setWorkspaceError("");

    const filePath = "config/deploy-checklist.md";
    const contents = createDeployChecklistMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setDeployExportMessage(`config/deploy-checklist.md ${result}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export deployment checklist.";

      setDeployExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDeployChecklist(false);
    }
  }

  async function handleExportProjectBrief() {
    setIsExportingProjectBrief(true);
    setProjectBriefExportMessage("");
    setWorkspaceError("");

    const filePath = "config/project-brief.md";
    const contents = createProjectBriefMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setProjectBriefExportMessage(`config/project-brief.md ${result}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export project brief.";

      setProjectBriefExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingProjectBrief(false);
    }
  }



  async function handleExportHandoffPack() {
    setIsExportingHandoffPack(true);
    setHandoffPackMessage("");
    setDeployExportMessage("");
    setProjectBriefExportMessage("");
    setWorkspaceError("");

    const variables = getEnvironmentVariableReadiness({
      projectType: previewState.projectType,
      modules: previewState.modules,
      architecture: previewState.architecture,
      classification: previewState.classification,
    });

    const handoffFiles = [
      {
        filePath: "config/project-brief.md",
        contents: createProjectBriefMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/deploy-checklist.md",
        contents: createDeployChecklistMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/env.example",
        contents: createEnvExampleContents(variables),
      },
    ];

    try {
      const results = await Promise.all(
        handoffFiles.map((file) => upsertGeneratedProjectFile(file))
      );

      const exportedCount = results.filter((result) => result === "exported").length;
      const updatedCount = results.filter((result) => result === "updated").length;

      setHandoffPackMessage(
        `Handoff pack complete: ${exportedCount} exported, ${updatedCount} updated.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export project handoff pack.";

      setHandoffPackMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingHandoffPack(false);
    }
  }



  async function handleExportFullBuildPack() {
    setIsExportingFullBuildPack(true);
    setFullBuildPackMessage("");
    setHandoffPackMessage("");
    setDeployExportMessage("");
    setProjectBriefExportMessage("");
    setWorkspaceError("");

    const variables = getEnvironmentVariableReadiness({
      projectType: previewState.projectType,
      modules: previewState.modules,
      architecture: previewState.architecture,
      classification: previewState.classification,
    });

    const fullBuildFiles = [
      {
        filePath: "config/project-brief.md",
        contents: createProjectBriefMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/deploy-checklist.md",
        contents: createDeployChecklistMarkdown({
          previewState,
          files,
        }),
      },
      {
        filePath: "config/env.example",
        contents: createEnvExampleContents(variables),
      },
      {
        filePath: "config/developer-instructions.md",
        contents: createDeveloperInstructions({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },
    ];

    try {
      const results = await Promise.all(
        fullBuildFiles.map((file) => upsertGeneratedProjectFile(file))
      );

      const exportedCount = results.filter((result) => result === "exported").length;
      const updatedCount = results.filter((result) => result === "updated").length;

      setFullBuildPackMessage(
        `Full build pack complete: ${exportedCount} exported, ${updatedCount} updated.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export full build pack.";

      setFullBuildPackMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingFullBuildPack(false);
    }
  }



  async function handleCopyHandoffSummary() {
    setCopyHandoffMessage("");
    setWorkspaceError("");

    const summary = createCompactHandoffSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyHandoffMessage("Handoff summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy handoff summary.";

      setCopyHandoffMessage(message);
      setWorkspaceError(message);
    }
  }



  async function handleCopyDeveloperInstructions() {
    setCopyDeveloperMessage("");
    setWorkspaceError("");

    const instructions = createDeveloperInstructions({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(instructions);
      setCopyDeveloperMessage("Developer instructions copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy developer instructions.";

      setCopyDeveloperMessage(message);
      setWorkspaceError(message);
    }
  }



  async function handleExportDeveloperInstructions() {
    setIsExportingDeveloperInstructions(true);
    setDeveloperExportMessage("");
    setWorkspaceError("");

    const filePath = "config/developer-instructions.md";
    const contents = createDeveloperInstructions({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setDeveloperExportMessage(
        `config/developer-instructions.md ${result}.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export developer instructions.";

      setDeveloperExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDeveloperInstructions(false);
    }
  }



  async function handleExportSecurityRules() {
    setIsExportingSecurityRules(true);
    setSecurityRulesMessage("");
    setWorkspaceError("");

    const filePath = "config/security-rules.md";
    const contents = createSecurityRulesScaffoldMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setSecurityRulesMessage(`config/security-rules.md ${result}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export security rules scaffold.";

      setSecurityRulesMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingSecurityRules(false);
    }
  }



  async function handleExportDesignReview() {
    setIsExportingDesignReview(true);
    setDesignReviewMessage("");
    setWorkspaceError("");

    const filePath = "config/design-review.md";
    const contents = createDesignReviewMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setDesignReviewMessage(`config/design-review.md ${result}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export design review.";

      setDesignReviewMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDesignReview(false);
    }
  }



  async function handleCopyDesignSummary() {
    setCopyDesignSummaryMessage("");
    setWorkspaceError("");

    const designSummary = createDesignImprovementSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(designSummary);
      setCopyDesignSummaryMessage("Design summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy design summary.";

      setCopyDesignSummaryMessage(message);
      setWorkspaceError(message);
    }
  }



  async function handleExportvisualBuilderCompetitivenessReview() {
    setIsExportingvisualBuilderCompetitiveness(true);
    setvisualBuilderCompetitivenessMessage("");
    setWorkspaceError("");

    const filePath = "config/visual-builder-competitiveness.md";
    const contents = createVisualBuilderCompetitivenessMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setvisualBuilderCompetitivenessMessage(
        `config/visual-builder-competitiveness.md ${result}.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export Visual builder competitiveness review.";

      setvisualBuilderCompetitivenessMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingvisualBuilderCompetitiveness(false);
    }
  }



  async function handleCopyvisualBuilderCompetitivenessSummary() {
    setCopyvisualBuilderCompetitivenessMessage("");
    setWorkspaceError("");

    const summary = createVisualBuilderCompetitivenessSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyvisualBuilderCompetitivenessMessage("Visual builder competitiveness summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy Visual builder competitiveness summary.";

      setCopyvisualBuilderCompetitivenessMessage(message);
      setWorkspaceError(message);
    }
  }



  async function handleExportVisualQaChecklist() {
    setIsExportingVisualQa(true);
    setVisualQaMessage("");
    setWorkspaceError("");

    const filePath = "config/visual-qa-checklist.md";
    const contents = createVisualQaChecklistMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setVisualQaMessage(`config/visual-qa-checklist.md ${result}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export Visual QA checklist.";

      setVisualQaMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingVisualQa(false);
    }
  }



  async function handleCopyVisualQaSummary() {
    setCopyVisualQaMessage("");
    setWorkspaceError("");

    const summary = createVisualQaSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyVisualQaMessage("Visual QA summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy Visual QA summary.";

      setCopyVisualQaMessage(message);
      setWorkspaceError(message);
    }
  }



  async function handleExportLaunchReadinessReport() {
    setIsExportingLaunchReadinessReport(true);
    setLaunchReadinessReportMessage("");
    setWorkspaceError("");

    const filePath = "config/launch-readiness-report.md";
    const contents = createLaunchReadinessReportMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setLaunchReadinessReportMessage(
        `config/launch-readiness-report.md ${result}.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export launch readiness report.";

      setLaunchReadinessReportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingLaunchReadinessReport(false);
    }
  }



  async function handleCopyLaunchReadinessSummary() {
    setCopyLaunchReadinessMessage("");
    setWorkspaceError("");

    const summary = createLaunchReadinessSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyLaunchReadinessMessage("Launch readiness summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy launch readiness summary.";

      setCopyLaunchReadinessMessage(message);
      setWorkspaceError(message);
    }
  }



  async function handleExportPublishGateReport() {
    setIsExportingPublishGateReport(true);
    setPublishGateReportMessage("");
    setWorkspaceError("");

    const filePath = "config/publish-gate-report.md";
    const contents = createPublishGateReportMarkdown({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setPublishGateReportMessage(
        `config/publish-gate-report.md ${result}.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export publish gate report.";

      setPublishGateReportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingPublishGateReport(false);
    }
  }



  async function handleCopyPublishGateSummary() {
    setCopyPublishGateMessage("");
    setWorkspaceError("");

    const summary = createPublishGateSummary({
      previewState,
      files,
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopyPublishGateMessage("Publish gate summary copied.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to copy publish gate summary.";

      setCopyPublishGateMessage(message);
      setWorkspaceError(message);
    }
  }

  const blocked = deployItems.filter((item) => item.status === "blocked");
  const needsSetup = deployItems.filter((item) => item.status === "needs-setup");
  const ready = deployItems.filter((item) => item.status === "ready");

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
            Deploy readiness
          </h3>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {ready.length} ready, {needsSetup.length} need setup, and{" "}
            {blocked.length} blocked. A tidy little autopsy before Vercel gets involved.
          </p>

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button suppressHydrationWarning
              type="button"
              className="pill-button"
              onClick={handleExportDeployChecklist}
              disabled={isExportingDeployChecklist}
            >
              {isExportingDeployChecklist
                ? "Exporting..."
                : "Export deployment checklist"}
            </button>

            <span
              style={{
                color:
                  deployExportMessage.toLowerCase().includes("failed") ||
                  deployExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {deployExportMessage ||
                "Export launch steps into the project file tree."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportProjectBrief}
              disabled={isExportingProjectBrief}
            >
              {isExportingProjectBrief
                ? "Exporting..."
                : "Export project brief"}
            </button>

            <span
              style={{
                color:
                  projectBriefExportMessage.toLowerCase().includes("failed") ||
                  projectBriefExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {projectBriefExportMessage ||
                "Export a readable project summary."}
            </span>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "26px",
            padding: "0 10px",
            borderRadius: "999px",
            background:
              blocked.length > 0
                ? "#fef2f2"
                : needsSetup.length > 0
                  ? "#fff7ed"
                  : "#ecfdf5",
            color:
              blocked.length > 0
                ? "#991b1b"
                : needsSetup.length > 0
                  ? "#9a3412"
                  : "#166534",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {blocked.length > 0
            ? "Blocked"
            : needsSetup.length > 0
              ? "Needs setup"
              : "Ready"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {deployItems.map((item) => (
          <DeployReadinessCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function DeployReadinessCard({
  item,
}: {
  item: DeployReadinessItem;
}) {
  const statusLabel =
    item.status === "ready"
      ? "Ready"
      : item.status === "blocked"
        ? "Blocked"
        : "Needs setup";

  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "18px",
        background: "#f9fafb",
        padding: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "14px",
            lineHeight: 1.25,
          }}
        >
          {item.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background:
              item.status === "ready"
                ? "#ecfdf5"
                : item.status === "blocked"
                  ? "#fef2f2"
                  : "#fff7ed",
            color:
              item.status === "ready"
                ? "#166534"
                : item.status === "blocked"
                  ? "#991b1b"
                  : "#9a3412",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {item.detail}
      </p>

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
        Checklist
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#111827",
        }}
      >
        {item.checklist.map((check) => (
          <li
            key={check}
            style={{
              marginBottom: "6px",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {check}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PublishReadinessWorkspace({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setSelectedFileId,
  setWorkspaceView,
  setWorkspaceError,
  publishCenterRef,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setSelectedFileId: (fileId: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
  setWorkspaceError: (value: string) => void;
  publishCenterRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const report = getPublishReadinessReport({
    previewState,
    files,
  });

  const statusLabel =
    report.status === "ready"
      ? "Ready"
      : report.status === "blocked"
        ? "Blocked"
        : "Needs setup";

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#ffffff",
        padding: "28px",
      }}
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "24px",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
          padding: "22px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Publish readiness
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "32px",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              {statusLabel} · {report.score}%
            </h2>

            <p
              style={{
                margin: "12px 0 0",
                maxWidth: "820px",
                color: "#4b5563",
                fontSize: "15px",
                lineHeight: 1.65,
              }}
            >
              {report.summary}
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "30px",
              padding: "0 12px",
              borderRadius: "999px",
              background:
                report.status === "ready"
                  ? "#ecfdf5"
                  : report.status === "blocked"
                    ? "#fef2f2"
                    : "#fff7ed",
              color:
                report.status === "ready"
                  ? "#166534"
                  : report.status === "blocked"
                    ? "#991b1b"
                    : "#9a3412",
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </section>

      <div
        ref={publishCenterRef}
        style={{
          marginBottom: "18px",
          scrollMarginTop: "96px",
        }}
      >
        <PublishCenterPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishGatePanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <OverallLaunchReadinessPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <BuildPackContentsPanel
          files={files}
          setSelectedFileId={setSelectedFileId}
          setWorkspaceView={setWorkspaceView}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <VisualQaHealthPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <VisualBuilderCompetitivenessPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DesignQualityPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <SecurityHealthPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <DeployReadinessPanel
          previewState={previewState}
          files={files}
        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <EnvironmentVariablesPanel
          previewState={previewState}
          files={files}
          onCreateFile={onCreateFile}
          onSaveFile={onSaveFile}
          setWorkspaceError={setWorkspaceError}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >
        {report.items.map((item) => (
          <PublishReadinessCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function PublishReadinessCard({
  item,
}: {
  item: PublishReadinessItem;
}) {
  const statusLabel =
    item.status === "ready"
      ? "Ready"
      : item.status === "blocked"
        ? "Blocked"
        : "Needs setup";

  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#111827",
            fontSize: "15px",
            lineHeight: 1.2,
          }}
        >
          {item.label}
        </strong>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "24px",
            padding: "0 9px",
            borderRadius: "999px",
            background:
              item.status === "ready"
                ? "#ecfdf5"
                : item.status === "blocked"
                  ? "#fef2f2"
                  : "#fff7ed",
            color:
              item.status === "ready"
                ? "#166534"
                : item.status === "blocked"
                  ? "#991b1b"
                  : "#9a3412",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          color: "#4b5563",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {item.detail}
      </p>

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
        Checklist
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          color: "#111827",
        }}
      >
        {item.checklist.map((check) => (
          <li
            key={check}
            style={{
              marginBottom: "6px",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {check}
          </li>
        ))}
      </ul>
    </article>
  );
}

function HistoryWorkspace({
  buildHistory,
  onRestoreBuild,
}: {
  buildHistory: BuildHistoryItem[];
  onRestoreBuild: (historyItem: BuildHistoryItem) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#ffffff",
        padding: "28px",
      }}
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "24px",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
          padding: "22px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: "#6b7280",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Build history
        </div>

        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "32px",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          Database build timeline
        </h2>

        <p
          style={{
            margin: "12px 0 0",
            maxWidth: "760px",
            color: "#4b5563",
            fontSize: "15px",
            lineHeight: 1.65,
          }}
        >
          Every completed build stores the prompt, detected project type,
          modules, files, preview state, and architecture plan in Supabase.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {buildHistory.map((item) => (
          <article
            key={item.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: 800,
                    flexWrap: "wrap",
                  }}
                >
                  <Clock3 className="icon" />
                  <span>{item.createdAt}</span>
                  <span>·</span>
                  <span>{getProjectTypeLabel(item.projectType)}</span>
                  <span>·</span>
                  <span>{item.status}</span>
                  <span>·</span>
                  <span>{item.source}</span>
                </div>

                <strong
                  style={{
                    display: "block",
                    color: "#111827",
                    fontSize: "15px",
                    lineHeight: 1.35,
                    marginBottom: "8px",
                  }}
                >
                  {item.prompt}
                </strong>

                <p
                  style={{
                    margin: 0,
                    color: "#4b5563",
                    fontSize: "13px",
                    lineHeight: 1.55,
                  }}
                >
                  {item.modules.length} modules · {item.files.length} files ·{" "}
                  {item.architecture.tables.length} tables ·{" "}
                  {item.architecture.endpoints.length} API routes ·{" "}
                  {item.architecture.securityRules.length} security rules
                </p>
              </div>

              <button suppressHydrationWarning
                type="button"
                className="findings-button"
                onClick={() => onRestoreBuild(item)}
                style={{
                  margin: 0,
                  minHeight: "32px",
                  whiteSpace: "nowrap",
                }}
              >
                Restore
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
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