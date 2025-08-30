import type { DayContext, SetLike } from './calculators';

interface WorkoutLike {
  id: string;
  startedAt: string;
  duration?: number;
}

interface SetInput {
  workoutId: string;
  weightKg?: number;
  reps?: number;
  seconds?: number;
  isBodyweight?: boolean;
  performedAt?: string;
  restMs?: number;
}

/**
 * Groups workouts/sets by day and computes per-day context used by engine calculators.
 */
export function buildDayContexts(
  workouts: WorkoutLike[],
  sets: SetInput[]
): Record<string, DayContext> {
  const ctxByDay: Record<string, DayContext> = {};

  // Pre-group sets by workout id for efficiency
  const setsByWorkout = new Map<string, SetInput[]>();
  for (const s of sets) {
    if (!setsByWorkout.has(s.workoutId)) setsByWorkout.set(s.workoutId, []);
    setsByWorkout.get(s.workoutId)!.push(s);
  }

  const toWarsawDay = (iso?: string): string => {
    if (!iso) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(
      new Date(iso)
    );
  };

  for (const w of workouts) {
    const day = toWarsawDay(w.startedAt);
    if (!day) continue;

    let ctx = ctxByDay[day];
    if (!ctx) ctx = ctxByDay[day] = { sets: [], activeMinutes: 0 };

    const wSets = setsByWorkout.get(w.id) ?? [];
    let workMsTotal = 0;

    for (const s of wSets) {
      const workMs = (s.seconds ?? 0) * 1000;
      workMsTotal += workMs;
      const setLike: SetLike = {
        weight: s.weightKg,
        unit: 'kg',
        reps: s.reps,
        isBodyweight: s.isBodyweight,
        performedAt: s.performedAt,
        workMs,
      };
      ctx.sets.push(setLike);
      if (typeof s.restMs === 'number') {
        if (ctx.restMs) ctx.restMs.push(s.restMs);
        else ctx.restMs = [s.restMs];
      }
    }

    ctx.activeMinutes += workMsTotal / 60000;
    ctx.workMsTotal = (ctx.workMsTotal ?? 0) + workMsTotal;
  }

  return ctxByDay;
}

export type { WorkoutLike, SetInput };
