// Minimal type definitions for Overview data unification
import { WorkoutStats } from '@/types/workout-metrics';
import { ProcessedWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

export interface UnifiedOverviewData {
  // Core stats from existing patterns
  stats: WorkoutStats;
  workouts: any[];
  processedMetrics: ProcessedWorkoutMetrics | null;
  
  // Unified data aggregations
  volumeOverTimeData: Array<{ date: string; volume: number }>;
  densityOverTimeData: Array<{ date: string; density: number }>;
  
  // Chart data consistency
  chartData: {
    workoutTypes: WorkoutStats['workoutTypes'];
    muscleFocus: Record<string, number>;
    timePatterns: WorkoutStats['timePatterns'];
    exerciseVolumeHistory: WorkoutStats['exerciseVolumeHistory'];
  };
  
  // Derived metrics for consistency
  hasVolumeData: boolean;
  hasDensityData: boolean;
  hasWorkoutData: boolean;
  efficiencyScore: number;
  densityStats: any;
}

export interface DateRange {
  from: Date;
  to?: Date;
}

// Simple error wrapper for service layer
export class ServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ServiceError';
  }
}