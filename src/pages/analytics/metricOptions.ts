import type { MetricKey } from '@/services/metrics-v2/dto';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export type ChartMetric = MetricKey;

export const LABELS: Record<MetricKey, string> = {
  volume: 'Total Volume',
  sets: 'Total Sets',
  workouts: 'Workouts',
  duration: 'Total Duration',
  reps: 'Total Reps',
  density: 'Workout Density (kg/min)',
  avgRest: 'Avg Rest / Session (sec)',
  setEfficiency: 'Set Efficiency (×)',
};

const DERIVED_KEYS: MetricKey[] = ['density', 'avgRest', 'setEfficiency'];

export function getMetricOptions(metricKeys: readonly MetricKey[]): ReadonlyArray<{ key: MetricKey; label: string }> {
  const keys = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED
    ? metricKeys
    : metricKeys.filter(k => !DERIVED_KEYS.includes(k));
  return keys.map(k => ({ key: k, label: LABELS[k] }));
}
