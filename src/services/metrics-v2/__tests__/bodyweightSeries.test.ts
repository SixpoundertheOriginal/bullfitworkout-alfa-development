import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { bodyweight_kg: 80 } }),
  },
}));

vi.mock('../repository/supabase', () => ({
  SupabaseMetricsRepository: class {
    async getWorkouts() {
      return [{ id: 'w1', startedAt: '2024-01-01T00:00:00Z', duration: 60 }];
    }
    async getSets() {
      return [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'pushup',
          exerciseName: 'Push-up',
          weightKg: 0,
          reps: 10,
        },
      ];
    }
  },
}));

vi.mock('../repository', () => ({ InMemoryMetricsRepository: class {} }));

vi.mock('../aggregators', () => ({
  aggregatePerWorkout: () => [],
  aggregateTotals: () => ({}),
  aggregateTotalsKpis: () => ({}),
}));

vi.mock('../index', () => ({ getMetricsV2: async () => ({ series: { tonnage_kg: [] }, totals: { density_kg_min: 1 } }) }));

import { metricsServiceV2 } from '../service';

describe('metricsServiceV2 bodyweight loads', () => {
  it('includes bodyweight loads in volume series when enabled', async () => {
    const res = await metricsServiceV2.getMetricsV2({
      userId: 'u1',
      dateRange: { start: '2024-01-01', end: '2024-01-02' },
      includeBodyweightLoads: true,
    });
    expect(res.series.tonnage_kg.length).toBeGreaterThan(0);
    expect(res.series.tonnage_kg[0].value).toBeGreaterThan(0);
    expect(res.totals.density_kg_min).toBeGreaterThan(0);
  });
});
