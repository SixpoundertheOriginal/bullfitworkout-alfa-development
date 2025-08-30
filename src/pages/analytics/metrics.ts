import * as FEATURE_FLAGS from '@/constants/featureFlags';
import type { ChartMetric, MetricOption } from './types';

/** @deprecated Use metricKeys from service instead */
export const BASE_METRICS: MetricOption[] = [
  { key: 'volume',   label: 'Tonnage (kg)' },
  { key: 'sets',     label: 'Sets' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'duration', label: 'Duration (min)' },
  { key: 'reps',     label: 'Reps' },
];

/** @deprecated Use metricKeys from service instead */
export const DERIVED_METRICS: MetricOption[] = [
  { key: 'density',       label: 'Density (kg/min)' },
  { key: 'avgRest',       label: 'Avg Rest / Session (sec)' },
  { key: 'setEfficiency', label: 'Set Efficiency (×)' },
];

/** @deprecated Use buildMetricOptions(metricKeys) instead */
export function getMetricOptions(): MetricOption[] {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using deprecated getMetricOptions - migrate to service metricKeys');
  }
  return FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED
    ? [...BASE_METRICS, ...DERIVED_METRICS]
    : BASE_METRICS;
}
