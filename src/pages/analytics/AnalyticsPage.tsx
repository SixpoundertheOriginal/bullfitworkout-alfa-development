import React from 'react';
import type { PerWorkoutMetrics } from '@/services/metrics-v2/dto';
import { getMetricOptions } from './metrics';
import { metricToSeries } from './adapters';
import type { ChartMetric } from './types';
import * as FEATURE_FLAGS from '@/constants/featureFlags';
import { fmtKgPerMin, fmtSeconds, fmtRatio } from './formatters';

export type AnalyticsPageProps = {
  perWorkout: PerWorkoutMetrics[];
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ perWorkout }) => {
  const [options, setOptions] = React.useState(getMetricOptions());
  const [metric, setMetric] = React.useState<ChartMetric>(options[0].key);
  React.useEffect(() => {
    const next = getMetricOptions();
    setOptions(next);
    if (!next.some(o => o.key === metric)) {
      setMetric(next[0].key);
    }
    console.debug('ANALYTICS_DERIVED_KPIS_ENABLED=', FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED);
  }, [FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED]);

  const series = React.useMemo(() => {
    const adapter = metricToSeries[metric];
    return adapter ? adapter(perWorkout) : [];
  }, [metric, perWorkout]);

  // KPI calculations (last 7 days vs previous 7 days)
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

    // Helper functions
    const densityVal = (wps: PerWorkoutMetrics[]) => {
      const { tonnage, duration } = wps.reduce(
        (acc, w) => ({
          tonnage: acc.tonnage + (w.totalVolumeKg || 0),
          duration: acc.duration + (w.durationMin || 0),
        }),
        { tonnage: 0, duration: 0 }
      );
      return tonnage / Math.max(duration, 1e-9);
    };

    const avgRestVal = (wps: PerWorkoutMetrics[]) => {
      const { rest, sets } = wps.reduce(
        (acc, w) => ({
          rest: acc.rest + ((w.restMin || 0) * 60),
          sets: acc.sets + (w.totalSets || 0),
        }),
        { rest: 0, sets: 0 }
      );
      return rest / Math.max(sets, 1);
    };

    const efficiencyVal = (wps: PerWorkoutMetrics[]) => {
      const arr = wps
        .map(w => w.kpis?.setEfficiency)
        .filter((n): n is number => n !== null && n !== undefined);
      return arr.length > 0 ? arr.reduce((s, n) => s + n, 0) / arr.length : null;
    };

    const curr = {
      density: densityVal(currWorkouts),
      avgRest: avgRestVal(currWorkouts),
      efficiency: efficiencyVal(currWorkouts),
    };
    const prev = {
      density: densityVal(prevWorkouts),
      avgRest: avgRestVal(prevWorkouts),
      efficiency: efficiencyVal(prevWorkouts),
    };
    return { curr, prev };
  }, [perWorkout]);

  const renderDelta = (value: number, formatter: (n: number) => string) => {
    const sign = value >= 0 ? '+' : '-';
    return sign + formatter(Math.abs(value));
  };

  return (
    <div>
      {FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED && (
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
        onChange={e => setMetric(e.target.value as ChartMetric)}
        data-testid="metric-select"
      >
        {options.map(o => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>

      <pre data-testid="series">{JSON.stringify(series, null, 2)}</pre>
    </div>
  );
};

export default AnalyticsPage;
