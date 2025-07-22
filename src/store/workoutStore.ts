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
import { 
  validateWorkoutState, 
  recoverFromCorruption, 
  CURRENT_STATE_VERSION, 
  StateCorruptionIssue 
} from '@/utils/workoutStateDebug';

// Export types for other components to use
export type { ExerciseSet, WorkoutExerciseConfig, WorkoutExercises, WorkoutStatus, WorkoutError, RestTimerState };

export interface WorkoutState {
  // Core workout data
  exercises: WorkoutExercises;
  activeExercise: string | null;
  elapsedTime: number;
  workoutId: string | null;
  startTime: string | null;
  workoutStatus: WorkoutStatus;
  isPaused: boolean;
  
  // Configuration
  trainingConfig: TrainingConfig | null;
  
  // Enhanced rest timer state - support multiple concurrent timers
  activeRestTimers: Map<string, RestTimerState>;
  
  // Session tracking
  isActive: boolean;
  lastActiveRoute: string;
  sessionId: string;
  explicitlyEnded: boolean;
  lastTabActivity: number;
  
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
  
  // Rest timer management
  startRestTimer: (timerId: string, targetTime: number) => void;
  stopRestTimer: (timerId: string) => void;
  updateRestTimerElapsed: (timerId: string, elapsedTime: number) => void;
  getRestTimerState: (timerId: string) => RestTimerState | undefined;
  clearAllRestTimers: () => void;
  
  // Workout lifecycle actions
  startWorkout: () => void;
  endWorkout: () => void;
  resetSession: () => void;
  
  // Status management
  markAsSaving: () => void;
  markAsSaved: () => void;
  markAsFailed: (error: WorkoutError) => void;
  
  // Exercise management
  handleCompleteSet: (exerciseName: string, setIndex: number) => void;
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

// Create the persistent store
export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      exercises: {},
      activeExercise: null,
      elapsedTime: 0,
      workoutId: null,
      startTime: null,
      workoutStatus: 'idle',
      isPaused: false,
      
      // Configuration
      trainingConfig: null,
      
      // Enhanced rest timer state
      activeRestTimers: new Map<string, RestTimerState>(),
      
      // Session tracking
      isActive: false,
      lastActiveRoute: '/training-session',
      sessionId: generateSessionId(),
      explicitlyEnded: false,
      lastTabActivity: Date.now(),
      
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
      
      addEnhancedExercise: (exercise, sets = [{ weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false }]) => set((state) => {
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

      pauseWorkout: () => set({ 
        isPaused: true,
        lastTabActivity: Date.now(),
      }),

      resumeWorkout: () => set({ 
        isPaused: false,
        lastTabActivity: Date.now(),
      }),
      
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
        newTimers.set(timerId, {
          isActive: true,
          targetTime,
          startTime: Date.now(),
          elapsedTime: 0,
          isCompleted: false,
          isOvertime: false,
        });
        return { 
          activeRestTimers: newTimers,
          lastTabActivity: Date.now(),
        };
      }),
      
      stopRestTimer: (timerId) => set((state) => {
        const newTimers = new Map(state.activeRestTimers);
        newTimers.delete(timerId);
        return { 
          activeRestTimers: newTimers,
          lastTabActivity: Date.now(),
        };
      }),
      
      updateRestTimerElapsed: (timerId, elapsedTime) => set((state) => {
        const newTimers = new Map(state.activeRestTimers);
        const timer = newTimers.get(timerId);
        if (timer) {
          const isCompleted = elapsedTime >= timer.targetTime;
          const isOvertime = elapsedTime > timer.targetTime;
          newTimers.set(timerId, {
            ...timer,
            elapsedTime,
            isCompleted,
            isOvertime,
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
      
      clearAllRestTimers: () => set({ 
        activeRestTimers: new Map(),
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
          sessionId: generateSessionId(),
          lastTabActivity: Date.now(),
        });
        
        toast.success("Workout started", {
          description: "Your workout session has begun"
        });
        
        console.log("Workout started at:", now);
      },
      
      endWorkout: () => {
        set({ 
          isActive: false,
          explicitlyEnded: true,
          workoutStatus: 'idle',
          lastTabActivity: Date.now(),
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
          isActive: false,
          isPaused: false,
          explicitlyEnded: true,
          sessionId: generateSessionId(),
          lastTabActivity: Date.now(),
          savingErrors: [],
        });
        console.log("🔄 Workout session reset - all storage cleared");
      },
      
      markAsSaving: () => set({ 
        workoutStatus: 'saving',
        lastTabActivity: Date.now(),
      }),
      
      markAsSaved: () => {
        // CRITICAL: Clear ALL storage immediately to prevent zombie recovery
        clearAllStorage();
        
        set({ 
          workoutStatus: 'saved',
          isActive: false,
          explicitlyEnded: true,
          lastTabActivity: Date.now(),
        });
        
        toast.success("Workout saved successfully!");
        
        // Reset session after short delay to ensure UI updates
        setTimeout(() => {
          get().resetSession();
        }, 500);
      },
      
      markAsFailed: (error) => set((state) => ({ 
        workoutStatus: 'failed',
        savingErrors: [...state.savingErrors, error],
        lastTabActivity: Date.now(),
      })),
      
      handleCompleteSet: (exerciseName, setIndex) => set((state) => {
        const newExercises = { ...state.exercises };
        const exerciseData = newExercises[exerciseName];
        
        if (Array.isArray(exerciseData)) {
          // Legacy format
          newExercises[exerciseName] = exerciseData.map((set, i) => 
            i === setIndex ? { ...set, completed: true } : set
          );
        } else if (exerciseData) {
          // New format
          const config = exerciseData as WorkoutExerciseConfig;
          newExercises[exerciseName] = {
            ...config,
            sets: config.sets.map((set, i) => 
              i === setIndex ? { ...set, completed: true } : set
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
          trainingConfig: null,
          activeRestTimers: new Map(),
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
    }),
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
        
        // Only create backup for active workouts
        if (state.isActive && state.exercises && Object.keys(state.exercises).length > 0) {
          try {
            sessionStorage.setItem('workout-backup', JSON.stringify({
              exercises: state.exercises,
              elapsedTime: state.elapsedTime,
              activeExercise: state.activeExercise,
              savedAt: Date.now()
            }));
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
          trainingConfig: state.trainingConfig,
          isActive: state.isActive,
          lastActiveRoute: state.lastActiveRoute,
          sessionId: state.sessionId,
          explicitlyEnded: state.explicitlyEnded,
          activeRestTimers: Array.from(state.activeRestTimers.entries()) as any,
          stateVersion: state.stateVersion,
          lastValidationTime: state.lastValidationTime,
        };
      },
      onRehydrateStorage: () => {
        return (rehydratedState, error) => {
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
            
            if (rehydratedState.workoutStatus === 'saved' || rehydratedState.explicitlyEnded) {
              console.log('🚫 Preventing zombie recovery of saved/ended workout');
              clearAllStorage();
              return;
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
            
            if (rehydratedState.exercises) {
              rehydratedState.exercises = normalizeExerciseData(rehydratedState.exercises);
            }
            
            console.log('✅ State rehydration complete');
          }
          
          if (rehydratedState && rehydratedState.isActive && !rehydratedState.corruptionDetected) {
            if (rehydratedState.isActive && rehydratedState.startTime) {
              const storedStartTime = new Date(rehydratedState.startTime);
              const currentTime = new Date();
              const calculatedElapsedTime = Math.floor(
                (currentTime.getTime() - storedStartTime.getTime()) / 1000
              );
              
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
  )
);

export const useWorkoutPageVisibility = () => {
  const { isActive, setElapsedTime, startTime, activeRestTimers, updateRestTimerElapsed } = useWorkoutStore();
  
  React.useEffect(() => {
    if (!document || !isActive) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        if (startTime) {
          const storedStartTime = new Date(startTime);
          const currentTime = new Date();
          const calculatedElapsedTime = Math.floor(
            (currentTime.getTime() - storedStartTime.getTime()) / 1000
          );
          
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
