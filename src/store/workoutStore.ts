
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrainingConfig } from '@/hooks/useTrainingSetupPersistence';
import { toast } from "@/hooks/use-toast";
import React from 'react';

export interface ExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
}

export interface WorkoutExercises {
  [key: string]: ExerciseSet[];
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
}

// Generate a unique session ID
const generateSessionId = () => 
  crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;

// Create the persistent store
export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      // Core workout data
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
        exercises: typeof exercises === 'function' ? exercises(state.exercises) : exercises,
        lastTabActivity: Date.now(),
      })),
      
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
      
      // Fixed: This function was causing infinite loops by updating on every call
      // Now we check if the route is actually different before updating state
      updateLastActiveRoute: (route) => set((state) => {
        // Only update if the route has actually changed
        if (state.lastActiveRoute !== route) {
          return { 
            lastActiveRoute: route,
            lastTabActivity: Date.now(),
          };
        }
        return {}; // Return empty object if no changes needed
      }),
      
      // New action to directly modify workout status
      setWorkoutStatus: (status) => set({ 
        workoutStatus: status,
        lastTabActivity: Date.now(),
      }),
      
      // Rest timer management
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
      
      // Workout lifecycle actions
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
        
        // Show a toast notification
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
      
      // Status management
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
        
        // Show success notification
        toast.success("Workout saved successfully!");
        
        // Reset the session after a short delay
        setTimeout(() => {
          get().resetSession();
        }, 500);
      },
      
      markAsFailed: (error) => set((state) => ({ 
        workoutStatus: 'failed',
        savingErrors: [...state.savingErrors, error],
        lastTabActivity: Date.now(),
      })),
      
      // Exercise management
      handleCompleteSet: (exerciseName, setIndex) => set((state) => {
        const newExercises = { ...state.exercises };
        newExercises[exerciseName] = state.exercises[exerciseName].map((set, i) => 
          i === setIndex ? { ...set, completed: true } : set
        );
        
        return { 
          exercises: newExercises,
          lastTabActivity: Date.now(),
        };
      }),
      
      deleteExercise: (exerciseName) => set((state) => {
        const newExercises = { ...state.exercises };
        delete newExercises[exerciseName];
        
        // Show notification
        toast.success(`Removed ${exerciseName} from workout`);
        
        // Check if this was the last exercise, and if so, ask if user wants to end workout
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
        // Only persist these specific parts of the state
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
        // Convert Map to array for serialization
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
            
            // Restore rest timers from serialized format IMMEDIATELY
            if (rehydratedState.activeRestTimers && Array.isArray(rehydratedState.activeRestTimers)) {
              const timersArray = rehydratedState.activeRestTimers as [string, RestTimerState][];
              rehydratedState.activeRestTimers = new Map(timersArray) as any;
            } else {
              // Ensure activeRestTimers is always a Map
              rehydratedState.activeRestTimers = new Map() as any;
            }
          }
          
          if (rehydratedState && rehydratedState.isActive) {
            
            // Update elapsed time based on stored start time for active workouts
            if (rehydratedState.isActive && rehydratedState.startTime) {
              const storedStartTime = new Date(rehydratedState.startTime);
              const currentTime = new Date();
              const calculatedElapsedTime = Math.floor(
                (currentTime.getTime() - storedStartTime.getTime()) / 1000
              );
              
              // Only update if calculated time is greater than stored time
              if (calculatedElapsedTime > (rehydratedState.elapsedTime || 0)) {
                setTimeout(() => {
                  // Using the Zustand store's set function through the get() method
                  const store = useWorkoutStore.getState();
                  store.setElapsedTime(calculatedElapsedTime);
                  console.log(`Restored elapsed time: ${calculatedElapsedTime}s`);
                }, 100);
              }
              
              // Show recovery notification
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

// Create a hook for handling page visibility changes
export const useWorkoutPageVisibility = () => {
  const { isActive, setElapsedTime, startTime, activeRestTimers, updateRestTimerElapsed } = useWorkoutStore();
  
  React.useEffect(() => {
    if (!document || !isActive) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        // When tab becomes visible again, update elapsed time
        if (startTime) {
          const storedStartTime = new Date(startTime);
          const currentTime = new Date();
          const calculatedElapsedTime = Math.floor(
            (currentTime.getTime() - storedStartTime.getTime()) / 1000
          );
          
          setElapsedTime(calculatedElapsedTime);
          console.log(`Updated elapsed time after tab switch: ${calculatedElapsedTime}s`);
        }
        
        // Update all active rest timers
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
