const METRIC_LABELS: Record<string, string> = {
  volume: 'Tonnage (kg)',
  sets: 'Sets',
  workouts: 'Workouts',
  duration: 'Duration (min)',
  reps: 'Reps',
  density: 'Density (kg/min)',
  avgRest: 'Avg Rest / Session (sec)',
  setEfficiency: 'Set Efficiency (×)',
};

const DERIVED_KEYS = ['density', 'avgRest', 'setEfficiency'];

export type MetricOption = { key: string; label: string };

/**
 * Build metric options from service-provided metric keys.
 * @deprecated legacy metric constants should no longer be used
 */
export function buildMetricOptions(keys: string[], derivedEnabled: boolean): MetricOption[] {
  return keys
    .filter(key => (derivedEnabled ? true : !DERIVED_KEYS.includes(key)))
    .map(key => ({ key, label: METRIC_LABELS[key] || key }));
}

export function getMetricLabel(key: string): string {
  return METRIC_LABELS[key] || key;
}
