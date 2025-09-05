import { useCallback, useEffect, useState } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { useEnhancedRestAnalytics } from '@/hooks/useEnhancedRestAnalytics';
import { registerRestTimer, stopCurrentTimer, getCurrentTimer } from '@/utils/timerCoordinator';

export const useGlobalRestTimers = () => {
  const {
    activeRestTimers,
    startRestTimer,
    stopRestTimer,
    updateRestTimerElapsed,
    getRestTimerState,
    clearAllRestTimers,
    setCurrentRest,
  } = useWorkoutStore();

  // Integration with enhanced analytics to prevent duplicate systems
  const {
    startRestTimer: startEnhancedRestTimer,
  } = useEnhancedRestAnalytics();

  // Track the currently active exercise to manage rest timers intelligently
  const [activeExerciseName, setActiveExerciseName] = useState<string | null>(null);

  // Extract exercise name from timer ID
  const extractExerciseFromTimerId = useCallback((timerId: string): string => {
    return timerId.split('_set_')[0];
  }, []);

  // Stop all timers for a specific exercise
  const stopAllTimersForExercise = useCallback((exerciseName: string) => {
    Array.from(activeRestTimers.keys()).forEach(timerId => {
      if (extractExerciseFromTimerId(timerId) === exerciseName) {
        stopRestTimer(timerId);
      }
    });
  }, [activeRestTimers, stopRestTimer, extractExerciseFromTimerId]);

  // Generate unique timer ID for exercise + set combination (moved up to avoid TDZ)
  const generateTimerId = useCallback((exerciseName: string, setNumber: number) => {
    return `${exerciseName}_set_${setNumber}`;
  }, []);

  // Start a new rest timer (with exercise awareness)
  const startTimer = useCallback((timerId: string, targetTime: number) => {
    const exerciseName = extractExerciseFromTimerId(timerId);
    
    // If this is a different exercise, stop all timers from the previous exercise
    if (activeExerciseName && exerciseName !== activeExerciseName) {
      stopAllTimersForExercise(activeExerciseName);
    }
    
    // Set the new active exercise
    setActiveExerciseName(exerciseName);
    
    startRestTimer(timerId, targetTime);
  }, [startRestTimer, activeExerciseName, extractExerciseFromTimerId, stopAllTimersForExercise]);

  // Start timer for a specific exercise (smart version with analytics integration and singleton enforcement)
  const startTimerForExercise = useCallback(
    (
      exerciseName: string,
      nextSetIndex: number,
      targetTime: number,
      targetSetKey?: string
    ) => {
      const timerId = generateTimerId(exerciseName, nextSetIndex);
      const expectedKey = `${exerciseName}_${nextSetIndex}`;
      const key = targetSetKey || expectedKey;
      if (targetSetKey && targetSetKey !== expectedKey) {
        console.warn('Timer target key mismatch:', {
          provided: targetSetKey,
          expected: expectedKey,
        });
      }

      // Use timer coordinator to ensure only one timer is active at a time
      registerRestTimer(timerId, exerciseName, nextSetIndex, targetTime, 'global');

      // Stop all existing timers to prevent concurrent execution
      clearAllRestTimers();

      // Set the new active exercise
      setActiveExerciseName(exerciseName);

      // Start the store-based timer (UI display)
      startRestTimer(timerId, targetTime);

      // Start the enhanced analytics timer (data tracking)
      startEnhancedRestTimer(exerciseName, nextSetIndex, targetTime);

      // Set current rest state for compatibility with existing code
      setCurrentRest({
        startedAt: Date.now(),
        targetSetKey: key,
      });
    },
    [
      startRestTimer,
      startEnhancedRestTimer,
      setCurrentRest,
      clearAllRestTimers,
      setActiveExerciseName,
      generateTimerId,
    ]
  );

  // Stop a specific rest timer
  const stopTimer = useCallback((timerId: string) => {
    stopRestTimer(timerId);
    stopCurrentTimer(); // Also notify coordinator
  }, [stopRestTimer]);

  // Update elapsed time for a specific timer
  const updateTimer = useCallback((timerId: string, elapsedTime: number) => {
    updateRestTimerElapsed(timerId, elapsedTime);
  }, [updateRestTimerElapsed]);

  // Get timer state
  const getTimer = useCallback((timerId: string) => {
    return getRestTimerState(timerId);
  }, [getRestTimerState]);

  // Clear all timers (both store and analytics)
  const clearAllTimers = useCallback(() => {
    clearAllRestTimers();
    stopCurrentTimer(); // Notify coordinator
    setActiveExerciseName(null);
    setCurrentRest(null);
  }, [clearAllRestTimers, setCurrentRest]);



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


  // Check if timer belongs to currently active exercise
  const isTimerForActiveExercise = useCallback((timerId: string) => {
    const exerciseName = extractExerciseFromTimerId(timerId);
    return exerciseName === activeExerciseName;
  }, [activeExerciseName, extractExerciseFromTimerId]);

  // Get active timers only for the current exercise
  const getActiveTimersForCurrentExercise = useCallback(() => {
    if (!activeExerciseName) return [];
    
    return Array.from(activeRestTimers.keys()).filter(timerId => {
      const timer = activeRestTimers.get(timerId);
      return timer?.isActive && extractExerciseFromTimerId(timerId) === activeExerciseName;
    });
  }, [activeRestTimers, activeExerciseName, extractExerciseFromTimerId]);

  return {
    activeRestTimers,
    startTimer,
    startTimerForExercise,
    stopTimer,
    updateTimer,
    getTimer,
    clearAllTimers,
    generateTimerId,
    isTimerActive,
    getActiveTimerIds,
    activeExerciseName,
    setActiveExerciseName,
    stopAllTimersForExercise,
    isTimerForActiveExercise,
    getActiveTimersForCurrentExercise,
  };
};