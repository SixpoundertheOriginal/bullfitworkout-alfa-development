import type { MetricKey, ServiceOutput, TimeSeriesPoint } from '@/services/metrics-v2/dto';

type Series = ServiceOutput['series'];

export const metricToSeries: Record<MetricKey, (s: Series) => TimeSeriesPoint[]> = {
  volume: s => s.base.map(d => ({ date: d.date, value: d.volumeKg })),
  sets: s => s.base.map(d => ({ date: d.date, value: d.sets })),
  workouts: s => s.base.map(d => ({ date: d.date, value: d.workouts })),
  duration: s => s.base.map(d => ({ date: d.date, value: d.durationMin })),
  reps: s => s.base.map(d => ({ date: d.date, value: d.reps })),
  density: s => s.derived.map(d => ({ date: d.date, value: d.densityKgPerMin })),
  avgRest: s => s.derived.map(d => ({ date: d.date, value: d.avgRestSec })),
  setEfficiency: s => s.derived.map(d => ({ date: d.date, value: d.setEfficiency ?? 0 })),
};
