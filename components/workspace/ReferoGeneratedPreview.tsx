"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
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
  name: string;
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
      name: "Plain Workbench",
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
      name: "Mercury Command",
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
      name: "Warp Terminal",
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
    name: "Linear Polished SaaS",
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

function extractProductName(title: string) {
  const clean = title
    .replace(/builder/gi, "")
    .replace(/workspace/gi, "")
    .replace(/preview/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return clean || "Founder AI";
}

export function ReferoGeneratedPreview({
  title,
  subtitle,
  projectType,
  fileCount,
  designReference,
}: ReferoGeneratedPreviewProps) {
  const system = inferVisualSystem(designReference);
  const productName = extractProductName(title);
  const isDark = system.theme === "dark";

  const navText = isDark ? "rgba(247,248,251,0.72)" : system.mutedText;
  const subtleBorder = `1px solid ${system.border}`;

  return (
    <div
      style={{
        background: system.background,
        color: system.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
      className="min-h-[1180px] overflow-hidden"
    >
      <header
        style={{
          background: isDark
            ? "rgba(8, 9, 13, 0.82)"
            : "rgba(255, 255, 255, 0.86)",
          borderBottom: subtleBorder,
          backdropFilter: "blur(18px)",
        }}
        className="sticky top-0 z-20"
      >
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
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
          </div>

          <nav
            style={{ color: navText }}
            className="hidden items-center gap-7 text-sm font-medium md:flex"
          >
            <span>Product</span>
            <span>Workflow</span>
            <span>Security</span>
            <span>Pricing</span>
          </nav>

          <button
            style={{
              background: system.primary,
              color: system.primaryText,
              borderRadius: system.radiusSm,
            }}
            className="inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold"
          >
            Start building
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-6 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
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
              {designReference?.name ?? system.name} taste applied
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
              {productName}
              <span style={{ color: system.accent }}> that feels built.</span>
            </h1>

            <p
              style={{ color: system.mutedText }}
              className="mt-7 max-w-xl text-[17px] leading-8"
            >
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                style={{
                  background: system.primary,
                  color: system.primaryText,
                  borderRadius: system.radiusSm,
                }}
                className="inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold"
              >
                Start workspace
                <ArrowRight size={15} />
              </button>

              <button
                style={{
                  background: system.surface,
                  color: system.text,
                  border: subtleBorder,
                  borderRadius: system.radiusSm,
                }}
                className="inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold"
              >
                View workflow
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Product dashboard",
                "Workflow panels",
                "SLA warnings",
                "Automation engine",
              ].map((label) => (
                <span
                  key={label}
                  style={{
                    background: system.surfaceMuted,
                    color: system.mutedText,
                    border: subtleBorder,
                    borderRadius: 999,
                  }}
                  className="px-3 py-1.5 text-xs font-semibold"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              background: system.surfaceElevated,
              border: subtleBorder,
              borderRadius: system.radiusLg,
              boxShadow: system.shadow,
            }}
            className="overflow-hidden p-4"
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
                  Generated from the current build state
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
              ].map((item) => (
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
                    <item.icon size={17} />
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
              ))}
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
                style={{ borderBottom: subtleBorder, color: system.mutedText }}
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
                  style={{ borderBottom: subtleBorder }}
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
          ].map((item) => (
            <article
              key={item.title}
              style={{
                background: system.surfaceElevated,
                border: subtleBorder,
                borderRadius: system.radiusMd,
              }}
              className="p-6"
            >
              <item.icon size={21} />
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
          ))}
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-4 px-6 pb-24 lg:grid-cols-[0.9fr_1.1fr]">
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
              Founder AI should generate visible product evidence, planned
              architecture, file changes, and publish readiness in one coherent
              workspace.
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

        <section className="mx-auto max-w-[1180px] px-6 pb-24">
          <div
            style={{
              background: system.surfaceElevated,
              border: subtleBorder,
              borderRadius: system.radiusLg,
            }}
            className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <div
                style={{ color: system.mutedText }}
                className="text-xs font-semibold uppercase tracking-[0.16em]"
              >
                Launch readiness
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                A generated site should look like someone cared.
              </h2>
              <p
                style={{ color: system.mutedText }}
                className="mt-3 max-w-2xl text-sm leading-6"
              >
                This preview is now driven by imported design references instead
                of the old hardcoded template.
              </p>
            </div>

            <button
              style={{
                background: system.primary,
                color: system.primaryText,
                borderRadius: system.radiusSm,
              }}
              className="inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold"
            >
              Continue build
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
