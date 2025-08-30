import React from 'react';
import type { PerWorkoutMetrics, TimeSeriesPoint } from '@/services/metrics-v2/dto';
import { fmtKgPerMin, fmtSeconds, fmtRatio } from './formatters';
import { setFlagOverride, useFeatureFlags } from '@/constants/featureFlags';
import { BASE_MEASURES, DERIVED_MEASURES } from './measureOptions';
import {
  TONNAGE_ID,
  SETS_ID,
  REPS_ID,
  DURATION_ID,
  DENSITY_ID,
  AVG_REST_ID,
  EFF_ID,
  type MetricId,
} from './metricIds';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useMetricsV2 from '@/hooks/useMetricsV2';
import { useAuth } from '@/context/AuthContext';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Switch } from '@/components/ui/switch';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

export type AnalyticsServiceData = {
  perWorkout?: PerWorkoutMetrics[];
  series?: Record<string, TimeSeriesPoint[]>;
  metricKeys?: string[];
  totals?: Record<string, number>;
};

export type AnalyticsPageProps = { data?: AnalyticsServiceData };

type Range = { start: Date; end: Date };
const DAY_MS = 86400000;

function loadRange(): Range {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem('analytics:lastRange');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return { start: new Date(parsed.start), end: new Date(parsed.end) };
      } catch {}
    }
  }
  const end = new Date();
  const start = new Date(end.getTime() - 30 * DAY_MS);
  return { start, end };
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ data }) => {
  let userId: string | undefined;
  try {
    const auth = useAuth();
    userId = auth.user?.id;
  } catch {
    userId = undefined;
  }

  const { ANALYTICS_DERIVED_KPIS_ENABLED } = useFeatureFlags();
  const [derivedEnabled, setDerivedEnabled] = React.useState<boolean>(
    ANALYTICS_DERIVED_KPIS_ENABLED
  );
  const [range, setRange] = React.useState<Range>(() => loadRange());
  const rangeIso = React.useMemo(
    () => ({ startISO: range.start.toISOString(), endISO: range.end.toISOString() }),
    [range.start, range.end]
  );

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'analytics:lastRange',
        JSON.stringify({ start: rangeIso.startISO, end: rangeIso.endISO })
      );
    }
  }, [rangeIso.startISO, rangeIso.endISO]);

  const [preset, setPreset] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('analytics:lastPreset') || 'last30';
    }
    return 'last30';
  });

  const handlePreset = (p: string) => {
    setPreset(p);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('analytics:lastPreset', p);
    }
    if (p !== 'custom') {
      const end = new Date();
      let start = new Date();
      if (p === 'last7') start = new Date(end.getTime() - 7 * DAY_MS);
      else if (p === 'last14') start = new Date(end.getTime() - 14 * DAY_MS);
      else if (p === 'last30') start = new Date(end.getTime() - 30 * DAY_MS);
      else if (p === 'thisMonth') {
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        end.setHours(23, 59, 59, 999);
      }
      setRange({ start, end });
    }
  };

  const { data: fetched, isLoading, error } = useMetricsV2(userId, {
    startISO: rangeIso.startISO,
    endISO: rangeIso.endISO,
    includeBodyweightLoads: derivedEnabled,
  });
  const serviceData = data ?? fetched;
  const seriesData = serviceData?.series ?? {};
  const totals = serviceData?.totals ?? ({} as Record<string, number>);

  React.useEffect(() => {
    console.debug('[AnalyticsPage] render, derivedKpis=', derivedEnabled);
  }, [derivedEnabled]);

  const options = React.useMemo(
    () => (derivedEnabled ? [...BASE_MEASURES, ...DERIVED_MEASURES] : BASE_MEASURES),
    [derivedEnabled]
  );
  const baseIds = React.useMemo(() => BASE_MEASURES.map(m => m.id), []);
  const [metric, setMetric] = React.useState<MetricId>(TONNAGE_ID);

  React.useEffect(() => {
    if (!derivedEnabled && !baseIds.includes(metric)) {
      setMetric(TONNAGE_ID);
    }
  }, [derivedEnabled, metric, baseIds]);

  const selectedSeries = seriesData[metric];
  const unavailable = !selectedSeries;
  const currentMeasureId = unavailable ? TONNAGE_ID : metric;
  const series = seriesData[currentMeasureId] ?? [];

  const baseTotals = React.useMemo(
    () => ({
      sets: totals[SETS_ID] ?? 0,
      reps: totals[REPS_ID] ?? 0,
      duration: totals[DURATION_ID] ?? 0,
      tonnage: totals[TONNAGE_ID] ?? 0,
    }),
    [totals]
  );

  const kpiTotals = React.useMemo(
    () => ({
      density: totals[DENSITY_ID] ?? 0,
      avgRestMs: totals[AVG_REST_ID] ?? 0,
      efficiencyPct: totals[EFF_ID] ?? 0,
    }),
    [totals]
  );

  React.useEffect(() => {
    console.debug('[Analytics] currentMeasure', currentMeasureId);
  }, [currentMeasureId]);

  if (!data) {
    if (isLoading) {
      return <div data-testid="loading">Loading analytics...</div>;
    }
    if (error) {
      return <div data-testid="error">Failed to load analytics</div>;
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/20">
        <div className="flex items-center gap-3">
          <Switch
            id="derived-toggle"
            checked={derivedEnabled}
            onCheckedChange={(v) => {
              setDerivedEnabled(v);
              setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', v);
            }}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
          <UiTooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="derived-toggle" className="cursor-pointer font-medium text-sm text-foreground hover:text-primary transition-colors">
                Show derived KPIs 
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">beta</span>
              </Label>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">Adds Density, Efficiency, PRs, and other computed metrics (Metrics v2).</p>
            </TooltipContent>
          </UiTooltip>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={preset} 
            onChange={e => handlePreset(e.target.value)} 
            data-testid="range-select"
            className="px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          >
            <option value="last7">Last 7 days</option>
            <option value="last14">Last 14 days</option>
            <option value="last30">Last 30 days</option>
            <option value="thisMonth">This month</option>
            <option value="custom">Custom</option>
          </select>
          {preset === 'custom' && (
            <DateRangePicker
              value={{ from: range.start, to: range.end }}
              onChange={r => {
                if (r?.from && r?.to) {
                  setRange({ start: r.from, end: r.to });
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Base KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div data-testid="kpi-sets" className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all group">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Sets</div>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{baseTotals.sets}</div>
        </div>
        <div data-testid="kpi-reps" className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all group">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Reps</div>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{baseTotals.reps}</div>
        </div>
        <div data-testid="kpi-duration" className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all group">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Duration (min)</div>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{baseTotals.duration}</div>
        </div>
        <div data-testid="kpi-tonnage" className="bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all group">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tonnage (kg)</div>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{Math.round(baseTotals.tonnage)}</div>
        </div>
      </div>

      {/* Derived KPIs */}
      {derivedEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div data-testid="kpi-density" className="bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-sm p-4 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-all group">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Density (kg/min)</div>
            <div className="text-2xl font-bold text-foreground group-hover:text-secondary transition-colors">{fmtKgPerMin(kpiTotals.density)}</div>
          </div>
          <div data-testid="kpi-rest" className="bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm p-4 rounded-lg border border-accent/20 hover:border-accent/40 transition-all group">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Avg Rest</div>
            <div className="text-2xl font-bold text-foreground group-hover:text-accent-foreground transition-colors">{fmtSeconds(kpiTotals.avgRestMs / 1000)}</div>
          </div>
          <div data-testid="kpi-efficiency" className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all group">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Set Efficiency</div>
            <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{fmtRatio(kpiTotals.efficiencyPct / 100)}</div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground">Performance Trends</h3>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as MetricId)}
            data-testid="metric-select"
            disabled={options.length === 0}
            className="px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-w-[180px]"
          >
            {options.map(o => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {unavailable && (
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/10 rounded-md border border-muted/20" data-testid="measure-note">
            Selected measure unavailable for this range.
          </div>
        )}

        {Object.keys(seriesData).length === 0 && (
          <div data-testid="no-metrics" className="text-center py-12 text-muted-foreground">
            <div className="text-lg font-medium mb-2">No metrics available</div>
            <div className="text-sm">Start tracking workouts to see your analytics</div>
          </div>
        )}

        {series.length > 0 ? (
          <div className="h-80 w-full" data-testid="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div data-testid="empty-series" className="text-center py-12 text-muted-foreground">
            <div className="text-lg font-medium mb-2">No data to display</div>
            <div className="text-sm">Select a different time range or metric</div>
          </div>
        )}
      </div>
    </div>
  );
  };

export default AnalyticsPage;
