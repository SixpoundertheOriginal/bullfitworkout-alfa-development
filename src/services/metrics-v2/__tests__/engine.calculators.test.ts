import { describe, it, expect } from 'vitest';
import {
  getSetLoadKg,
  deriveRestMs,
  calcDensityKgPerMin,
  calcAvgRestMs,
  calcSetEfficiencyPct,
} from '../engine/calculators';

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
    expect(density.totals.density_kg_min).toBeGreaterThan(0);
    const avgRest = calcAvgRestMs(ctxByDay);
    expect(avgRest.totals.avg_rest_ms).toBe(60000);
    const eff = calcSetEfficiencyPct(ctxByDay);
    expect(eff.totals.set_efficiency_pct).toBeGreaterThan(0);
  });
});
