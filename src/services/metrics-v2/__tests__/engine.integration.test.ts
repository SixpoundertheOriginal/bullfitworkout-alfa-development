import { describe, it, expect } from 'vitest';
import { calcDensityKgPerMin } from '../engine/calculators';
import { toVolumeSeries } from '../engine/seriesAdapter';

describe('engine integration', () => {
  it('computes density for bodyweight sets when included', () => {
    const day = '2024-02-01';
    const sets = [{ isBodyweight: true, reps: 10, performedAt: `${day}T10:00:00Z` }];
    const ctxByDay = { [day]: { sets, activeMinutes: 10 } } as any;
    const off = calcDensityKgPerMin(ctxByDay, { includeBodyweight: false, bodyweightKg: 80 });
    expect(off.totals.density_kg_min).toBe(0);
    const on = calcDensityKgPerMin(ctxByDay, { includeBodyweight: true, bodyweightKg: 80 });
    expect(on.totals.density_kg_min).toBeGreaterThan(0);
  });

  it('returns series points when sets produce volume', () => {
    const sets = [{ isBodyweight: true, reps: 10, performedAt: '2024-02-01T10:00:00Z' }];
    const series = toVolumeSeries(sets, { includeBodyweightLoads: true, bodyweightKg: 80 });
    expect(series.length).toBeGreaterThan(0);
  });
});
