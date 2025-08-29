import { toAvgRestSeries, toEfficiencySeries } from '../adapters';
import type { PerWorkoutMetrics } from '@/services/metrics-v2/dto';

describe('analytics adapters', () => {
  it('computes avg rest per day weighted by sets', () => {
    const workouts: PerWorkoutMetrics[] = [
      { workoutId: '1', startedAt: '2023-01-01T00:00:00Z', totalVolumeKg: 0, totalSets: 10, totalReps: 0, durationMin: 0, restMin: 10 },
      { workoutId: '2', startedAt: '2023-01-01T01:00:00Z', totalVolumeKg: 0, totalSets: 5, totalReps: 0, durationMin: 0, restMin: 5 },
    ];
    const series = toAvgRestSeries(workouts);
    expect(series).toEqual([{ date: '2023-01-01', value: 60 }]);
  });

  it('averages set efficiency ignoring nulls', () => {
    const workouts: PerWorkoutMetrics[] = [
      { workoutId: '1', startedAt: '2023-01-01T00:00:00Z', totalVolumeKg: 0, totalSets: 0, totalReps: 0, durationMin: 0, kpis: { densityKgPerMin: 0, avgRestSec: 0, setEfficiency: 0.8 } },
      { workoutId: '2', startedAt: '2023-01-01T01:00:00Z', totalVolumeKg: 0, totalSets: 0, totalReps: 0, durationMin: 0, kpis: { densityKgPerMin: 0, avgRestSec: 0, setEfficiency: 1.2 } },
      { workoutId: '3', startedAt: '2023-01-01T02:00:00Z', totalVolumeKg: 0, totalSets: 0, totalReps: 0, durationMin: 0, kpis: { densityKgPerMin: 0, avgRestSec: 0, setEfficiency: null } },
    ];
    const series = toEfficiencySeries(workouts);
    expect(series).toEqual([{ date: '2023-01-01', value: 1.0 }]);
  });
});
