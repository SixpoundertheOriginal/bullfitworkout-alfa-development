
import { WorkoutSession, ExerciseSet } from '@/types/workout';

export interface EnhancedWorkoutMetrics {
  totalVolume: number;
  avgWeight: number;
  maxWeight: number;
  totalReps: number;
  totalSets: number;
  completionRate: number;
  exerciseVariety: number;
  workoutDensity: number; // kg/min
  estimatedCalories?: number;
}

export interface WorkoutQualityIndicators {
  isComplete: boolean;
  hasIncompleteData: boolean;
  qualityScore: number; // 0-100
  performanceLevel: 'poor' | 'average' | 'good' | 'excellent';
  badges: WorkoutBadge[];
}

export interface WorkoutBadge {
  type: 'pr' | 'progress' | 'consistent' | 'volume' | 'intensity' | 'incomplete';
  label: string;
  color: string;
  icon: string;
}

export interface EnhancedWorkoutData extends WorkoutSession {
  metrics: EnhancedWorkoutMetrics;
  quality: WorkoutQualityIndicators;
  exercisePreview: ExercisePreview[];
  previousSession?: WorkoutSession;
  nextSession?: WorkoutSession;
}

export interface ExercisePreview {
  name: string;
  sets: number;
  reps: number[];
  weights: number[];
  isPersonalRecord?: boolean;
  progressIndicator?: 'up' | 'down' | 'same';
}

export interface WorkoutComparisonData {
  current: EnhancedWorkoutData;
  previous?: EnhancedWorkoutData;
  improvements: {
    volume: number;
    strength: number;
    endurance: number;
  };
}

export interface WorkoutManagementFilters {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  trainingTypes: string[];
  qualityLevels: string[];
  searchQuery: string;
  sortBy: 'date' | 'duration' | 'volume' | 'quality';
  sortOrder: 'asc' | 'desc';
}
