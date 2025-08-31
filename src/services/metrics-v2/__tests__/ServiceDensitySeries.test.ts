import { describe, it, expect, vi } from 'vitest';
import { metricsServiceV2 } from '../service';
import { DENSITY_ID } from '@/pages/analytics/metricIds';

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
      return [
        { id: 'w1', startedAt: '2024-01-01T00:00:00Z', duration: 40 },
        { id: 'w2', startedAt: '2024-01-02T00:00:00Z', duration: 30 },
      ];
    }
    async getSets() {
      return [
        { id: 's1', workoutId: 'w1', exerciseName: 'Bench', weightKg: 100, reps: 20 },
        { id: 's2', workoutId: 'w2', exerciseName: 'Sit', weightKg: 0, reps: 10 },
      ];
    }
  },
}));

vi.mock('../repository', () => ({ InMemoryMetricsRepository: class {} }));
vi.mock('../index', () => ({ getMetricsV2: async () => ({ series: {}, totals: {} }) }));

describe('metricsServiceV2 density series', () => {
  it('computes daily density from tonnage and duration', async () => {
    const res = await metricsServiceV2.getMetricsV2({
      userId: 'u1',
      dateRange: { start: '2024-01-01', end: '2024-01-03' },
    });
    expect(res.series[DENSITY_ID]).toEqual([
      { date: '2024-01-01', value: 50 },
      { date: '2024-01-02', value: 0 },
    ]);
  });
});
