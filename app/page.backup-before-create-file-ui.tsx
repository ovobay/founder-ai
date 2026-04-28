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
type WorkspaceView = "preview" | "code" | "architecture" | "history";

type ProjectType =
  | "marketing-site"
  | "saas"
  | "web-app"
  | "crm"
  | "shopify-store"
  | "shopify-app"
  | "marketing-engine"
  | "mobile-app";

type BuildStepStatus = "pending" | "active" | "complete";
type AssistantStatus = "building" | "completed";

type BuildStep = {
  id: string;
  label: string;
  detail: string;
  status: BuildStepStatus;
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

type FeedItem =
  | {
      id: string;
      role: "user";
      body: string;
      projectType: ProjectType;
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
  const labels: Record<ProjectType, string> = {
    "marketing-site": "Marketing site",
    saas: "SaaS",
    "web-app": "Web app",
    crm: "CRM",
    "shopify-store": "Shopify store",
    "shopify-app": "Shopify app",
    "marketing-engine": "Marketing engine",
    "mobile-app": "Mobile app",
  };

  return labels[projectType];
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
  return [
    "marketing-site",
    "saas",
    "web-app",
    "crm",
    "shopify-store",
    "shopify-app",
    "marketing-engine",
    "mobile-app",
  ].includes(value);
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

  const modules = parseModules(build.modules);
  const architecture = parseArchitecture(build.architecture);
  const files = parseChangedFiles(build.files);
  const parsedPreviewState = parsePreviewState(build.preview_state);

  const previewState =
    parsedPreviewState ??
    createPreviewState(
      build.prompt,
      projectType,
      files.length,
      modules,
      architecture
    );

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
      <textarea placeholder="Describe what you want to build..." />
      <button type="submit">Send</button>
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
    const nextFiles = assistantMessage.files;

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

    await wait(500);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 1)
          : item
      )
    );

    scheduleScrollUpdate();
    await wait(550);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 2)
          : item
      )
    );

    scheduleScrollUpdate();
    await wait(600);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 3)
          : item
      )
    );

    scheduleScrollUpdate();
    await wait(650);

    const nextPreviewState = createPreviewState(
      promptValue,
      buildProjectType,
      nextFiles.length,
      buildModules,
      buildArchitecture
    );

    setChangedFiles(nextFiles);
    setSelectedFileId(nextFiles[0]?.id ?? "");
    setPreviewState(nextPreviewState);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 4)
          : item
      )
    );

    scheduleScrollUpdate();
    await wait(600);

    try {
      const savedHistoryItem = await saveBuildToDatabase(
        promptValue,
        buildProjectType,
        buildModules,
        buildArchitecture,
        nextFiles,
        nextPreviewState
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
          ? advanceAssistantUpdate(item, 5)
          : item
      )
    );

    scheduleScrollUpdate();
    await wait(520);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 6, true)
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
                <button
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
        <button type="button" aria-label="Refresh preview">
          <RefreshCcw className="icon" />
        </button>

        <button type="button" aria-label="Toggle panel">
          <PanelLeft className="icon" />
        </button>

        <button type="button" aria-label="Sign out" onClick={onSignOut}>
          <LogOut className="icon" />
        </button>
      </div>
    </header>
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
          <button
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

          <button
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
        <button type="button" aria-label="Close queue">
          <X className="icon" />
        </button>

        <button type="button" aria-label="Run queue">
          <Play className="icon" />
        </button>

        <button type="button" aria-label="Expand queue">
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

        <button type="button" aria-label="Close security">
          <X className="icon" />
        </button>
      </div>

      <button type="button" className="findings-button">
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

  return (
    <section className="composer">
      <textarea
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
        disabled={isBuilding || isLoadingWorkspace}
      />

      <div className="composer-row">
        <button type="button" className="composer-plus-button" aria-label="Add">
          <Plus className="icon" />
        </button>

        <button
          type="button"
          className="visual-button"
          onClick={() => setMode("visual-edits")}
          disabled={isBuilding || isLoadingWorkspace}
        >
          <Sparkles className="icon" />
          <span>Visual edits</span>
        </button>

        <div className="mode-wrapper">
          <button
            type="button"
            className="mode-button"
            onClick={() => setMenuOpen((current) => !current)}
            disabled={isBuilding || isLoadingWorkspace}
          >
            {mode === "build" ? "Build" : "Visual edits"}
            <ChevronDown className="chevron-icon" />
          </button>

          {menuOpen ? (
            <div className="mode-menu">
              <button
                type="button"
                className={mode === "build" ? "active" : ""}
                onClick={() => {
                  setMode("build");
                  setMenuOpen(false);
                }}
              >
                Build
              </button>

              <button
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

        <button
          type="button"
          className="composer-mic-button"
          aria-label="Voice input"
        >
          <Mic className="icon" />
        </button>

        <button
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
      <button
        type="button"
        className="preview-button"
        onClick={() => setWorkspaceView("preview")}
        aria-pressed={workspaceView === "preview"}
      >
        <Globe2 className="icon" />
        Preview
      </button>

      <button
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

      <button type="button" className="tool-button" aria-label="Cloud">
        <Cloud className="icon" />
      </button>

      <button
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

      <button
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

      <button
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

      <button type="button" className="tool-button" aria-label="Security">
        <Shield className="icon" />
      </button>

      <button type="button" className="tool-button" aria-label="More">
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
                : "/history"}
        </span>
      </div>

      <button type="button" className="tool-button" aria-label="Stop">
        <Square className="icon" />
      </button>

      <button type="button" className="pill-button">
        <Share className="icon" />
        Share
      </button>

      <button type="button" className="pill-button">
        <GitBranch className="icon" />
        Git
      </button>

      <button type="button" className="upgrade-button">
        Upgrade
      </button>

      <button type="button" className="publish-button">
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
}: {
  files: ChangedFile[];
  projectFiles: DatabaseProjectFile[];
  selectedFileId: string;
  setSelectedFileId: (fileId: string) => void;
}) {
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

        <button type="button">
          {projectFiles.length > 0 ? "Synced" : "No DB files"}
        </button>
      </div>

      <div className="files-list">
        {files.map((file) => {
          const databaseFile = projectFiles.find((item) => item.id === file.id);

          return (
            <button
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

            <input
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

            <button
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

            <button
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

        <textarea
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

function ArchitectureWorkspace({
  previewState,
}: {
  previewState: PreviewState;
}) {
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
        </section>

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

              <button
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

        <button type="button" aria-label="Open menu">
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
            <button type="button">Start workspace</button>
            <button type="button">View workflow</button>
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