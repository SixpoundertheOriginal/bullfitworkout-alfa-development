import { useCallback, useEffect } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

export const useGlobalRestTimers = () => {
  const {
    activeRestTimers,
    startRestTimer,
    stopRestTimer,
    updateRestTimerElapsed,
    getRestTimerState,
    clearAllRestTimers,
  } = useWorkoutStore();

  // Start a new rest timer
  const startTimer = useCallback((timerId: string, targetTime: number) => {
    startRestTimer(timerId, targetTime);
  }, [startRestTimer]);

  // Stop a specific rest timer
  const stopTimer = useCallback((timerId: string) => {
    stopRestTimer(timerId);
  }, [stopRestTimer]);

  // Update elapsed time for a specific timer
  const updateTimer = useCallback((timerId: string, elapsedTime: number) => {
    updateRestTimerElapsed(timerId, elapsedTime);
  }, [updateRestTimerElapsed]);

  // Get timer state
  const getTimer = useCallback((timerId: string) => {
    return getRestTimerState(timerId);
  }, [getRestTimerState]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    clearAllRestTimers();
  }, [clearAllRestTimers]);

  // Generate unique timer ID for exercise + set combination
  const generateTimerId = useCallback((exerciseName: string, setNumber: number) => {
    return `${exerciseName}_set_${setNumber}`;
  }, []);

  // Check if a timer exists and is active
  const isTimerActive = useCallback((timerId: string) => {
    const timer = getRestTimerState(timerId);
    return timer?.isActive || false;
  }, [getRestTimerState]);

  // Get all active timer IDs
  const getActiveTimerIds = useCallback(() => {
    return Array.from(activeRestTimers.keys()).filter(timerId => 
      activeRestTimers.get(timerId)?.isActive
    );
  }, [activeRestTimers]);

  return {
    activeRestTimers,
    startTimer,
    stopTimer,
    updateTimer,
    getTimer,
    clearAllTimers,
    generateTimerId,
    isTimerActive,
    getActiveTimerIds,
  };
};