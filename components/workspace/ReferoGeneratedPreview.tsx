"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  HelpCircle,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  Ticket,
  Workflow,
  Zap,
} from "lucide-react";

import type { ImportedDesignReference } from "@/lib/design/imported-design-references";

type ReferoGeneratedPreviewProps = {
  title: string;
  subtitle: string;
  projectType: string;
  fileCount: number;
  designReference: ImportedDesignReference | null;
};

type PreviewVisualSystem = {
  theme: "light" | "dark";
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentText: string;
  primary: string;
  primaryText: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  shadow: string;
};

function inferVisualSystem(
  reference: ImportedDesignReference | null
): PreviewVisualSystem {
  const source = [
    reference?.id ?? "",
    reference?.name ?? "",
    reference?.content ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (
    source.includes("plain") ||
    source.includes("workbench") ||
    source.includes("support") ||
    source.includes("helpdesk")
  ) {
    return {
      theme: "light",
      background: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f3fbe9",
      surfaceElevated: "#f9f6f1",
      text: "#0a2414",
      mutedText: "#607166",
      border: "#d7dfd2",
      accent: "#1ad379",
      accentText: "#0a2414",
      primary: "#1ad379",
      primaryText: "#0a2414",
      radiusSm: 8,
      radiusMd: 14,
      radiusLg: 22,
      shadow: "0 18px 45px rgba(10, 36, 20, 0.08)",
    };
  }

  if (
    source.includes("mercury") ||
    source.includes("fintech") ||
    source.includes("command center")
  ) {
    return {
      theme: "dark",
      background: "#08090a",
      surface: "#111315",
      surfaceMuted: "#191b1f",
      surfaceElevated: "#202329",
      text: "#f4f1ea",
      mutedText: "#a3a3a3",
      border: "#2a2d33",
      accent: "#6366f1",
      accentText: "#ffffff",
      primary: "#6366f1",
      primaryText: "#ffffff",
      radiusSm: 12,
      radiusMd: 18,
      radiusLg: 28,
      shadow: "0 28px 80px rgba(0, 0, 0, 0.36)",
    };
  }

  if (
    source.includes("warp") ||
    source.includes("terminal") ||
    source.includes("developer")
  ) {
    return {
      theme: "dark",
      background: "#141413",
      surface: "#1b1b1a",
      surfaceMuted: "#252523",
      surfaceElevated: "#353534",
      text: "#e3e2e0",
      mutedText: "#a1a09d",
      border: "#3d3d3a",
      accent: "#799c92",
      accentText: "#141413",
      primary: "#ffffff",
      primaryText: "#141413",
      radiusSm: 10,
      radiusMd: 14,
      radiusLg: 24,
      shadow: "none",
    };
  }

  return {
    theme: "dark",
    background: "#08090d",
    surface: "#11131a",
    surfaceMuted: "#181b24",
    surfaceElevated: "#202432",
    text: "#f7f8fb",
    mutedText: "#9ca3af",
    border: "#2a2f3d",
    accent: "#8b5cf6",
    accentText: "#ffffff",
    primary: "#f7f8fb",
    primaryText: "#08090d",
    radiusSm: 12,
    radiusMd: 20,
    radiusLg: 30,
    shadow: "0 30px 90px rgba(0, 0, 0, 0.36)",
  };
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function removeNoise(value: string) {
  return value
    .replace(/\b(build|create|make|generate|design|develop|launch)\b/gi, "")
    .replace(/\b(a|an|the|for|with|and|to|of|in|on|by)\b/gi, " ")
    .replace(/\b(landing page|website|web app|saas|dashboard|platform|tool)\b/gi, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferProductName(title: string, subtitle: string, projectType: string) {
  const combined = `${title} ${subtitle} ${projectType}`;

  const explicitNameMatch = combined.match(
    /\b(?:called|named|for)\s+([A-Z][A-Za-z0-9-]{2,}(?:\s+[A-Z][A-Za-z0-9-]{2,}){0,2})/
  );

  if (explicitNameMatch?.[1]) {
    return explicitNameMatch[1].trim();
  }

  const brandedWords = combined.match(/\b[A-Z][A-Za-z0-9]*(?:Wired|Desk|Flow|Ops|Stack|Base|Pilot|Forge|ly|AI)\b/);

  if (brandedWords?.[0]) {
    return brandedWords[0].trim();
  }

  const cleaned = removeNoise(title);

  if (
    cleaned &&
    !/builder|workspace|preview|marketing site|web app|mobile app/i.test(cleaned)
  ) {
    return titleCase(cleaned).slice(0, 28);
  }

  const lower = combined.toLowerCase();

  if (lower.includes("ticket") || lower.includes("helpdesk") || lower.includes("support")) {
    return "DeskPilot";
  }

  if (lower.includes("security") || lower.includes("incident") || lower.includes("risk")) {
    return "RiskForge";
  }

  if (lower.includes("finance") || lower.includes("fintech") || lower.includes("payment")) {
    return "LedgerPilot";
  }

  if (lower.includes("shopify") || lower.includes("commerce") || lower.includes("store")) {
    return "StorePilot";
  }

  if (lower.includes("marketing") || lower.includes("campaign") || lower.includes("lead")) {
    return "GrowthPilot";
  }

  return "LaunchPilot";
}

function inferAudience(subtitle: string, projectType: string) {
  const text = `${subtitle} ${projectType}`.toLowerCase();

  if (text.includes("support") || text.includes("ticket") || text.includes("helpdesk")) {
    return "support teams";
  }

  if (text.includes("security") || text.includes("incident")) {
    return "security teams";
  }

  if (text.includes("shopify") || text.includes("commerce")) {
    return "commerce teams";
  }

  if (text.includes("marketing") || text.includes("lead")) {
    return "growth teams";
  }

  return "modern teams";
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function ReferoGeneratedPreview({
  title,
  subtitle,
  projectType,
  fileCount,
  designReference,
}: ReferoGeneratedPreviewProps) {
  const system = inferVisualSystem(designReference);
  const productName = inferProductName(title, subtitle, projectType);
  const audience = inferAudience(subtitle, projectType);
  const isDark = system.theme === "dark";

  const navText = isDark ? "rgba(247,248,251,0.72)" : system.mutedText;
  const subtleBorder = "1px solid transparent";
  const softDivider = `1px solid ${system.theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"}`;

  const primaryButtonStyle = {
    background: system.primary,
    color: system.primaryText,
    borderRadius: system.radiusSm,
  };

  const secondaryButtonStyle = {
    background: system.surface,
    color: system.text,
    border: subtleBorder,
    borderRadius: system.radiusSm,
  };

  return (
    <div
      style={{
        background: system.background,
        color: system.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
      className="refero-generated-site min-h-full overflow-auto"
    >
      <header
        style={{
          background: isDark
            ? "rgba(8, 9, 13, 0.82)"
            : "rgba(255, 255, 255, 0.86)",
          backdropFilter: "blur(18px)",
        }}
        className="sticky top-0 z-20"
      >
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <button
            type="button"
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-3 text-left"
          >
            <div
              style={{
                background: system.surfaceMuted,
                border: subtleBorder,
                borderRadius: system.radiusSm,
              }}
              className="flex h-9 w-9 items-center justify-center"
            >
              <Sparkles size={17} strokeWidth={2.25} />
            </div>

            <div>
              <div className="text-sm font-semibold tracking-[-0.02em]">
                {productName}
              </div>
              <div
                style={{ color: system.mutedText }}
                className="text-xs font-medium"
              >
                {projectType}
              </div>
            </div>
          </button>

          <nav
            style={{ color: navText }}
            className="hidden items-center gap-7 text-sm font-medium md:flex"
          >
            <button type="button" onClick={() => scrollToSection("product")}>
              Product
            </button>
            <button type="button" onClick={() => scrollToSection("workflow")}>
              Workflow
            </button>
            <button type="button" onClick={() => scrollToSection("pricing")}>
              Pricing
            </button>
            <button type="button" onClick={() => scrollToSection("faq")}>
              FAQ
            </button>
          </nav>

          <button
            type="button"
            onClick={() => scrollToSection("pricing")}
            style={primaryButtonStyle}
            className="hidden h-10 items-center gap-2 px-4 text-sm font-semibold md:inline-flex"
          >
            Start free
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("footer")}
            style={secondaryButtonStyle}
            className="inline-flex h-10 w-10 items-center justify-center md:hidden"
            aria-label="Open footer navigation"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <main>
        <section
          id="hero"
          className="mx-auto grid max-w-[1180px] gap-12 px-6 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center"
        >
          <div>
            <div
              style={{
                background: system.surfaceMuted,
                color: isDark ? system.text : system.accentText,
                border: subtleBorder,
                borderRadius: 999,
              }}
              className="mb-5 inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold"
            >
              <CheckCircle2 size={14} />
              Generated product website
            </div>

            <h1
              style={{
                fontSize: "clamp(52px, 7vw, 88px)",
                lineHeight: 0.92,
                letterSpacing: "-0.075em",
                fontWeight: 650,
              }}
              className="max-w-3xl"
            >
              {productName} for {audience} who need clarity.
            </h1>

            <p
              style={{ color: system.mutedText }}
              className="mt-7 max-w-xl text-[17px] leading-8"
            >
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                style={primaryButtonStyle}
                className="inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold"
              >
                Start workspace
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("product")}
                style={secondaryButtonStyle}
                className="inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold"
              >
                View product
              </button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["48%", "faster routing"],
                ["12", "SLA risks found"],
                ["36", "automations live"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  style={{
                    background: system.surfaceMuted,
                    border: subtleBorder,
                    borderRadius: system.radiusMd,
                  }}
                  className="p-4"
                >
                  <div className="text-2xl font-semibold tracking-[-0.05em]">
                    {value}
                  </div>
                  <div
                    style={{ color: system.mutedText }}
                    className="mt-1 text-xs font-medium"
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            id="product"
            style={{
              background: system.surfaceElevated,
              border: subtleBorder,
              borderRadius: system.radiusLg,
              boxShadow: system.shadow,
            }}
            className="scroll-mt-24 overflow-hidden p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold tracking-[-0.02em]">
                  Operations cockpit
                </div>
                <div
                  style={{ color: system.mutedText }}
                  className="text-xs font-medium"
                >
                  Live command surface generated from your product brief
                </div>
              </div>

              <div
                style={{
                  background: system.surfaceMuted,
                  border: subtleBorder,
                  borderRadius: 999,
                  color: system.mutedText,
                }}
                className="px-3 py-1 text-xs font-semibold"
              >
                {fileCount} files
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "Open tickets",
                  value: "184",
                  icon: Ticket,
                  note: "+12 today",
                },
                {
                  label: "SLA risk",
                  value: "12",
                  icon: AlertTriangle,
                  note: "3 urgent",
                },
                {
                  label: "Automations",
                  value: "36",
                  icon: Zap,
                  note: "8 active",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    style={{
                      background: system.surface,
                      border: subtleBorder,
                      borderRadius: system.radiusMd,
                    }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <Icon size={17} />
                      <span
                        style={{ color: system.mutedText }}
                        className="text-xs font-medium"
                      >
                        {item.note}
                      </span>
                    </div>

                    <div className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                      {item.value}
                    </div>
                    <div
                      style={{ color: system.mutedText }}
                      className="mt-1 text-xs font-medium"
                    >
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: system.surface,
                border: subtleBorder,
                borderRadius: system.radiusMd,
              }}
              className="mt-3 overflow-hidden"
            >
              <div
                style={{ borderBottom: softDivider, color: system.mutedText }}
                className="grid grid-cols-[92px_1fr_88px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]"
              >
                <span>ID</span>
                <span>Issue</span>
                <span>Priority</span>
              </div>

              {[
                ["INC-1042", "Email outage affecting finance team", "High"],
                ["REQ-8841", "New starter laptop and access setup", "Normal"],
                ["SEC-2110", "Suspicious login review", "Urgent"],
                ["AUT-3201", "Auto-route password reset requests", "Live"],
              ].map(([id, label, priority]) => (
                <div
                  key={id}
                  style={{ borderBottom: softDivider }}
                  className="grid grid-cols-[92px_1fr_88px] items-center gap-3 px-4 py-3 text-sm last:border-b-0"
                >
                  <span
                    style={{ color: system.mutedText }}
                    className="font-mono text-xs"
                  >
                    {id}
                  </span>
                  <span>{label}</span>
                  <span
                    style={{
                      background:
                        priority === "Urgent" || priority === "Live"
                          ? system.accent
                          : system.surfaceMuted,
                      color:
                        priority === "Urgent" || priority === "Live"
                          ? system.accentText
                          : system.mutedText,
                      borderRadius: 999,
                    }}
                    className="px-2 py-1 text-center text-xs font-semibold"
                  >
                    {priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-4 px-6 pb-20 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Security-aware by default",
              copy:
                "Auth, roles, policy checks, and launch risks are planned before the preview reaches publish.",
            },
            {
              icon: Workflow,
              title: "Workflow proof, not filler",
              copy:
                "Generated sections show ticket flows, actions, owners, metrics, and real product behaviour.",
            },
            {
              icon: Bot,
              title: "AI where it earns its keep",
              copy:
                "Automation suggestions and generated knowledge are presented as operational modules.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                style={{
                  background: system.surfaceElevated,
                  border: subtleBorder,
                  borderRadius: system.radiusMd,
                }}
                className="p-6"
              >
                <Icon size={21} />
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em]">
                  {item.title}
                </h3>
                <p
                  style={{ color: system.mutedText }}
                  className="mt-3 text-sm leading-6"
                >
                  {item.copy}
                </p>
              </article>
            );
          })}
        </section>

        <section
          id="workflow"
          className="mx-auto grid max-w-[1180px] scroll-mt-24 gap-4 px-6 pb-24 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div
            style={{
              background: system.surfaceElevated,
              border: subtleBorder,
              borderRadius: system.radiusLg,
            }}
            className="p-7"
          >
            <div
              style={{ color: system.mutedText }}
              className="text-xs font-semibold uppercase tracking-[0.16em]"
            >
              Build flow
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              From prompt to working product structure.
            </h2>
            <p
              style={{ color: system.mutedText }}
              className="mt-4 text-sm leading-6"
            >
              The website includes product evidence, planned architecture, file
              changes, launch checks, and conversion sections in one coherent
              experience.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              {
                icon: LayoutDashboard,
                label: "Generate preview",
                copy: "Create a polished product-facing page.",
              },
              {
                icon: FileText,
                label: "Create files",
                copy: "Produce useful page and CSS structure.",
              },
              {
                icon: LockKeyhole,
                label: "Review security",
                copy: "Check auth, keys, data rules, and launch risks.",
              },
              {
                icon: GitBranch,
                label: "Publish safely",
                copy: "Move from local build to production-ready flow.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  style={{
                    background: system.surface,
                    border: subtleBorder,
                    borderRadius: system.radiusMd,
                  }}
                  className="flex items-center gap-4 p-4"
                >
                  <div
                    style={{
                      background: system.surfaceMuted,
                      borderRadius: system.radiusSm,
                    }}
                    className="flex h-10 w-10 items-center justify-center"
                  >
                    <Icon size={18} />
                  </div>

                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div
                      style={{ color: system.mutedText }}
                      className="text-xs leading-5"
                    >
                      {item.copy}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto max-w-[1180px] scroll-mt-24 px-6 pb-24"
        >
          <div className="mb-8 max-w-2xl">
            <div
              style={{ color: system.mutedText }}
              className="text-xs font-semibold uppercase tracking-[0.16em]"
            >
              Pricing
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em]">
              Start small. Scale when the work does.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Starter", "€0", "For testing the workspace", "Start free"],
              ["Growth", "€29", "For active teams and live workflows", "Choose Growth"],
              ["Scale", "Custom", "For larger operations and controls", "Talk to sales"],
            ].map(([plan, price, description, action], index) => (
              <article
                key={plan}
                style={{
                  background:
                    index === 1 ? system.surfaceElevated : system.surface,
                  border:
                    index === 1
                      ? `1px solid ${system.accent}`
                      : subtleBorder,
                  borderRadius: system.radiusLg,
                  boxShadow: index === 1 ? system.shadow : "none",
                }}
                className="p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan}</h3>
                  {index === 1 ? (
                    <span
                      style={{
                        background: system.accent,
                        color: system.accentText,
                        borderRadius: 999,
                      }}
                      className="px-3 py-1 text-xs font-semibold"
                    >
                      Popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 text-4xl font-semibold tracking-[-0.07em]">
                  {price}
                </div>

                <p
                  style={{ color: system.mutedText }}
                  className="mt-3 text-sm leading-6"
                >
                  {description}
                </p>

                <ul className="mt-6 grid gap-3 text-sm">
                  {[
                    "Generated website preview",
                    "Workflow sections",
                    "Security readiness checks",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => scrollToSection("footer")}
                  style={index === 1 ? primaryButtonStyle : secondaryButtonStyle}
                  className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 px-4 text-sm font-semibold"
                >
                  {action}
                  <ChevronRight size={15} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto max-w-[1180px] scroll-mt-24 px-6 pb-24"
        >
          <div
            style={{
              background: system.surfaceElevated,
              border: subtleBorder,
              borderRadius: system.radiusLg,
            }}
            className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div>
              <div
                style={{ color: system.mutedText }}
                className="text-xs font-semibold uppercase tracking-[0.16em]"
              >
                FAQ
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                Built to feel complete, not decorative.
              </h2>
            </div>

            <div className="grid gap-3">
              {[
                [
                  "Do the buttons work?",
                  "Yes. Navigation and CTAs scroll to real sections inside this generated preview.",
                ],
                [
                  "Is this using the design reference visibly?",
                  "Yes. The visual system is inferred from imported design reference files, while keeping metadata hidden from users.",
                ],
                [
                  "Can this become a production website?",
                  "The preview now has the right structure. The next step is making generated code files match this same quality.",
                ],
              ].map(([question, answer]) => (
                <article
                  key={question}
                  style={{
                    background: system.surface,
                    border: subtleBorder,
                    borderRadius: system.radiusMd,
                  }}
                  className="p-5"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <HelpCircle size={16} />
                    {question}
                  </div>
                  <p
                    style={{ color: system.mutedText }}
                    className="mt-2 text-sm leading-6"
                  >
                    {answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        id="footer"
        style={{
          background: system.surface,
          borderTop: subtleBorder,
        }}
        className="scroll-mt-24"
      >
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <div
                style={{
                  background: system.surfaceMuted,
                  border: subtleBorder,
                  borderRadius: system.radiusSm,
                }}
                className="flex h-9 w-9 items-center justify-center"
              >
                <Sparkles size={17} />
              </div>
              <strong>{productName}</strong>
            </div>

            <p
              style={{ color: system.mutedText }}
              className="mt-4 max-w-sm text-sm leading-6"
            >
              A complete generated website preview with product sections,
              working navigation, pricing, FAQ, and footer.
            </p>
          </div>

          {[
            ["Product", "Dashboard", "Workflow", "Automation"],
            ["Company", "About", "Security", "Contact"],
            ["Get started", "Start free", "Book demo", "Email team"],
          ].map(([heading, ...items]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold">{heading}</h4>
              <div
                style={{ color: system.mutedText }}
                className="mt-4 grid gap-2 text-sm"
              >
                {items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => scrollToSection("hero")}
                    className="text-left"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{ borderTop: softDivider, color: system.mutedText }}
          className="mx-auto grid max-w-[1180px] gap-12 px-8 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center"        >
          <span>© {new Date().getFullYear()} {productName}. All rights reserved.</span>
          <button
            type="button"
            onClick={() => {
              window.location.href = "mailto:hello@example.com";
            }}
            className="inline-flex items-center gap-2"
          >
            <Mail size={14} />
            Contact
          </button>
        </div>
      </footer>
    </div>
  );
}