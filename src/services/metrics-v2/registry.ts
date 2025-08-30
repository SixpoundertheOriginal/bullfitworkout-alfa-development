import { calcDensityKgPerMin, calcAvgRestMs, calcSetEfficiencyPct } from './engine/calculators';

export interface MetricDef {
  id: string;
  units: string;
  category: string;
  aggregation: string;
  calculator: any;
}

export const METRIC_DEFS: MetricDef[] = [
  {
    id: 'density_kg_min',
    units: 'kg/min',
    category: 'efficiency',
    aggregation: 'timeseries/day',
    calculator: calcDensityKgPerMin,
  },
  {
    id: 'avg_rest_ms',
    units: 'ms',
    category: 'rest',
    aggregation: 'timeseries/day',
    calculator: calcAvgRestMs,
  },
  {
    id: 'set_efficiency_pct',
    units: '%',
    category: 'efficiency',
    aggregation: 'timeseries/day',
    calculator: calcSetEfficiencyPct,
  },
];

export const DEFS_VERSION = 2;
