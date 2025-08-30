export type MetricId =
  | 'tonnage_kg'
  | 'density_kg_min'
  | 'avg_rest_ms'
  | 'set_efficiency_pct';

export const TONNAGE_ID: MetricId = 'tonnage_kg';
export const DENSITY_ID: MetricId = 'density_kg_min';
export const AVG_REST_ID: MetricId = 'avg_rest_ms';
export const EFF_ID: MetricId = 'set_efficiency_pct';
