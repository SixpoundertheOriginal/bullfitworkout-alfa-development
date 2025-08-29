// Public surface for v2 + DI-friendly façade
import { METRIC_KEYS, type ServiceOutput } from './dto';
import type { MetricsRepository, DateRange } from './repository';

export type MetricsConfig = {
  tz?: 'Europe/Warsaw';
  units?: 'kg|min';
};

export async function getMetricsV2(
  repo: MetricsRepository,
  userId: string,
  range: DateRange,
  config: MetricsConfig = { tz: 'Europe/Warsaw', units: 'kg|min' },
  exerciseId?: string
): Promise<ServiceOutput> {
  // TODO: Call repo, calculators, aggregators, prDetector when implemented
  return {
    totals: { totalVolumeKg: 0, totalSets: 0, totalReps: 0, workouts: 0, durationMin: 0 },
    perWorkout: [],
    prs: [],
    series: { base: [], derived: [] },
    metricKeys: [...METRIC_KEYS],
    meta: {
      generatedAt: new Date().toISOString(),
      version: 'v2',
      inputs: { tz: 'Europe/Warsaw', units: 'kg|min' },
    },
  } as ServiceOutput;
}

export * from './dto';
export * from './repository';
export * from './flags';
export * from './chartAdapter';
