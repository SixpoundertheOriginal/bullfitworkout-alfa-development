// Aggregation signatures (implement later). Europe/Warsaw day bucketing to be added later.
import { PerWorkoutMetrics, Totals, TimeSeriesPoint } from './dto';

export function aggregatePerWorkout(/* workouts, sets, calculators */): PerWorkoutMetrics[] {
  // TODO: implement
  return [];
}

export function aggregateTotals(perWorkout: PerWorkoutMetrics[]): Totals {
  // TODO: implement
  return { totalVolumeKg: 0, totalSets: 0, totalReps: 0, workouts: 0, durationMin: 0 };
}

export function rollingWindows(
  perWorkout: PerWorkoutMetrics[],
  kind: 'volume'|'sets'|'reps'|'density'|'cvr'
): TimeSeriesPoint[] {
  // TODO: implement
  return [];
}
