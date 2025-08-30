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
import useMetricsV2, { useMetricsV2Analytics, type MetricsV2Data } from '@/hooks/useMetricsV2';
import { useAuth } from '@/context/AuthContext';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Switch } from '@/components/ui/switch';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { TimePeriodAveragesSection } from '@/components/analytics/TimePeriodAveragesSection';
import { MetricDropdown } from '@/components/analytics/MetricDropdown';
import { toChartSeries } from '@/services/metrics-v2/chartAdapter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export type AnalyticsServiceData = {
  perWorkout?: PerWorkoutMetrics[];
  series?: Record<string, TimeSeriesPoint[]>;
  metricKeys?: string[];
  totals?: Record<string, number>;
  timePeriodAverages?: import('@/services/metrics-v2/calculators/timePeriodAveragesCalculator').TimePeriodAveragesOutput;
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

  const { ANALYTICS_DERIVED_KPIS_ENABLED, ANALYTICS_V2_ENABLED } = useFeatureFlags();
  const [derivedEnabled, setDerivedEnabled] = React.useState<boolean>(
    ANALYTICS_DERIVED_KPIS_ENABLED
  );
  const [v2Enabled, setV2Enabled] = React.useState<boolean>(ANALYTICS_V2_ENABLED);
  const [testerPanelOpen, setTesterPanelOpen] = React.useState<boolean>(false);
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

  // V2 Analytics Hook
  const { data: v2Data, isLoading: v2Loading, error: v2Error } = useMetricsV2Analytics(
    userId,
    v2Enabled ? rangeIso : undefined
  );

  // Legacy Hook (fallback)
  const { data: fetched, isLoading, error } = useMetricsV2(userId, 
    v2Enabled ? undefined : {
      startISO: rangeIso.startISO,
      endISO: rangeIso.endISO,
      includeBodyweightLoads: derivedEnabled,
      includeTimePeriodAverages: true,
      bodyweightKg: 75, // TODO: Get from user profile
    }
  );

  const serviceData = data ?? fetched;
  const totals = serviceData?.totals ?? ({} as Record<string, number>);

  // Initialize currentMeasure state early
  const [currentMeasure, setCurrentMeasure] = React.useState<MetricId>(TONNAGE_ID);

  const { series: seriesData, availableMeasures } = React.useMemo(() => {
    if (v2Enabled && serviceData) {
      // For V2, adapt legacy series data format (TimeSeriesPoint) to chart adapter input format
      const transformedSeries: Record<string, { timestamp: string; value: number }[]> = {};
      for (const [key, points] of Object.entries(serviceData.series || {})) {
        transformedSeries[key] = points.map(p => ({
          timestamp: p.date + 'T00:00:00.000Z', // Convert date to timestamp for adapter
          value: p.value
        }));
      }
      const adapted = toChartSeries({ series: transformedSeries });
      return adapted;
    }
    // Legacy fallback
    const raw = serviceData?.series ?? {};
    const measures = Object.keys(raw).filter(k => raw[k]?.length);
    return { series: raw, availableMeasures: measures };
  }, [v2Enabled, serviceData]);

  React.useEffect(() => {
    console.debug('[AnalyticsPage] render, derivedKpis=', derivedEnabled);
  }, [derivedEnabled]);

  const options = React.useMemo(
    () => (derivedEnabled ? [...BASE_MEASURES, ...DERIVED_MEASURES] : BASE_MEASURES),
    [derivedEnabled]
  );
  const baseIds = React.useMemo(() => BASE_MEASURES.map(m => m.id), []);

  React.useEffect(() => {
    if (!derivedEnabled && !baseIds.includes(currentMeasure)) {
      setCurrentMeasure(TONNAGE_ID);
    }
  }, [derivedEnabled, currentMeasure, baseIds]);

  React.useEffect(() => {
    if (!availableMeasures.includes(currentMeasure)) {
      const nextMeasure = (availableMeasures[0] ?? TONNAGE_ID) as MetricId;
      console.debug('[metrics-v2.reset]', { prev: currentMeasure, next: nextMeasure });
      setCurrentMeasure(nextMeasure);
    }
  }, [availableMeasures, currentMeasure]);

  // Use currentMeasure after it's properly initialized
  const series = seriesData[currentMeasure] ?? [];
  const unavailable = series.length === 0;
  const dropdownOptions = React.useMemo(
    () => options.filter(o => availableMeasures.includes(o.id)),
    [options, availableMeasures]
  );

  const baseTotals = React.useMemo(
    () => {
      if (v2Enabled && v2Data) {
        return {
          sets: v2Data.kpis.sets,
          reps: v2Data.kpis.reps,
          duration: v2Data.kpis.durationMin,
          tonnage: v2Data.kpis.tonnageKg,
        };
      }
      return {
        sets: totals[SETS_ID] ?? 0,
        reps: totals[REPS_ID] ?? 0,
        duration: totals[DURATION_ID] ?? 0,
        tonnage: totals[TONNAGE_ID] ?? 0,
      };
    },
    [v2Enabled, v2Data, totals]
  );

  const kpiTotals = React.useMemo(
    () => {
      if (v2Enabled && v2Data) {
        return {
          density: v2Data.kpis.densityKgPerMin,
          avgRestMs: 0, // Not in V2 core KPIs
          efficiencyPct: 0, // Not in V2 core KPIs
        };
      }
      return {
        density: totals[DENSITY_ID] ?? 0,
        avgRestMs: totals[AVG_REST_ID] ?? 0,
        efficiencyPct: totals[EFF_ID] ?? 0,
      };
    },
    [v2Enabled, v2Data, totals]
  );

  React.useEffect(() => {
    console.debug('[chart.props]', {
      currentMeasure,
      availableMeasures,
      seriesKeys: Object.keys(seriesData || {}),
      seriesLen: seriesData[currentMeasure]?.length,
      sample: seriesData[currentMeasure]?.[0],
    });
    
    if (v2Enabled && v2Data) {
      console.debug('[metrics-v2.chart]', {
        measure: currentMeasure,
        seriesLen: seriesData[currentMeasure]?.length || 0,
        keys: availableMeasures,
        tz: 'Europe/Warsaw'
      });
    }
  }, [currentMeasure, availableMeasures, seriesData, v2Enabled, v2Data]);

  if (!data) {
    if (v2Enabled && v2Loading) {
      return <div data-testid="loading">Loading V2 analytics...</div>;
    }
    if (v2Enabled && v2Error) {
      return <div data-testid="error">Failed to load V2 analytics</div>;
    }
    if (!v2Enabled && isLoading) {
      return <div data-testid="loading">Loading analytics...</div>;
    }
    if (!v2Enabled && error) {
      return <div data-testid="error">Failed to load analytics</div>;
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Switch
              id="v2-toggle"
              checked={v2Enabled}
              onCheckedChange={(v) => {
                setV2Enabled(v);
                setFlagOverride('ANALYTICS_V2_ENABLED', v);
              }}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
            <UiTooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="v2-toggle" className="cursor-pointer font-medium text-sm text-foreground hover:text-primary transition-colors">
                  Metrics V2 
                  <span className="ml-1 text-xs bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-md">tester</span>
                </Label>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">Use Metrics V2 for accurate tonnage calculations with 5 core KPIs</p>
              </TooltipContent>
            </UiTooltip>
          </div>
          
          {!v2Enabled && (
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
          )}
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
      {(derivedEnabled && !v2Enabled) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div data-testid="kpi-density" className="bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-sm p-4 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-all group">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Density (kg/min)</div>
            <div className="text-2xl font-bold text-foreground group-hover:text-secondary transition-colors">
              {fmtKgPerMin(kpiTotals.density)}
            </div>
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

      {/* V2 Density KPI (standalone when V2 enabled) */}
      {v2Enabled && (
        <div className="grid grid-cols-1 gap-4">
          <div data-testid="kpi-density-v2" className="bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-sm p-4 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-all group">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Density (kg/min) - V2</div>
            <div className="text-2xl font-bold text-foreground group-hover:text-secondary transition-colors">
              {kpiTotals.density.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground">Performance Trends</h3>
          <MetricDropdown
            value={currentMeasure}
            onChange={setCurrentMeasure}
            options={dropdownOptions}
            disabled={dropdownOptions.length === 0}
          />
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

      {/* Time Period Averages Section (only for legacy) */}
      {!v2Enabled && (
        <TimePeriodAveragesSection
          timePeriodAverages={serviceData?.timePeriodAverages}
          isLoading={isLoading}
        />
      )}

      {/* Tester Data Panel (V2 only) */}
      {v2Enabled && (
        <Collapsible open={testerPanelOpen} onOpenChange={setTesterPanelOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/40 cursor-pointer hover:bg-muted/40 transition-all">
              <h3 className="text-sm font-medium text-foreground">Tester Data Panel (Raw V2 Response)</h3>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${testerPanelOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 bg-muted/20 backdrop-blur-sm rounded-lg border border-border/20">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                {v2Data ? JSON.stringify(v2Data, null, 2) : 'No V2 data loaded'}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
  };

export default AnalyticsPage;
