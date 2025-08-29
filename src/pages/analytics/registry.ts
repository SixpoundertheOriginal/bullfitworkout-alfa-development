import type { PerWorkoutMetrics, TimeSeriesPoint } from '@/services/metrics-v2/dto';
import {
  toVolumeSeries,
  toSetsSeries,
  toWorkoutsSeries,
  toDurationSeries,
  toRepsSeries,
  toDensitySeriesWeighted,
  toAvgRestSeries,
  toEfficiencySeries,
} from './adapters';

export type ChartMetric =
  | 'volume'
  | 'sets'
  | 'workouts'
  | 'duration'
  | 'reps'
  | 'density'
  | 'avgRest'
  | 'setEfficiency';

export const METRICS: Record<ChartMetric, { label: string; gated?: boolean; toSeries: (data: PerWorkoutMetrics[]) => TimeSeriesPoint[] }> = {
  volume: { label: 'Total Volume', toSeries: toVolumeSeries },
  sets: { label: 'Total Sets', toSeries: toSetsSeries },
  workouts: { label: 'Workouts', toSeries: toWorkoutsSeries },
  duration: { label: 'Total Duration', toSeries: toDurationSeries },
  reps: { label: 'Total Reps', toSeries: toRepsSeries },
  density: { label: 'Workout Density (kg/min)', gated: true, toSeries: toDensitySeriesWeighted },
  avgRest: { label: 'Avg Rest / Session (sec)', gated: true, toSeries: toAvgRestSeries },
  setEfficiency: { label: 'Set Efficiency (×)', gated: true, toSeries: toEfficiencySeries },
};

export function availableMetrics(flags: { derivedKpis: boolean }): { key: ChartMetric; label: string }[] {
  return (Object.entries(METRICS) as [ChartMetric, typeof METRICS[ChartMetric]][])
    .filter(([_, m]) => !m.gated || flags.derivedKpis)
    .map(([key, m]) => ({ key, label: m.label }));
}
