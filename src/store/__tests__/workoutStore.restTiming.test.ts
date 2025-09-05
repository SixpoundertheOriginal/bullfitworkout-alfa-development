import { describe, beforeEach, test, expect } from 'vitest';
import { useWorkoutStore } from '@/store/workoutStore';

describe('workoutStore rest timing', () => {
  beforeEach(() => {
    const store = useWorkoutStore.getState();
    store.resetSession();
    store.addEnhancedExercise('exercise1', [
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
    ]);
  });

  test('rest time appears when next set starts', () => {
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('exercise1', 0);
    useWorkoutStore.setState({ currentRest: { startedAt: Date.now() - 30_000, targetSetKey: 'exercise1_2' } });
    store.setSetStartTime('exercise1', 2);
    const sets = (useWorkoutStore.getState().exercises['exercise1'] as any).sets as any[];
    expect(sets[1].metadata.restBefore).toBeGreaterThan(0);
  });

  test('rest times do not overwrite once recorded', () => {
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('exercise1', 0);
    useWorkoutStore.setState({ currentRest: { startedAt: Date.now() - 60_000, targetSetKey: 'exercise1_2' } });
    store.setSetStartTime('exercise1', 2);
    const initial = (useWorkoutStore.getState().exercises['exercise1'] as any).sets[1].metadata.restBefore;
    useWorkoutStore.setState({ currentRest: { startedAt: Date.now() - 180_000, targetSetKey: 'exercise1_2' } });
    store.setSetStartTime('exercise1', 2);
    const after = (useWorkoutStore.getState().exercises['exercise1'] as any).sets[1].metadata.restBefore;
    expect(after).toBe(initial);
  });

  test('rest timer targets upcoming set', () => {
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('exercise1', 2);
    const currentRest = useWorkoutStore.getState().currentRest;
    expect(currentRest?.targetSetKey).toBe('exercise1_3');
  });
});
