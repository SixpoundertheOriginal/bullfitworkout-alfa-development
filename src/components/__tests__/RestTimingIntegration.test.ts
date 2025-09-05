import { renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useGlobalRestTimers } from '@/hooks/useGlobalRestTimers';
import { useWorkoutStore } from '@/store/workoutStore';

test('startTimerForExercise uses upcoming set key', () => {
  const { result } = renderHook(() => useGlobalRestTimers());
  result.current.startTimerForExercise('Bench', 2, 60, 'Bench_2');
  const key = useWorkoutStore.getState().currentRest?.targetSetKey;
  expect(key).toBe('Bench_2');
});
