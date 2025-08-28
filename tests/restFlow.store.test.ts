import { describe, test, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from '@/store/workoutStore';

describe('Store rest freezing flow (failing first)', () => {
  beforeEach(() => {
    // Reset store to a clean session
    const store = useWorkoutStore.getState();
    store.resetSession();
    // Add a sample exercise with 3 sets
    store.addEnhancedExercise('Bench Press', [
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
    ]);
  });

  test('complete set 1 → pending rest; start set 2 → freezes set 1 rest = 75s', () => {
    const store = useWorkoutStore.getState();
    // Mark set 1 complete
    store.handleCompleteSet('Bench Press', 0);
    // Simulate that next set (2) starts after 75s rest
    useWorkoutStore.setState({ currentRest: { startedAt: Date.now() - 75_000, targetSetKey: 'Bench Press_2' } });
    store.setSetStartTime('Bench Press', 2);

    const state = useWorkoutStore.getState();
    const ex = state.exercises['Bench Press'];
    const sets = Array.isArray(ex) ? ex : ex.sets;
    // restBefore is stored on the set that is starting (set 2), representing rest after set 1
    const restBefore = (sets[1] as any)?.metadata?.restBefore;
    expect(Math.round((restBefore || 0) / 1000)).toBe(75);
  });

  test('finish workout with set 3 pending → freezes final set rest = 42s', () => {
    const store = useWorkoutStore.getState();
    // Complete set 2
    store.handleCompleteSet('Bench Press', 1);
    // Simulate 42s have elapsed after set 3 completion without a next set
    // Expectation (desired): on workout finish, pending final rest should freeze
    // Current behavior: no freeze logic exists, so this should FAIL initially
    useWorkoutStore.setState({ currentRest: { startedAt: Date.now() - 42_000, targetSetKey: 'Bench Press_3' } });
    store.endWorkout();

    const state = useWorkoutStore.getState();
    const ex = state.exercises['Bench Press'];
    const sets = Array.isArray(ex) ? ex : ex.sets;
    const finalRest = (sets[2] as any)?.metadata?.restBefore; // where we would expect it to be stored
    expect(Math.round((finalRest || 0) / 1000)).toBe(42);
  });
});

