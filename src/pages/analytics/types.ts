export type ChartMetric =
  | 'volume'
  | 'sets'
  | 'workouts'
  | 'duration'
  | 'reps'
  | 'density'
  | 'avgRest'
  | 'setEfficiency';

export type MetricOption = { key: ChartMetric; label: string };
