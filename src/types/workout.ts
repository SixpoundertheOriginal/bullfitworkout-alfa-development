
export type WorkoutStatus = 
  | 'idle'        // Initial state
  | 'active'      // Workout in progress
  | 'saving'      // Saving in progress
  | 'saved'       // Successfully saved
  | 'failed'      // Save failed
  | 'partial'     // Partially saved
  | 'recovering'; // Attempting recovery

// Export types from Supabase for compatibility
export type WorkoutSession = {
  id: string;
  name: string;
  training_type: string;
  start_time: string;
  end_time: string;
  duration: number;
  user_id: string;
  notes?: string | null;
  is_historical?: boolean | null;
  logged_at?: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type ExerciseSet = {
  id: string;
  workout_id: string;
  exercise_name: string;
  exercise_id?: string | null;
  weight: number;
  reps: number;
  completed: boolean;
  set_number: number;
  rest_time?: number | null;
  is_warmup?: boolean | null;
  rpe?: number | null;
  variant_id?: string | null;
  tempo?: string | null;
  range_of_motion?: string | null;
  added_weight?: number | null;
  assistance_used?: number | null;
  notes?: string | null;
  created_at: string;
  failure_point?: 'none' | 'technical' | 'muscular' | null;
  form_score?: number | null;
};

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
  isWarmup?: boolean;
  saveStatus?: 'pending' | 'saving' | 'saved' | 'failed';
  retryCount?: number;
  rpe?: number | null;
  variant_id?: string | null;
  tempo?: string | null;
  range_of_motion?: string | null;
  added_weight?: number | null;
  assistance_used?: number | null;
  notes?: string | null;
  failurePoint?: 'none' | 'technical' | 'muscular' | null;
  formScore?: number | null;
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
