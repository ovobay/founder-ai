import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type ProjectKind =
  | "auto"
  | "website"
  | "landing_page"
  | "saas_app"
  | "ai_app"
  | "marketplace"
  | "ecommerce_store"
  | "shopify_store"
  | "shopify_app"
  | "dashboard"
  | "internal_tool"
  | "crm"
  | "helpdesk"
  | "booking_platform"
  | "media_site"
  | "learning_platform"
  | "mobile_app"
  | "marketing_sales"
  | "backend_api"
  | "directory"
  | "job_board"
  | "real_estate"
  | "restaurant_ordering"
  | "fintech_dashboard"
  | "healthcare_portal"
  | "church_charity"
  | "portfolio"
  | "community_platform"
  | "analytics_product"
  | "automation_tool"
  | "chrome_extension";

type ResolvedProjectKind = Exclude<ProjectKind, "auto">;

type FileItem = {
  path: string;
  content: string;
};

type TemplateConfig = {
  productLabel: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  heroCardTitle: string;
  heroCardBody: string;
  metrics: Array<[string, string, string]>;
  sections: Array<{
    title: string;
    description: string;
  }>;
  workflow: Array<{
    title: string;
    description: string;
  }>;
  implementation: string[];
  pricing?: Array<[string, string, string]>;
  databasePlan?: boolean;
  apiPlan?: boolean;
};

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

function cleanIdea(value: string) {
  return value.replace(/`/g, "'").replace(/\$/g, "\\$").trim();
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function stripBuildWords(value: string) {
  return value
    .replace(/^(build|create|make|develop|design|generate|launch)\s+(a|an|the)?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBetween(value: string, startPattern: RegExp) {
  const match = value.match(startPattern);

  if (!match?.[1]) {
    return "";
  }

  return match[1]
    .replace(/\s+(with|that|where|for customers|for users|including)\s+.*$/i, "")
    .replace(/[,.;:!?]/g, "")
    .trim();
}

function makeDisplayTitle(idea: string, kind: ResolvedProjectKind) {
  const raw = cleanIdea(idea);
  const clean = stripBuildWords(raw);
  const lower = clean.toLowerCase();

  if (kind === "marketplace") {
    const audience =
      extractBetween(clean, /marketplace\s+(?:for|connecting)\s+(.+)$/i) ||
      extractBetween(clean, /platform\s+(?:for|connecting)\s+(.+)$/i);

    if (audience) {
      if (audience.toLowerCase().includes("home service")) {
        return "Home Service Marketplace";
      }

      if (audience.toLowerCase().includes("freelance")) {
        return "Freelance Marketplace";
      }

      if (audience.toLowerCase().includes("property") || audience.toLowerCase().includes("real estate")) {
        return "Property Marketplace";
      }

      return `${toTitleCase(audience)} Marketplace`;
    }

    return "Marketplace Platform";
  }

  if (kind === "ai_app") {
    if (lower.includes("product description") || lower.includes("ad campaign") || lower.includes("social post")) {
      return "AI Content Studio";
    }

    if (lower.includes("ugc") || lower.includes("video")) {
      return "AI Creative Studio";
    }

    if (lower.includes("customer support") || lower.includes("chatbot")) {
      return "AI Support Agent";
    }

    return "AI Product Studio";
  }

  if (kind === "booking_platform") {
    const audience =
      extractBetween(clean, /booking platform\s+(?:for)\s+(.+)$/i) ||
      extractBetween(clean, /booking app\s+(?:for)\s+(.+)$/i);

    if (audience) {
      if (audience.toLowerCase().includes("barber")) {
        return "Barber Booking Platform";
      }

      if (audience.toLowerCase().includes("clinic")) {
        return "Clinic Booking Platform";
      }

      if (audience.toLowerCase().includes("restaurant")) {
        return "Restaurant Booking Platform";
      }

      return `${toTitleCase(audience)} Booking Platform`;
    }

    return "Booking Platform";
  }

  if (kind === "helpdesk") {
    if (lower.includes("it")) {
      return "IT Helpdesk Platform";
    }

    return "Support Helpdesk";
  }

  if (kind === "crm") {
    if (lower.includes("small business")) {
      return "Small Business CRM";
    }

    return "Sales CRM";
  }

  if (kind === "saas_app") {
    if (lower.includes("it team") || lower.includes("tickets") || lower.includes("sla")) {
      return "IT Operations SaaS";
    }

    if (lower.includes("dashboard")) {
      return "SaaS Dashboard";
    }

    return "SaaS Platform";
  }

  if (kind === "shopify_store") {
    if (lower.includes("laptop") || lower.includes("computer")) {
      return "Laptop Shopify Store";
    }

    return "Shopify Storefront";
  }

  if (kind === "shopify_app") {
    if (lower.includes("abandoned cart") || lower.includes("whatsapp")) {
      return "Cart Recovery Shopify App";
    }

    return "Shopify Merchant App";
  }

  if (kind === "ecommerce_store") {
    if (lower.includes("laptop") || lower.includes("computer")) {
      return "Laptop Ecommerce Store";
    }

    return "Ecommerce Storefront";
  }

  if (kind === "media_site") {
    if (lower.includes("news")) {
      return "Modern News Platform";
    }

    return "Media Publishing Platform";
  }

  if (kind === "learning_platform") {
    return "Learning Platform";
  }

  if (kind === "marketing_sales") {
    return "Growth Campaign System";
  }

  if (kind === "backend_api") {
    return "Backend API Service";
  }

  if (kind === "dashboard") {
    return "Analytics Dashboard";
  }

  if (kind === "internal_tool") {
    return "Operations Console";
  }

  if (kind === "community_platform") {
    return "Community Platform";
  }

  if (kind === "job_board") {
    return "Job Board Platform";
  }

  if (kind === "real_estate") {
    return "Real Estate Platform";
  }

  if (kind === "restaurant_ordering") {
    return "Restaurant Ordering Platform";
  }

  if (kind === "fintech_dashboard") {
    return "Fintech Dashboard";
  }

  if (kind === "healthcare_portal") {
    return "Healthcare Portal";
  }

  if (kind === "church_charity") {
    return "Charity Website";
  }

  if (kind === "portfolio") {
    return "Portfolio Website";
  }

  if (kind === "analytics_product") {
    return "Analytics Product";
  }

  if (kind === "automation_tool") {
    return "Automation Tool";
  }

  if (kind === "chrome_extension") {
    return "Chrome Extension";
  }

  if (kind === "landing_page") {
    return "Launch Landing Page";
  }

  const shortened = clean
    .replace(/\s+(with|that|where|including|for)\s+.*$/i, "")
    .replace(/[,.;:!?]/g, "")
    .trim();

  if (shortened.length > 0) {
    return toTitleCase(shortened);
  }

  return "Premium Product Prototype";
}

function normalizePath(filePath: string) {
  return filePath
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .replace(/\\/g, "/")
    .trim();
}

function detectProjectKind(idea: string): ResolvedProjectKind {
  const text = idea.toLowerCase();

  if (
    text.includes("shopify app") ||
    text.includes("embedded shopify") ||
    text.includes("shopify admin") ||
    text.includes("shopify billing") ||
    text.includes("shopify oauth")
  ) {
    return "shopify_app";
  }

  if (
    text.includes("shopify store") ||
    text.includes("shopify storefront") ||
    text.includes("shopify") ||
    text.includes("shopify theme")
  ) {
    return "shopify_store";
  }

  if (
    text.includes("ecommerce") ||
    text.includes("e-commerce") ||
    text.includes("online store") ||
    text.includes("storefront") ||
    text.includes("sell products") ||
    text.includes("product catalogue") ||
    text.includes("product catalog")
  ) {
    return "ecommerce_store";
  }

  if (
    text.includes("ai app") ||
    text.includes("ai tool") ||
    text.includes("chatbot") ||
    text.includes("agent") ||
    text.includes("openai") ||
    text.includes("llm") ||
    text.includes("generates") ||
    text.includes("generate ai")
  ) {
    return "ai_app";
  }

  if (
    text.includes("marketplace") ||
    text.includes("buyers and sellers") ||
    text.includes("vendors") ||
    text.includes("service providers") ||
    text.includes("escrow")
  ) {
    return "marketplace";
  }

  if (
    text.includes("booking") ||
    text.includes("appointment") ||
    text.includes("reservation") ||
    text.includes("schedule")
  ) {
    return "booking_platform";
  }

  if (
    text.includes("crm") ||
    text.includes("customer relationship") ||
    text.includes("sales pipeline") ||
    text.includes("leads")
  ) {
    return "crm";
  }

  if (
    text.includes("helpdesk") ||
    text.includes("support ticket") ||
    text.includes("ticketing") ||
    text.includes("customer support")
  ) {
    return "helpdesk";
  }

  if (
    text.includes("dashboard") ||
    text.includes("admin panel") ||
    text.includes("admin dashboard") ||
    text.includes("analytics dashboard")
  ) {
    return "dashboard";
  }

  if (
    text.includes("internal tool") ||
    text.includes("back office") ||
    text.includes("operations tool")
  ) {
    return "internal_tool";
  }

  if (
    text.includes("news") ||
    text.includes("media") ||
    text.includes("magazine") ||
    text.includes("publication") ||
    text.includes("blog")
  ) {
    return "media_site";
  }

  if (
    text.includes("course") ||
    text.includes("learning") ||
    text.includes("education") ||
    text.includes("lms") ||
    text.includes("students")
  ) {
    return "learning_platform";
  }

  if (
    text.includes("mobile app") ||
    text.includes("ios app") ||
    text.includes("android app") ||
    text.includes("app prototype")
  ) {
    return "mobile_app";
  }

  if (
    text.includes("marketing") ||
    text.includes("sales") ||
    text.includes("campaign") ||
    text.includes("outreach") ||
    text.includes("prospecting") ||
    text.includes("lead generation") ||
    text.includes("ads")
  ) {
    return "marketing_sales";
  }

  if (
    text.includes("api") ||
    text.includes("backend service") ||
    text.includes("microservice") ||
    text.includes("webhook")
  ) {
    return "backend_api";
  }

  if (
    text.includes("directory") ||
    text.includes("listing site") ||
    text.includes("listings")
  ) {
    return "directory";
  }

  if (
    text.includes("job board") ||
    text.includes("jobs platform") ||
    text.includes("recruitment")
  ) {
    return "job_board";
  }

  if (
    text.includes("real estate") ||
    text.includes("property") ||
    text.includes("rentals")
  ) {
    return "real_estate";
  }

  if (
    text.includes("restaurant") ||
    text.includes("food ordering") ||
    text.includes("takeaway") ||
    text.includes("menu ordering")
  ) {
    return "restaurant_ordering";
  }

  if (
    text.includes("fintech") ||
    text.includes("finance dashboard") ||
    text.includes("payments dashboard")
  ) {
    return "fintech_dashboard";
  }

  if (
    text.includes("healthcare") ||
    text.includes("patient portal") ||
    text.includes("clinic") ||
    text.includes("medical portal")
  ) {
    return "healthcare_portal";
  }

  if (
    text.includes("church") ||
    text.includes("charity") ||
    text.includes("nonprofit") ||
    text.includes("non-profit")
  ) {
    return "church_charity";
  }

  if (
    text.includes("portfolio") ||
    text.includes("personal website") ||
    text.includes("creator site")
  ) {
    return "portfolio";
  }

  if (
    text.includes("community") ||
    text.includes("forum") ||
    text.includes("members")
  ) {
    return "community_platform";
  }

  if (
    text.includes("analytics product") ||
    text.includes("insights platform") ||
    text.includes("reporting tool")
  ) {
    return "analytics_product";
  }

  if (
    text.includes("automation") ||
    text.includes("workflow automation") ||
    text.includes("zapier") ||
    text.includes("automate")
  ) {
    return "automation_tool";
  }

  if (
    text.includes("chrome extension") ||
    text.includes("browser extension") ||
    text.includes("extension")
  ) {
    return "chrome_extension";
  }

  if (
    text.includes("saas") ||
    text.includes("subscription") ||
    text.includes("auth") ||
    text.includes("login") ||
    text.includes("billing") ||
    text.includes("web app") ||
    text.includes("application")
  ) {
    return "saas_app";
  }

  if (
    text.includes("landing page") ||
    text.includes("waitlist") ||
    text.includes("coming soon")
  ) {
    return "landing_page";
  }

  return "website";
}

function packageJson() {
  return `{
  "name": "founder-ai-generated-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.23",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.17.12",
    "@types/react": "18.3.18",
    "@types/react-dom": "18.3.5",
    "typescript": "5.7.2",
    "tailwindcss": "3.4.17",
    "postcss": "8.4.49",
    "autoprefixer": "10.4.20"
  }
}`;
}

function templateConfig(kind: ResolvedProjectKind, idea: string): TemplateConfig {
  const cleanedIdea = cleanIdea(idea);
  const displayTitle = makeDisplayTitle(idea, kind);

  const basePricing: Array<[string, string, string]> = [
    ["Starter", "€19/mo", "For validating the workflow and first customers."],
    ["Growth", "€59/mo", "For teams needing automation, reporting, and integrations."],
    ["Scale", "€149/mo", "For advanced controls, roles, support, and higher usage."],
  ];

  if (kind === "marketplace") {
    return {
      productLabel: displayTitle,
      eyebrow: "Marketplace platform prototype",
      headline: displayTitle,
      subheadline:
        "A two-sided marketplace foundation for buyers, sellers, listings, booking or checkout, reviews, and trust workflows.",
      primaryCta: "Browse listings",
      secondaryCta: "Become a seller",
      heroCardTitle: "Marketplace flywheel",
      heroCardBody:
        "Supply, demand, listings, trust, payments, messaging, ratings, and dispute workflows in one structure.",
      metrics: [
        ["Listings", "1,248", "Active supply"],
        ["Vendors", "320", "Verified providers"],
        ["Transactions", "€84k", "Monthly GMV"],
        ["Match rate", "41%", "Search-to-contact"],
      ],
      sections: [
        {
          title: "Buyer discovery",
          description:
            "Search, filters, categories, listing cards, comparison, and trust signals.",
        },
        {
          title: "Seller tools",
          description:
            "Onboarding, listings, pricing, availability, messages, and payouts.",
        },
        {
          title: "Trust and safety",
          description:
            "Reviews, verification, dispute handling, escrow logic, and moderation queues.",
        },
      ],
      workflow: [
        {
          title: "Seller lists offer",
          description: "Create listing, price, availability, media, rules, and verification details.",
        },
        {
          title: "Buyer searches",
          description: "Find, filter, compare, favourite, message, book, or purchase.",
        },
        {
          title: "Transaction happens",
          description: "Payment, escrow, order status, fulfilment, and notification flow.",
        },
        {
          title: "Trust loop closes",
          description: "Reviews, disputes, refunds, and seller quality scoring.",
        },
      ],
      implementation: [
        "Create tables for users, seller profiles, listings, bookings, orders, messages, reviews, and payouts",
        "Add search filters, categories, location fields, and listing moderation",
        "Connect Stripe Connect or platform payout flow",
        "Add buyer-seller messaging and notification routes",
        "Add reviews, dispute workflow, and admin moderation dashboard",
      ],
      pricing: [
        ["Commission", "8%", "Take rate on completed transactions."],
        ["Seller Pro", "€29/mo", "Featured listings and analytics."],
        ["Enterprise", "Custom", "Managed marketplace operations."],
      ],
      databasePlan: true,
      apiPlan: true,
    };
  }

  const defaults: Record<string, TemplateConfig> = {
    website: {
      productLabel: displayTitle,
      eyebrow: "Premium website prototype",
      headline: displayTitle,
      subheadline:
        "A polished website foundation with strong positioning, clear sections, trust signals, and conversion-focused structure.",
      primaryCta: "Explore sections",
      secondaryCta: "View launch plan",
      heroCardTitle: "Brand system",
      heroCardBody:
        "Positioning, benefits, social proof, offers, and page structure prepared for a serious launch.",
      metrics: [
        ["Pages", "5+", "Homepage, about, services, proof, contact"],
        ["Sections", "12", "Hero, trust, offers, FAQ, CTA"],
        ["Readiness", "MVP", "Ready to connect CMS and forms"],
        ["Conversion", "Focused", "Built around clear customer actions"],
      ],
      sections: [
        {
          title: "Positioning",
          description:
            "Explain what the brand does, who it serves, and why customers should care quickly.",
        },
        {
          title: "Offer structure",
          description:
            "Turn vague services into clear packages, benefits, outcomes, and next steps.",
        },
        {
          title: "Trust proof",
          description:
            "Add testimonials, case studies, credentials, guarantees, and clear contact routes.",
        },
      ],
      workflow: [
        {
          title: "Visitor lands",
          description: "Hero explains the value proposition without making people decode a brochure.",
        },
        {
          title: "Visitor compares",
          description: "Sections answer objections, show trust, and reduce uncertainty.",
        },
        {
          title: "Visitor acts",
          description: "CTA routes them to booking, contact, purchase, signup, or enquiry.",
        },
      ],
      implementation: [
        "Add final brand copy, imagery, and SEO metadata",
        "Connect contact forms to email or CRM",
        "Add analytics, conversion tracking, and cookie controls",
        "Deploy to Vercel and connect production domain",
      ],
    },

    saas_app: {
      productLabel: displayTitle,
      eyebrow: "SaaS product prototype",
      headline: displayTitle,
      subheadline:
        "A dashboard-led SaaS foundation with product metrics, workflows, billing structure, and implementation notes.",
      primaryCta: "View dashboard",
      secondaryCta: "See pricing",
      heroCardTitle: "Product command centre",
      heroCardBody:
        "Auth, dashboard, workspaces, usage, billing, automations, and reporting mapped into one buildable structure.",
      metrics: [
        ["Active users", "2,418", "+18% this month"],
        ["Workflows", "84", "12 urgent"],
        ["Revenue", "€24,900", "+31%"],
        ["Automation saved", "126 hrs", "This month"],
      ],
      sections: [
        {
          title: "Workspace dashboard",
          description:
            "A central interface for users, activity, metrics, alerts, and next actions.",
        },
        {
          title: "Subscription engine",
          description:
            "Pricing, usage limits, billing portal, plan gates, and webhook syncing.",
        },
        {
          title: "Operational workflows",
          description:
            "Create, track, assign, automate, and report on the product’s main workflows.",
        },
      ],
      workflow: [
        {
          title: "User signs in",
          description: "Add Supabase auth, roles, protected routes, and workspace membership.",
        },
        {
          title: "User creates workflow",
          description: "Persist records to Postgres with ownership, status, and audit trail.",
        },
        {
          title: "System automates",
          description: "Trigger background jobs, AI actions, notifications, and integrations.",
        },
        {
          title: "Dashboard updates",
          description: "Show live status, usage, failures, and recommended next actions.",
        },
      ],
      implementation: [
        "Create Supabase tables for users, workspaces, memberships, workflows, usage, and billing state",
        "Add auth-protected dashboard routes and workspace ownership rules",
        "Connect Stripe checkout, customer portal, and webhook sync",
        "Add API routes for workflow creation, status updates, analytics, and automation",
        "Add background jobs for notifications and scheduled processing",
        "Deploy on Vercel with production environment variables and database policies",
      ],
      pricing: basePricing,
      databasePlan: true,
      apiPlan: true,
    },

    ai_app: {
      productLabel: displayTitle,
      eyebrow: "AI product prototype",
      headline: displayTitle,
      subheadline:
        "An AI-powered product foundation with prompt workflows, generation history, user limits, model routing, and output review.",
      primaryCta: "Generate result",
      secondaryCta: "View workflow",
      heroCardTitle: "AI workflow",
      heroCardBody:
        "Prompt input, model execution, structured output, usage tracking, history, and export controls.",
      metrics: [
        ["Generations", "8,420", "Across user workspaces"],
        ["Avg latency", "4.8s", "Target response time"],
        ["Saved outputs", "1,260", "Reusable results"],
        ["Usage cost", "Tracked", "Per user and plan"],
      ],
      sections: [
        {
          title: "Prompt workspace",
          description:
            "Input area, mode selector, saved templates, generated outputs, and review tools.",
        },
        {
          title: "Usage and billing",
          description:
            "Track generations, model costs, plan limits, and upgrade triggers before costs eat the business alive.",
        },
        {
          title: "Output management",
          description:
            "Save, edit, export, share, and rerun AI outputs with version history.",
        },
      ],
      workflow: [
        {
          title: "User enters request",
          description: "Capture goal, context, constraints, and output format.",
        },
        {
          title: "System routes model",
          description: "Choose the right model, retrieval source, or tool chain for the task.",
        },
        {
          title: "AI generates output",
          description: "Return structured, editable, and auditable results.",
        },
        {
          title: "User saves or exports",
          description: "Store history, regenerate variants, or export the finished work.",
        },
      ],
      implementation: [
        "Add OpenAI API route with server-side key handling",
        "Create prompt templates, output history, and usage tables",
        "Add rate limiting and plan-based generation limits",
        "Add streaming responses for long generations",
        "Add export, copy, retry, and version controls",
      ],
      pricing: basePricing,
      databasePlan: true,
      apiPlan: true,
    },

    booking_platform: {
      productLabel: displayTitle,
      eyebrow: "Booking platform prototype",
      headline: displayTitle,
      subheadline:
        "A booking foundation with availability, calendar views, service listings, customer flow, reminders, and payment readiness.",
      primaryCta: "Book now",
      secondaryCta: "View availability",
      heroCardTitle: "Booking engine",
      heroCardBody:
        "Services, providers, availability, appointments, reminders, payments, cancellation rules, and admin controls.",
      metrics: [
        ["Bookings", "326", "This month"],
        ["Availability", "82%", "Open slots"],
        ["No-shows", "4.1%", "Reminder assisted"],
        ["Revenue", "€18.6k", "Booked services"],
      ],
      sections: [
        {
          title: "Service catalogue",
          description: "List services, duration, pricing, provider, and booking rules.",
        },
        {
          title: "Availability engine",
          description: "Manage slots, calendars, capacity, buffers, holidays, and overrides.",
        },
        {
          title: "Customer booking flow",
          description: "Choose service, slot, details, payment, confirmation, and reminders.",
        },
      ],
      workflow: [
        {
          title: "Customer selects service",
          description: "Browse services, providers, location, price, and duration.",
        },
        {
          title: "System checks availability",
          description: "Filter slots by calendar, capacity, rules, and conflicts.",
        },
        {
          title: "Customer confirms",
          description: "Save booking, collect payment or deposit, and send confirmation.",
        },
        {
          title: "Reminder sends",
          description: "Notify customer, reduce no-shows, and manage cancellation rules.",
        },
      ],
      implementation: [
        "Create services, providers, customers, availability, bookings, and payments tables",
        "Add calendar views and conflict checks",
        "Add booking confirmation, reminders, cancellation, and rescheduling",
        "Connect Stripe for deposits or full payment",
      ],
      pricing: basePricing,
      databasePlan: true,
      apiPlan: true,
    },

    helpdesk: {
      productLabel: displayTitle,
      eyebrow: "Support platform prototype",
      headline: displayTitle,
      subheadline:
        "A helpdesk foundation with ticket queues, conversation view, SLA tracking, user context, automation, and knowledge base hooks.",
      primaryCta: "Open inbox",
      secondaryCta: "View SLA risk",
      heroCardTitle: "Support command centre",
      heroCardBody:
        "Inbox, assignments, SLA risks, automations, similar tickets, knowledge base, and requester context.",
      metrics: [
        ["Open tickets", "248", "31 high priority"],
        ["SLA risk", "18", "Needs attention"],
        ["Avg response", "42m", "-12%"],
        ["Automation", "64%", "Resolved or assisted"],
      ],
      sections: [
        {
          title: "Ticket inbox",
          description: "All, unassigned, mine, priority queues, filters, and ownership.",
        },
        {
          title: "Conversation workspace",
          description: "Requester context, messages, internal notes, status, and next action panel.",
        },
        {
          title: "Automation and KB",
          description: "Suggest replies, similar tickets, runbooks, and article creation.",
        },
      ],
      workflow: [
        {
          title: "Ticket created",
          description: "Email, portal, API, or manual ticket enters queue.",
        },
        {
          title: "Triage runs",
          description: "Assign priority, owner, category, requester, and SLA policy.",
        },
        {
          title: "Agent resolves",
          description: "Reply, automate, escalate, or document resolution.",
        },
        {
          title: "Knowledge improves",
          description: "Convert solved tickets into runbooks and article suggestions.",
        },
      ],
      implementation: [
        "Create tickets, conversations, users, SLAs, comments, tags, and KB tables",
        "Add inbox views, assignment rules, priority logic, and SLA timers",
        "Add requester portal and email ingestion",
        "Add AI suggestions using ticket context and knowledge base retrieval",
      ],
      pricing: basePricing,
      databasePlan: true,
      apiPlan: true,
    },
  };

  return (
    defaults[kind] || {
      productLabel: displayTitle,
      eyebrow: "Premium product prototype",
      headline: displayTitle,
      subheadline:
        "A premium product foundation with strong layout, structured workflows, clear sections, implementation notes, and production next steps.",
      primaryCta: "Explore product",
      secondaryCta: "View implementation",
      heroCardTitle: "Product blueprint",
      heroCardBody:
        "Screens, flows, data, actions, monetisation, and implementation strategy arranged into a buildable prototype.",
      metrics: [
        ["Core screens", "8", "Prototype flow"],
        ["Workflows", "4", "Primary user journeys"],
        ["Data model", "Ready", "Needs production schema"],
        ["Launch state", "MVP", "Prepared for buildout"],
      ],
      sections: [
        {
          title: "Core experience",
          description:
            "Map the main user journey, critical screens, states, and action paths.",
        },
        {
          title: "Business logic",
          description:
            "Define how the product creates value, captures data, and moves users to outcomes.",
        },
        {
          title: "Production path",
          description:
            "Plan auth, database, billing, APIs, admin controls, and deployment.",
        },
      ],
      workflow: [
        {
          title: "User enters",
          description: "Landing, onboarding, account creation, or first action.",
        },
        {
          title: "User acts",
          description: "Complete the main workflow with clear screens and feedback.",
        },
        {
          title: "System processes",
          description: "Persist data, call APIs, automate logic, and update state.",
        },
        {
          title: "Outcome delivered",
          description: "Show result, confirmation, dashboard update, or next recommendation.",
        },
      ],
      implementation: [
        "Create data schema and API route plan",
        "Add authentication and protected routes where needed",
        "Add dashboard, admin controls, and operational states",
        "Connect payments, integrations, and deployment environment variables",
      ],
      databasePlan: true,
      apiPlan: true,
    }
  );
}

function fallbackProject(idea: string, kind: ResolvedProjectKind) {
  const safeIdea = cleanIdea(idea);
  const config = templateConfig(kind, safeIdea);
  const configLiteral = JSON.stringify(config, null, 2);
  const isMarketplace = kind === "marketplace";

  let extraDocs = "";

  if (config.databasePlan) {
    extraDocs += `

FILE: DATABASE.md
# Database plan

## Suggested tables

- users
- workspaces
- workspace_members
- profiles
- records
- events
- activities
- billing_customers
- usage_limits
- audit_logs

## Marketplace-specific tables

- buyer_profiles
- seller_profiles
- listings
- listing_categories
- bookings
- orders
- messages
- reviews
- disputes
- payouts
- moderation_queue

## Suggested policies

- Users can only read private records inside workspaces they belong to.
- Buyers can manage their own bookings and orders.
- Sellers can manage only their own listings, availability, and payouts.
- Reviews should be linked to completed transactions.
- Disputes and moderation actions should write immutable audit records.
`;
  }

  if (config.apiPlan) {
    extraDocs += `

FILE: API.md
# API plan

## Suggested routes

- GET /api/health
- GET /api/me
- GET /api/listings
- POST /api/listings
- GET /api/listings/:id
- POST /api/bookings
- PATCH /api/bookings/:id
- POST /api/messages
- POST /api/reviews
- POST /api/disputes
- POST /api/billing/checkout
- POST /api/billing/portal
- POST /api/webhooks/provider

## Production notes

- Add authentication to protected routes.
- Validate all request bodies.
- Add rate limiting.
- Log important mutations.
- Verify webhook signatures.
- Add moderation controls before marketplace scale.
`;
  }

  return `FILE: package.json
${packageJson()}

FILE: app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Founder AI Generated Project",
  description: "Generated by Founder AI Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

FILE: app/page.tsx
const config = ${configLiteral};

const isMarketplace = ${isMarketplace ? "true" : "false"};

const marketplaceCategories = [
  ["Cleaning", "248 providers", "Homes, deep cleans, move-out services"],
  ["Repairs", "184 providers", "Plumbing, electrical, general fixes"],
  ["Gardening", "156 providers", "Lawn care, landscaping, outdoor work"],
  ["Painting", "92 providers", "Interior, exterior, touch-ups"],
];

const marketplaceProviders = [
  {
    name: "BrightHome Cleaning",
    category: "Cleaning",
    rating: "4.9",
    jobs: "1,248 jobs",
    price: "From €45",
    badge: "Verified",
  },
  {
    name: "FixRight Repairs",
    category: "Repairs",
    rating: "4.8",
    jobs: "842 jobs",
    price: "From €65",
    badge: "Fast response",
  },
  {
    name: "GreenEdge Gardens",
    category: "Gardening",
    rating: "4.9",
    jobs: "620 jobs",
    price: "From €55",
    badge: "Top rated",
  },
];

const marketplaceReviews = [
  ["Sarah M.", "Booked a cleaner in under five minutes. Clear pricing, verified provider, no circus."],
  ["Daniel K.", "The seller dashboard makes it easy to manage requests, availability, and payouts."],
  ["Amina R.", "Reviews, verification, and dispute handling made the marketplace feel trustworthy."],
];

const moderationItems = [
  ["Listing approval", "12 pending", "Check provider documents and service claims"],
  ["Dispute queue", "4 active", "Review buyer and seller evidence"],
  ["Payout review", "8 flagged", "Confirm completed bookings before release"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Hero />
        <Metrics />

        {isMarketplace ? (
          <>
            <MarketplaceSearch />
            <MarketplaceCategories />
            <MarketplaceProviders />
            <MarketplaceBookingFlow />
            <MarketplaceSellerDashboard />
            <MarketplaceTrust />
            <MarketplaceModeration />
          </>
        ) : (
          <>
            <Sections />
            <Workflow />
          </>
        )}

        {config.pricing ? <Pricing /> : null}
        <Implementation />
      </div>
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a href="#" className="text-lg font-black tracking-tight text-slate-950">
          {config.productLabel}
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {["Explore", "Providers", "Trust", "Pricing", "Build"].map((item) => (
            <a
              key={item}
              href="#implementation"
              className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
            >
              {item}
            </a>
          ))}
        </nav>

        <a
          href="#implementation"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Build plan
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-8 py-16 text-white shadow-2xl shadow-slate-200">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-32 left-16 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-300">
            {config.eyebrow}
          </div>

          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            {config.headline}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            {config.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#marketplace-search" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-white/10">
              {config.primaryCta}
            </a>

            <a href="#seller-dashboard" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white">
              {config.secondaryCta}
            </a>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30">
          <div className="rounded-[1.3rem] bg-white p-5 text-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Product blueprint
                </p>
                <h2 className="mt-3 text-2xl font-black">{config.heroCardTitle}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                MVP ready
              </span>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600">
              {config.heroCardBody}
            </p>

            <div className="mt-5 grid h-48 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-500">
              Premium UI preview
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {["UX", "Data", "API"].map((item) => (
                <div key={item} className="rounded-xl bg-slate-100 p-3 text-center text-xs font-black text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metrics() {
  return (
    <section className="mt-6 grid gap-3 md:grid-cols-4">
      {config.metrics.map((metric) => (
        <article
          key={metric[0]}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-bold text-slate-500">{metric[0]}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{metric[1]}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{metric[2]}</p>
        </article>
      ))}
    </section>
  );
}

function MarketplaceSearch() {
  return (
    <section id="marketplace-search" className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Marketplace discovery
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Search, compare, and book trusted providers
          </h2>
        </div>
        <p className="max-w-md text-sm font-medium leading-6 text-slate-500">
          Buyers need speed, trust, and useful filters. Not a heroic journey through twelve badly named tabs.
        </p>
      </div>

      <div className="mt-7 grid gap-3 rounded-[1.75rem] bg-slate-50 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
        <div className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
          Search for cleaning, repairs, painting...
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
          Location: Galway
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
          Date: This week
        </div>
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white">
          Search
        </div>
      </div>
    </section>
  );
}

function MarketplaceCategories() {
  return (
    <section className="mt-10">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Popular categories
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        {marketplaceCategories.map((category) => (
          <article key={category[0]} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid h-24 place-items-center rounded-2xl bg-slate-100 text-sm font-black text-slate-400">
              {category[0]}
            </div>
            <h3 className="mt-5 text-xl font-black text-slate-950">{category[0]}</h3>
            <p className="mt-1 text-sm font-black text-slate-500">{category[1]}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{category[2]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketplaceProviders() {
  return (
    <section id="providers" className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Featured providers
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Provider cards built for conversion
          </h2>
        </div>
        <span className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-700">
          Verified supply
        </span>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {marketplaceProviders.map((provider) => (
          <article key={provider.name} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid h-40 place-items-center rounded-2xl bg-white text-sm font-bold text-slate-400">
              Provider image
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                {provider.badge}
              </span>
              <span className="text-sm font-black text-slate-700">★ {provider.rating}</span>
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-950">{provider.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{provider.category} · {provider.jobs}</p>
            <p className="mt-4 text-lg font-black text-slate-950">{provider.price}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm">
                View profile
              </div>
              <div className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">
                Book
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketplaceBookingFlow() {
  const steps = [
    ["1", "Choose provider", "Compare rating, price, location, availability, and previous work."],
    ["2", "Select slot", "Pick date, service, duration, and booking rules."],
    ["3", "Pay deposit", "Hold the booking with Stripe payment or marketplace wallet logic."],
    ["4", "Review work", "Close the trust loop with rating, review, and dispute fallback."],
  ];

  return (
    <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Booking journey
      </p>
      <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
        From search to completed booking
      </h2>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        {steps.map((step) => (
          <article key={step[1]} className="rounded-[1.75rem] bg-slate-50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              {step[0]}
            </div>
            <h3 className="mt-5 text-lg font-black text-slate-950">{step[1]}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step[2]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketplaceSellerDashboard() {
  return (
    <section id="seller-dashboard" className="mt-14 grid gap-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-200 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
          Seller dashboard
        </p>
        <h2 className="mt-2 text-4xl font-black tracking-tight">
          Give providers a reason to stay
        </h2>
        <p className="mt-5 text-sm leading-6 text-slate-300">
          Seller-side tools matter. Otherwise the marketplace is just a pretty empty room with venture-backed loneliness.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          ["Availability", "Set working hours, blocked dates, and service areas"],
          ["Requests", "Approve, decline, reschedule, and message buyers"],
          ["Payouts", "Track completed work, pending payouts, fees, and disputes"],
          ["Performance", "Views, conversion rate, response time, and review score"],
        ].map((item) => (
          <div key={item[0]} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-black text-white">{item[0]}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item[1]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketplaceTrust() {
  return (
    <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Trust and reviews
      </p>
      <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
        Trust is the actual product
      </h2>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {marketplaceReviews.map((review) => (
          <article key={review[0]} className="rounded-[1.75rem] bg-slate-50 p-6">
            <p className="text-sm leading-6 text-slate-600">“{review[1]}”</p>
            <p className="mt-4 text-sm font-black text-slate-950">{review[0]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketplaceModeration() {
  return (
    <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Admin moderation
      </p>
      <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
        Admin queue before chaos becomes a feature
      </h2>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {moderationItems.map((item) => (
          <article key={item[0]} className="rounded-[1.75rem] border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">{item[0]}</h3>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                {item[1]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item[2]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Sections() {
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Product structure
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            The pieces this product needs
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-slate-500">
          Clear structure first. Then code. Radical concept, apparently.
        </p>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {config.sections.map((section, index) => (
          <article
            key={section.title}
            className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              {index + 1}
            </div>
            <h3 className="mt-5 text-xl font-black text-slate-950">{section.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Core workflow
      </p>

      <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
        How the product should work
      </h2>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        {config.workflow.map((step, index) => (
          <article key={step.title} className="rounded-[1.75rem] bg-slate-50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              {index + 1}
            </div>
            <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Monetisation
      </p>

      <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
        Pricing structure
      </h2>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {config.pricing?.map((plan) => (
          <article key={plan[0]} className="rounded-[1.75rem] border border-slate-200 p-6">
            <h3 className="text-xl font-black text-slate-950">{plan[0]}</h3>
            <p className="mt-2 text-3xl font-black text-slate-950">{plan[1]}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{plan[2]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Implementation() {
  return (
    <section id="implementation" className="mt-14 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-200">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Backend implementation
      </p>

      <h2 className="mt-2 text-4xl font-black tracking-tight">
        What needs to become real code
      </h2>

      <div className="mt-7 grid gap-3 md:grid-cols-2">
        {config.implementation.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold leading-6 text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black text-slate-950">{config.productLabel}</p>
          <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-slate-500">
            Prototype generated by Founder AI Builder.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {["Auth", "Database", "Billing", "API", "Deploy"].map((link) => (
            <span key={link} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              {link}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

FILE: app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: #f7f8fb;
  color: #020617;
}

::selection {
  background: #020617;
  color: #ffffff;
}

FILE: lib/config.ts
export const appConfig = {
  name: "${safeIdea}",
  kind: "${kind}",
};

FILE: app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "ok",
    service: "${kind}"
  });
}

FILE: README.md
# Founder AI Generated Project

## Idea

${safeIdea}

## Project kind

${kind}

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Open:

\`\`\`txt
http://localhost:3000
\`\`\`

## Next steps

- Replace prototype content with production data.
- Add authentication if users need accounts.
- Add database tables and RLS policies if data must persist.
- Add billing if monetisation is required.
- Add API routes for production workflows.
- Deploy to Vercel.
${extraDocs}

FILE: postcss.config.mjs
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;

FILE: tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

FILE: next-env.d.ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file was generated by Founder AI Builder.

FILE: next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

FILE: .gitignore
node_modules
.next
.env
.env.local
.DS_Store
`;
}

function parseFiles(text?: string): FileItem[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  const files: FileItem[] = [];
  const parts = text.split("FILE:");

  for (let part of parts) {
    part = part.trim();

    if (!part) {
      continue;
    }

    const firstLineEnd = part.indexOf("\n");

    if (firstLineEnd === -1) {
      continue;
    }

    const filePath = normalizePath(part.substring(0, firstLineEnd).trim());
    const content = part.substring(firstLineEnd + 1).trim();

    if (!filePath || !content) {
      continue;
    }

    files.push({
      path: filePath,
      content,
    });
  }

  return files;
}

function rebuildProject(files: FileItem[]) {
  return files.map((file) => `FILE: ${file.path}\n${file.content}`).join("\n\n");
}

function getFileContent(text: string, filePath: string) {
  const marker = `FILE: ${filePath}`;
  const start = text.indexOf(marker);

  if (start === -1) {
    return "";
  }

  const nextFile = text.indexOf("FILE:", start + marker.length);

  return nextFile === -1
    ? text.slice(start + marker.length)
    : text.slice(start + marker.length, nextFile);
}

function packageJsonIsValid(text: string) {
  const content = getFileContent(text, "package.json");

  if (!content) {
    return false;
  }

  try {
    JSON.parse(content.trim());
    return true;
  } catch {
    return false;
  }
}

function normalizeGeneratedPackageJson(result: string) {
  const content = getFileContent(result, "package.json");

  if (!content) {
    return result;
  }

  let normalized = content;

  try {
    const parsed = JSON.parse(content.trim());

    normalized = JSON.stringify(
      {
        ...parsed,
        scripts: {
          ...(parsed.scripts || {}),
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          ...(parsed.dependencies || {}),
          next: "14.2.23",
          react: "18.3.1",
          "react-dom": "18.3.1",
        },
        devDependencies: {
          ...(parsed.devDependencies || {}),
          "@types/node": "20.17.12",
          "@types/react": "18.3.18",
          "@types/react-dom": "18.3.5",
          typescript: "5.7.2",
          tailwindcss: "3.4.17",
          postcss: "8.4.49",
          autoprefixer: "10.4.20",
        },
      },
      null,
      2
    );
  } catch {
    normalized = packageJson();
  }

  return result.replace(content, `\n${normalized}\n`);
}

function ensureSupportFiles(result: string) {
  const files = parseFiles(result);

  if (files.length === 0) {
    return result;
  }

  function add(path: string, content: string) {
    if (!files.some((file) => file.path === path)) {
      files.push({ path, content });
    }
  }

  add(
    "postcss.config.mjs",
    `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`
  );

  add(
    "tailwind.config.ts",
    `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`
  );

  add(
    "next-env.d.ts",
    `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file was generated by Founder AI Builder.
`
  );

  add(
    "next.config.mjs",
    `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`
  );

  add(
    ".gitignore",
    `node_modules
.next
.env
.env.local
.DS_Store
`
  );

  return rebuildProject(files);
}

function sanitizeNextConfig(result: string) {
  return result
    .replaceAll("FILE: next.config.ts", "FILE: next.config.mjs")
    .replaceAll("FILE: next.config.js", "FILE: next.config.mjs");
}

function fileNeedsClientDirective(content: string) {
  const interactivePatterns = [
    "useState(",
    "useEffect(",
    "useRef(",
    "useRouter(",
    "useSearchParams(",
    "onClick=",
    "onSubmit=",
    "onChange=",
    "onMouseEnter=",
    "onMouseLeave=",
  ];

  return interactivePatterns.some((pattern) => content.includes(pattern));
}

function addClientDirectiveIfNeeded(content: string) {
  const trimmed = content.trimStart();

  if (!fileNeedsClientDirective(content)) {
    return content;
  }

  if (trimmed.startsWith('"use client";') || trimmed.startsWith("'use client';")) {
    return content;
  }

  return `"use client";\n\n${content}`;
}

function sanitizeClientComponents(result: string) {
  const parts = result.split("FILE:");
  const sanitized: string[] = [];

  for (const part of parts) {
    const trimmedPart = part.trim();

    if (!trimmedPart) {
      continue;
    }

    const firstLineEnd = trimmedPart.indexOf("\n");

    if (firstLineEnd === -1) {
      sanitized.push(`FILE: ${normalizePath(trimmedPart)}`);
      continue;
    }

    const filePath = normalizePath(trimmedPart.substring(0, firstLineEnd).trim());
    const content = trimmedPart.substring(firstLineEnd + 1);

    const shouldCheck =
      filePath.endsWith(".tsx") || filePath.endsWith(".jsx");

    const finalContent = shouldCheck
      ? addClientDirectiveIfNeeded(content)
      : content;

    sanitized.push(`FILE: ${filePath}\n${finalContent.trim()}`);
  }

  return sanitized.join("\n\n");
}

function hasValidFileOutput(text: string) {
  return (
    text.includes("FILE:") &&
    text.includes("package.json") &&
    text.includes("app/page.tsx") &&
    text.includes("app/layout.tsx")
  );
}

function hasVisiblePage(text: string) {
  const pageContent = getFileContent(text, "app/page.tsx");

  return (
    pageContent.includes("return") &&
    pageContent.includes("<") &&
    !pageContent.includes("return null") &&
    pageContent.length > 120
  );
}

function hasHydrationRisk(text: string) {
  const riskyPatterns = [
    "Math.random(",
    "Date.now(",
    "new Date(",
    "window.",
    "document.",
    "localStorage",
    "sessionStorage",
    "navigator.",
    "suppressHydrationWarning",
    "dangerouslySetInnerHTML",
  ];

  return riskyPatterns.some((pattern) => text.includes(pattern));
}

function looksTooGeneric(text: string, kind: ResolvedProjectKind) {
  if (
    text.includes("Build faster") ||
    text.includes("Launch with intent") ||
    text.includes("Grow from day one")
  ) {
    return true;
  }

  if (kind === "marketplace") {
    return (
      !text.includes("MarketplaceSearch") ||
      !text.includes("MarketplaceProviders") ||
      !text.includes("MarketplaceSellerDashboard") ||
      !text.includes("MarketplaceModeration")
    );
  }

  return false;
}

function getBuilderSystemPrompt(kind: ResolvedProjectKind) {
  return `
You are Founder AI Builder, a senior full-stack engineer, product designer, and visual systems architect.

Generate a complete runnable Next.js project using FILE blocks only.

The selected project type is: ${kind}.

Core rules:
- Return only FILE blocks.
- No markdown fences.
- No explanation.
- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS.
- Pin package versions.
- Do not use "latest".
- Do not use browser APIs during render.
- Do not use event handlers unless the file starts with "use client".
- Do not use next.config.ts.
- Every import must point to a file you output.
- app/page.tsx must visibly render real content.
- Do not import icon libraries or external UI libraries unless every required file is included.
- Do not use external images or assets.

Design quality rules:
- Make the UI premium, modern, dense, and product-grade.
- Use strong hierarchy, confident spacing, polished cards, dark hero bands, white cards, subtle borders, and rounded 2xl/3xl containers.
- Avoid generic three-card brochure sections unless part of a larger composition.
- Use dashboard shells, hero split layouts, metric cards, pricing panels, product previews, workflow panels, implementation sections, and admin-like density.
- Include practical product logic, not just decorative sections.

Marketplace rules:
- If project type is marketplace, include actual marketplace UI:
  search/filter bar, categories, provider/listing cards, booking or checkout journey, seller dashboard, reviews/trust, admin moderation queue, pricing/take-rate model, backend plan.

Project coverage:
- Support websites, landing pages, SaaS apps, AI apps, marketplaces, ecommerce stores, Shopify stores, Shopify apps, dashboards, internal tools, CRMs, helpdesks, booking platforms, media/news sites, learning platforms, mobile app prototypes, marketing/sales systems, backend APIs, directories, job boards, real estate platforms, restaurant ordering, fintech dashboards, healthcare portals, charity/church sites, portfolios, community platforms, analytics products, automation tools, and Chrome extensions.

If unsure, still output a runnable premium product prototype.
`;
}

function sanitizeResult(result: string, idea: string, kind: ResolvedProjectKind) {
  let cleaned = result.trim();

  cleaned = sanitizeNextConfig(cleaned);
  cleaned = sanitizeClientComponents(cleaned);
  cleaned = normalizeGeneratedPackageJson(cleaned);
  cleaned = ensureSupportFiles(cleaned);

  if (
    !hasValidFileOutput(cleaned) ||
    !hasVisiblePage(cleaned) ||
    !packageJsonIsValid(cleaned) ||
    hasHydrationRisk(cleaned) ||
    looksTooGeneric(cleaned, kind)
  ) {
    return fallbackProject(idea, kind);
  }

  return cleaned;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { idea, projectKind } = await req.json();

    if (!idea || typeof idea !== "string") {
      return Response.json({ error: "Missing idea." }, { status: 400 });
    }

    const allowedKinds: ProjectKind[] = [
      "auto",
      "website",
      "landing_page",
      "saas_app",
      "ai_app",
      "marketplace",
      "ecommerce_store",
      "shopify_store",
      "shopify_app",
      "dashboard",
      "internal_tool",
      "crm",
      "helpdesk",
      "booking_platform",
      "media_site",
      "learning_platform",
      "mobile_app",
      "marketing_sales",
      "backend_api",
      "directory",
      "job_board",
      "real_estate",
      "restaurant_ordering",
      "fintech_dashboard",
      "healthcare_portal",
      "church_charity",
      "portfolio",
      "community_platform",
      "analytics_product",
      "automation_tool",
      "chrome_extension",
    ];

    const requestedKind: ProjectKind = allowedKinds.includes(projectKind)
      ? projectKind
      : "auto";

    const kind: ResolvedProjectKind =
      requestedKind === "auto" ? detectProjectKind(idea) : requestedKind;

    let { data: usage, error: usageError } = await supabaseAdmin
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (usageError) {
      return Response.json({ error: usageError.message }, { status: 500 });
    }

    if (!usage) {
      const { data: newUsage, error: createUsageError } = await supabaseAdmin
        .from("usage_limits")
        .insert({
          user_id: user.id,
          generations: 0,
          plan: "free",
          subscription_status: "inactive",
        })
        .select("*")
        .single();

      if (createUsageError) {
        return Response.json(
          { error: createUsageError.message },
          { status: 500 }
        );
      }

      usage = newUsage;
    }

    const plan = usage.plan || "free";
    const generations = usage.generations || 0;

    if (plan === "free" && generations >= 5) {
      return Response.json(
        {
          error: "Free limit reached",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    let rawResult = "";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.12,
        messages: [
          {
            role: "system",
            content: getBuilderSystemPrompt(kind),
          },
          {
            role: "user",
            content: idea,
          },
        ],
      });

      rawResult = completion.choices[0]?.message?.content || "";
    } catch {
      rawResult = "";
    }

    const result = sanitizeResult(rawResult, idea, kind);

    const { error: updateError } = await supabaseAdmin
      .from("usage_limits")
      .update({
        generations: generations + 1,
      })
      .eq("user_id", user.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      result,
      project_kind: kind,
      plan,
      remaining:
        plan === "pro" ? "unlimited" : Math.max(0, 5 - (generations + 1)),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}