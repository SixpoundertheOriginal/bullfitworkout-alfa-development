import { describe, it, expect, vi } from 'vitest';
import { aggregatePerWorkout } from '../aggregators';
import { WorkoutRaw, SetRaw } from '../types';

describe('metrics-v2 performance', () => {
  it('should process large dataset efficiently', () => {
    // Generate test data: 200 workouts with 50 sets each = 10k sets
    const workouts: WorkoutRaw[] = Array.from({ length: 200 }, (_, i) => ({
      id: `workout-${i}`,
      startedAt: new Date(2024, 0, 1 + Math.floor(i / 10)).toISOString(),
      duration: 45 + Math.random() * 30, // 45-75 minutes
    }));

    const sets: SetRaw[] = [];
    workouts.forEach((workout, workoutIndex) => {
      for (let setIndex = 0; setIndex < 50; setIndex++) {
        sets.push({
          id: `set-${workoutIndex}-${setIndex}`,
          workoutId: workout.id,
          weightKg: 50 + Math.random() * 100, // 50-150kg
          reps: 5 + Math.floor(Math.random() * 10), // 5-15 reps
          exerciseId: `exercise-${setIndex % 10}`, // 10 different exercises
          restTimeSec: 60 + Math.random() * 120, // 60-180s rest
        });
      }
    });

    console.log(`Testing with ${workouts.length} workouts and ${sets.length} sets`);

    // Time the aggregation
    const startTime = performance.now();
    const result = aggregatePerWorkout(workouts, sets);
    const endTime = performance.now();

    const processingTimeMs = endTime - startTime;
    console.log(`Processing time: ${processingTimeMs.toFixed(2)}ms`);

    // Verify results
    expect(result).toHaveLength(200);
    expect(result[0]).toHaveProperty('totalSets', 50);
    expect(result[0]).toHaveProperty('activeMin');
    expect(result[0]).toHaveProperty('restMin');

    // Performance should be reasonable (under 100ms for 10k sets)
    expect(processingTimeMs).toBeLessThan(100);

    // Memory usage should be reasonable (no obvious leaks)
    const avgProcessingPerSet = processingTimeMs / sets.length;
    expect(avgProcessingPerSet).toBeLessThan(0.01); // Less than 0.01ms per set
  });

  it('should handle empty datasets gracefully', () => {
    const startTime = performance.now();
    const result = aggregatePerWorkout([], []);
    const endTime = performance.now();

    expect(result).toEqual([]);
    expect(endTime - startTime).toBeLessThan(5); // Should be nearly instant
  });

  it('should handle workouts without sets efficiently', () => {
    const workouts: WorkoutRaw[] = Array.from({ length: 100 }, (_, i) => ({
      id: `empty-workout-${i}`,
      startedAt: new Date(2024, 0, 1 + i).toISOString(),
      duration: 30,
    }));

    const startTime = performance.now();
    const result = aggregatePerWorkout(workouts, []);
    const endTime = performance.now();

    expect(result).toHaveLength(100);
    expect(result[0]).toMatchObject({
      totalSets: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      activeMin: 30, // Full duration since no rest
      restMin: 0,
    });

    expect(endTime - startTime).toBeLessThan(10);
  });
});