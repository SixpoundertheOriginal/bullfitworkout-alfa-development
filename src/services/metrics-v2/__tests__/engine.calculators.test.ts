import { describe, it, expect } from 'vitest';
import {
  getSetLoadKg,
  deriveRestMs,
  calcDensityKgPerMin,
  calcAvgRestSec,
  calcSetEfficiencyKgPerMin,
  restCoveragePct,
} from '../engine/calculators';
import { buildDayContexts } from '../engine/dayContextBuilder';

const ctx = { includeBodyweight: true, bodyweightKg: 80 };

describe('engine calculators', () => {
  it('getSetLoadKg handles weighted, bodyweight and mixed', () => {
    expect(getSetLoadKg({ weight: 50, unit: 'kg' }, ctx)).toBeCloseTo(50);
    expect(getSetLoadKg({ isBodyweight: true }, ctx)).toBeCloseTo(80);
    expect(getSetLoadKg({ weight: 20, unit: 'kg', isBodyweight: true }, ctx)).toBeCloseTo(100);
  });

  it('deriveRestMs computes rests between sets', () => {
    const sets = [
      { performedAt: '2024-01-01T10:00:00Z' },
      { performedAt: '2024-01-01T10:01:30Z' },
      { performedAt: '2024-01-01T10:03:00Z' },
    ];
    expect(deriveRestMs(sets)).toEqual([90000, 90000]);
  });

  it('calculators return totals and series', () => {
    const day = '2024-01-01';
    const ctxByDay = {
      [day]: {
        sets: [{ weight: 20, reps: 5 }],
        activeMinutes: 10,
        restMs: [60000],
        workMsTotal: 30000,
      },
    };
    const density = calcDensityKgPerMin(ctxByDay, { includeBodyweight: false, bodyweightKg: 80 });
    expect(density.totals.density_kg_per_min).toBeGreaterThan(0);
    const avgRest = calcAvgRestSec(ctxByDay);
    expect(avgRest.totals.avgRestSec).toBe(60);
    const eff = calcSetEfficiencyKgPerMin(ctxByDay, { includeBodyweight: false, bodyweightKg: 0 });
    expect(eff.totals.setEfficiencyKgPerMin).toBeGreaterThan(0);
  });

  it('clamps negative rest and applies epsilon', () => {
    const ctxByDay = {
      '2024-01-01': {
        sets: [{ weight: 50, reps: 5, workMs: 0 }],
        activeMinutes: 0,
        restMs: [-1000],
      },
    };
    const avg = calcAvgRestSec(ctxByDay);
    expect(avg.totals.avgRestSec).toBe(0);
    const eff = calcSetEfficiencyKgPerMin(ctxByDay, { includeBodyweight: false, bodyweightKg: 0 });
    expect(eff.totals.setEfficiencyKgPerMin).toBe(0);
  });

  it('handles Warsaw day bucketing', () => {
    const workouts = [{ id: 'w1', startedAt: '2024-01-01T23:30:00Z' }];
    const sets = [{ workoutId: 'w1', weightKg: 20, reps: 5, seconds: 30, restMs: 30000 }];
    const ctxByDay = buildDayContexts(workouts as any, sets as any);
    const day = Object.keys(ctxByDay)[0];
    expect(day).toBe('2024-01-02');
    const coverage = restCoveragePct(ctxByDay);
    expect(coverage).toBe(100);
  });
});
