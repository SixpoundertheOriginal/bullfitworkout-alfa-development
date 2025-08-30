// Public surface for v2 + DI-friendly façade
import type { ServiceOutput, PerWorkoutMetrics, TimeSeriesPoint } from './dto';
import type { MetricsRepository, DateRange } from './repository';
import { calcDensityKgPerMin, calcAvgRestMs, calcSetEfficiencyPct, type DayContext, type SetLike } from './engine/calculators';
import { findPRs } from './prDetector';

export type MetricsConfig = {
  tz?: 'Europe/Warsaw';
  units?: 'kg|min';
};

export async function getMetricsV2(
  repo: MetricsRepository,
  userId: string,
  range: DateRange,
  config: MetricsConfig = { tz: 'Europe/Warsaw', units: 'kg|min' },
  exerciseId?: string
): Promise<ServiceOutput> {
  // Step 1: fetch workouts and sets via repository.  The repo may expose either the
  // new `getWorkouts/getSets` interface or the legacy `fetchWorkoutsForUser` that
  // returns workouts with nested sets.  We try the modern interface first.
  let workouts: { id: string; startedAt: string; duration?: number }[] = [];
  let sets: Array<{
    workoutId: string;
    exerciseName: string;
    weightKg?: number;
    reps?: number;
    seconds?: number;
    isBodyweight?: boolean;
    performedAt?: string;
    restMs?: number;
  }> = [];

  if (typeof (repo as any).getWorkouts === 'function') {
    workouts = await (repo as any).getWorkouts(range, userId);
    const workoutIds = workouts.map(w => w.id);
    sets = workoutIds.length
      ? await (repo as any).getSets(workoutIds, exerciseId)
      : [];
  } else if (typeof (repo as any).fetchWorkoutsForUser === 'function') {
    // Legacy repository used in perf tests.  Each workout already contains sets.
    const wks = await (repo as any).fetchWorkoutsForUser(userId, range);
    workouts = wks.map((w: any) => ({
      id: w.id,
      startedAt: w.start_time || w.startedAt,
      duration: w.duration,
    }));
    sets = [];
    wks.forEach((w: any) => {
      (w.exercises || w.sets || []).forEach((s: any, idx: number) => {
        sets.push({
          workoutId: w.id,
          exerciseName: s.exercise_name || s.exerciseName || '',
          weightKg: s.weight ?? s.weightKg,
          reps: s.reps ?? s.completedReps,
          seconds: typeof s.duration === 'number' ? s.duration / 1000 : s.seconds,
          isBodyweight: s.isBodyweight,
          performedAt: s.created_at || s.performedAt,
          restMs: typeof s.restTime === 'number' ? s.restTime * 1000 : undefined,
        });
      });
    });
  }

  // Step 2: Build per-workout metrics and DayContext records for calculators
  const perWorkout: PerWorkoutMetrics[] = [];
  const ctxByDay: Record<string, DayContext> = {};

  workouts.forEach(w => {
    const wSets = sets.filter(s => s.workoutId === w.id);
    const totalSets = wSets.length;
    const totalReps = wSets.reduce((s, r) => s + (r.reps ?? 0), 0);
    const totalVolumeKg = wSets.reduce((s, r) => s + (r.weightKg ?? 0) * (r.reps ?? 0), 0);
    const workSeconds = wSets.reduce((s, r) => s + (r.seconds ?? 0), 0);
    const durationMin = workSeconds / 60;

    perWorkout.push({
      workoutId: w.id,
      startedAt: w.startedAt,
      totalVolumeKg,
      totalSets,
      totalReps,
      durationMin,
      activeMin: durationMin,
      restMin: 0,
    });

    const day = (w.startedAt || '').split('T')[0];
    if (!day) return;
    if (!ctxByDay[day]) {
      ctxByDay[day] = { sets: [], activeMinutes: 0, restMs: [], workMsTotal: 0 } as DayContext;
    }

    const ctx = ctxByDay[day];
    ctx.activeMinutes += durationMin;
    ctx.workMsTotal = (ctx.workMsTotal ?? 0) + workSeconds * 1000;

    wSets.forEach(s => {
      const setLike: SetLike = {
        weight: s.weightKg,
        unit: 'kg',
        reps: s.reps,
        isBodyweight: s.isBodyweight,
        performedAt: s.performedAt,
        workMs: (s.seconds ?? 0) * 1000,
      };
      ctx.sets.push(setLike);
      if (typeof s.restMs === 'number') {
        ctx.restMs = ctx.restMs ? [...ctx.restMs, s.restMs] : [s.restMs];
      }
    });
  });

  // Step 3: run calculators and aggregate totals/series
  const densityRes = calcDensityKgPerMin(ctxByDay, { includeBodyweight: true, bodyweightKg: 0 });
  const restRes = calcAvgRestMs(ctxByDay);
  const effRes = calcSetEfficiencyPct(ctxByDay);

  const totalsBase = {
    tonnage_kg: perWorkout.reduce((s, w) => s + w.totalVolumeKg, 0),
    sets_count: perWorkout.reduce((s, w) => s + w.totalSets, 0),
    reps_total: perWorkout.reduce((s, w) => s + w.totalReps, 0),
    workouts: workouts.length,
    duration_min: perWorkout.reduce((s, w) => s + w.durationMin, 0),
  };

  const totals = {
    ...totalsBase,
    ...densityRes.totals,
    ...restRes.totals,
    ...effRes.totals,
  } as Record<string, number>;

  // build basic day series
  const mapSeries = (fn: (w: PerWorkoutMetrics) => number): TimeSeriesPoint[] => {
    const m = new Map<string, number>();
    perWorkout.forEach(w => {
      const day = w.startedAt.split('T')[0];
      m.set(day, (m.get(day) || 0) + fn(w));
    });
    return Array.from(m.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const series: Record<string, TimeSeriesPoint[]> = {
    tonnage_kg: mapSeries(w => w.totalVolumeKg),
    sets_count: mapSeries(w => w.totalSets),
    reps_total: mapSeries(w => w.totalReps),
    density_kg_min: densityRes.series.density_kg_min,
    cvr: [],
    workouts: mapSeries(() => 1),
    duration_min: mapSeries(w => w.durationMin),
    avg_rest_ms: restRes.series.avg_rest_ms,
    set_efficiency_pct: effRes.series.set_efficiency_pct,
  };

  const metricKeys = Object.keys(series);

  // Step 4: return populated ServiceOutput
  return {
    totals: totals as any,
    perWorkout,
    prs: findPRs(),
    series,
    metricKeys,
    meta: {
      generatedAt: new Date().toISOString(),
      version: 'v2',
      inputs: { tz: config.tz ?? 'Europe/Warsaw', units: config.units ?? 'kg|min' },
    },
  };
}

export * from './dto';
export * from './repository';
export * from './flags';
export * from './chartAdapter';
