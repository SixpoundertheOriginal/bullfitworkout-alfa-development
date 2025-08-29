// Aggregation functions for workout metrics
import { PerWorkoutMetrics, Totals, TimeSeriesPoint, TotalsKpis } from './dto';
import { WorkoutRaw, SetRaw } from './types';
import { 
  calcWorkoutDensityKgPerMin, 
  calcAvgRestPerSession, 
  calcSetEfficiency, 
  getTargetRestSecForWorkout 
} from './calculators/derivedKpis';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export function aggregatePerWorkout(
  workouts: WorkoutRaw[], 
  sets: SetRaw[]
): PerWorkoutMetrics[] {
  const setsByWorkout = new Map<string, SetRaw[]>();
  sets.forEach(set => {
    if (!setsByWorkout.has(set.workoutId)) {
      setsByWorkout.set(set.workoutId, []);
    }
    setsByWorkout.get(set.workoutId)!.push(set);
  });

  return workouts.map(workout => {
    const workoutSets = setsByWorkout.get(workout.id) || [];
    
    // Basic metrics
    const totalSets = workoutSets.length;
    const totalReps = workoutSets.reduce((sum, set) => sum + (set.reps || 0), 0);
    const totalVolumeKg = workoutSets.reduce((sum, set) => 
      sum + (set.weightKg || 0) * (set.reps || 0), 0);
    const durationMin = workout.duration || 0;
    
    // Rest time analysis
    const restSecTotal = workoutSets.reduce((sum, set) => sum + (set.restTimeSec || 0), 0);
    const workoutDurationSec = durationMin * 60;
    const activeSec = Math.max(0, workoutDurationSec - restSecTotal);
    
    const activeMin = activeSec / 60;
    const restMin = restSecTotal / 60;
    
    // Derived KPIs
    let kpis = undefined;
    if (FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED) {
      const avgRestSec = calcAvgRestPerSession(restSecTotal, totalSets);
      const targetRestSec = getTargetRestSecForWorkout({
        workoutId: workout.id,
        startedAt: workout.startedAt,
        totalVolumeKg,
        totalSets,
        totalReps,
        durationMin,
        activeMin,
        restMin
      });
      
      kpis = {
        densityKgPerMin: calcWorkoutDensityKgPerMin(totalVolumeKg, durationMin),
        avgRestSec,
        setEfficiency: calcSetEfficiency(avgRestSec, targetRestSec),
      };
    }

    return {
      workoutId: workout.id,
      startedAt: workout.startedAt,
      totalVolumeKg,
      totalSets,
      totalReps,
      durationMin,
      activeMin,
      restMin,
      kpis,
    };
  });
}

export function aggregateTotals(perWorkout: PerWorkoutMetrics[]): Totals {
  return {
    totalVolumeKg: perWorkout.reduce((sum, w) => sum + w.totalVolumeKg, 0),
    totalSets: perWorkout.reduce((sum, w) => sum + w.totalSets, 0),
    totalReps: perWorkout.reduce((sum, w) => sum + w.totalReps, 0),
    workouts: perWorkout.length,
    durationMin: perWorkout.reduce((sum, w) => sum + w.durationMin, 0),
  };
}

export function aggregateTotalsKpis(perWorkout: PerWorkoutMetrics[]): TotalsKpis | undefined {
  if (!FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED || perWorkout.length === 0) {
    return undefined;
  }

  const totals = aggregateTotals(perWorkout);
  
  // Overall density
  const densityKgPerMin = calcWorkoutDensityKgPerMin(totals.totalVolumeKg, totals.durationMin);
  
  // Weighted average rest time
  const totalRestSec = perWorkout.reduce((sum, w) => sum + ((w.restMin || 0) * 60), 0);
  const avgRestSec = calcAvgRestPerSession(totalRestSec, totals.totalSets);
  
  // Weighted set efficiency (average of all workout efficiencies)
  const efficiencies = perWorkout
    .map(w => w.kpis?.setEfficiency)
    .filter((eff): eff is number => eff !== null && eff !== undefined);
  const setEfficiency = efficiencies.length > 0 
    ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length 
    : null;

  return {
    densityKgPerMin,
    avgRestSec,
    setEfficiency,
  };
}

export function rollingWindows(
  perWorkout: PerWorkoutMetrics[],
  kind: 'volume'|'sets'|'reps'|'density'|'cvr'
): TimeSeriesPoint[] {
  // Group by date and aggregate values
  // For most kinds we simply sum the daily values, but for density we need to
  // compute a weighted average based on total tonnage and duration for the day.
  const byDate = new Map<string, any>();

  perWorkout.forEach(workout => {
    const date = new Date(workout.startedAt).toISOString().split('T')[0];

    switch (kind) {
      case 'volume': {
        const value = workout.totalVolumeKg;
        byDate.set(date, (byDate.get(date) || 0) + value);
        break;
      }
      case 'sets': {
        const value = workout.totalSets;
        byDate.set(date, (byDate.get(date) || 0) + value);
        break;
      }
      case 'reps': {
        const value = workout.totalReps;
        byDate.set(date, (byDate.get(date) || 0) + value);
        break;
      }
      case 'density': {
        const cur = byDate.get(date) || { tonnage: 0, duration: 0 };
        cur.tonnage += workout.totalVolumeKg || 0;
        cur.duration += workout.durationMin || 0;
        byDate.set(date, cur);
        break;
      }
      case 'cvr': {
        // Placeholder for completion rate
        const value = 1;
        byDate.set(date, (byDate.get(date) || 0) + value);
        break;
      }
    }
  });

  return Array.from(byDate.entries())
    .map(([date, value]) => {
      if (kind === 'density') {
        const { tonnage, duration } = value as { tonnage: number; duration: number };
        const density = tonnage / Math.max(duration, 1e-9);
        return { date, value: duration === 0 ? 0 : +density.toFixed(2) };
      }
      return { date, value: value as number };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
