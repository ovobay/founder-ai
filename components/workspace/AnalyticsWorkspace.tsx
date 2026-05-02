"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Eye,
  Globe2,
  Laptop,
  MousePointerClick,
  RefreshCcw,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WorkspaceCallout,
  WorkspaceList,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePanel,
  WorkspaceSection,
  WorkspaceStatusPill,
  WorkspaceSubHeader,
} from "@/components/workspace/tool-system/WorkspacePanel";

export type AnalyticsPoint = {
  label: string;
  value: number;
};

export type AnalyticsEvent = {
  id: string;
  title: string;
  description: string;
  timestampLabel: string;
  type: "view" | "click" | "conversion" | "system";
};

export type AnalyticsWorkspaceProps = {
  projectName?: string;
  lastUpdatedLabel?: string;
  visitors?: number;
  pageViews?: number;
  conversionRate?: number;
  averageSessionSeconds?: number;
  weeklyTrend?: AnalyticsPoint[];
  events?: AnalyticsEvent[];
  onClose?: () => void;
  onRefresh?: () => void;
  onOpenReports?: () => void;
};

type AnalyticsTab = "overview" | "traffic" | "pages" | "devices" | "events";

const defaultWeeklyTrend: AnalyticsPoint[] = [
  { label: "Mon", value: 18 },
  { label: "Tue", value: 31 },
  { label: "Wed", value: 26 },
  { label: "Thu", value: 44 },
  { label: "Fri", value: 51 },
  { label: "Sat", value: 39 },
  { label: "Sun", value: 58 },
];

const defaultEvents: AnalyticsEvent[] = [
  {
    id: "preview-opened",
    title: "Preview opened",
    description: "Workspace preview was viewed from the build panel.",
    timestampLabel: "2 min ago",
    type: "view",
  },
  {
    id: "publish-clicked",
    title: "Publish panel opened",
    description: "User opened publish readiness from the toolbar.",
    timestampLabel: "8 min ago",
    type: "click",
  },
  {
    id: "security-reviewed",
    title: "Security review viewed",
    description: "Security workspace was opened for launch checks.",
    timestampLabel: "14 min ago",
    type: "system",
  },
  {
    id: "cta-clicked",
    title: "Primary CTA clicked",
    description: "A preview visitor interacted with the main call to action.",
    timestampLabel: "21 min ago",
    type: "conversion",
  },
];

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes}m`;

  return `${minutes}m ${remainingSeconds}s`;
}

function getEventIcon(type: AnalyticsEvent["type"]) {
  if (type === "view") return <Eye className="h-4 w-4" />;
  if (type === "click") return <MousePointerClick className="h-4 w-4" />;
  if (type === "conversion") return <TrendingUp className="h-4 w-4" />;

  return <Activity className="h-4 w-4" />;
}

function getEventTone(type: AnalyticsEvent["type"]) {
  if (type === "conversion") return "success" as const;
  if (type === "click") return "info" as const;
  if (type === "system") return "neutral" as const;

  return "default" as const;
}

function getChangeLabel(current: number, previous: number) {
  const delta = current - previous;

  if (delta === 0) return "No change";
  if (delta > 0) return `+${delta} this period`;

  return `${delta} this period`;
}

function getMaxTrendValue(points: AnalyticsPoint[]) {
  return Math.max(...points.map((point) => point.value), 1);
}

export function AnalyticsWorkspace({
  projectName = "Founder AI workspace",
  lastUpdatedLabel = "Just now",
  visitors = 128,
  pageViews = 394,
  conversionRate = 7.8,
  averageSessionSeconds = 184,
  weeklyTrend = defaultWeeklyTrend,
  events = defaultEvents,
  onClose,
  onRefresh,
  onOpenReports,
}: AnalyticsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");

  const maxTrendValue = getMaxTrendValue(weeklyTrend);
  const latestTrendValue = weeklyTrend.at(-1)?.value ?? 0;
  const previousTrendValue = weeklyTrend.at(-2)?.value ?? latestTrendValue;
  const trendDelta = latestTrendValue - previousTrendValue;
  const trendTone = trendDelta >= 0 ? "success" : "warning";

  const totalTrendValue = weeklyTrend.reduce(
    (total, point) => total + point.value,
    0
  );

  const averageTrendValue = Math.round(totalTrendValue / weeklyTrend.length);

  const conversionEvents = events.filter(
    (event) => event.type === "conversion"
  ).length;

  const trafficRows = useMemo(
    () => [
      {
        label: "Direct",
        description: "Visitors opening the preview or generated URL directly.",
        value: "42%",
        trailing: <WorkspaceStatusPill tone="success">Top</WorkspaceStatusPill>,
      },
      {
        label: "Workspace",
        description: "Visitors arriving from the Founder AI preview workspace.",
        value: "31%",
        trailing: <WorkspaceStatusPill tone="info">Internal</WorkspaceStatusPill>,
      },
      {
        label: "Shared link",
        description: "Traffic from shared preview links and external reviews.",
        value: "18%",
        trailing: <WorkspaceStatusPill tone="neutral">Review</WorkspaceStatusPill>,
      },
      {
        label: "Unknown",
        description: "Unclassified sources until analytics is fully connected.",
        value: "9%",
        trailing: <WorkspaceStatusPill tone="warning">Needs data</WorkspaceStatusPill>,
      },
    ],
    []
  );

  const pageRows = useMemo(
    () => [
      {
        label: "/",
        description: "Generated landing or primary workspace preview route.",
        value: `${Math.max(1, Math.round(pageViews * 0.68))}`,
        trailing: <Eye className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "/pricing",
        description: "Pricing or plan comparison page.",
        value: `${Math.max(0, Math.round(pageViews * 0.14))}`,
        trailing: <ArrowUpRight className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "/build",
        description: "Generated build or feature section.",
        value: `${Math.max(0, Math.round(pageViews * 0.11))}`,
        trailing: <Sparkles className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "/contact",
        description: "Lead capture or enquiry route.",
        value: `${Math.max(0, Math.round(pageViews * 0.07))}`,
        trailing: <MousePointerClick className="h-4 w-4 text-slate-500" />,
      },
    ],
    [pageViews]
  );

  const countryRows = useMemo(
    () => [
      {
        label: "Ireland",
        description: "Primary local workspace traffic.",
        value: "54%",
        trailing: <Globe2 className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "United Kingdom",
        description: "Secondary preview traffic.",
        value: "18%",
        trailing: <Globe2 className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "United States",
        description: "External review and shared link traffic.",
        value: "15%",
        trailing: <Globe2 className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "Other",
        description: "Unclassified or low-volume regions.",
        value: "13%",
        trailing: <Globe2 className="h-4 w-4 text-slate-500" />,
      },
    ],
    []
  );

  const deviceRows = useMemo(
    () => [
      {
        label: "Desktop",
        description: "Users reviewing the generated result on larger screens.",
        value: "72%",
        trailing: <Laptop className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "Mobile",
        description: "Users reviewing responsive preview output.",
        value: "24%",
        trailing: <Smartphone className="h-4 w-4 text-slate-500" />,
      },
      {
        label: "Tablet",
        description: "Mid-size viewport traffic.",
        value: "4%",
        trailing: <Smartphone className="h-4 w-4 text-slate-500" />,
      },
    ],
    []
  );

  const tabs: Array<{ key: AnalyticsTab; label: string; count?: number }> = [
    { key: "overview", label: "Overview" },
    { key: "traffic", label: "Traffic" },
    { key: "pages", label: "Pages" },
    { key: "devices", label: "Devices" },
    { key: "events", label: "Events", count: events.length },
  ];

  return (
    <WorkspacePanel
      eyebrow="Analytics"
      title="Analytics"
      description="Track preview activity, conversion signals, page engagement, and generated project usage."
      status={getChangeLabel(latestTrendValue, previousTrendValue)}
      statusTone={trendTone}
      actions={
        <>
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            className="h-9 rounded-[12px]"
            onClick={onRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            className="h-9 rounded-[12px]"
            onClick={onOpenReports}
          >
            <BarChart3 className="h-4 w-4" />
            Reports
          </Button>

          {onClose ? (
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-[12px]"
              onClick={onClose}
            >
              Close
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <WorkspaceSubHeader
          left={
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Workspace intelligence
              </div>
              <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
                {projectName} analytics overview
              </h3>
              <p className="mt-1 max-w-[900px] text-[14px] leading-6 text-slate-600">
                Keep analytics readable and decision-focused: visitors, page
                activity, conversion signals, and where attention is going.
                Nobody needs a decorative chart cathedral. 📊
              </p>
            </div>
          }
          right={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <WorkspaceStatusPill tone={trendTone}>
                {getChangeLabel(latestTrendValue, previousTrendValue)}
              </WorkspaceStatusPill>

              <WorkspaceStatusPill tone="neutral">
                Updated · {lastUpdatedLabel}
              </WorkspaceStatusPill>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                suppressHydrationWarning
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "inline-flex h-9 items-center gap-2 rounded-[12px] border px-3 text-[13px] font-medium transition-colors",
                  isActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {tab.label}

                {typeof tab.count === "number" ? (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-white px-2 text-[11px]"
                  >
                    {tab.count}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Visitors"
            value={visitors.toLocaleString()}
            description="Unique preview visitors."
            tone="info"
            icon={<Users className="h-4 w-4" />}
          />

          <WorkspaceMetricCard
            label="Pageviews"
            value={pageViews.toLocaleString()}
            description="Total preview screens viewed."
            tone="neutral"
            icon={<Eye className="h-4 w-4" />}
          />

          <WorkspaceMetricCard
            label="Views / Visit"
            value={visitors > 0 ? (pageViews / visitors).toFixed(1) : "0"}
            description="Average screens per visitor."
            tone="default"
            icon={<MousePointerClick className="h-4 w-4" />}
          />

          <WorkspaceMetricCard
            label="Conversion"
            value={`${conversionRate}%`}
            description="Primary action completion."
            tone={conversionRate >= 6 ? "success" : "warning"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </WorkspaceMetricGrid>

        <WorkspaceCallout
          title={
            activeTab === "overview"
              ? "Analytics are ready for wiring"
              : "Filtered analytics view"
          }
          description={
            activeTab === "overview"
              ? "This workspace structure is ready to connect to Supabase, PostHog, Plausible, or another analytics source when tracking is implemented."
              : "This tab shows a focused breakdown without changing the core workspace layout."
          }
          tone="info"
          action={
            <Button
              suppressHydrationWarning
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-[12px] bg-white"
              onClick={onOpenReports}
            >
              Open reports
            </Button>
          }
        />

        {(activeTab === "overview" || activeTab === "traffic") ? (
          <WorkspaceSection
            title="Visitor activity"
            description="Preview traffic across the selected period."
            action={
              <WorkspaceStatusPill tone={trendTone}>
                Avg · {averageTrendValue}
              </WorkspaceStatusPill>
            }
          >
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[13px] font-medium text-slate-600">
                    Current visitors
                  </div>
                  <div className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">
                    {latestTrendValue}
                  </div>
                </div>

                <WorkspaceStatusPill tone={trendTone}>
                  {getChangeLabel(latestTrendValue, previousTrendValue)}
                </WorkspaceStatusPill>
              </div>

              <div className="grid min-h-[320px] grid-cols-7 items-end gap-3 rounded-[18px] border border-slate-200 bg-white px-5 py-5">
                {weeklyTrend.map((point) => {
                  const height = Math.max(
                    8,
                    Math.round((point.value / maxTrendValue) * 100)
                  );

                  const isLatest = point.label === weeklyTrend.at(-1)?.label;

                  return (
                    <div
                      key={point.label}
                      className="grid h-full grid-rows-[24px_1fr_22px] items-end justify-items-center gap-2"
                    >
                      <span className="text-[11px] font-semibold text-slate-500">
                        {point.value}
                      </span>

                      <div className="flex h-full min-h-[220px] w-full max-w-[44px] items-end overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-1">
                        <div
                          className={[
                            "w-full rounded-full transition-all",
                            isLatest ? "bg-blue-600" : "bg-slate-300",
                          ].join(" ")}
                          style={{ height: `${height}%` }}
                        />
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </WorkspaceSection>
        ) : null}

        {activeTab === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <WorkspaceSection
              title="Traffic sources"
              description="Where preview traffic is coming from."
            >
              <WorkspaceList rows={trafficRows} />
            </WorkspaceSection>

            <WorkspaceSection
              title="Top pages"
              description="Most viewed generated routes."
            >
              <WorkspaceList rows={pageRows} />
            </WorkspaceSection>

            <WorkspaceSection
              title="Countries"
              description="Regional traffic breakdown."
            >
              <WorkspaceList rows={countryRows} />
            </WorkspaceSection>

            <WorkspaceSection
              title="Devices"
              description="Device and viewport distribution."
            >
              <WorkspaceList rows={deviceRows} />
            </WorkspaceSection>
          </div>
        ) : null}

        {activeTab === "traffic" ? (
          <WorkspaceSection
            title="Traffic sources"
            description="Source-level breakdown for preview activity."
          >
            <WorkspaceList rows={trafficRows} />
          </WorkspaceSection>
        ) : null}

        {activeTab === "pages" ? (
          <WorkspaceSection
            title="Top pages"
            description="Generated routes ranked by preview activity."
          >
            <WorkspaceList rows={pageRows} />
          </WorkspaceSection>
        ) : null}

        {activeTab === "devices" ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <WorkspaceSection
              title="Devices"
              description="Device and viewport distribution."
            >
              <WorkspaceList rows={deviceRows} />
            </WorkspaceSection>

            <WorkspaceSection
              title="Responsive review"
              description="Use this to decide where to test layout quality next."
            >
              <WorkspaceList
                rows={[
                  {
                    label: "Desktop review",
                    description:
                      "Check large viewport spacing, hero layout, nav, and call-to-action hierarchy.",
                    value: "Required",
                    trailing: <Laptop className="h-4 w-4 text-slate-500" />,
                  },
                  {
                    label: "Mobile review",
                    description:
                      "Check stacked cards, header behaviour, horizontal overflow, and tap targets.",
                    value: "Required",
                    trailing: <Smartphone className="h-4 w-4 text-slate-500" />,
                  },
                  {
                    label: "Tablet review",
                    description:
                      "Check mid-width wrapping and grid breakpoints.",
                    value: "Optional",
                    trailing: <Sparkles className="h-4 w-4 text-slate-500" />,
                  },
                ]}
              />
            </WorkspaceSection>
          </div>
        ) : null}

        {(activeTab === "overview" || activeTab === "events") ? (
          <WorkspaceSection
            title="Recent events"
            description="Latest tracked preview, publish, security, and conversion activity."
            action={
              <WorkspaceStatusPill tone="info">
                {events.length} events
              </WorkspaceStatusPill>
            }
          >
            <div className="overflow-hidden rounded-[20px] border border-slate-200">
              <div className="grid grid-cols-[42px_minmax(0,1fr)_140px_120px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-500">
                <div />
                <div>Event</div>
                <div>Type</div>
                <div>Time</div>
              </div>

              {events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-[42px_minmax(0,1fr)_140px_120px] items-center border-b border-slate-200 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-slate-600">
                      {getEventIcon(event.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-slate-950">
                        {event.title}
                      </div>
                      <div className="mt-0.5 truncate text-[13px] text-slate-500">
                        {event.description}
                      </div>
                    </div>

                    <div>
                      <WorkspaceStatusPill tone={getEventTone(event.type)}>
                        {event.type}
                      </WorkspaceStatusPill>
                    </div>

                    <div className="text-[13px] font-medium text-slate-600">
                      {event.timestampLabel}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12 text-center">
                  <div className="text-[15px] font-semibold text-slate-950">
                    No events yet
                  </div>
                  <p className="mt-1 text-[14px] text-slate-600">
                    Activity will appear after preview interactions are tracked.
                  </p>
                </div>
              )}
            </div>
          </WorkspaceSection>
        ) : null}

        <WorkspaceSection
          title="Recommended tracking"
          description="Analytics events that should be wired before production release."
        >
          <WorkspaceList
            rows={[
              {
                label: "Preview opened",
                description:
                  "Track when generated previews are opened from the workspace.",
                value: "Event",
                trailing: <WorkspaceStatusPill tone="info">preview_opened</WorkspaceStatusPill>,
              },
              {
                label: "Publish clicked",
                description:
                  "Track intent to publish and readiness review actions.",
                value: "Event",
                trailing: <WorkspaceStatusPill tone="info">publish_clicked</WorkspaceStatusPill>,
              },
              {
                label: "Primary CTA clicked",
                description:
                  "Track the main conversion action in generated previews.",
                value: "Conversion",
                trailing: <WorkspaceStatusPill tone="success">conversion</WorkspaceStatusPill>,
              },
              {
                label: "Security issue viewed",
                description:
                  "Track whether users inspect blockers before deployment.",
                value: "Event",
                trailing: <WorkspaceStatusPill tone="warning">security_review</WorkspaceStatusPill>,
              },
            ]}
          />
        </WorkspaceSection>
      </div>
    </WorkspacePanel>
  );
}