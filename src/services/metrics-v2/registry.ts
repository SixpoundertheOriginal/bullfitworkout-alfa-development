import {
  calcDensityKgPerMin,
  calcAvgRestSec,
  calcSetEfficiencyKgPerMin,
} from './engine/calculators';

export interface MetricDef {
  id: string;
  units: string;
  category: string;
  aggregation: string;
  calculator: any;
}

export const METRIC_DEFS: MetricDef[] = [
  {
    id: 'density_kg_per_min',
    units: 'kg/min',
    category: 'efficiency',
    aggregation: 'timeseries/day',
    calculator: calcDensityKgPerMin,
  },
  {
    id: 'avgRestSec',
    units: 's',
    category: 'rest',
    aggregation: 'timeseries/day',
    calculator: calcAvgRestSec,
  },
  {
    id: 'setEfficiencyKgPerMin',
    units: 'kg/min',
    category: 'efficiency',
    aggregation: 'timeseries/day',
    calculator: calcSetEfficiencyKgPerMin,
  },
];

export const DEFS_VERSION = 3;
