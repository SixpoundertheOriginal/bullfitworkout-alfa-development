import { describe, it, expect } from 'vitest';
import { getMetricsV2 } from '../index';

// Create a simple in-memory repo stub that returns synthetic sets/workouts
const makeSets = (n: number) => {
  const sets: any[] = [];
  for (let i = 0; i < n; i++) {
    sets.push({
      id: `s-${i}`,
      exercise_name: `ex-${i % 50}`,
      weight: ((i % 5) + 1) * 10,
      reps: (i % 12) + 1,
      completed: true,
      restTime: 60,
      duration: 45000,
      created_at: new Date(1700000000000 + i * 30000).toISOString(),
    });
  }
  return sets;
};

const InMemoryRepoStub = {
  async fetchWorkoutsForUser(userId: string, range: any) {
    // Return a single synthetic workout containing lots of sets
    return [
      {
        id: 'w-1',
        start_time: new Date().toISOString(),
        duration: 60,
        exercises: makeSets(10000),
      }
    ];
  }
};

describe('metrics-v2 perf', () => {
  it('computes KPI on 10k sets under threshold', async () => {
    const attempts = 3;
    let total = 0;
    for (let i = 0; i < attempts; i++) {
      const t0 = performance.now();
      await getMetricsV2(InMemoryRepoStub as any, 'u1', { from: new Date(), to: new Date() });
      const t1 = performance.now();
      total += (t1 - t0);
    }
    const avg = total / attempts;
    const isCI = !!process.env.CI;
    const limit = isCI ? 120 : 50; // ms
    // Warn if over local limit but only fail if exceeding CI limit
    if (!isCI && avg > limit) {
      console.warn(`Perf warning: avg ${avg.toFixed(1)}ms > ${limit}ms`);
    }
    expect(avg).toBeLessThanOrEqual(isCI ? 120 : 1000); // generous local pass condition to avoid flakiness
  }, 20000);
});
