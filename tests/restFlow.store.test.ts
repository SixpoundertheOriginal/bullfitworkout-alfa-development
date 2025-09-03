import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useWorkoutStore, ensurePrevRestFrozen } from '@/store/workoutStore';
import { setFlagOverride } from '@/constants/featureFlags';

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

describe('REST_FREEZE_ON_START flag', () => {
  beforeEach(() => {
    const store = useWorkoutStore.getState();
    store.resetSession();
    store.addEnhancedExercise('Bench Press', [
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
      { weight: 100, reps: 5, restTime: 60, completed: false, isEditing: false, isWarmup: false },
    ]);
    vi.setSystemTime(1_000);
    setFlagOverride('REST_FREEZE_ON_START', false);
  });

  test('freezes previous set rest on startSet', () => {
    setFlagOverride('REST_FREEZE_ON_START', true);
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('Bench Press', 0);
    vi.setSystemTime(76_000);
    store.startSet('Bench Press', 1);
    const set0 = (useWorkoutStore.getState().exercises['Bench Press'] as any).sets[0] as any;
    expect(set0.restMs).toBe(75_000);
    expect(set0.restFrozen).toBe(true);
  });

  test('does not mutate frozen rest on later completeSet', () => {
    setFlagOverride('REST_FREEZE_ON_START', true);
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('Bench Press', 0);
    vi.setSystemTime(51_000);
    store.startSet('Bench Press', 1);
    vi.setSystemTime(120_000);
    store.handleCompleteSet('Bench Press', 1);
    const set0 = (useWorkoutStore.getState().exercises['Bench Press'] as any).sets[0] as any;
    expect(set0.restMs).toBe(50_000);
    expect(set0.restFrozen).toBe(true);
  });

  test('startSet is idempotent', () => {
    setFlagOverride('REST_FREEZE_ON_START', true);
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('Bench Press', 0);
    vi.setSystemTime(51_000);
    store.startSet('Bench Press', 1);
    vi.setSystemTime(71_000);
    store.startSet('Bench Press', 1);
    const set0 = (useWorkoutStore.getState().exercises['Bench Press'] as any).sets[0] as any;
    expect(set0.restMs).toBe(50_000);
    expect(set0.restFrozen).toBe(true);
  });

  test('fallback freeze when completing set without startSet', () => {
    setFlagOverride('REST_FREEZE_ON_START', true);
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('Bench Press', 0);
    vi.setSystemTime(30_000);
    store.handleCompleteSet('Bench Press', 1);
    const sets = (useWorkoutStore.getState().exercises['Bench Press'] as any).sets as any[];
    expect(sets[0].restMs).toBe(30_000);
    expect(sets[0].restFrozen).toBe(true);
    expect(sets[1].restStartedAt).toBe(30_000);
  });

  test('setSetStartTime wrapper passes correct index', () => {
    setFlagOverride('REST_FREEZE_ON_START', true);
    const state = useWorkoutStore.getState();
    const spy = vi.spyOn(state, 'startSet');
    state.setSetStartTime('Bench Press', 2);
    expect(spy).toHaveBeenCalledWith('Bench Press', 2);
  });

  test('flag OFF preserves legacy behavior', () => {
    setFlagOverride('REST_FREEZE_ON_START', false);
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('Bench Press', 0);
    vi.setSystemTime(61_000);
    store.startSet('Bench Press', 1);
    const set0 = (useWorkoutStore.getState().exercises['Bench Press'] as any).sets[0] as any;
    expect(set0.restMs).toBeUndefined();
    expect(set0.restFrozen).toBeUndefined();
    expect(set0.restStartedAt).toBeUndefined();
  });

  test('setSetStartTime legacy path records start and restBefore without freezing', () => {
    setFlagOverride('REST_FREEZE_ON_START', false);
    const store = useWorkoutStore.getState();
    store.handleCompleteSet('Bench Press', 0);
    useWorkoutStore.setState({ currentRest: { startedAt: 1_000, targetSetKey: 'Bench Press_2' } });
    vi.setSystemTime(41_000);
    store.setSetStartTime('Bench Press', 2);
    const state = useWorkoutStore.getState();
    const timings = state.setTimings;
    expect(timings.get('Bench Press_2')?.startTime).toBe(41_000);
    const sets = (state.exercises['Bench Press'] as any).sets as any[];
    expect(sets[1].metadata.restBefore).toBe(40_000);
    expect(sets[0].restMs).toBeUndefined();
    expect(sets[0].restFrozen).toBeUndefined();
  });

  test('ensurePrevRestFrozen exits early when flag disabled', () => {
    setFlagOverride('REST_FREEZE_ON_START', false);
    const exercise = {
      sets: [
        { restStartedAt: 1_000 },
        { weight: 100, reps: 5 },
      ],
    } as any;
    const result = ensurePrevRestFrozen(exercise, 1, 5_000);
    expect(result).toBe(exercise);
    const prev = (result as any).sets[0];
    expect(prev.restMs).toBeUndefined();
    expect(prev.restFrozen).toBeUndefined();
  });
});

