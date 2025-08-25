import { describe, expect, test } from 'vitest';
import { useWorkoutStore } from './workoutStore';

describe('workoutStore startSessionIfNeeded', () => {
  test('starts session only once', () => {
    const { resetSession, startSessionIfNeeded, sessionId } = useWorkoutStore.getState();
    resetSession();
    const firstId = useWorkoutStore.getState().sessionId;
    const firstStart = startSessionIfNeeded();
    const startedId = useWorkoutStore.getState().sessionId;
    const secondStart = startSessionIfNeeded();
    expect(firstStart).toBe(true);
    expect(secondStart).toBe(false);
    expect(startedId).toBe(useWorkoutStore.getState().sessionId);
    expect(startedId).not.toBe(firstId);
  });
});
