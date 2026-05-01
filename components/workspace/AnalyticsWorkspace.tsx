"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Eye,
  Gauge,
  MousePointerClick,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Users,
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
  if (type === "conversion") return "green" as const;
  if (type === "click") return "blue" as const;
  if (type === "system") return "purple" as const;

  return "default" as const;
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
  const highestTrendValue = Math.max(
    ...weeklyTrend.map((point) => point.value),
    1
  );

  const latestTrendValue = weeklyTrend.at(-1)?.value ?? 0;
  const previousTrendValue = weeklyTrend.at(-2)?.value ?? latestTrendValue;
  const trendDelta = latestTrendValue - previousTrendValue;
  const trendTone = trendDelta >= 0 ? "green" : "orange";

  return (
    <WorkspaceShell
      title="Analytics"
      eyebrow="Workspace intelligence"
      description="Track preview activity, conversion signals, and launch-readiness engagement."
      icon={<BarChart3 className="h-4 w-4" />}
      badge={
        <WorkspaceStatusBadge tone={trendTone}>
          Updated · {lastUpdatedLabel}
        </WorkspaceStatusBadge>
      }
      actions={
        <Button
          suppressHydrationWarning
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      }
      onClose={onClose}
    >
      <WorkspaceSectionStack>
        <WorkspaceHero
          eyebrow="Performance overview"
          title={`${projectName} analytics`}
          description="A clean command view for what users are doing, where they engage, and whether the project is becoming useful or just another beautifully arranged pile of pixels."
          icon={<Gauge className="h-5 w-5" />}
          badge={
            <WorkspaceStatusBadge tone={trendTone}>
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta} this period
            </WorkspaceStatusBadge>
          }
          metric={{
            label: "Conversion",
            value: `${conversionRate}%`,
            tone: conversionRate >= 6 ? "green" : "orange",
          }}
          actions={
            <>
              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                onClick={onOpenReports}
              >
                <BarChart3 className="h-4 w-4" />
                Open reports
              </Button>

              <Button
                suppressHydrationWarning
                type="button"
                size="sm"
                variant="outline"
                onClick={onRefresh}
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh data
              </Button>
            </>
          }
        />

        <WorkspaceNotice title="Analytics are currently estimated" tone="info">
          These values can be wired to real product analytics later. For now,
          this workspace gives the UI structure and state model without dragging
          another half-configured analytics SDK into the room wearing muddy
          boots.
        </WorkspaceNotice>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Visitors"
            value={visitors.toLocaleString()}
            detail="Unique preview visitors."
            icon={<Users className="h-4 w-4" />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Page views"
            value={pageViews.toLocaleString()}
            detail="Total viewed screens."
            icon={<Eye className="h-4 w-4" />}
            tone="purple"
          />

          <WorkspaceMetricCard
            label="Conversion"
            value={`${conversionRate}%`}
            detail="Primary action completion."
            icon={<ArrowUpRight className="h-4 w-4" />}
            tone={conversionRate >= 6 ? "green" : "orange"}
          />

          <WorkspaceMetricCard
            label="Avg session"
            value={formatDuration(averageSessionSeconds)}
            detail="Average engagement duration."
            icon={<Clock3 className="h-4 w-4" />}
            tone="default"
          />
        </WorkspaceMetricGrid>

        <WorkspaceTwoColumnGrid>
          <WorkspaceCard
            title="Weekly activity"
            description="Preview traffic and engagement movement across the last seven days."
            badge={<WorkspaceStatusBadge tone={trendTone}>Trend</WorkspaceStatusBadge>}
          >
            <div className="min-h-80 rounded-2xl border bg-background p-4">
              <div
                aria-label="Weekly activity chart"
                className="grid min-h-64 grid-cols-7 items-end gap-2"
              >
                {weeklyTrend.map((point) => {
                  const height = Math.max(
                    12,
                    Math.round((point.value / highestTrendValue) * 100)
                  );

                  return (
                    <div
                      key={point.label}
                      className="grid h-full grid-rows-[auto_1fr_auto] items-end justify-items-center gap-2"
                    >
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {point.value}
                      </span>

                      <div className="flex h-full min-h-44 w-full max-w-10 items-end overflow-hidden rounded-full border bg-muted p-1">
                        <div
                          className="w-full rounded-full bg-blue-600 shadow-sm transition-all"
                          style={{ height: `${height}%` }}
                        />
                      </div>

                      <span className="text-[11px] font-bold text-muted-foreground">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Recent events"
            description="Latest activity from preview, publish, security, and system actions."
            badge={
              <WorkspaceStatusBadge tone="blue">
                {events.length} events
              </WorkspaceStatusBadge>
            }
          >
            {events.length > 0 ? (
              <div className="grid gap-2">
                {events.map((event) => (
                  <WorkspaceActionRow
                    key={event.id}
                    title={event.title}
                    description={event.description}
                    icon={getEventIcon(event.type)}
                    badge={
                      <WorkspaceStatusBadge tone={getEventTone(event.type)}>
                        {event.timestampLabel}
                      </WorkspaceStatusBadge>
                    }
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No events yet"
                description="Workspace activity will appear here after preview interactions are tracked."
              />
            )}
          </WorkspaceCard>
        </WorkspaceTwoColumnGrid>

        <WorkspaceCard
          title="Recommended next actions"
          description="Suggested analytics improvements before production release."
          badge={<WorkspaceStatusBadge>Checklist</WorkspaceStatusBadge>}
        >
          <div className="grid gap-2">
            <WorkspaceActionRow
              title="Add real event tracking"
              description="Track preview opens, publish clicks, conversion actions, and onboarding completion."
              icon={<MousePointerClick className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="orange">Next</WorkspaceStatusBadge>}
            />

            <WorkspaceActionRow
              title="Define conversion events"
              description="Mark the primary actions that prove the generated product is working."
              icon={<TrendingUp className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge>Manual</WorkspaceStatusBadge>}
            />

            <WorkspaceActionRow
              title="Connect reporting source"
              description="Wire this panel to Supabase, PostHog, Plausible, or your chosen analytics store."
              icon={<Sparkles className="h-4 w-4" />}
              badge={<WorkspaceStatusBadge tone="blue">Later</WorkspaceStatusBadge>}
            />
          </div>
        </WorkspaceCard>
      </WorkspaceSectionStack>
    </WorkspaceShell>
  );
}