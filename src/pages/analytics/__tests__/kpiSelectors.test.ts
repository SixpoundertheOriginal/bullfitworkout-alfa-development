import { describe, it, expect } from 'vitest';
import { getSets, getReps, getDuration, getTonnage, getDensity } from '../kpiSelectors';
import { SETS_ID, REPS_ID, DURATION_ID, TONNAGE_ID, DENSITY_ID } from '../metricIds';
import type { MetricsV2Data } from '@/hooks/useMetricsV2';

describe('kpiSelectors', () => {
  const legacy = {
    [SETS_ID]: 1,
    [REPS_ID]: 2,
    [DURATION_ID]: 3,
    [TONNAGE_ID]: 4,
    [DENSITY_ID]: 5,
  } as Record<string, number>;

  it('prefers kpis over totals and legacy', () => {
    const v2 = {
      kpis: { sets: 10, reps: 20, durationMin: 30, tonnageKg: 40, densityKgPerMin: 50 },
      totals: { [SETS_ID]: 100, [REPS_ID]: 200, [DURATION_ID]: 300, [TONNAGE_ID]: 400, [DENSITY_ID]: 500 },
    } as unknown as MetricsV2Data & { totals: Record<string, number> };
    expect(getSets(v2, legacy)).toBe(10);
    expect(getReps(v2, legacy)).toBe(20);
    expect(getDuration(v2, legacy)).toBe(30);
    expect(getTonnage(v2, legacy)).toBe(40);
    expect(getDensity(v2, legacy)).toBe(50);
  });

  it('falls back to totals then legacy', () => {
    const v2 = {
      totals: { [SETS_ID]: 100, [REPS_ID]: 200, [DURATION_ID]: 300, [TONNAGE_ID]: 400, [DENSITY_ID]: 500 },
    } as unknown as MetricsV2Data & { totals: Record<string, number> };
    expect(getSets(v2, legacy)).toBe(100);
    expect(getReps(v2, legacy)).toBe(200);
    expect(getDuration(v2, legacy)).toBe(300);
    expect(getTonnage(v2, legacy)).toBe(400);
    expect(getDensity(v2, legacy)).toBe(500);
  });

  it('uses legacy when v2 data missing', () => {
    expect(getSets(undefined, legacy)).toBe(1);
    expect(getReps(undefined, legacy)).toBe(2);
    expect(getDuration(undefined, legacy)).toBe(3);
    expect(getTonnage(undefined, legacy)).toBe(4);
    expect(getDensity(undefined, legacy)).toBe(5);
  });

  it('returns 0 when everything missing', () => {
    expect(getSets()).toBe(0);
    expect(getReps()).toBe(0);
    expect(getDuration()).toBe(0);
    expect(getTonnage()).toBe(0);
    expect(getDensity()).toBe(0);
  });
});
