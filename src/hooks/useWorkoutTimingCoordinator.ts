import { useCallback, useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { useEnhancedRestAnalytics } from '@/hooks/useEnhancedRestAnalytics';

export interface TimingValidation {
  isValid: boolean;
  discrepancy?: number;
  warnings: string[];
  breakdown: {
    globalElapsed: number;
    totalRestTime: number;
    estimatedExerciseTime: number;
    calculatedTotal: number;
  };
}

export interface TimingDebugInfo {
  globalTimer: {
    elapsed: number;
    startTime: string | null;
    isPaused: boolean;
    totalPausedMs: number;
  };
  restAnalytics: {
    totalRestTime: number;
    averageRestTime: number;
    completedSessions: number;
  };
  setTimings: {
    totalEstimatedExerciseTime: number;
    setCount: number;
  };
  validation: TimingValidation;
}

/**
 * Comprehensive workout timing coordinator that synchronizes all timing systems
 * and provides validation and debugging capabilities
 */
export const useWorkoutTimingCoordinator = () => {
  const {
    elapsedTime,
    startTime,
    isPaused,
    totalPausedMs,
    setTimings,
    isActive
  } = useWorkoutStore();

  const {
    getRestAnalytics,
    restSessions,
    activeRestSession
  } = useEnhancedRestAnalytics();

  const lastValidationRef = useRef<TimingValidation | null>(null);

  /**
   * Calculate total estimated exercise time from set timings
   */
  const calculateExerciseTime = useCallback(() => {
    let totalExerciseTime = 0;
    let setCount = 0;

    setTimings.forEach((timing) => {
      if (timing.estimatedDuration) {
        totalExerciseTime += timing.estimatedDuration;
        setCount++;
      }
    });

    // If we have no recorded timings, use a reasonable default (30s per set)
    if (setCount === 0 && isActive) {
      // Estimate based on exercises in workout
      totalExerciseTime = 30; // Default fallback
    }

    return {
      totalEstimatedExerciseTime: totalExerciseTime,
      setCount
    };
  }, [setTimings, isActive]);

  /**
   * Get real-time rest analytics
   */
  const getRestTimingData = useCallback(() => {
    const analytics = getRestAnalytics();
    
    // Include active rest session in calculations
    let totalRestTime = analytics.totalRestTime;
    if (activeRestSession && !activeRestSession.endTime) {
      const currentRestTime = Math.floor((Date.now() - activeRestSession.startTime) / 1000);
      totalRestTime += currentRestTime;
    }

    return {
      totalRestTime,
      averageRestTime: analytics.averageRestTime,
      completedSessions: restSessions.filter(s => s.actualRestTime !== undefined).length
    };
  }, [getRestAnalytics, activeRestSession, restSessions]);

  /**
   * Validate timing consistency across all systems
   */
  const validateTiming = useCallback((): TimingValidation => {
    if (!isActive || !startTime) {
      return {
        isValid: true,
        warnings: [],
        breakdown: {
          globalElapsed: 0,
          totalRestTime: 0,
          estimatedExerciseTime: 0,
          calculatedTotal: 0
        }
      };
    }

    const exerciseData = calculateExerciseTime();
    const restData = getRestTimingData();
    
    const calculatedTotal = restData.totalRestTime + exerciseData.totalEstimatedExerciseTime;
    const discrepancy = Math.abs(elapsedTime - calculatedTotal);
    
    const warnings: string[] = [];
    
    // Check for significant discrepancies (>30 seconds)
    if (discrepancy > 30) {
      warnings.push(`Timing discrepancy of ${discrepancy}s detected`);
    }
    
    // Check if rest time seems too high relative to total time
    if (restData.totalRestTime > elapsedTime * 0.8) {
      warnings.push('Rest time appears unusually high');
    }
    
    // Check for missing exercise timing data
    if (exerciseData.setCount === 0 && elapsedTime > 60) {
      warnings.push('No exercise timing data available');
    }

    // Check for paused time consistency
    const expectedElapsed = Math.floor((Date.now() - new Date(startTime).getTime() - totalPausedMs) / 1000);
    if (Math.abs(elapsedTime - expectedElapsed) > 5) {
      warnings.push('Global timer may be out of sync');
    }

    return {
      isValid: discrepancy <= 30 && warnings.length === 0,
      discrepancy,
      warnings,
      breakdown: {
        globalElapsed: elapsedTime,
        totalRestTime: restData.totalRestTime,
        estimatedExerciseTime: exerciseData.totalEstimatedExerciseTime,
        calculatedTotal
      }
    };
  }, [
    isActive,
    startTime,
    elapsedTime,
    totalPausedMs,
    calculateExerciseTime,
    getRestTimingData
  ]);

  /**
   * Get comprehensive timing debug information
   */
  const getTimingDebugInfo = useCallback((): TimingDebugInfo => {
    const exerciseData = calculateExerciseTime();
    const restData = getRestTimingData();
    const validation = validateTiming();

    return {
      globalTimer: {
        elapsed: elapsedTime,
        startTime,
        isPaused,
        totalPausedMs
      },
      restAnalytics: restData,
      setTimings: exerciseData,
      validation
    };
  }, [
    elapsedTime,
    startTime,
    isPaused,
    totalPausedMs,
    calculateExerciseTime,
    getRestTimingData,
    validateTiming
  ]);

  /**
   * Attempt to reconcile timing discrepancies
   */
  const reconcileTiming = useCallback(() => {
    const validation = validateTiming();
    
    if (!validation.isValid && validation.discrepancy && validation.discrepancy > 30) {
      console.warn('⚠️ Timing discrepancy detected:', validation);
      
      // In a real implementation, you might want to:
      // 1. Adjust the global timer based on calculated time
      // 2. Flag the workout for manual review
      // 3. Update rest times to match global timer
      
      // For now, just log the issue for debugging
      console.log('🔍 Timing breakdown:', validation.breakdown);
    }
    
    return validation;
  }, [validateTiming]);

  /**
   * Sync rest time data with workout save
   */
  const getRestTimeForSave = useCallback(() => {
    const completedSessions = restSessions.filter(s => s.actualRestTime !== undefined);
    
    // Create a map of exercise -> set -> actual rest time
    const restTimeMap = new Map<string, Map<number, number>>();
    
    completedSessions.forEach(session => {
      if (!restTimeMap.has(session.exerciseName)) {
        restTimeMap.set(session.exerciseName, new Map());
      }
      restTimeMap.get(session.exerciseName)!.set(session.setNumber, session.actualRestTime!);
    });
    
    return restTimeMap;
  }, [restSessions]);

  // Perform periodic validation
  useEffect(() => {
    if (!isActive) return;

    const validationInterval = setInterval(() => {
      const validation = validateTiming();
      lastValidationRef.current = validation;
      
      if (!validation.isValid) {
        console.warn('⚠️ Timing validation failed:', validation);
      }
    }, 10000); // Validate every 10 seconds

    return () => clearInterval(validationInterval);
  }, [isActive, validateTiming]);

  return {
    validateTiming,
    getTimingDebugInfo,
    reconcileTiming,
    getRestTimeForSave,
    lastValidation: lastValidationRef.current
  };
};