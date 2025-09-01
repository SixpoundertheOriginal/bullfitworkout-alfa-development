import { describe, it, expect } from 'vitest';
import {
  getSetLoadKg,
  deriveRestMs,
  calcDensityKgPerMin,
  calcAvgRestSec,
  calcSetEfficiencyKgPerMin,
  restCoveragePct,
} from '../engine/calculators';
import { deriveRestMs as deriveRestMsFixed } from '../engine/restCalculatorsFixed';
import { buildDayContexts } from '../engine/dayContextBuilder';

const ctx = { includeBodyweight: true, bodyweightKg: 80 };

describe('engine calculators', () => {
  it('getSetLoadKg handles weighted, bodyweight and mixed', () => {
    expect(getSetLoadKg({ weight: 50, unit: 'kg', hasActualTiming: false }, ctx)).toBeCloseTo(50);
    expect(getSetLoadKg({ isBodyweight: true, hasActualTiming: false }, ctx)).toBeCloseTo(80);
    expect(getSetLoadKg({ weight: 20, unit: 'kg', isBodyweight: true, hasActualTiming: false }, ctx)).toBeCloseTo(100);
  });

  it('deriveRestMs computes rests between sets', () => {
    const sets = [
      { performedAt: '2024-01-01T10:00:00Z', hasActualTiming: false },
      { performedAt: '2024-01-01T10:01:30Z', hasActualTiming: false },
      { performedAt: '2024-01-01T10:03:00Z', hasActualTiming: false },
    ];
    expect(deriveRestMs(sets)).toEqual([90000, 90000]);
  });

  it('deriveRestMsFixed uses start and completion times when available', () => {
    const sets = [
      {
        workoutId: 'w1',
        exerciseName: 'bench',
        startedAt: '2024-01-01T10:00:00Z',
        completedAt: '2024-01-01T10:00:30Z',
        reps: 5,
        weightKg: 50,
        hasActualTiming: true,
      },
      {
        workoutId: 'w1',
        exerciseName: 'bench',
        startedAt: '2024-01-01T10:02:00Z',
        completedAt: '2024-01-01T10:02:30Z',
        reps: 5,
        weightKg: 50,
        hasActualTiming: true,
      },
    ];
    expect(deriveRestMsFixed(sets)).toEqual([90000]);
  });

  it('deriveRestMsFixed returns empty array with missing timing', () => {
    const sets = [
      { workoutId: 'w1', exerciseName: 'bench', reps: 5, weightKg: 50, hasActualTiming: false },
      { workoutId: 'w1', exerciseName: 'bench', reps: 5, weightKg: 50, hasActualTiming: false },
    ];
    expect(deriveRestMsFixed(sets as any)).toEqual([]);
  });

  it('calculators return totals and series', () => {
    const day = '2024-01-01';
    const ctxByDay = {
      [day]: {
        sets: [{ weight: 20, reps: 5, hasActualTiming: false }],
        activeMinutes: 10,
        restMs: [60000],
        workMsTotal: 30000,
        hasActualTiming: false,
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
        sets: [{ weight: 50, reps: 5, workMs: 0, hasActualTiming: false }],
        activeMinutes: 0,
        restMs: [-1000],
        hasActualTiming: false,
      },
    };
    const avg = calcAvgRestSec(ctxByDay);
    expect(avg.totals.avgRestSec).toBe(0);
    const eff = calcSetEfficiencyKgPerMin(ctxByDay, { includeBodyweight: false, bodyweightKg: 0 });
    expect(eff.totals.setEfficiencyKgPerMin).toBe(0);
  });

  it('handles Warsaw day bucketing', () => {
    const workouts = [{ id: 'w1', startedAt: '2024-01-01T23:30:00Z' }];
    const sets = [{ workoutId: 'w1', weightKg: 20, reps: 5, seconds: 30, restMs: 30000, hasActualTiming: false }];
    const ctxByDay = buildDayContexts(workouts as any, sets as any);
    const day = Object.keys(ctxByDay)[0];
    expect(day).toBe('2024-01-02');
    const coverage = restCoveragePct(ctxByDay);
    expect(coverage).toBe(0);
  });

  it('buildDayContexts flags hasActualTiming correctly', () => {
    const workouts = [{ id: 'w1', startedAt: '2024-01-01T10:00:00Z' }];
    const sets = [
      {
        workoutId: 'w1',
        weightKg: 50,
        reps: 5,
        seconds: 30,
        startedAt: '2024-01-01T10:00:00Z',
        completedAt: '2024-01-01T10:00:30Z',
        performedAt: '2024-01-01T10:00:30Z',
        restMs: 30000,
        hasActualTiming: true,
      },
      {
        workoutId: 'w1',
        weightKg: 40,
        reps: 5,
        seconds: 30,
        performedAt: '2024-01-01T10:02:00Z',
        restMs: 30000,
        hasActualTiming: false,
      },
    ];
    const ctxByDay = buildDayContexts(workouts as any, sets as any);
    const dayCtx = ctxByDay['2024-01-01'];
    expect(dayCtx.sets[0].hasActualTiming).toBe(true);
    expect(dayCtx.sets[1].hasActualTiming).toBe(false);
    expect(dayCtx.hasActualTiming).toBe(false);
  });

  it('buildDayContexts marks day as accurate when all sets have timing', () => {
    const workouts = [{ id: 'w1', startedAt: '2024-01-01T10:00:00Z' }];
    const sets = [
      {
        workoutId: 'w1',
        weightKg: 50,
        reps: 5,
        seconds: 30,
        startedAt: '2024-01-01T10:00:00Z',
        completedAt: '2024-01-01T10:00:30Z',
        performedAt: '2024-01-01T10:00:30Z',
        restMs: 30000,
        hasActualTiming: true,
      },
    ];
    const ctxByDay = buildDayContexts(workouts as any, sets as any);
    expect(ctxByDay['2024-01-01'].hasActualTiming).toBe(true);
  });

  describe('calcAvgRestSec', () => {
    it('uses actual timing when available', () => {
      const day = '2024-01-01';
      const ctxByDay = {
        [day]: {
          sets: [
            {
              startedAt: '2024-01-01T10:00:00Z',
              completedAt: '2024-01-01T10:00:30Z',
              hasActualTiming: true,
            },
            {
              startedAt: '2024-01-01T10:02:00Z',
              completedAt: '2024-01-01T10:02:30Z',
              hasActualTiming: true,
            },
            {
              startedAt: '2024-01-01T10:05:00Z',
              completedAt: '2024-01-01T10:05:30Z',
              hasActualTiming: true,
            },
          ],
          activeMinutes: 0,
          hasActualTiming: true,
        },
      } as any;
      const res = calcAvgRestSec(ctxByDay);
      expect(res.totals.avgRestSec).toBeCloseTo(120);
      expect(res.totals.timingCoveragePct).toBe(100);
    });

    it('falls back to legacy calculation without timing', () => {
      const day = '2024-01-01';
      const ctxByDay = {
        [day]: {
          sets: [{ hasActualTiming: false }, { hasActualTiming: false }, { hasActualTiming: false }],
          activeMinutes: 0,
          restMs: [60000, 120000],
          hasActualTiming: false,
        },
      } as any;
      const res = calcAvgRestSec(ctxByDay);
      expect(res.totals.avgRestSec).toBe(90);
      expect(res.totals.timingCoveragePct).toBe(0);
    });

    it('handles single set', () => {
      const day = '2024-01-01';
      const ctxByDay = {
        [day]: {
          sets: [{ hasActualTiming: true, startedAt: '2024-01-01T10:00:00Z', completedAt: '2024-01-01T10:00:30Z' }],
          activeMinutes: 0,
          hasActualTiming: true,
        },
      } as any;
      const res = calcAvgRestSec(ctxByDay);
      expect(res.totals.avgRestSec).toBe(0);
      expect(res.totals.timingCoveragePct).toBe(0);
    });

    it('skips intervals with missing timestamps', () => {
      const day = '2024-01-01';
      const ctxByDay = {
        [day]: {
          sets: [
            {
              startedAt: '2024-01-01T10:00:00Z',
              completedAt: '2024-01-01T10:00:30Z',
              hasActualTiming: true,
            },
            { hasActualTiming: false },
            {
              startedAt: '2024-01-01T10:05:00Z',
              completedAt: '2024-01-01T10:05:30Z',
              hasActualTiming: true,
            },
          ],
          activeMinutes: 0,
          hasActualTiming: false,
        },
      } as any;
      const res = calcAvgRestSec(ctxByDay);
      expect(res.totals.avgRestSec).toBe(0);
      expect(res.totals.timingCoveragePct).toBe(0);
    });

    it('uses next start minus previous completion for rest gaps', () => {
      const day = '2024-01-01';
      const ctxByDay = {
        [day]: {
          sets: [
            {
              startedAt: '2024-01-01T10:00:00Z',
              completedAt: '2024-01-01T10:00:10Z',
              hasActualTiming: true,
            },
            {
              startedAt: '2024-01-01T10:01:00Z',
              completedAt: '2024-01-01T10:01:10Z',
              hasActualTiming: true,
            },
          ],
          activeMinutes: 0,
          hasActualTiming: true,
        },
      } as any;
      const res = calcAvgRestSec(ctxByDay);
      // start2 - complete1 = 50s (not 60s start-start)
      expect(res.totals.avgRestSec).toBe(50);
      expect(res.totals.timingCoveragePct).toBe(100);
    });

    it('ignores outlier rests over 30 min', () => {
      const day = '2024-01-01';
      const ctxByDay = {
        [day]: {
          sets: [
            {
              startedAt: '2024-01-01T10:00:00Z',
              completedAt: '2024-01-01T10:00:30Z',
              hasActualTiming: true,
            },
            {
              startedAt: '2024-01-01T10:05:00Z',
              completedAt: '2024-01-01T10:05:30Z',
              hasActualTiming: true,
            },
            {
              startedAt: '2024-01-01T11:00:00Z',
              completedAt: '2024-01-01T11:00:30Z',
              hasActualTiming: true,
            },
          ],
          activeMinutes: 0,
          hasActualTiming: true,
        },
      } as any;
      const res = calcAvgRestSec(ctxByDay);
      // Second interval ~55min should be discarded, leaving 4.5min (270s)
      expect(res.totals.avgRestSec).toBe(270);
      expect(res.totals.timingCoveragePct).toBe(100);
    });
  });
});
