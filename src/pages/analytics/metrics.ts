import * as FEATURE_FLAGS from '@/constants/featureFlags';
import type { ChartMetric, MetricOption } from './types';

export const BASE_METRICS: MetricOption[] = [
  { key: 'volume',   label: 'Total Volume' },
  { key: 'sets',     label: 'Total Sets' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'duration', label: 'Total Duration' },
  { key: 'reps',     label: 'Total Reps' },
];

export const DERIVED_METRICS: MetricOption[] = [
  { key: 'density',       label: 'Workout Density (kg/min)' },
  { key: 'avgRest',       label: 'Avg Rest / Session (sec)' },
  { key: 'setEfficiency', label: 'Set Efficiency (×)' },
];

export function getMetricOptions(): MetricOption[] {
  return FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED
    ? [...BASE_METRICS, ...DERIVED_METRICS]
    : BASE_METRICS;
}
