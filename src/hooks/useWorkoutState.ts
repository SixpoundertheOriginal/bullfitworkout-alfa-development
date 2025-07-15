import { useState, useEffect } from 'react';
import { Storage } from '@/utils/storage';
import { WorkoutStatus, WorkoutError } from '@/types/workout';
import { TrainingConfig } from './useTrainingSetupPersistence';
import { toast } from "@/hooks/use-toast";

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

// Storage key for workout session
const WORKOUT_STORAGE_KEY = 'workout_in_progress';

// Create a global variable to track if storage was already initialized
// This prevents double initialization on component mounts
let storageInitialized = false;

export function useWorkoutState() {
  // Core workout state
  const [exercises, setExercises] = useState<WorkoutExercises>({});
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [workoutStatus, setWorkoutStatus] = useState<WorkoutStatus>('idle');
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<WorkoutError | null>(null);
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig | null>(null);
  
  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerResetSignal, setRestTimerResetSignal] = useState(0);
  const [currentRestTime, setCurrentRestTime] = useState(60);
  
  // Session activity tracking
  const [isActive, setIsActive] = useState(false);
  const [lastActiveRoute, setLastActiveRoute] = useState<string | null>('/training-session');
  const [lastPersistedTime, setLastPersistedTime] = useState<number>(Date.now());
  
  // New fields for better persistence
  const [sessionId, setSessionId] = useState<string>(() => 
    crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`
  );
  const [lastTabActivity, setLastTabActivity] = useState<number>(Date.now());
  const [explicitlyEnded, setExplicitlyEnded] = useState<boolean>(false);
  
  // Debug helper
  const logDebug = (message: string, data?: any) => {
    console.log(`[WorkoutState] ${message}`, data || '');
  };

  // Load workout state from local storage on component mount
  useEffect(() => {
    if (storageInitialized) {
      logDebug("Storage already initialized, skipping");
      return;
    }
    
    const savedState = Storage.get(WORKOUT_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        logDebug('Loading workout state from storage:', parsedState);
        
        // Step 1: Check if we have an explicitly ended workout
        if (parsedState.explicitlyEnded) {
          logDebug('Workout was explicitly ended, clearing storage');
          Storage.remove(WORKOUT_STORAGE_KEY);
          storageInitialized = true;
          return;
        }

        // Step 2: First load essential state that other calculations depend on
        if (parsedState.isActive !== undefined) setIsActive(parsedState.isActive);
        if (parsedState.sessionId) setSessionId(parsedState.sessionId);
        if (parsedState.workoutStatus) setWorkoutStatus(parsedState.workoutStatus);
        if (parsedState.workoutId) setWorkoutId(parsedState.workoutId);
        
        // Step 3: Load exercises with proper normalization
        if (parsedState.exercises) {
          const normalizedExercises: WorkoutExercises = {};
          Object.entries(parsedState.exercises).forEach(([name, sets]) => {
            normalizedExercises[name] = (sets as any[]).map(set => ({
              ...set,
              isEditing: false // Always reset editing state on reload
            }));
          });
          setExercises(normalizedExercises);
        }
        
        // Step 4: Load additional state
        if (parsedState.activeExercise) setActiveExercise(parsedState.activeExercise);
        if (parsedState.trainingConfig) setTrainingConfig(parsedState.trainingConfig);
        if (parsedState.lastActiveRoute) setLastActiveRoute(parsedState.lastActiveRoute);
        if (parsedState.restTimerActive !== undefined) setRestTimerActive(parsedState.restTimerActive);
        if (parsedState.currentRestTime !== undefined) setCurrentRestTime(parsedState.currentRestTime);
        if (parsedState.lastPersistedTime) setLastPersistedTime(parsedState.lastPersistedTime);
        if (parsedState.lastTabActivity) setLastTabActivity(parsedState.lastTabActivity);
        
        // Step 5: Handle time tracking with start time
        if (parsedState.startTime) {
          const storedStartTime = new Date(parsedState.startTime);
          setStartTime(storedStartTime);
          
          // Calculate elapsed time based on stored start time if workout is active
          if (parsedState.isActive && !parsedState.explicitlyEnded) {
            const storedElapsedTime = parsedState.elapsedTime || 0;
            const timeSinceLastActive = Math.floor((Date.now() - parsedState.lastTabActivity) / 1000);
            
            const calculatedElapsedTime = storedElapsedTime + timeSinceLastActive;
            logDebug(`Restored elapsed time: ${calculatedElapsedTime}s (stored: ${storedElapsedTime}s, added: ${timeSinceLastActive}s)`);
            setElapsedTime(calculatedElapsedTime);
          } else {
            setElapsedTime(parsedState.elapsedTime || 0);
          }
        } else if (parsedState.elapsedTime !== undefined) {
          setElapsedTime(parsedState.elapsedTime);
        }
        
        // Step 6: Determine if workout should be active based on multiple indicators
        const hasExercises = parsedState.exercises && Object.keys(parsedState.exercises).length > 0;
        const wasActive = parsedState.isActive === true;
        const notSaved = parsedState.workoutStatus !== 'saved';
        const notExplicitlyEnded = !parsedState.explicitlyEnded;
        
        // Only set a workout as active if all conditions are met
        const shouldBeActive = hasExercises && notSaved && wasActive && notExplicitlyEnded;
        
        logDebug(`Determining workout active state: hasExercises=${hasExercises}, wasActive=${wasActive}, `+
                `notSaved=${notSaved}, notExplicitlyEnded=${notExplicitlyEnded}, shouldBeActive=${shouldBeActive}`);
        
        if (shouldBeActive !== isActive) {
          setIsActive(shouldBeActive);
        }
        
        // If workout was recovered and is active, show a toast
        if (shouldBeActive && wasActive) {
          // Slight delay to ensure UI is rendered
          setTimeout(() => {
            toast.info("Workout session recovered");
          }, 1000);
        }
        
      } catch (error) {
        logDebug('Error parsing saved workout state:', error);
        // Don't clear storage here - let the user try to recover
      }
    }
    
    storageInitialized = true;
  }, []);

  // Set up page visibility event listener for tab switching
  useEffect(() => {
    if (!document) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logDebug('Tab became visible, checking for state updates');
        
        // Reload from storage in case another tab modified the state
        const savedState = Storage.get(WORKOUT_STORAGE_KEY);
        if (savedState && isActive) {
          try {
            const parsedState = JSON.parse(savedState);
            
            // Only update if it's the same session ID to prevent conflicts
            if (parsedState.sessionId === sessionId) {
              logDebug('Refreshing state from storage after tab switch');
              
              // Update elapsed time for active workouts
              if (parsedState.isActive && parsedState.elapsedTime) {
                const storedTime = parsedState.elapsedTime;
                const timeSinceStorage = Math.floor((Date.now() - parsedState.lastTabActivity) / 1000);
                const newElapsedTime = storedTime + (isActive ? timeSinceStorage : 0);
                
                logDebug(`Updating elapsed time after tab switch: ${storedTime} + ${timeSinceStorage} = ${newElapsedTime}`);
                setElapsedTime(newElapsedTime);
              }
            }
          } catch (error) {
            logDebug('Error parsing state after tab switch:', error);
          }
        }
        
        // Update last activity time
        setLastTabActivity(Date.now());
      } else if (document.visibilityState === 'hidden' && isActive) {
        logDebug('Tab hidden, persisting current state');
        
        // Force a state persistence when the tab becomes hidden
        persistWorkoutState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, sessionId]);

  // Helper function to persist workout state
  const persistWorkoutState = () => {
    const currentTime = Date.now();
    
    // Check if we should persist based on activity state
    if (workoutStatus === 'saved' || explicitlyEnded) {
      Storage.remove(WORKOUT_STORAGE_KEY);
      logDebug('Workout data cleared from storage (saved or explicitly ended)');
      return;
    }
    
    // Persist if there's an active session or exercise data
    if (isActive || Object.keys(exercises).length > 0) {
      const stateToSave = {
        exercises,
        activeExercise,
        elapsedTime,
        workoutId,
        startTime,
        workoutStatus,
        trainingConfig,
        isActive,
        lastActiveRoute,
        restTimerActive,
        currentRestTime,
        lastPersistedTime: currentTime,
        lastTabActivity: currentTime,
        sessionId,
        explicitlyEnded
      };
      
      Storage.set(WORKOUT_STORAGE_KEY, JSON.stringify(stateToSave));
      setLastPersistedTime(currentTime);
      setLastTabActivity(currentTime);
      logDebug('Workout state persisted to storage');
    }
  };

  // Persist workout state whenever relevant state changes
  useEffect(() => {
    persistWorkoutState();
  }, [
    exercises, activeExercise, elapsedTime, workoutId, 
    workoutStatus, trainingConfig, isActive, lastActiveRoute,
    restTimerActive, currentRestTime, startTime, explicitlyEnded
  ]);

  // Update time periodically for persistence during active workouts
  useEffect(() => {
    if (isActive) {
      const persistInterval = setInterval(() => {
        persistWorkoutState();
      }, 5000); // Update persistence more frequently (every 5 seconds)
      
      return () => clearInterval(persistInterval);
    }
  }, [isActive]);

  // Explicit actions to start/end workout with clear state transitions
  const startWorkout = () => {
    const now = new Date();
    setIsActive(true);
    setExplicitlyEnded(false);
    setWorkoutStatus('active');
    setStartTime(now);
    setElapsedTime(0);
    setSessionId(crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`);
    logDebug("Workout explicitly started at", now);
    persistWorkoutState();
  };

  const endWorkout = () => {
    setIsActive(false);
    setExplicitlyEnded(true);
    setWorkoutStatus('idle');
    logDebug("Workout explicitly ended");
    persistWorkoutState();
    
    // Remove from storage with small delay to ensure state is updated
    setTimeout(() => {
      Storage.remove(WORKOUT_STORAGE_KEY);
    }, 100);
  };

  // Reset the entire workout session
  const resetSession = () => {
    setExercises({});
    setActiveExercise(null);
    setElapsedTime(0);
    setWorkoutId(null);
    setWorkoutStatus('idle');
    setErrorDetails(null);
    setSaveProgress(0);
    setRecoveryAttempted(false);
    setRestTimerActive(false);
    setCurrentRestTime(60);
    setTrainingConfig(null);
    setIsActive(false);
    setExplicitlyEnded(true);
    setLastActiveRoute('/training-session');
    setStartTime(new Date());
    
    // Generate a new session ID for next workout
    setSessionId(crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`);
    
    Storage.remove(WORKOUT_STORAGE_KEY);
    logDebug("Workout session reset completely");
  };

  // Update the last active route for better navigation state
  const updateLastActiveRoute = (route: string) => {
    setLastActiveRoute(route);
    logDebug("Last active route updated:", route);
    persistWorkoutState();
  };

  // Status management functions
  const markAsSaving = () => {
    setWorkoutStatus('saving');
    setSaveProgress(10);
    persistWorkoutState();
  };

  const markAsPartialSave = () => {
    setWorkoutStatus('partial');
    setSaveProgress(50);
    persistWorkoutState();
  };

  const markAsFailed = (error: WorkoutError) => {
    setWorkoutStatus('failed');
    setErrorDetails(error);
    setSaveProgress(0);
    persistWorkoutState();
  };

  const markAsSaved = () => {
    setWorkoutStatus('saved');
    setSaveProgress(100);
    setIsActive(false);
    setExplicitlyEnded(true);
    
    // Important: Clear storage immediately
    Storage.remove(WORKOUT_STORAGE_KEY);
    
    // Show success notification
    toast.success("Workout saved successfully!");
    
    logDebug("Workout marked as saved and storage cleared");
    
    // Reset the session state after a short delay
    setTimeout(() => {
      resetSession();
    }, 500);
  };

  // Recovery features
  const attemptRecovery = async () => {
    if (recoveryAttempted) {
      logDebug('Recovery already attempted');
      return;
    }
    
    setRecoveryAttempted(true);
    setWorkoutStatus('saving');
    setSaveProgress(5);
    persistWorkoutState();
    
    // Simplified recovery logic for now
    logDebug('Attempting to recover workout', workoutId);
    
    setTimeout(() => {
      setWorkoutStatus('saved');
      setSaveProgress(100);
      setIsActive(false);
      setExplicitlyEnded(true);
      
      // Reset session after recovery
      resetSession();
    }, 2000);
  };

  // Rest timer management
  const triggerRestTimerReset = () => {
    setRestTimerResetSignal(prev => prev + 1);
  };

  // Exercise and set management functions
  const handleCompleteSet = (exerciseName: string, setIndex: number) => {
    setExercises(prev => {
      const newExercises = { ...prev };
      newExercises[exerciseName] = prev[exerciseName].map((set, i) => 
        i === setIndex ? { ...set, completed: true } : set
      );
      return newExercises;
    });
    
    // Automatically show rest timer
    setRestTimerActive(true);
    triggerRestTimerReset();
    persistWorkoutState();
  };

  const deleteExercise = (exerciseName: string) => {
    setExercises(prev => {
      const newExercises = { ...prev };
      delete newExercises[exerciseName];
      return newExercises;
    });
    toast.success(`Removed ${exerciseName} from workout`);
    
    // Check if this was the last exercise, and if so, ask if user wants to end workout
    setTimeout(() => {
      const exerciseCount = Object.keys(exercises).length;
      if (exerciseCount <= 1) {
        toast.info("No exercises left. Add exercises or end your workout.", {
          action: {
            label: "End Workout",
            onClick: () => {
              endWorkout();
              toast.success("Workout ended");
            }
          }
        });
      }
    }, 500);
    
    persistWorkoutState();
  };

  // Expose all state and actions
  return {
    // Core state
    exercises,
    setExercises,
    activeExercise,
    setActiveExercise,
    elapsedTime,
    setElapsedTime,
    workoutId,
    setWorkoutId,
    startTime,
    setStartTime,
    
    // Session management
    resetSession,
    workoutStatus,
    saveProgress,
    errorDetails,
    attemptRecovery,
    recoveryAttempted,
    
    // Status management
    markAsSaving,
    markAsPartialSave,
    markAsSaved,
    markAsFailed,
    
    // Configuration
    trainingConfig,
    setTrainingConfig,
    
    // Rest timer
    restTimerActive,
    setRestTimerActive,
    restTimerResetSignal,
    triggerRestTimerReset,
    currentRestTime,
    setCurrentRestTime,
    
    // Exercise management
    handleCompleteSet,
    deleteExercise,
    
    // Session control (clear active indicators)
    isActive,
    setIsActive,
    startWorkout,
    endWorkout,
    
    // Navigation
    lastActiveRoute,
    updateLastActiveRoute,
    
    // New persistent tracking
    sessionId,
    explicitlyEnded,
    setExplicitlyEnded,
    
    // Helper for consumers
    persistWorkoutState
  };
}
