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

import styles from "./AnalyticsWorkspace.module.css";

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
  if (type === "view") return <Eye size={15} strokeWidth={2.25} />;
  if (type === "click") return <MousePointerClick size={15} strokeWidth={2.25} />;
  if (type === "conversion") return <TrendingUp size={15} strokeWidth={2.25} />;
  return <Activity size={15} strokeWidth={2.25} />;
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
  const highestTrendValue = Math.max(...weeklyTrend.map((point) => point.value), 1);
  const latestTrendValue = weeklyTrend.at(-1)?.value ?? 0;
  const previousTrendValue = weeklyTrend.at(-2)?.value ?? latestTrendValue;
  const trendDelta = latestTrendValue - previousTrendValue;
  const trendTone = trendDelta >= 0 ? "green" : "orange";

  return (
    <WorkspacePanel
      title="Analytics"
      eyebrow="Workspace intelligence"
      description="Track preview activity, conversion signals, and launch-readiness engagement."
      icon={<BarChart3 size={17} strokeWidth={2.3} />}
      badge={<WorkspaceStatusPill tone={trendTone}>Updated · {lastUpdatedLabel}</WorkspaceStatusPill>}
      actions={
        <button
          suppressHydrationWarning
          type="button"
          className={styles.topbarButton}
          onClick={onRefresh}
        >
          <RefreshCcw size={14} strokeWidth={2.3} />
          Refresh
        </button>
      }
      onClose={onClose}
    >
      <div className={styles.analyticsWorkspace}>
        <WorkspaceHero
          eyebrow="Performance overview"
          title={`${projectName} analytics`}
          description="A clean command view for what users are doing, where they engage, and whether the project is becoming useful or just another beautifully arranged pile of pixels."
          icon={<Gauge size={20} strokeWidth={2.25} />}
          badge={
            <WorkspaceStatusPill tone={trendTone}>
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta} this period
            </WorkspaceStatusPill>
          }
          metric={{
            label: "Conversion",
            value: `${conversionRate}%`,
            tone: conversionRate >= 6 ? "green" : "orange",
          }}
          actions={
            <>
              <button
                suppressHydrationWarning
                type="button"
                className={styles.primaryAction}
                onClick={onOpenReports}
              >
                <BarChart3 size={14} strokeWidth={2.3} />
                Open reports
              </button>

              <button
                suppressHydrationWarning
                type="button"
                className={styles.secondaryAction}
                onClick={onRefresh}
              >
                <RefreshCcw size={14} strokeWidth={2.3} />
                Refresh data
              </button>
            </>
          }
        />

        <WorkspaceAlert title="Analytics are currently estimated" tone="info">
          These values can be wired to real product analytics later. For now,
          this workspace gives the UI structure and state model without dragging
          another half-configured analytics SDK into the room wearing muddy boots.
        </WorkspaceAlert>

        <WorkspaceMetricGrid>
          <WorkspaceMetricCard
            label="Visitors"
            value={visitors.toLocaleString()}
            detail="Unique preview visitors."
            icon={<Users size={15} strokeWidth={2.25} />}
            tone="blue"
          />

          <WorkspaceMetricCard
            label="Page views"
            value={pageViews.toLocaleString()}
            detail="Total viewed screens."
            icon={<Eye size={15} strokeWidth={2.25} />}
            tone="purple"
          />

          <WorkspaceMetricCard
            label="Conversion"
            value={`${conversionRate}%`}
            detail="Primary action completion."
            icon={<ArrowUpRight size={15} strokeWidth={2.25} />}
            tone={conversionRate >= 6 ? "green" : "orange"}
          />

          <WorkspaceMetricCard
            label="Avg session"
            value={formatDuration(averageSessionSeconds)}
            detail="Average engagement duration."
            icon={<Clock3 size={15} strokeWidth={2.25} />}
            tone="default"
          />
        </WorkspaceMetricGrid>

        <div className={styles.analyticsGrid}>
          <WorkspaceCard
            title="Weekly activity"
            description="Preview traffic and engagement movement across the last seven days."
            badge={<WorkspaceStatusPill tone={trendTone}>Trend</WorkspaceStatusPill>}
          >
            <div className={styles.chartCard}>
              <div className={styles.chartBars} aria-label="Weekly activity chart">
                {weeklyTrend.map((point) => {
                  const height = Math.max(12, Math.round((point.value / highestTrendValue) * 100));

                  return (
                    <div key={point.label} className={styles.chartColumn}>
                      <span className={styles.chartValue}>{point.value}</span>
                      <div className={styles.chartTrack}>
                        <div
                          className={styles.chartBar}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className={styles.chartLabel}>{point.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </WorkspaceCard>

          <WorkspaceCard
            title="Recent events"
            description="Latest activity from preview, publish, security, and system actions."
            badge={<WorkspaceStatusPill tone="blue">{events.length} events</WorkspaceStatusPill>}
          >
            {events.length > 0 ? (
              <div className={styles.eventList}>
                {events.map((event) => (
                  <WorkspaceActionRow
                    key={event.id}
                    title={event.title}
                    description={event.description}
                    icon={getEventIcon(event.type)}
                    badge={
                      <WorkspaceStatusPill tone={getEventTone(event.type)}>
                        {event.timestampLabel}
                      </WorkspaceStatusPill>
                    }
                  />
                ))}
              </div>
            ) : (
              <WorkspaceEmptyState
                icon={<Activity size={22} strokeWidth={2.2} />}
                title="No events yet"
                description="Workspace activity will appear here after preview interactions are tracked."
              />
            )}
          </WorkspaceCard>

          <WorkspaceCard
            title="Recommended next actions"
            description="Suggested analytics improvements before production release."
            badge={<WorkspaceStatusPill>Checklist</WorkspaceStatusPill>}
          >
            <div className={styles.eventList}>
              <WorkspaceActionRow
                title="Add real event tracking"
                description="Track preview opens, publish clicks, conversion actions, and onboarding completion."
                icon={<MousePointerClick size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="orange">Next</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Define conversion events"
                description="Mark the primary actions that prove the generated product is working."
                icon={<TrendingUp size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill>Manual</WorkspaceStatusPill>}
              />

              <WorkspaceActionRow
                title="Connect reporting source"
                description="Wire this panel to Supabase, PostHog, Plausible, or your chosen analytics store."
                icon={<Sparkles size={15} strokeWidth={2.25} />}
                badge={<WorkspaceStatusPill tone="blue">Later</WorkspaceStatusPill>}
              />
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspacePanel>
  );
}