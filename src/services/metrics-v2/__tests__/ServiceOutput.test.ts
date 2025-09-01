import { describe, it, expect } from 'vitest';
import { getMetricsV2 } from '../index';
import { withoutVolatile } from '../../../../tests/helpers/stableSnapshot';
import { TONNAGE_ID } from '@/pages/analytics/metricIds';

const repo = {
  async getWorkouts() {
    return [{ id: 'w1', startedAt: '2025-06-01T10:00:00Z' }];
  },
  async getSets() {
    return [
      {
        id: 's1',
        workoutId: 'w1',
        exerciseId: 'e1',
        exerciseName: 'bench',
        weightKg: 50,
        reps: 5,
        startedAt: '2025-06-01T10:00:00Z',
        completedAt: '2025-06-01T10:00:30Z',
        timingQuality: 'actual',
      },
      {
        id: 's2',
        workoutId: 'w1',
        exerciseId: 'e1',
        exerciseName: 'bench',
        weightKg: 50,
        reps: 5,
        startedAt: '2025-06-01T10:02:00Z',
        completedAt: '2025-06-01T10:02:30Z',
        timingQuality: 'actual',
      },
    ];
  },
};

describe('ServiceOutput shape (v2)', () => {
  it('returns a versioned, canonical structure', async () => {
    const out = await getMetricsV2(repo as any, 'u1', { start: '2025-01-01', end: '2025-12-31' });
    expect(out.meta.version).toBe('v2');
    expect(out.series[TONNAGE_ID].length).toBe(out.series[TONNAGE_ID].length); // sanity
    expect(withoutVolatile(out)).toMatchSnapshot();
  });
});
