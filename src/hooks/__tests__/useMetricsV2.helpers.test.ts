import { describe, it, expect } from 'vitest';
import { toCanonicalTotals } from '../useMetricsV2.helpers';

describe('toCanonicalTotals', () => {
  it('normalizes aliases and applies rounding with density fallback', () => {
    const raw = {
      total_sets: 5,
      reps_total: 10,
      durationMin: 123.456,
      tonnageKg: 789.555,
    };
    expect(toCanonicalTotals(raw)).toEqual({
      sets: 5,
      reps: 10,
      duration_min: 123.46,
      tonnage_kg: 789.56,
      density_kg_per_min: 6.4,
    });
  });

  it('returns zero density when duration is zero', () => {
    const raw = { total_sets: 1, reps_total: 5, duration_min: 0, tonnage_kg: 50 };
    expect(toCanonicalTotals(raw)).toEqual({
      sets: 1,
      reps: 5,
      duration_min: 0,
      tonnage_kg: 50,
      density_kg_per_min: 0,
    });
  });
});
