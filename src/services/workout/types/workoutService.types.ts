import { EnhancedExerciseSet, WorkoutError, SaveProgress } from '@/types/workout';

export interface SaveWorkoutParams {
  userData: {
    id: string;
    [key: string]: any;
  };
  workoutData: {
    name: string;
    training_type: string;
    start_time: string;
    end_time: string;
    duration: number;
    notes: string | null;
    metadata: any;
  };
  exercises: Record<string, EnhancedExerciseSet[]>;
  onProgressUpdate?: (progress: SaveProgress) => void;
}

export interface SaveResult {
  success: boolean;
  workoutId?: string;
  error?: WorkoutError;
  partialSave?: boolean;
}

export interface WorkoutUpdateData {
  name?: string;
  training_type?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  notes?: string | null;
}

export interface WorkoutBulkUpdateData {
  name?: string;
  training_type?: string;
  notes?: string | null;
}
