import { describe, expect, test } from 'vitest';
import type { ExerciseSet as WorkoutExerciseSet } from '@/types/workout-enhanced';
import type { ExerciseSet as ExerciseExerciseSet } from '@/types/exercise';

describe('ExerciseSet rest fields', () => {
  test('workout-enhanced ExerciseSet accepts rest fields', () => {
    const set: WorkoutExerciseSet = {
      weight: 100,
      reps: 5,
      restTime: 60,
      completed: false,
      isEditing: false,
      restStartedAt: 0,
      restMs: 30000,
      restFrozen: true,
    };
    expect(set.restMs).toBe(30000);
    expect(set.restFrozen).toBe(true);
  });

  test('exercise.ts ExerciseSet accepts rest fields', () => {
    const set: ExerciseExerciseSet = {
      id: 's1',
      weight: 100,
      reps: 5,
      completed: false,
      set_number: 1,
      exercise_name: 'Bench Press',
      workout_id: 'w1',
      restStartedAt: 0,
      restMs: 30000,
      restFrozen: false,
    };
    expect(set.restFrozen).toBe(false);
    expect(set.restStartedAt).toBe(0);
  });
});
