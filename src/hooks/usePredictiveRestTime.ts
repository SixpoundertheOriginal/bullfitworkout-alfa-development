import { useState, useEffect, useRef } from 'react';
import { useGlobalRestTimers } from '@/hooks/useGlobalRestTimers';
import { formatTime } from '@/utils/formatTime';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

interface PredictiveRestTimeResult {
  displayRestTime: string | null;
  isPredicted: boolean;
  actualRestTime: number | null;
  isTimerActive: boolean;
}

/**
 * Hook for predictive rest time display that shows real-time calculated rest times
 * without modifying any data recording logic. This provides immediate UX feedback
 * while preserving all existing data persistence behavior.
 */
export function usePredictiveRestTime(
  exerciseId: string,
  setIndex: number,
  recordedRestTime?: number
): PredictiveRestTimeResult {
  const { generateTimerId, isTimerActive, getTimer } = useGlobalRestTimers();
  const [currentElapsed, setCurrentElapsed] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate timer ID for the previous set (where rest would be recorded)
  const prevSetTimerId = setIndex > 1 ? generateTimerId(exerciseId, setIndex - 1) : null;
  const timerActive = prevSetTimerId ? isTimerActive(prevSetTimerId) : false;
  
  // Real-time timer updates
  useEffect(() => {
    if (!timerActive || !prevSetTimerId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateElapsed = () => {
      try {
        const timer = getTimer(prevSetTimerId);
        if (timer && timer.isActive) {
          const now = Date.now();
          const elapsed = Math.max(0, Math.floor((now - timer.startTime) / 1000));
          setCurrentElapsed(elapsed);
        }
      } catch (error) {
        console.warn('Error updating predictive rest time:', error);
      }
    };

    // Update immediately
    updateElapsed();
    
    // Then update every second
    intervalRef.current = setInterval(updateElapsed, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerActive, prevSetTimerId, getTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Determine what to display
  const result: PredictiveRestTimeResult = {
    displayRestTime: null,
    isPredicted: false,
    actualRestTime: recordedRestTime || null,
    isTimerActive: timerActive
  };

  // First set never shows rest time
  if (setIndex <= 1) {
    return result;
  }

  // If we have recorded rest time, use it (final state)
  if (recordedRestTime && recordedRestTime > 0) {
    result.displayRestTime = formatTime(recordedRestTime);
    result.isPredicted = false;
    result.actualRestTime = recordedRestTime;
    return result;
  }

  // If timer is active, show predicted time (real-time state)
  if (timerActive && currentElapsed > 0) {
    result.displayRestTime = formatTime(currentElapsed);
    result.isPredicted = true;
    result.actualRestTime = null;
    return result;
  }

  // Fallback: no time to display yet
  return result;
}

/**
 * Enhanced version that also provides visual state indicators
 */
export function usePredictiveRestTimeWithState(
  exerciseId: string,
  setIndex: number,
  recordedRestTime?: number
) {
  const baseResult = usePredictiveRestTime(exerciseId, setIndex, recordedRestTime);
  
  return {
    ...baseResult,
    // Visual state helpers
    shouldShowPulsing: baseResult.isPredicted && FEATURE_FLAGS.REST_TIMER_ANIMATIONS_ENABLED,
    opacity: baseResult.isPredicted ? 0.75 : 1.0,
    className: baseResult.isPredicted ? 'italic font-light' : 'font-normal',
    ariaLabel: baseResult.isPredicted 
      ? `Predicted rest time: ${baseResult.displayRestTime}` 
      : `Rest time: ${baseResult.displayRestTime}`
  };
}