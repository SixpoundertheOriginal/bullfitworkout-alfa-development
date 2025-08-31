// Public surface for v2 + DI-friendly façade
import type { ServiceOutput, PerWorkoutMetrics, TimeSeriesPoint } from './dto';
import type { MetricsRepository, DateRange } from './repository';
import {
  calcDensityKgPerMin,
  calcAvgRestSec,
  calcSetEfficiencyKgPerMin,
  restCoveragePct,
} from './engine/calculators';
import { buildDayContexts } from './engine/dayContextBuilder';
import { findPRs } from './prDetector';
import { 
  calculateTimePeriodAverages, 
  type TimePeriodAveragesOutput 
} from './calculators/timePeriodAveragesCalculator';

export type MetricsConfig = {
  tz?: 'Europe/Warsaw';
  units?: 'kg|min';
  includeTimePeriodAverages?: boolean;
  bodyweightKg?: number;
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
  });

  const ctxByDay = buildDayContexts(workouts, sets);

  // Step 3: run calculators and aggregate totals/series
  console.debug('[v2.build.rest_eff]', {
    coveragePct: restCoveragePct(ctxByDay),
  });
  const loadCtx = { includeBodyweight: true, bodyweightKg: config.bodyweightKg ?? 0 };
  const densityRes = calcDensityKgPerMin(ctxByDay, loadCtx);
  const restRes = calcAvgRestSec(ctxByDay);
  const effRes = calcSetEfficiencyKgPerMin(ctxByDay, loadCtx);

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
    density_kg_per_min: densityRes.series.density_kg_per_min,
    cvr: [],
    workouts: mapSeries(() => 1),
    duration_min: mapSeries(w => w.durationMin),
    avgRestSec: restRes.series.avgRestSec,
    setEfficiencyKgPerMin: effRes.series.setEfficiencyKgPerMin,
  };

  const metricKeys = Object.keys(series);

  // Step 4: Calculate time period averages if requested
  let timePeriodAverages: TimePeriodAveragesOutput | undefined;
  if (config.includeTimePeriodAverages) {
    // Transform data to match calculator input format
    const timePeriodSets = sets.map(set => ({
      workoutId: set.workoutId,
      exerciseName: set.exerciseName,
      weightKg: set.weightKg,
      reps: set.reps,
      seconds: set.seconds,
      isBodyweight: set.isBodyweight,
      performedAt: set.performedAt,
      restMs: set.restMs,
      isWarmup: false // Add default since not in original data
    }));

    timePeriodAverages = calculateTimePeriodAverages({
      workouts,
      sets: timePeriodSets,
      referenceDate: new Date(),
      timezone: config.tz || 'Europe/Warsaw',
      bodyweightKg: config.bodyweightKg || 75
    });
  }

  // Step 5: return populated ServiceOutput
  return {
    totals: totals as any,
    perWorkout,
    prs: findPRs(),
    series,
    metricKeys,
    timePeriodAverages,
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
