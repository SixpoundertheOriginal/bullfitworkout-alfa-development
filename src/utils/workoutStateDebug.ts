import { useWorkoutStore } from '@/store/workoutStore';
import { WorkoutState } from '@/store/workoutStore';

// Import the immediate cleanup utility
import { scanForCorruption, clearCorruption, quickHealthCheck } from './immediateCorruptionCleanup';

// Current state version for migration purposes
export const CURRENT_STATE_VERSION = '1.0.0';

// State corruption detection types
export interface StateCorruptionIssue {
  type: 'stuck_saving' | 'active_without_start' | 'outdated_version' | 'invalid_data' | 'storage_corruption';
  message: string;
  severity: 'critical' | 'moderate' | 'minor';
  detected_at: number;
}

export interface StateValidationReport {
  isValid: boolean;
  issues: StateCorruptionIssue[];
  recommendations: string[];
}

/**
 * Validates workout state for corruption issues
 */
export const validateWorkoutState = (state: Partial<WorkoutState>): StateValidationReport => {
  const issues: StateCorruptionIssue[] = [];
  const recommendations: string[] = [];
  const now = Date.now();

  // Check for stuck saving state (5+ minutes)
  if (state.workoutStatus === 'saving' && state.lastTabActivity) {
    const timeSinceSaving = now - state.lastTabActivity;
    if (timeSinceSaving > 5 * 60 * 1000) {
      issues.push({
        type: 'stuck_saving',
        message: `Workout has been stuck in saving state for ${Math.round(timeSinceSaving / 60000)} minutes`,
        severity: 'critical',
        detected_at: now
      });
      recommendations.push('Reset saving status to failed and allow user to retry');
    }
  }

  // Check for active workout without start time
  if (state.isActive && !state.startTime) {
    issues.push({
      type: 'active_without_start',
      message: 'Workout is marked as active but has no start time',
      severity: 'moderate',
      detected_at: now
    });
    recommendations.push('Set workout to inactive or provide default start time');
  }

  // Check for impossible workout status combinations
  if (state.workoutStatus === 'active' && !state.isActive) {
    issues.push({
      type: 'invalid_data',
      message: 'Workout status is active but isActive flag is false',
      severity: 'moderate',
      detected_at: now
    });
    recommendations.push('Synchronize workout status with isActive flag');
  }

  // Check for corrupted exercise data
  if (state.exercises) {
    Object.entries(state.exercises).forEach(([name, data]) => {
      if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
        issues.push({
          type: 'invalid_data',
          message: `Exercise "${name}" has corrupted data structure`,
          severity: 'moderate',
          detected_at: now
        });
        recommendations.push(`Remove or repair corrupted exercise: ${name}`);
      }
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

/**
 * Attempts to recover from corrupted state
 */
export const recoverFromCorruption = (state: Partial<WorkoutState>, issues: StateCorruptionIssue[]): Partial<WorkoutState> => {
  let recovered = { ...state };

  issues.forEach(issue => {
    switch (issue.type) {
      case 'stuck_saving':
        recovered.workoutStatus = 'failed';
        recovered.savingErrors = [
          ...(state.savingErrors || []),
          {
            message: 'Save operation timed out and was reset',
            timestamp: new Date().toISOString(),
            type: 'unknown',
            recoverable: true
          }
        ];
        break;

      case 'active_without_start':
        if (recovered.isActive) {
          // Provide a reasonable start time based on elapsed time
          const estimatedStart = new Date(Date.now() - (recovered.elapsedTime || 0) * 1000);
          recovered.startTime = estimatedStart.toISOString();
        } else {
          recovered.workoutStatus = 'idle';
        }
        break;

      case 'invalid_data':
        // Clean up corrupted exercises
        if (recovered.exercises) {
          const cleanExercises: any = {};
          Object.entries(recovered.exercises).forEach(([name, data]) => {
            if (data && (typeof data === 'object' || Array.isArray(data))) {
              cleanExercises[name] = data;
            }
          });
          recovered.exercises = cleanExercises;
        }
        break;
    }
  });

  // Set last activity to now for recovered state
  recovered.lastTabActivity = Date.now();

  return recovered;
};

/**
 * Clear all workout state and localStorage
 */
export const clearWorkoutState = (): void => {
  try {
    // Use the new aggressive cleanup utility
    clearCorruption(true); // Skip confirmation for programmatic calls
    
    console.log('✅ Workout state cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing workout state:', error);
    
    // Fallback to original method
    try {
      useWorkoutStore.getState().resetSession();
      localStorage.removeItem('workout-storage');
      console.log('✅ Fallback cleanup successful');
    } catch (fallbackError) {
      console.error('❌ Fallback cleanup failed:', fallbackError);
    }
  }
};

/**
 * Get detailed state information for debugging
 */
export const getStateDebugInfo = () => {
  const state = useWorkoutStore.getState();
  const validation = validateWorkoutState(state);
  const storageSize = JSON.stringify(state).length;
  const lastActivity = state.lastTabActivity ? new Date(state.lastTabActivity).toLocaleString() : 'Never';

  return {
    state,
    validation,
    storageSize,
    lastActivity,
    exerciseCount: Object.keys(state.exercises || {}).length,
    activeTimers: state.activeRestTimers?.size || 0,
    sessionAge: state.startTime ? Date.now() - new Date(state.startTime).getTime() : 0
  };
};

/**
 * Check localStorage health
 */
export const checkStorageHealth = () => {
  try {
    const testKey = 'workout-storage-test';
    const testData = JSON.stringify({ test: true });
    
    localStorage.setItem(testKey, testData);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return {
      isHealthy: retrieved === testData,
      totalSize: Object.keys(localStorage).reduce((total, key) => {
        return total + (localStorage.getItem(key)?.length || 0);
      }, 0),
      workoutStorageSize: localStorage.getItem('workout-storage')?.length || 0
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown storage error',
      totalSize: 0,
      workoutStorageSize: 0
    };
  }
};

// Development-only global debugging utilities
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugWorkoutState = () => {
    const debugInfo = getStateDebugInfo();
    console.group('🏋️ Workout State Debug');
    console.log('State:', debugInfo.state);
    console.log('Validation:', debugInfo.validation);
    console.log('Storage Size:', `${debugInfo.storageSize} characters`);
    console.log('Last Activity:', debugInfo.lastActivity);
    console.log('Exercise Count:', debugInfo.exerciseCount);
    console.log('Active Timers:', debugInfo.activeTimers);
    console.log('Session Age:', `${Math.round(debugInfo.sessionAge / 1000)}s`);
    console.groupEnd();
    
    return debugInfo;
  };

  (window as any).clearWorkoutState = clearWorkoutState;

  (window as any).validateWorkoutState = () => {
    const state = useWorkoutStore.getState();
    const validation = validateWorkoutState(state);
    console.log('🔍 Validation Report:', validation);
    return validation;
  };

  (window as any).checkStorageHealth = () => {
    const health = checkStorageHealth();
    console.log('💾 Storage Health:', health);
    return health;
  };

  // Add new corruption utilities
  (window as any).scanCorruption = scanForCorruption;
  (window as any).clearCorruption = clearCorruption;
  (window as any).quickHealth = quickHealthCheck;

  console.log('🛠️ Workout debugging tools available:');
  console.log('  debugWorkoutState() - Full state inspection');
  console.log('  validateWorkoutState() - Check for corruption');
  console.log('  clearWorkoutState() - Reset everything');
  console.log('  checkStorageHealth() - localStorage diagnostics');
  console.log('');
  console.log('🚨 CORRUPTION TOOLS:');
  console.log('  scanCorruption() - Detailed corruption scan');
  console.log('  clearCorruption() - Aggressive cleanup with backup');
  console.log('  quickHealth() - Fast issue detection');
  console.log('');
  console.log('🔥 IMMEDIATE FIX: clearCorruption() to fix stuck sessions');
}
