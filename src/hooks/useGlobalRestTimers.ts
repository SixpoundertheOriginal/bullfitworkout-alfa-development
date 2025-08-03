import { useCallback, useEffect, useState } from 'react';
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

  // Start timer for a specific exercise (smart version)
  const startTimerForExercise = useCallback((exerciseName: string, setNumber: number, targetTime: number) => {
    // Stop all timers from other exercises
    if (activeExerciseName && activeExerciseName !== exerciseName) {
      stopAllTimersForExercise(activeExerciseName);
    }
    
    // Set the new active exercise
    setActiveExerciseName(exerciseName);
    
    const timerId = generateTimerId(exerciseName, setNumber);
    startRestTimer(timerId, targetTime);
  }, [startRestTimer, activeExerciseName, stopAllTimersForExercise]);

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