import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrainingConfig } from '@/hooks/useTrainingSetupPersistence';
import { Exercise } from '@/types/exercise';
import { toast } from "@/hooks/use-toast";
import React from 'react';
import {
  ExerciseSet,
  WorkoutExerciseConfig,
  WorkoutExercises,
  WorkoutStatus,
  WorkoutError,
  RestTimerState
} from '@/types/workout-enhanced';
import { restAuditLog, isRestAuditEnabled } from '@/utils/restAudit';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import {
  validateWorkoutState,
  recoverFromCorruption,
  CURRENT_STATE_VERSION,
  StateCorruptionIssue
} from '@/utils/workoutStateDebug';
import { RestTimingValidationService } from '@/services/RestTimingValidationService';

// Export types for other components to use
export type { ExerciseSet, WorkoutExerciseConfig, WorkoutExercises, WorkoutStatus, WorkoutError, RestTimerState };

export interface RestTimerPreferences {
  precisionMode: boolean;
  showAdjustedRest: boolean;
}

export interface WorkoutState {
  // Core workout data
  exercises: WorkoutExercises;
  activeExercise: string | null;
  elapsedTime: number;
  workoutId: string | null;
  startTime: string | null;
  workoutStatus: WorkoutStatus;
  isPaused: boolean;
  pausedAt: number | null;
  totalPausedMs: number;
  lastCompletionTime: number | null;
  lastSavedWorkoutId: string | null; // NEW: Track last saved workout ID
  
  // Configuration (enhanced)
  trainingConfig: (TrainingConfig & {
    smartTemplate?: any;
    enhancedConfig?: any;
  }) | null;
  
  // Enhanced rest timer state - support multiple concurrent timers
  activeRestTimers: Map<string, RestTimerState>;
  // Pause-awareness baseline for each rest timer (totalPausedMs at timer start)
  restTimerBaselines: Map<string, number>;
  // Configurable max rest duration in seconds (auto-stop threshold)
  restTimerMaxSeconds: number;
  // Track individual set timings
  setTimings: Map<string, { startTime?: number; endTime?: number; estimatedDuration?: number }>;
  // Rest timer preference settings
  restTimerPreferences: RestTimerPreferences;
  currentRest?: { startedAt: number; targetSetKey: string } | null;
  
  // Session tracking
  isActive: boolean;
  lastActiveRoute: string;
  sessionId: string;
  explicitlyEnded: boolean;
  lastTabActivity: number;
  isCreatingSession: boolean;
  
  // Error handling
  savingErrors: WorkoutError[];
  
  // State integrity and recovery
  stateVersion: string;
  lastValidationTime: number;
  corruptionDetected: boolean;
  
  // Action functions
  setExercises: (exercises: WorkoutExercises | ((prev: WorkoutExercises) => WorkoutExercises)) => void;
  addEnhancedExercise: (exercise: Exercise | string, sets?: ExerciseSet[]) => void;
  setActiveExercise: (exerciseName: string | null) => void;
  setElapsedTime: (time: number | ((prev: number) => number)) => void;
  setTrainingConfig: (config: TrainingConfig | null) => void;
  updateLastActiveRoute: (route: string) => void;
  setWorkoutStatus: (status: WorkoutStatus) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  setSavedWorkout: (workoutId: string) => void;
  
  // Rest timer management
  startRestTimer: (timerId: string, targetTime: number) => void;
  stopRestTimer: (timerId: string) => void;
  updateRestTimerElapsed: (timerId: string, elapsedTime: number) => void;
  getRestTimerState: (timerId: string) => RestTimerState | undefined;
  getRestTimerBaseline: (timerId: string) => number;
  clearAllRestTimers: () => void;
  setRestTimerMaxSeconds: (maxSeconds: number) => void;
  setCurrentRest: (rest: { startedAt: number; targetSetKey: string } | null) => void;
  startSet: (exerciseName: string, setIndex: number) => void;
  setSetStartTime: (exerciseId: string, setNumber: number) => void;
  setSetEndTime: (exerciseId: string, setNumber: number) => void;
  updateRestTimerPreferences: (prefs: Partial<RestTimerPreferences>) => void;
  
  // Workout lifecycle actions
  startWorkout: () => void;
  startSessionIfNeeded: () => boolean;
  endWorkout: () => void;
  resetSession: () => void;
  
  // Status management
  markAsSaving: () => void;
  markAsSaved: () => void;
  markAsFailed: (error: WorkoutError) => void;
  
  // Exercise management
  handleCompleteSet: (exerciseName: string, setIndex: number, data?: { failurePoint?: 'none'|'technical'|'muscular'; formScore?: number }) => void;
  toggleWarmupSet: (exerciseName: string, setIndex: number) => void;
  deleteExercise: (exerciseName: string) => void;
  
  // Utility functions
  getExerciseDisplayName: (exerciseName: string) => string;
  getExerciseConfig: (exerciseName: string) => WorkoutExerciseConfig | null;
  
  // State recovery functions
  validateCurrentState: () => StateCorruptionIssue[];
  recoverFromCorruption: () => void;
  clearWorkoutState: () => void;
  quickFix: () => void;
}

// Generate a unique session ID
const generateSessionId = () => 
  crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;

// Utility function to normalize exercise data
const normalizeExerciseData = (exercises: WorkoutExercises): WorkoutExercises => {
  const normalized: WorkoutExercises = {};
  
  Object.entries(exercises).forEach(([name, data]) => {
    if (Array.isArray(data)) {
      // Legacy format: just sets array
      normalized[name] = data;
    } else {
      // New format: WorkoutExerciseConfig
      normalized[name] = data;
    }
  });
  
  return normalized;
};

// Helper function to get sets from exercise data
const getExerciseSets = (exerciseData: ExerciseSet[] | WorkoutExerciseConfig): ExerciseSet[] => {
  if (Array.isArray(exerciseData)) {
    return exerciseData;
  }
  return exerciseData.sets || [];
};

// Helper function to clear all storage
const clearAllStorage = () => {
  try {
    // Clear localStorage items
    localStorage.removeItem('workout-storage');
    
    // Clear sessionStorage items
    sessionStorage.removeItem('workout-backup');
    sessionStorage.removeItem('workout-session-recovery');
    
    console.log('✅ All workout storage cleared');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// Freeze the previous set's rest if it hasn't been frozen yet
export const ensurePrevRestFrozen = (
  exercise: WorkoutExerciseConfig | ExerciseSet[],
  nextIndex: number,
  now: number
): WorkoutExerciseConfig | ExerciseSet[] => {
  if (!FEATURE_FLAGS.REST_FREEZE_ON_START) return exercise;
  const sets = Array.isArray(exercise) ? exercise : exercise.sets;
  const prevIndex = nextIndex - 1;
  if (prevIndex < 0 || prevIndex >= sets.length) return exercise;
  const prevSet = sets[prevIndex] as any;
  if (prevSet?.restStartedAt == null) return exercise;
  if (prevSet.restFrozen) {
    if (isRestAuditEnabled()) {
      restAuditLog('[Rest] skip write; already frozen');
    }
    return exercise;
  }
  const restMs = Math.max(0, now - prevSet.restStartedAt);
  const updatedPrev = { ...prevSet, restMs, restFrozen: true };
  const updatedSets = sets.map((s, i) => (i === prevIndex ? updatedPrev : s));
  if (isRestAuditEnabled()) {
    restAuditLog(`[Rest] freeze prev set #${prevIndex + 1}: ${restMs}ms (frozen=true)`);
  }
  return Array.isArray(exercise)
    ? updatedSets
    : { ...exercise, sets: updatedSets };
};

// Create the persistent store
export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => {
      const recordRestTimeImmediately = (
        exerciseId: string,
        setIndex: number,
        durationMs: number
      ) => {
        const state = get();
        const exercise = state.exercises[exerciseId];
        if (!exercise) return;
        const sets = Array.isArray(exercise)
          ? [...exercise]
          : [...exercise.sets];
        const existing = sets[setIndex] as any;
        const existingRest = existing?.metadata?.restBefore;
        const validation = RestTimingValidationService.validateRestTime(
          exerciseId,
          setIndex,
          durationMs,
          existingRest
        );
        if (!validation.isValid) {
          console.warn('Invalid rest time', validation.errors);
          return;
        }
        const restBefore = validation.sanitizedValue!;
        if (
          existingRest &&
          Math.abs(restBefore - existingRest) >
            Math.max(5000, existingRest * 0.05)
        ) {
          console.warn('Attempting to overwrite rest time with significantly different value:', {
            exerciseId,
            setIndex,
            existing: existingRest,
            new: restBefore,
          });
          return;
        }
        sets[setIndex] = {
          ...existing,
          metadata: {
            ...existing?.metadata,
            restBefore,
            restRecordedAt: Date.now(),
          },
        };
        const updatedExercises = Array.isArray(exercise)
          ? { ...state.exercises, [exerciseId]: sets }
          : { ...state.exercises, [exerciseId]: { ...exercise, sets } };
        set({ exercises: updatedExercises });
        console.debug('Rest recorded immediately:', {
          exerciseId,
          setIndex,
          durationMs: restBefore,
        });
      };
      return {
      exercises: {},
      activeExercise: null,
      elapsedTime: 0,
      workoutId: null,
      startTime: null,
      workoutStatus: 'idle',
      isPaused: false,
      pausedAt: null,
      totalPausedMs: 0,
      lastCompletionTime: null,
      lastSavedWorkoutId: null, // NEW: Initialize saved workout ID
      
      // Configuration
      trainingConfig: null,
      
      // Enhanced rest timer state
      activeRestTimers: new Map<string, RestTimerState>(),
      restTimerBaselines: new Map<string, number>(),
      restTimerMaxSeconds: 15 * 60, // 15 minutes default
      setTimings: new Map<string, { startTime?: number; endTime?: number; estimatedDuration?: number }>(),
      restTimerPreferences: { precisionMode: false, showAdjustedRest: true },
      currentRest: null,
      
      // Session tracking
      isActive: false,
      lastActiveRoute: '/training-session',
      sessionId: generateSessionId(),
      explicitlyEnded: false,
      lastTabActivity: Date.now(),
      isCreatingSession: false,
      
      // Error handling
      savingErrors: [],
      
      // State integrity and recovery
      stateVersion: CURRENT_STATE_VERSION,
      lastValidationTime: Date.now(),
      corruptionDetected: false,
      
      setExercises: (exercises) => set((state) => ({ 
        exercises: typeof exercises === 'function' ? normalizeExerciseData(exercises(state.exercises)) : normalizeExerciseData(exercises),
        lastTabActivity: Date.now(),
      })),
      
      addEnhancedExercise: (exercise, sets = [{ weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false, isWarmup: false }]) => set((state) => {
        const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
        
        // Check if exercise already exists
        if (state.exercises[exerciseName]) {
          toast({ 
            title: "Exercise already added", 
            description: `${exerciseName} is already in your workout` 
          });
          return {};
        }
        
        const exerciseConfig: WorkoutExerciseConfig = {
          name: exerciseName,
          sets: sets,
          ...(typeof exercise === 'object' && {
            exercise: exercise,
            variant: {
              primaryModifier: exercise.primary_muscle_groups?.[0] // Simple fallback
            }
          })
        };
        
        return {
          exercises: {
            ...state.exercises,
            [exerciseName]: exerciseConfig
          },
          activeExercise: exerciseName,
          lastTabActivity: Date.now(),
        };
      }),
      
      setActiveExercise: (exerciseName) => set({ 
        activeExercise: exerciseName,
        lastTabActivity: Date.now(),
      }),
      
      setElapsedTime: (time) => set((state) => ({ 
        elapsedTime: typeof time === 'function' ? time(state.elapsedTime) : time,
        lastTabActivity: Date.now(),
      })),
      
      setTrainingConfig: (config) => set({ 
        trainingConfig: config,
        lastTabActivity: Date.now(),
      }),
      
      updateLastActiveRoute: (route) => set((state) => {
        if (state.lastActiveRoute !== route) {
          return { 
            lastActiveRoute: route,
            lastTabActivity: Date.now(),
          };
        }
        return {};
      }),
      
setWorkoutStatus: (status) => set({ 
  workoutStatus: status,
  lastTabActivity: Date.now(),
}),

pauseWorkout: () => set((state) => ({ 
  isPaused: true,
  pausedAt: Date.now(),
  lastTabActivity: Date.now(),
})),

resumeWorkout: () => set((state) => {
  const now = Date.now();
  const additionalPaused = state.pausedAt ? (now - state.pausedAt) : 0;
  return { 
    isPaused: false,
    pausedAt: null,
    totalPausedMs: (state.totalPausedMs || 0) + additionalPaused,
    lastTabActivity: Date.now(),
  };
}),

setSavedWorkout: (workoutId) => set({ 
  lastSavedWorkoutId: workoutId,
  lastTabActivity: Date.now(),
}),

setRestTimerMaxSeconds: (maxSeconds) => set({
  restTimerMaxSeconds: Math.max(30, maxSeconds || 0),
  lastTabActivity: Date.now(),
}),

setCurrentRest: (currentRest) => set({ currentRest, lastTabActivity: Date.now() }),

startSet: (exerciseName, nextIndex) => set((state) => {
  if (!FEATURE_FLAGS.REST_FREEZE_ON_START) return {};
  const exerciseData = state.exercises[exerciseName];
  if (!exerciseData) return {};
  const now = Date.now();
  const updatedExercise = ensurePrevRestFrozen(exerciseData, nextIndex, now);
  const exercises =
    updatedExercise === exerciseData
      ? state.exercises
      : { ...state.exercises, [exerciseName]: updatedExercise };
  if (isRestAuditEnabled()) {
    restAuditLog(`[Rest] startSet nextIndex=${nextIndex}`);
  }
  return { exercises, lastTabActivity: now };
}),

setSetStartTime: (exerciseId, setNumber) => {
  const key = `${exerciseId}_${setNumber}`;
  const state = get();
  if (state.currentRest && state.currentRest.targetSetKey === key) {
    const restDuration = Date.now() - state.currentRest.startedAt;
    const prevSetIndex = setNumber - 1;
    if (prevSetIndex >= 0) {
      recordRestTimeImmediately(exerciseId, prevSetIndex, restDuration);
    }
    set({ currentRest: null });
    if (isRestAuditEnabled()) {
      restAuditLog('freeze_prev_set_rest', {
        targetSetKey: key,
        restSeconds: Math.floor(restDuration / 1000),
        note: 'Computed on next set start',
      });
    }
  }
  if (FEATURE_FLAGS.REST_FREEZE_ON_START) {
    get().startSet(exerciseId, setNumber);
    set((state) => {
      const timings = new Map(state.setTimings);
      const current = timings.get(key) || {};
      if (!current.startTime) {
        timings.set(key, { ...current, startTime: Date.now() });
      }
      return { setTimings: timings, lastTabActivity: Date.now() };
    });
    return;
  }
  set((state) => {
    const timings = new Map(state.setTimings);
    const current = timings.get(key) || {};
    if (!current.startTime) {
      timings.set(key, { ...current, startTime: Date.now() });
    }
    return { setTimings: timings, lastTabActivity: Date.now() };
  });
},

setSetEndTime: (exerciseId, setNumber) => set((state) => {
  const key = `${exerciseId}_${setNumber}`;
  const timings = new Map(state.setTimings);
  const current = timings.get(key) || {};
  const endTime = Date.now();
  let estimatedDuration: number;
  if (current.startTime) {
    // Calculate actual duration in seconds and cap at 3 minutes
    estimatedDuration = Math.min(
      Math.floor((endTime - current.startTime) / 1000),
      180
    );
  } else {
    // Fallback default estimate (40s) if no start interaction
    estimatedDuration = 40;
  }
  timings.set(key, { ...current, endTime, estimatedDuration });
  return { setTimings: timings, lastTabActivity: Date.now() };
}),

updateRestTimerPreferences: (prefs) => set((state) => ({
  restTimerPreferences: { ...state.restTimerPreferences, ...prefs },
  lastTabActivity: Date.now(),
})),

getExerciseDisplayName: (exerciseName) => {
  const state = get();
  const exerciseData = state.exercises[exerciseName];
  
  if (!exerciseData || Array.isArray(exerciseData)) {
    return exerciseName; // Legacy format
  }
  
  const config = exerciseData as WorkoutExerciseConfig;
  const primaryModifier = config.variant?.primaryModifier;
  
  return primaryModifier ? `${exerciseName} • ${primaryModifier}` : exerciseName;
},
      
getExerciseConfig: (exerciseName) => {
  const state = get();
  const exerciseData = state.exercises[exerciseName];
  
  if (!exerciseData) return null;
  
  if (Array.isArray(exerciseData)) {
    // Convert legacy format to new format
    return {
      name: exerciseName,
      sets: exerciseData
    };
  }
  
  return exerciseData as WorkoutExerciseConfig;
},
      
startRestTimer: (timerId, targetTime) => set((state) => {
  const newTimers = new Map(state.activeRestTimers);
  const newBaselines = new Map(state.restTimerBaselines);
  newTimers.set(timerId, {
    isActive: true,
    targetTime,
    startTime: Date.now(),
    elapsedTime: 0,
    isCompleted: false,
    isOvertime: false,
  });
  // Record paused baseline at timer start
  newBaselines.set(timerId, state.totalPausedMs || 0);
  return { 
    activeRestTimers: newTimers,
    restTimerBaselines: newBaselines,
    lastTabActivity: Date.now(),
  };
}),
      
stopRestTimer: (timerId) => set((state) => {
  const newTimers = new Map(state.activeRestTimers);
  const newBaselines = new Map(state.restTimerBaselines);
  newTimers.delete(timerId);
  newBaselines.delete(timerId);
  return { 
    activeRestTimers: newTimers,
    restTimerBaselines: newBaselines,
    lastTabActivity: Date.now(),
  };
}),
      
      updateRestTimerElapsed: (timerId, _elapsedTimeIgnored) => set((state) => {
        const newTimers = new Map(state.activeRestTimers);
        const timer = newTimers.get(timerId);
        if (timer) {
          const now = Date.now();
          const baseline = state.restTimerBaselines.get(timerId) || 0;
          const pausedDelta = Math.max(0, (state.totalPausedMs || 0) - baseline + ((state.isPaused && state.pausedAt) ? (now - state.pausedAt) : 0));
          let elapsed = Math.floor((now - timer.startTime - pausedDelta) / 1000);
          if (elapsed < 0) elapsed = 0;
          const max = state.restTimerMaxSeconds || Infinity;
          const finalElapsed = Math.min(elapsed, max);
          const reachedMax = elapsed >= max;
          const isCompleted = finalElapsed >= timer.targetTime;
          const isOvertime = finalElapsed > timer.targetTime;
          newTimers.set(timerId, {
            ...timer,
            elapsedTime: finalElapsed,
            isCompleted,
            isOvertime,
            isActive: reachedMax ? false : timer.isActive,
          });
        }
        return { 
          activeRestTimers: newTimers,
          lastTabActivity: Date.now(),
        };
      }),
      
getRestTimerState: (timerId) => {
  const state = get();
  return state.activeRestTimers.get(timerId);
},

getRestTimerBaseline: (timerId) => {
  const state = get();
  return state.restTimerBaselines.get(timerId) || 0;
},

clearAllRestTimers: () => set({ 
  activeRestTimers: new Map(),
  restTimerBaselines: new Map(),
  lastTabActivity: Date.now(),
}),
      
      startWorkout: () => {
        const now = new Date();
        set({
          isActive: true,
          explicitlyEnded: false,
          workoutStatus: 'active',
          startTime: now.toISOString(),
          elapsedTime: 0,
          isPaused: false,
          pausedAt: null,
          totalPausedMs: 0,
          sessionId: generateSessionId(),
          lastTabActivity: Date.now(),
        });

        toast.success("Workout started", {
          description: "Your workout session has begun"
        });

        console.log("Workout started at:", now);
      },

      startSessionIfNeeded: () => {
        const state = get();
        if (state.workoutStatus !== 'idle' || state.isCreatingSession) return false;
        
        // Set creating flag to prevent duplicate sessions
        set({ isCreatingSession: true });
        
        const now = new Date();
        set({
          isActive: true,
          explicitlyEnded: false,
          workoutStatus: 'active',
          startTime: now.toISOString(),
          elapsedTime: 0,
          isPaused: false,
          pausedAt: null,
          totalPausedMs: 0,
          sessionId: generateSessionId(),
          lastTabActivity: Date.now(),
          isCreatingSession: false,
        });
        console.log('Workout session started');
        return true;
      },
      
      endWorkout: () => {
        set((state) => {
          // Freeze any pending rest for targeted set if present
          let exercises = state.exercises as WorkoutExercises;
          if (state.currentRest && state.currentRest.targetSetKey) {
            try {
              const key = state.currentRest.targetSetKey;
              const lastUnderscore = key.lastIndexOf('_');
              const exerciseId = key.slice(0, lastUnderscore);
              const setNumber = parseInt(key.slice(lastUnderscore + 1), 10);
              const restBeforeMs = Date.now() - state.currentRest.startedAt;
              const updated = { ...exercises } as any;
              const ex = updated[exerciseId];
              const sets = Array.isArray(ex) ? ex : ex?.sets;
              if (sets && sets[setNumber - 1]) {
                const original = sets[setNumber - 1];
                sets[setNumber - 1] = {
                  ...original,
                  metadata: { ...(original.metadata || {}), restBefore: restBeforeMs }
                };
                if (!Array.isArray(ex) && ex) {
                  updated[exerciseId] = { ...ex, sets };
                } else {
                  updated[exerciseId] = sets;
                }
                exercises = updated;
              }
            } catch (e) {
              console.warn('Failed to freeze pending rest on endWorkout:', e);
            }
          }

          return {
            exercises,
            currentRest: null,
            isActive: false,
            explicitlyEnded: true,
            workoutStatus: 'idle',
            lastTabActivity: Date.now(),
          };
        });
        console.log("Workout ended");
      },
      
resetSession: () => {
  // Clear ALL storage immediately to prevent zombie sessions
  clearAllStorage();
  
  set({ 
    exercises: {},
    activeExercise: null,
    elapsedTime: 0,
    workoutId: null,
    startTime: null,
    workoutStatus: 'idle',
    trainingConfig: null,
    activeRestTimers: new Map(),
    restTimerBaselines: new Map(),
    isActive: false,
    isPaused: false,
    pausedAt: null,
    totalPausedMs: 0,
    explicitlyEnded: true,
    sessionId: generateSessionId(),
    lastTabActivity: Date.now(),
    savingErrors: [],
    // Keep lastSavedWorkoutId for post-save continuity
  });
  console.log("🔄 Workout session reset - all storage cleared");
},
      
      markAsSaving: () => {
        // CRITICAL: Clear all backup data BEFORE setting saving state
        // This prevents recovery loops that cause stuck workouts
        try {
          sessionStorage.removeItem('workout-backup');
          sessionStorage.removeItem('workout-session-recovery');
          console.log('🗑️ Cleared backup data before save');
        } catch (error) {
          console.error('Failed to clear backup data:', error);
        }
        
        set({ 
          workoutStatus: 'saving',
          lastTabActivity: Date.now(),
        });
      },
      
      markAsSaved: () => {
        console.log('🎯 Marking workout as saved');
        
        // ATOMIC COMPLETION: Set completion timestamp immediately
        const completionTime = Date.now();
        localStorage.setItem('last-workout-completion', completionTime.toString());
        
        // CRITICAL: Set completion state FIRST to prevent recovery interference
        set({ 
          workoutStatus: 'saved',
          isActive: false,
          explicitlyEnded: true,
          lastCompletionTime: completionTime,
          lastTabActivity: Date.now(),
        });
        
        // Clear ALL storage immediately AFTER state is set
        clearAllStorage();
        
        toast.success("Workout saved successfully!");
        
        // Reset session immediately - no delay to prevent race conditions
        get().resetSession();
      },
      
      
      markAsFailed: (error) => set((state) => ({ 
        workoutStatus: 'failed',
        savingErrors: [...state.savingErrors, error],
        lastTabActivity: Date.now(),
      })),
      
      handleCompleteSet: (exerciseName, setIndex, data) => set((state) => {
        const newExercises = { ...state.exercises };
        let exerciseData = newExercises[exerciseName];
        const ts = Date.now();
        let startedRest = false;

        if (FEATURE_FLAGS.REST_FREEZE_ON_START && exerciseData) {
          const updated = ensurePrevRestFrozen(exerciseData, setIndex, ts);
          newExercises[exerciseName] = updated as any;
          exerciseData = updated;
        }

        if (Array.isArray(exerciseData)) {
          newExercises[exerciseName] = exerciseData.map((set, i) => {
            if (i === setIndex) {
              const updated = { ...set, completed: true, failurePoint: data?.failurePoint, formScore: data?.formScore };
              if (FEATURE_FLAGS.REST_FREEZE_ON_START) {
                if ((set as any).restFrozen) {
                  if (isRestAuditEnabled()) {
                    restAuditLog('[Rest] skip write; already frozen');
                  }
                } else {
                  updated.restStartedAt = ts;
                  startedRest = true;
                }
              }
              return updated;
            }
            return set;
          });
        } else if (exerciseData) {
          const config = exerciseData as WorkoutExerciseConfig;
          newExercises[exerciseName] = {
            ...config,
            sets: config.sets.map((set, i) => {
              if (i === setIndex) {
                const updated = { ...set, completed: true, failurePoint: data?.failurePoint, formScore: data?.formScore };
                if (FEATURE_FLAGS.REST_FREEZE_ON_START) {
                  if ((set as any).restFrozen) {
                    if (isRestAuditEnabled()) {
                      restAuditLog('[Rest] skip write; already frozen');
                    }
                  } else {
                    updated.restStartedAt = ts;
                    startedRest = true;
                  }
                }
                return updated;
              }
              return set;
            })
          };
        }

        if (startedRest && isRestAuditEnabled()) {
          restAuditLog(`[Rest] start for set #${setIndex + 1} at ${ts}`);
        }

        return {
          exercises: newExercises,
          lastTabActivity: Date.now(),
        };
      }),

      toggleWarmupSet: (exerciseName, setIndex) => set((state) => {
        const newExercises = { ...state.exercises };
        const exerciseData = newExercises[exerciseName];
        
        if (Array.isArray(exerciseData)) {
          // Legacy format - add isWarmup property
          newExercises[exerciseName] = exerciseData.map((set, i) => 
            i === setIndex ? { ...set, isWarmup: !set.isWarmup } : set
          );
        } else if (exerciseData) {
          // New format
          const config = exerciseData as WorkoutExerciseConfig;
          newExercises[exerciseName] = {
            ...config,
            sets: config.sets.map((set, i) => 
              i === setIndex ? { ...set, isWarmup: !set.isWarmup } : set
            )
          };
        }
        
        return { 
          exercises: newExercises,
          lastTabActivity: Date.now(),
        };
      }),
      
      deleteExercise: (exerciseName) => set((state) => {
        const newExercises = { ...state.exercises };
        delete newExercises[exerciseName];
        
        toast.success(`Removed ${exerciseName} from workout`);
        
        setTimeout(() => {
          const exerciseCount = Object.keys(newExercises).length;
          if (exerciseCount === 0) {
            toast.info("No exercises left. Add exercises or end your workout.", {
              action: {
                label: "End Workout",
                onClick: () => {
                  get().endWorkout();
                  toast.success("Workout ended");
                }
              }
            });
          }
        }, 500);
        
        return { 
          exercises: newExercises,
          lastTabActivity: Date.now(),
        };
      }),
      
      validateCurrentState: () => {
  const state = get();
  const validation = validateWorkoutState(state);
  return validation.issues;
},

recoverFromCorruption: () => {
  const state = get();
  const validation = validateWorkoutState(state);
  
  if (validation.issues.length > 0) {
    const recovered = recoverFromCorruption(state, validation.issues);
    set({
      ...recovered,
      corruptionDetected: false,
      lastValidationTime: Date.now(),
    });
    
    toast.info("Workout session recovered", {
      description: `Fixed ${validation.issues.length} issue${validation.issues.length !== 1 ? 's' : ''}`
    });
    
    console.log('🔧 Recovered from corruption:', validation.issues);
  }
},

clearWorkoutState: () => {
  // Clear ALL storage before resetting state
  clearAllStorage();
  
  set({
    exercises: {},
    activeExercise: null,
    elapsedTime: 0,
    workoutId: null,
    startTime: null,
    workoutStatus: 'idle',
    isPaused: false,
    pausedAt: null,
    totalPausedMs: 0,
    trainingConfig: null,
    activeRestTimers: new Map(),
    restTimerBaselines: new Map(),
    isActive: false,
    lastActiveRoute: '/training-session',
    sessionId: generateSessionId(),
    explicitlyEnded: true,
    lastTabActivity: Date.now(),
    savingErrors: [],
    stateVersion: CURRENT_STATE_VERSION,
    lastValidationTime: Date.now(),
    corruptionDetected: false,
  });
  
  toast.success("Workout session cleared", {
    description: "All workout data has been reset"
  });
  
  console.log('🗑️ Workout state cleared completely');
},

      quickFix: () => {
        set((state) => {
          // Save current exercise data to sessionStorage backup
          const backupData = {
            exercises: state.exercises,
            elapsedTime: state.elapsedTime,
            activeExercise: state.activeExercise,
            savedAt: Date.now()
          };
          
          try {
            sessionStorage.setItem('workout-backup', JSON.stringify(backupData));
          } catch (error) {
            console.warn('Could not save backup:', error);
          }

          // Fix corrupted state while preserving exercise data
          const fixed = {
            ...state,
            workoutStatus: (state.exercises && Object.keys(state.exercises).length > 0 ? 'active' : 'idle') as WorkoutStatus,
            savingErrors: [],
            lastTabActivity: Date.now(),
            activeRestTimers: new Map(),
          };

          console.log('🔧 Quick fix applied - workout state cleaned');
          return fixed;
        });
      },
    };
  },
  {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
    // First check: Don't persist saved or explicitly ended workouts
    if (state.workoutStatus === 'saved' || state.explicitlyEnded) {
      console.log('🚫 Not persisting saved/ended workout - clearing sessionStorage');
      // Clear sessionStorage backup for completed workouts
      sessionStorage.removeItem('workout-backup');
      sessionStorage.removeItem('workout-session-recovery');
      return {};
    }
    
    const MAX_REASONABLE_DURATION = 12 * 60 * 60; // 12 hours
    
    if (state.elapsedTime < 0) {
      console.warn('🔧 Fixed negative elapsed time');
      state.elapsedTime = 0;
    }
    
    if (state.elapsedTime > MAX_REASONABLE_DURATION) {
      console.warn(`🔧 Fixed corrupted elapsed time: ${state.elapsedTime}s -> 2h`);
      state.elapsedTime = 2 * 60 * 60; // Cap at 2 hours
    }
    
    if (state.workoutStatus === 'saving' && Date.now() - (state.lastTabActivity || 0) > 60000) {
      console.warn('🔧 Fixed stuck saving state');
      state.workoutStatus = 'failed'; // Don't save stuck saving states
    }
    
    // Check for very old session before backing up
    const SESSION_AGE_LIMIT = 24 * 60 * 60 * 1000; // 24 hours
    const isSessionTooOld = state.startTime && (Date.now() - new Date(state.startTime).getTime() > SESSION_AGE_LIMIT);
    
    if (isSessionTooOld) {
      console.warn('🕰️ Session too old, skipping backup and marking as invalid');
      sessionStorage.removeItem('workout-backup');
      // Do not save extremely old sessions
      return {};
    }
    
    // Only create backup for active workouts
    if (state.isActive && state.exercises && Object.keys(state.exercises).length > 0) {
      try {
        // Check if in stuck saving state
        const isStuckSaving = state.workoutStatus === 'saving' && 
                             state.lastTabActivity && 
                             (Date.now() - state.lastTabActivity > 2 * 60 * 1000);
                             
        if (!isStuckSaving) {
          sessionStorage.setItem('workout-backup', JSON.stringify({
            exercises: state.exercises,
            elapsedTime: state.elapsedTime,
            activeExercise: state.activeExercise,
            savedAt: Date.now()
          }));
        } else {
          console.warn('🚫 Not backing up stuck saving state to prevent zombie recovery');
        }
      } catch (error) {
        console.warn('Could not create backup:', error);
      }
    }
    
    return {
      exercises: state.exercises,
      activeExercise: state.activeExercise,
      elapsedTime: state.elapsedTime,
      workoutId: state.workoutId,
      startTime: state.startTime,
      workoutStatus: state.workoutStatus,
      isPaused: state.isPaused,
      pausedAt: state.pausedAt,
      totalPausedMs: state.totalPausedMs,
      trainingConfig: state.trainingConfig,
      isActive: state.isActive,
      lastActiveRoute: state.lastActiveRoute,
      sessionId: state.sessionId,
      explicitlyEnded: state.explicitlyEnded,
      activeRestTimers: Array.from(state.activeRestTimers.entries()) as any,
      restTimerBaselines: Array.from(state.restTimerBaselines.entries()) as any,
      restTimerMaxSeconds: state.restTimerMaxSeconds,
      stateVersion: state.stateVersion,
      lastValidationTime: state.lastValidationTime,
    };
  },
  // CRITICAL FIX: Prevent rehydration of completed workouts
  onRehydrateStorage: () => {
    return (rehydratedState, error) => {
      // ENHANCED: Check for completed workouts BEFORE any processing
      if (rehydratedState?.explicitlyEnded || rehydratedState?.workoutStatus === 'saved' || rehydratedState?.lastCompletionTime) {
        console.log('🚫 Blocking rehydration of completed workout - clearing storage');
        localStorage.removeItem('workout-storage');
        clearAllStorage();
        return undefined; // Don't rehydrate completed workouts
      }
      
      // Additional safety check for old sessions
      if (rehydratedState?.startTime) {
        const sessionAge = Date.now() - new Date(rehydratedState.startTime).getTime();
        const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge > MAX_SESSION_AGE) {
          console.log('🕰️ Blocking rehydration of stale session (>24h)');
          localStorage.removeItem('workout-storage');
          clearAllStorage();
          return undefined;
        }
      }
      
      if (error) {
        console.error('❌ Error rehydrating workout state:', error);
        
        try {
          const backup = sessionStorage.getItem('workout-backup');
          if (backup) {
            const backupData = JSON.parse(backup);
            
            const backupAge = Date.now() - (backupData.savedAt || 0);
            const MAX_BACKUP_AGE = 30 * 60 * 1000; // 30 minutes
            
            if (backupAge > MAX_BACKUP_AGE) {
              console.log('🚫 Backup too old, clearing instead of restoring');
              sessionStorage.removeItem('workout-backup');
              clearAllStorage();
              return;
            }
            
            const store = useWorkoutStore.getState();
            store.setExercises(backupData.exercises);
            store.setElapsedTime(backupData.elapsedTime);
            if (backupData.activeExercise) {
              store.setActiveExercise(backupData.activeExercise);
            }
            console.log('✅ Restored from recent backup');
            return;
          }
        } catch (backupError) {
          console.warn('Could not restore from backup:', backupError);
        }
        
        setTimeout(() => {
          const store = useWorkoutStore.getState();
          store.clearWorkoutState();
        }, 100);
        return;
      }
      
      if (rehydratedState) {
        console.log('🔄 Rehydrating workout state...');
        
        // Note: Zombie protection is now handled in onRehydrateStorage callback above
        
        // Check for session age limit to prevent very old sessions from being rehydrated
        const SESSION_AGE_LIMIT = 24 * 60 * 60 * 1000; // 24 hours
        if (rehydratedState.startTime && (Date.now() - new Date(rehydratedState.startTime).getTime() > SESSION_AGE_LIMIT)) {
          console.warn('🕰️ Session too old (>24h), clearing instead of rehydrating');
          clearAllStorage();
          return;
        }
        
        // Check for stuck saving state during rehydration
        if (rehydratedState.workoutStatus === 'saving' && rehydratedState.lastTabActivity) {
          const stuckTime = Date.now() - rehydratedState.lastTabActivity;
          if (stuckTime > 2 * 60 * 1000) { // 2 minutes
            console.warn('🔄 Unsticking workout from saving state during rehydration');
            rehydratedState.workoutStatus = 'failed';
            rehydratedState.corruptionDetected = true;
          }
        }
        
        rehydratedState.stateVersion = rehydratedState.stateVersion || CURRENT_STATE_VERSION;
        rehydratedState.lastValidationTime = rehydratedState.lastValidationTime || Date.now();
        rehydratedState.corruptionDetected = false;
        
        const MAX_REASONABLE_DURATION = 12 * 60 * 60; // 12 hours
        
        if (rehydratedState.elapsedTime > MAX_REASONABLE_DURATION) {
          console.warn(`🔧 Auto-fixing corrupted elapsed time during rehydration: ${rehydratedState.elapsedTime}s -> 2h`);
          rehydratedState.elapsedTime = 2 * 60 * 60; // Cap at 2 hours
          rehydratedState.corruptionDetected = true;
        }
        
        const validation = validateWorkoutState(rehydratedState);
        
        if (validation.issues.length > 0) {
          console.warn('⚠️ State corruption detected during rehydration:', validation.issues);
          
          rehydratedState.corruptionDetected = true;
          
          setTimeout(() => {
            const criticalIssues = validation.issues.filter(issue => issue.severity === 'critical');
            
            if (criticalIssues.length > 0) {
              toast.error("Critical workout issue detected", {
                description: "Your workout session needs recovery. Click to fix it.",
                action: {
                  label: "Recover",
                  onClick: () => {
                    const store = useWorkoutStore.getState();
                    store.recoverFromCorruption();
                  }
                }
              });
            } else {
              toast.warning("Workout session issue detected", {
                description: "Minor issues found and will be auto-corrected.",
                action: {
                  label: "Fix Now",
                  onClick: () => {
                    const store = useWorkoutStore.getState();
                    store.recoverFromCorruption();
                  }
                }
              });
            }
          }, 1500);
        }
        
        if (rehydratedState.activeRestTimers && Array.isArray(rehydratedState.activeRestTimers)) {
          const timersArray = rehydratedState.activeRestTimers as [string, RestTimerState][];
          rehydratedState.activeRestTimers = new Map(timersArray) as any;
        } else {
          rehydratedState.activeRestTimers = new Map() as any;
        }
        
        if (rehydratedState.restTimerBaselines && Array.isArray(rehydratedState.restTimerBaselines)) {
          const baselineArray = rehydratedState.restTimerBaselines as [string, number][];
          rehydratedState.restTimerBaselines = new Map(baselineArray) as any;
        } else {
          rehydratedState.restTimerBaselines = new Map() as any;
        }
        
        if (rehydratedState.exercises) {
          rehydratedState.exercises = normalizeExerciseData(rehydratedState.exercises);
        }
        
        console.log('✅ State rehydration complete');
      }
      
      if (rehydratedState && rehydratedState.isActive && !rehydratedState.corruptionDetected) {
        if (rehydratedState.isActive && rehydratedState.startTime) {
          const storedStartTime = new Date(rehydratedState.startTime);
          const now = Date.now();
          const pausedMs = (rehydratedState.totalPausedMs || 0) + ((rehydratedState.isPaused && rehydratedState.pausedAt) ? (now - rehydratedState.pausedAt) : 0);
          const calculatedElapsedTime = Math.max(0, Math.floor(
            (now - storedStartTime.getTime() - pausedMs) / 1000
          ));
          
          if (calculatedElapsedTime > (rehydratedState.elapsedTime || 0)) {
            setTimeout(() => {
              const store = useWorkoutStore.getState();
              store.setElapsedTime(calculatedElapsedTime);
              console.log(`⏱️ Restored elapsed time: ${calculatedElapsedTime}s`);
            }, 100);
          }
          
          setTimeout(() => {
            toast.success("Workout session recovered", {
              description: "Your workout has been restored successfully"
            });
          }, 1000);
         }
      }
    };
  }
  }
));

export const useWorkoutPageVisibility = () => {
  const { isActive, isPaused, pausedAt, totalPausedMs, setElapsedTime, startTime, activeRestTimers, updateRestTimerElapsed } = useWorkoutStore();
  
  React.useEffect(() => {
    if (!document || !isActive) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        if (startTime) {
          const storedStartTime = new Date(startTime);
          const now = Date.now();
          const pausedMs = (totalPausedMs || 0) + ((isPaused && pausedAt) ? (now - pausedAt) : 0);
          const calculatedElapsedTime = Math.max(0, Math.floor(
            (now - storedStartTime.getTime() - pausedMs) / 1000
          ));
          
          setElapsedTime(calculatedElapsedTime);
          console.log(`Updated elapsed time after tab switch: ${calculatedElapsedTime}s`);
        }
        
        const now = Date.now();
        activeRestTimers.forEach((timer, timerId) => {
          if (timer.isActive && timer.startTime) {
            const elapsedSeconds = Math.floor((now - timer.startTime) / 1000);
            updateRestTimerElapsed(timerId, elapsedSeconds);
            console.log(`Updated rest timer ${timerId}: ${elapsedSeconds}s`);
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, setElapsedTime, startTime, activeRestTimers, updateRestTimerElapsed]);
};
