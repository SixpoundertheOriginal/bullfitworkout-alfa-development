import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const storePath = './workoutStore';

describe('startSet with REST_FREEZE_ON_START', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    localStorage.clear();
  });

  afterEach(async () => {
    const { setFlagOverride } = await import('@/constants/featureFlags');
    setFlagOverride('REST_FREEZE_ON_START', false);
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('handleCompleteSet stores restStartedAt', async () => {
    const { useWorkoutStore } = await import(storePath);
    await useWorkoutStore.persist.rehydrate();
    const { setFlagOverride } = await import('@/constants/featureFlags');
    setFlagOverride('REST_FREEZE_ON_START', true);
    const base = useWorkoutStore.getState();
    useWorkoutStore.setState({
      ...base,
      exercises: {
        test: [
          { weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false }
        ]
      }
    });

    useWorkoutStore.getState().handleCompleteSet('test', 0);
    const state = useWorkoutStore.getState();
    const set0 = (state.exercises['test'] as any)[0];
    expect(typeof set0.restStartedAt).toBe('number');
  });

  it('fallback freeze when startSet skipped', async () => {
    const { useWorkoutStore } = await import(storePath);
    await useWorkoutStore.persist.rehydrate();
    const { setFlagOverride } = await import('@/constants/featureFlags');
    setFlagOverride('REST_FREEZE_ON_START', true);
    const base = useWorkoutStore.getState();
    useWorkoutStore.setState({
      ...base,
      exercises: {
        test: [
          { weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false },
          { weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false }
        ]
      }
    });

    useWorkoutStore.getState().handleCompleteSet('test', 0);
    vi.setSystemTime(30_000);
    useWorkoutStore.getState().handleCompleteSet('test', 1);
    const state = useWorkoutStore.getState();
    const sets = state.exercises['test'] as any;
    expect(sets[0].restFrozen).toBe(true);
    expect(sets[0].restMs).toBe(30_000);
    expect(sets[1].restStartedAt).toBe(30_000);
  });

  it('skips restStartedAt write when already frozen', async () => {
    const { useWorkoutStore } = await import(storePath);
    await useWorkoutStore.persist.rehydrate();
    const { setFlagOverride } = await import('@/constants/featureFlags');
    setFlagOverride('REST_FREEZE_ON_START', true);
    const base = useWorkoutStore.getState();
    useWorkoutStore.setState({
      ...base,
      exercises: {
        test: [
          { weight: 0, reps: 0, restTime: 60, completed: true, isEditing: false, restStartedAt: 0, restMs: 10_000, restFrozen: true }
        ]
      }
    });

    vi.setSystemTime(50_000);
    useWorkoutStore.getState().handleCompleteSet('test', 0);
    const set0 = (useWorkoutStore.getState().exercises['test'] as any)[0];
    expect(set0.restStartedAt).toBe(0);
    expect(set0.restMs).toBe(10_000);
  });
});
