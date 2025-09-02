import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const storePath = './workoutStore';

describe('startSet with REST_FREEZE_ON_START', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    localStorage.clear();
  });

  afterEach(() => {
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
});
