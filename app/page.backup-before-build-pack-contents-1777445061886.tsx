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
      <PreviewToolbar />
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
                {feedItems.map((item) => (
                  <FeedMessage
                    key={item.id}
                    item={item}
                    onApprovePlan={approvePlan}
                    onDismissPlan={dismissPlan}
                    isBuilding={isBuilding}
                  />
                ))}
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

function PreviewToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
}: {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  fileCountLabel: string;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
}) {
  return (
    <header className="preview-toolbar">
      <button suppressHydrationWarning
        type="button"
        className="preview-button"
        onClick={() => setWorkspaceView("preview")}
        aria-pressed={workspaceView === "preview"}
      >
        <Globe2 className="icon" />
        Preview
      </button>

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
        aria-label="Publish readiness"
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

      <button suppressHydrationWarning
        type="button"
        className="publish-button"
        aria-label="Open publish readiness"
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        Publish
      </button>
    </header>
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