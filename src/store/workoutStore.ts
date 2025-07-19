import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrainingConfig } from '@/hooks/useTrainingSetupPersistence';
import { Exercise } from '@/types/exercise';
import { toast } from "@/hooks/use-toast";
import React from 'react';

export interface ExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
}

// Enhanced exercise configuration with variant data
export interface WorkoutExerciseConfig {
  name: string;
  sets: ExerciseSet[];
  // Optional variant data for enhanced display
  exercise?: Exercise; // Full exercise object from library
  variant?: {
    gripType?: string;
    technique?: string;
    primaryModifier?: string; // "Wide Grip", "Explosive", etc.
  };
}

// Support both legacy string-based and new object-based exercises
export interface WorkoutExercises {
  [key: string]: ExerciseSet[] | WorkoutExerciseConfig;
}

export type WorkoutStatus = 
  | 'idle'        // Initial state
  | 'active'      // Workout in progress
  | 'saving'      // Saving in progress
  | 'saved'       // Successfully saved
  | 'failed'      // Save failed
  | 'partial'     // Partially saved
  | 'recovering'; // Attempting recovery

export interface WorkoutError {
  type: 'network' | 'database' | 'validation' | 'unknown';
  message: string;
  timestamp: string;
  recoverable: boolean;
}

export interface RestTimerState {
  isActive: boolean;
  targetTime: number;
  startTime: number;
  elapsedTime: number;
  isCompleted: boolean;
  isOvertime: boolean;
}

export interface WorkoutState {
  // Core workout data
  exercises: WorkoutExercises;
  activeExercise: string | null;
  elapsedTime: number;
  workoutId: string | null;
  startTime: string | null;
  workoutStatus: WorkoutStatus;
  
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
  
  // Action functions
  setExercises: (exercises: WorkoutExercises | ((prev: WorkoutExercises) => WorkoutExercises)) => void;
  addEnhancedExercise: (exercise: Exercise | string, sets?: ExerciseSet[]) => void;
  setActiveExercise: (exerciseName: string | null) => void;
  setElapsedTime: (time: number | ((prev: number) => number)) => void;
  setTrainingConfig: (config: TrainingConfig | null) => void;
  updateLastActiveRoute: (route: string) => void;
  setWorkoutStatus: (status: WorkoutStatus) => void;
  
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
      
      // Action setters
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
          explicitlyEnded: true,
          sessionId: generateSessionId(),
          lastTabActivity: Date.now(),
          savingErrors: [],
        });
        console.log("Workout session reset");
      },
      
      markAsSaving: () => set({ 
        workoutStatus: 'saving',
        lastTabActivity: Date.now(),
      }),
      
      markAsSaved: () => {
        set({ 
          workoutStatus: 'saved',
          isActive: false,
          explicitlyEnded: true,
          lastTabActivity: Date.now(),
        });
        
        toast.success("Workout saved successfully!");
        
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
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        exercises: state.exercises,
        activeExercise: state.activeExercise,
        elapsedTime: state.elapsedTime,
        workoutId: state.workoutId,
        startTime: state.startTime,
        workoutStatus: state.workoutStatus,
        trainingConfig: state.trainingConfig,
        isActive: state.isActive,
        lastActiveRoute: state.lastActiveRoute,
        sessionId: state.sessionId,
        explicitlyEnded: state.explicitlyEnded,
        activeRestTimers: Array.from(state.activeRestTimers.entries()) as any,
      }),
      onRehydrateStorage: () => {
        return (rehydratedState, error) => {
          if (error) {
            console.error('Error rehydrating workout state:', error);
            return;
          }
          
          if (rehydratedState) {
            console.log('Rehydrated workout state:', rehydratedState);
            
            // Restore rest timers from serialized format
            if (rehydratedState.activeRestTimers && Array.isArray(rehydratedState.activeRestTimers)) {
              const timersArray = rehydratedState.activeRestTimers as [string, RestTimerState][];
              rehydratedState.activeRestTimers = new Map(timersArray) as any;
            } else {
              rehydratedState.activeRestTimers = new Map() as any;
            }
            
            // Normalize exercise data format
            if (rehydratedState.exercises) {
              rehydratedState.exercises = normalizeExerciseData(rehydratedState.exercises);
            }
          }
          
          if (rehydratedState && rehydratedState.isActive) {
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
                  console.log(`Restored elapsed time: ${calculatedElapsedTime}s`);
                }, 100);
              }
              
              setTimeout(() => {
                toast.info("Workout session recovered");
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
