
/**
 * Enhanced workout types - single source of truth for all workout-related interfaces
 * This file consolidates all duplicate type definitions across the codebase
 */

import { Exercise } from './exercise';

// Core exercise set interface - replaces all duplicate definitions
export interface ExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
  // Enhanced timing metadata
  metadata?: {
    startTime?: string;
    endTime?: string;
    actualRestTime?: number;
    exerciseTransitionTime?: number;
    [key: string]: any;
  };
}

// Enhanced exercise configuration with variant data
export interface WorkoutExerciseConfig {
  name: string;
  sets: ExerciseSet[];
  // Optional variant data for enhanced display
  exercise?: Exercise;
  variant?: {
    gripType?: string;
    technique?: string;
    primaryModifier?: string;
  };
}

// Support both legacy string-based and new object-based exercises
export interface WorkoutExercises {
  [key: string]: ExerciseSet[] | WorkoutExerciseConfig;
}

// Workout status types
export type WorkoutStatus = 
  | 'idle'
  | 'active'
  | 'saving'
  | 'saved'
  | 'failed'
  | 'partial'
  | 'recovering';

// Error handling
export interface WorkoutError {
  type: 'network' | 'database' | 'validation' | 'unknown';
  message: string;
  timestamp: string;
  recoverable: boolean;
}

// Rest timer state management
export interface RestTimerState {
  isActive: boolean;
  targetTime: number;
  startTime: number;
  elapsedTime: number;
  isCompleted: boolean;
  isOvertime: boolean;
}

// Training configuration
export interface TrainingConfig {
  trainingType: string;
  tags: string[];
  duration: number;
  rankedExercises?: {
    recommended: Exercise[];
    other: Exercise[];
    matchData: Record<string, { score: number, reasons: string[] }>;
  };
  timeOfDay?: string;
  intensity?: number;
  lastUpdated?: string;
}

// Workout completion data
export interface WorkoutCompletionData {
  exercises: Record<string, ExerciseSet[]>;
  duration: number;
  intensity: number;
  efficiency: number;
  totalVolume: number;
  averageRestTime: number;
  completedSets: number;
  totalSets: number;
}

// Session analytics
export interface WorkoutSessionAnalytics {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  averageIntensity: number;
  restPeriods: number[];
  muscleGroupsTargeted: string[];
}
