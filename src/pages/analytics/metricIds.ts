export type MetricId =
  | 'tonnage_kg'
  | 'sets'
  | 'reps'
  | 'duration_min'
  | 'density_kg_per_min'
  | 'avg_rest_ms'
  | 'set_efficiency_pct';

export const TONNAGE_ID: MetricId = 'tonnage_kg';
export const SETS_ID: MetricId = 'sets';
export const REPS_ID: MetricId = 'reps';
export const DURATION_ID: MetricId = 'duration_min';
export const DENSITY_ID: MetricId = 'density_kg_per_min';
export const AVG_REST_ID: MetricId = 'avg_rest_ms';
export const EFF_ID: MetricId = 'set_efficiency_pct';
