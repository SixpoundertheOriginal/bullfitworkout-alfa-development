import { useMemo } from 'react';
import { useOptimizedWorkoutStats } from './useOptimizedWorkoutStats';
import { useProcessWorkoutMetrics } from './useProcessWorkoutMetrics';
import { useAIWorkoutRecommendations } from './useAIWorkoutRecommendations';
import { useWeightUnit } from '@/context/WeightUnitContext';

// Custom hook for parallel overview data loading with optimized performance
export function useParallelOverviewData() {
  const { weightUnit } = useWeightUnit();
  
  // All hooks run in parallel automatically due to React's concurrent execution
  const { stats, workouts, loading: statsLoading, refetch } = useOptimizedWorkoutStats();
  const processedMetrics = useProcessWorkoutMetrics(workouts, weightUnit);
  const { insights, generateWorkoutInsights, loading: insightsLoading } = useAIWorkoutRecommendations();

  // Memoized data extraction for performance
  const memoizedData = useMemo(() => ({
    // Core metrics
    volumeOverTimeData: processedMetrics.volumeOverTimeData || [],
    densityOverTimeData: processedMetrics.densityOverTimeData || [],
    densityStats: processedMetrics.densityStats,
    
    // Calculated efficiency score
    efficiencyScore: processedMetrics.processedMetrics?.efficiencyMetrics?.efficiencyScore || 0,
    
    // Data availability flags
    hasVolumeData: processedMetrics.hasVolumeData || false,
    hasDensityData: processedMetrics.hasDensityData || false,
    hasWorkoutData: workouts.length > 0,
    
    // Chart data with fallbacks
    chartData: {
      workoutTypes: stats.workoutTypes || [],
      muscleFocus: stats.muscleFocus || {},
      timePatterns: stats.timePatterns || {
        daysFrequency: {},
        durationByTimeOfDay: {}
      },
      exerciseVolumeHistory: stats.exerciseVolumeHistory || []
    }
  }), [
    processedMetrics.volumeOverTimeData,
    processedMetrics.densityOverTimeData,
    processedMetrics.densityStats,
    processedMetrics.processedMetrics,
    processedMetrics.hasVolumeData,
    processedMetrics.hasDensityData,
    workouts.length,
    stats.workoutTypes,
    stats.muscleFocus,
    stats.timePatterns,
    stats.exerciseVolumeHistory
  ]);

  return {
    // Core data
    stats,
    workouts,
    insights,
    processedMetrics,
    
    // Extracted memoized data
    ...memoizedData,
    
    // Loading states
    loading: statsLoading,
    insightsLoading,
    
    // Actions
    refetch,
    generateWorkoutInsights
  };
}