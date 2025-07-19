
import { ProcessedWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

export interface WorkoutMetrics {
  time: number;
  exerciseCount: number;
  completedSets: number;
  totalSets: number;
  performance: {
    volume: number;
    intensity: number;
    density: number;
    efficiency: number;
  };
}

export interface SetMetrics {
  rpe?: number;
  status: 'completed' | 'failed' | 'partial';
  notes?: string;
}

export interface WorkoutPerformanceMetrics {
  totalVolume: number;
  averageRpe: number;
  setCompletionRate: number;
  metrics: Record<string, any>;
}

// Extended interface for backward compatibility
export interface WorkoutStats {
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalDuration: number;
  avgDuration: number;
  workoutTypes: WorkoutTypeStats[];
  recommendedType?: string;
  recommendedDuration?: number;
  recommendedTags?: string[];
  tags?: { name: string; count: number }[];
  progressMetrics?: {
    volumeChangePercentage: number;
    strengthTrend: 'increasing' | 'decreasing' | 'stable';
    consistencyScore: number;
  };
  streakDays?: number;
  workouts?: any[];
  // Add missing properties from InsightsDashboard component
  timePatterns?: {
    daysFrequency: Record<string, number>;
    durationByTimeOfDay: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
  };
  muscleFocus?: Record<string, number>;
  exerciseVolumeHistory?: TopExerciseStats[];
  lastWorkoutDate?: string;
  efficiency?: number;
  density?: number;
  intensity?: number;
  totalVolume?: number;
}

// Updated TopExerciseStats interface to include trend properties
export interface TopExerciseStats {
  exerciseName: string;
  totalVolume: number;
  totalSets: number;
  averageWeight: number;
  trend?: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange?: number;
}

// Export the WorkoutTypeStats interface needed by the WorkoutTypeChart
export interface WorkoutTypeStats {
  type: string;
  count: number;
  percentage: number;
}

// Export the new centralized metrics type to support transition
export type { ProcessedWorkoutMetrics };

// For backward compatibility
export interface WorkoutStatsResult extends ProcessedWorkoutMetrics {
  stats: WorkoutStats;
  loading: boolean;
  refetch: () => void;
  workouts?: any[];
}
