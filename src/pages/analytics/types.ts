/** @deprecated Use metricKeys from service instead */
export type ChartMetric =
  | 'volume'
  | 'sets'
  | 'workouts'
  | 'duration'
  | 'reps'
  | 'density'
  | 'avgRest'
  | 'setEfficiency';

/** @deprecated Use MetricOption from metricOptions */
export type MetricOption = { key: ChartMetric; label: string };

if (process.env.NODE_ENV === 'development') {
  console.warn('Analytics types ChartMetric/MetricOption are deprecated; use service metricKeys');
}
