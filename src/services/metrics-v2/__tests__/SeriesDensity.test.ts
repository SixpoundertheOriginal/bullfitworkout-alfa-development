import { rollingWindows } from '../aggregators';
import type { PerWorkoutMetrics } from '../dto';

describe('density series weighted average', () => {
  it('computes weighted density per day', () => {
    const perWorkout: PerWorkoutMetrics[] = [
      {
        workoutId: 'a1',
        startedAt: '2023-01-01T10:00:00Z',
        totalVolumeKg: 1000,
        totalSets: 0,
        totalReps: 0,
        durationMin: 20,
      },
      {
        workoutId: 'a2',
        startedAt: '2023-01-01T12:00:00Z',
        totalVolumeKg: 1000,
        totalSets: 0,
        totalReps: 0,
        durationMin: 40,
      },
      {
        workoutId: 'b1',
        startedAt: '2023-01-02T10:00:00Z',
        totalVolumeKg: 500,
        totalSets: 0,
        totalReps: 0,
        durationMin: 0,
      },
    ];

    const series = rollingWindows(perWorkout, 'density');
    expect(series).toEqual([
      { date: '2023-01-01', value: 33.33 },
      { date: '2023-01-02', value: 0 },
    ]);
  });
});
