// Public surface for v2 + DI-friendly façade
import type { ServiceOutput } from './dto';
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
    totals: {
      tonnage_kg: 0,
      sets_count: 0,
      reps_total: 0,
      workouts: 0,
      duration_min: 0,
    },
    perWorkout: [],
    prs: [],
    series: {
      tonnage_kg: [],
      sets_count: [],
      reps_total: [],
      density_kg_min: [],
      cvr: [],
      workouts: [],
      duration_min: [],
      avg_rest_ms: [],
      set_efficiency_pct: [],
    },
    metricKeys: [],
    meta: {
      generatedAt: new Date().toISOString(),
      version: 'v2',
      inputs: { tz: 'Europe/Warsaw', units: 'kg|min' },
    },
  };
}

export * from './dto';
export * from './repository';
export * from './flags';
export * from './chartAdapter';
