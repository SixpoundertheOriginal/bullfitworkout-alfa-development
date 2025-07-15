
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
  details?: any;
  timestamp: string;
  recoverable: boolean;
}

export interface SaveProgress {
  step: 'workout' | 'exercise-sets' | 'analytics';
  total: number;
  completed: number;
  errors: WorkoutError[];
}

// Extending the existing LocalExerciseSet type
export interface EnhancedExerciseSet {
  id?: string;
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
  saveStatus?: 'pending' | 'saving' | 'saved' | 'failed';
  retryCount?: number;
}

export interface WorkoutState {
  exercises: Record<string, EnhancedExerciseSet[]>;
  activeExercise: string | null;
  elapsedTime: number;
  restTimerActive: boolean;
  restTimerResetSignal: number;
  currentRestTime: number;
  workoutStatus: WorkoutStatus;
  saveProgress?: SaveProgress;
  savingErrors: WorkoutError[];
  lastSyncTimestamp?: string;
  workoutId?: string | null;
  isRecoveryMode: boolean;
  trainingConfig: {
    trainingType: string;
    tags: string[];
    duration: number;
    rankedExercises?: {
      recommended: any[];
      other: any[];
      matchData: Record<string, { score: number, reasons: string[] }>;
    };
    timeOfDay?: string;
    intensity?: number;
  } | null;
}
