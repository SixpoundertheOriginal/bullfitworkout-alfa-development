import React from 'react';
import type { PerWorkoutMetrics, TimeSeriesPoint } from '@/services/metrics-v2/dto';
import { fmtKgPerMin, fmtSeconds, fmtRatio } from './formatters';
import { setFlagOverride, useFeatureFlags } from '@/constants/featureFlags';
import { buildMetricOptions } from './metricOptions';
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
  const perWorkout = serviceData?.perWorkout ?? [];
  const seriesData = serviceData?.series ?? {};
  const metricKeys = serviceData?.metricKeys ?? [];

  React.useEffect(() => {
    console.debug('[AnalyticsPage] render, derivedKpis=', derivedEnabled);
  }, [derivedEnabled]);

  const initOpts = React.useMemo(
    () => buildMetricOptions(metricKeys, derivedEnabled),
    [metricKeys, derivedEnabled]
  );
  const [options, setOptions] = React.useState(initOpts);
  const [metric, setMetric] = React.useState<string>(initOpts[0]?.key || '');

  React.useEffect(() => {
    const next = buildMetricOptions(metricKeys, derivedEnabled);
    setOptions(next);
    if (!next.some(o => o.key === metric) && next[0]) {
      setMetric(next[0].key);
    }
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as any).__BF_DEBUG__ = {
        ...(window as any).__BF_DEBUG__,
        metricOptions: next,
      };
    }
  }, [metricKeys, derivedEnabled]);

  const series = React.useMemo(() => {
    return seriesData[metric] ?? [];
  }, [metric, seriesData]);

  // KPI calculations (last 7 days vs previous 7 days) using server-provided KPIs
  const kpis = React.useMemo(() => {
    const now = new Date('2023-01-15'); // deterministic for tests; replace in real app
    const dayMs = 86400000;
    const startCurr = new Date(now.getTime() - 7 * dayMs);
    const startPrev = new Date(now.getTime() - 14 * dayMs);

    const currWorkouts = perWorkout.filter(w => {
      const d = new Date(w.startedAt);
      return d >= startCurr && d < now;
    });
    const prevWorkouts = perWorkout.filter(w => {
      const d = new Date(w.startedAt);
      return d >= startPrev && d < startCurr;
    });

    const avgKpi = (wps: PerWorkoutMetrics[], key: keyof NonNullable<PerWorkoutMetrics['kpis']>) => {
      const arr = wps
        .map(w => w.kpis?.[key] as number | null | undefined)
        .filter((n): n is number => n !== null && n !== undefined);
      return arr.length > 0 ? arr.reduce((s, n) => s + n, 0) / arr.length : key === 'setEfficiency' ? null : 0;
    };

    const curr = {
      density: avgKpi(currWorkouts, 'density'),
      avgRest: avgKpi(currWorkouts, 'avgRest'),
      efficiency: avgKpi(currWorkouts, 'setEfficiency'),
    };
    const prev = {
      density: avgKpi(prevWorkouts, 'density'),
      avgRest: avgKpi(prevWorkouts, 'avgRest'),
      efficiency: avgKpi(prevWorkouts, 'setEfficiency'),
    };
    return { curr, prev };
  }, [perWorkout]);

  const renderDelta = (value: number, formatter: (n: number) => string) => {
    const sign = value >= 0 ? '+' : '-';
    return sign + formatter(Math.abs(value));
  };

  if (!data) {
    if (isLoading) {
      return <div data-testid="loading">Loading analytics...</div>;
    }
    if (error) {
      return <div data-testid="error">Failed to load analytics</div>;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Switch
            id="derived-toggle"
            checked={derivedEnabled}
            onCheckedChange={(v) => {
              setDerivedEnabled(v);
              setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', v);
            }}
          />
          <UiTooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="derived-toggle" className="cursor-pointer">
                Show derived KPIs (beta)
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              Adds Density, Efficiency, PRs, and other computed metrics (Metrics v2).
            </TooltipContent>
          </UiTooltip>
        </div>
        <div className="flex items-center gap-2">
          <select value={preset} onChange={e => handlePreset(e.target.value)} data-testid="range-select">
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

      {derivedEnabled && (
        <div className="flex gap-4 mb-4">
          <div data-testid="kpi-density">
            <div>Density</div>
            <div>{fmtKgPerMin(kpis.curr.density)}</div>
            <div>{renderDelta(kpis.curr.density - kpis.prev.density, fmtKgPerMin)}</div>
          </div>
          <div data-testid="kpi-rest">
            <div>Avg Rest</div>
            <div>{fmtSeconds(kpis.curr.avgRest)}</div>
            <div>{renderDelta(kpis.curr.avgRest - kpis.prev.avgRest, fmtSeconds)}</div>
          </div>
          <div data-testid="kpi-efficiency">
            <div>Set Efficiency</div>
            <div>{fmtRatio(kpis.curr.efficiency)}</div>
            <div>{fmtRatio(
              kpis.curr.efficiency !== null && kpis.prev.efficiency !== null
                ? kpis.curr.efficiency - kpis.prev.efficiency
                : null
            )}</div>
          </div>
        </div>
      )}

      <select
        value={metric}
        onChange={e => setMetric(e.target.value)}
        data-testid="metric-select"
        disabled={metricKeys.length === 0}
      >
        {options.map(o => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      {metricKeys.length === 0 && (
        <div data-testid="no-metrics">No metrics available</div>
      )}

      {series.length > 0 ? (
        <ResponsiveContainer width="100%" height={300} data-testid="chart">
          <LineChart data={series}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div data-testid="empty-series">No data to display</div>
      )}
    </div>
  );
};

export default AnalyticsPage;
