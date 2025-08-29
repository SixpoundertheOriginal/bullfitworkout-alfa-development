
/**
 * Enhanced workout types - single source of truth for all workout-related interfaces
 * This file consolidates all duplicate type definitions across the codebase
 */

import { Exercise } from './exercise';

// Core exercise set interface - lightweight version for workout state
export interface ExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
  isWarmup?: boolean;
  failurePoint?: 'none' | 'technical' | 'muscular';
  formScore?: number;
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

// Enhanced workout data for history display
export interface EnhancedWorkoutData {
  id: string;
  name: string;
  date: string;
  start_time: string;
  training_type: string;
  duration: number;
  exerciseCount: number;
  totalVolume: number;
  trainingType: string;
  badges: WorkoutBadge[];
  metrics: EnhancedWorkoutMetrics;
  quality: WorkoutQualityIndicators;
  exercises: ExercisePreview[];
  exercisePreview: ExercisePreview[];
}

// Enhanced workout metrics
export interface EnhancedWorkoutMetrics {
  tonnage: number;
  density: number;
  intensity: number;
  efficiency: number;
  volumeLoad: number;
  averageRestTime: number;
  totalVolume: number;
  totalSets: number;
  avgWeight?: number;
  maxWeight?: number;
  totalReps?: number;
  completionRate?: number;
  exerciseVariety?: number;
  workoutDensity?: number;
}

// Workout quality indicators
export interface WorkoutQualityIndicators {
  consistency: number;
  progression: number;
  balance: number;
  recovery: number;
  overall: 'excellent' | 'good' | 'average' | 'needs-improvement' | 'poor';
  hasIncompleteData: boolean;
  badges: WorkoutBadge[];
  qualityScore: number;
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs-improvement' | 'poor';
  isComplete: boolean;
}

// Workout badges
export interface WorkoutBadge {
  id: string;
  type: 'achievement' | 'milestone' | 'streak' | 'pr' | 'incomplete' | 'progress';
  title: string;
  description: string;
  icon: string;
  color: string;
  label?: string;
}

// Exercise preview for workout cards
export interface ExercisePreview {
  name: string;
  sets: number;
  reps: number[];
  weight: number[];
  weights?: number[];
  volume: number;
}

// Workout management filters
export interface WorkoutManagementFilters {
  dateRange: {
    start: Date;
    end: Date;
    from: Date;
    to: Date;
  };
  trainingTypes: string[];
  qualityLevels: string[];
  sortBy: 'date' | 'duration' | 'volume' | 'quality';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}
