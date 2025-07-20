
import { useState, useEffect, useMemo } from 'react';
import { useWorkoutHistory, WorkoutHistoryFilters } from '@/hooks/useWorkoutHistory';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  EnhancedWorkoutData, 
  EnhancedWorkoutMetrics, 
  WorkoutQualityIndicators,
  WorkoutBadge,
  ExercisePreview,
  WorkoutManagementFilters 
} from '@/types/workout-enhanced';
import { useWeightUnit } from '@/context/WeightUnitContext';

export function useEnhancedWorkoutHistory(filters: WorkoutManagementFilters) {
  const { weightUnit } = useWeightUnit();
  
  // Convert enhanced filters to basic filters for the underlying hook
  const basicFilters: WorkoutHistoryFilters = {
    limit: 50, // Get more data for enhanced features
    offset: 0,
    startDate: filters.dateRange.from?.toISOString(),
    endDate: filters.dateRange.to?.toISOString(),
    trainingTypes: filters.trainingTypes.length > 0 ? filters.trainingTypes : undefined,
  };

  const { workouts, exerciseCounts, totalCount, isLoading, refetch } = useWorkoutHistory(basicFilters);

  // Fetch detailed exercise data for all workouts
  const { data: enhancedWorkouts, isLoading: isLoadingEnhanced } = useQuery({
    queryKey: ['enhanced-workouts', workouts?.map(w => w.id).join(',')],
    queryFn: async () => {
      if (!workouts || workouts.length === 0) return [];
      
      const workoutIds = workouts.map(w => w.id);
      
      // Fetch all exercise sets for these workouts
      const { data: exerciseSets, error } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('workout_id', workoutIds);
      
      if (error) throw error;

      // Process each workout into enhanced format
      const enhanced: EnhancedWorkoutData[] = workouts.map(workout => {
        const workoutSets = exerciseSets?.filter(set => set.workout_id === workout.id) || [];
        const metrics = calculateWorkoutMetrics(workoutSets, workout.duration);
        const quality = assessWorkoutQuality(workoutSets, workout, exerciseCounts[workout.id]);
        const exercisePreview = createExercisePreview(workoutSets);

        return {
          ...workout,
          metrics,
          quality,
          exercisePreview,
        };
      });

      return enhanced;
    },
    enabled: !!workouts && workouts.length > 0,
    staleTime: 30000,
  });

  // Apply enhanced filters and sorting
  const filteredAndSortedWorkouts = useMemo(() => {
    if (!enhancedWorkouts) return [];

    let filtered = enhancedWorkouts;

    // Apply quality filters
    if (filters.qualityLevels.length > 0) {
      filtered = filtered.filter(workout => 
        filters.qualityLevels.includes(workout.quality.performanceLevel)
      );
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(query) ||
        workout.training_type.toLowerCase().includes(query) ||
        workout.exercisePreview.some(ex => ex.name.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'volume':
          comparison = a.metrics.totalVolume - b.metrics.totalVolume;
          break;
        case 'quality':
          comparison = a.quality.qualityScore - b.quality.qualityScore;
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [enhancedWorkouts, filters]);

  return {
    workouts: filteredAndSortedWorkouts,
    totalCount,
    isLoading: isLoading || isLoadingEnhanced,
    refetch,
  };
}

function calculateWorkoutMetrics(exerciseSets: any[], duration: number): EnhancedWorkoutMetrics {
  const completedSets = exerciseSets.filter(set => set.completed);
  
  const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
  const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
  const totalSets = completedSets.length;
  
  const avgWeight = totalSets > 0 ? totalVolume / totalReps : 0;
  const maxWeight = completedSets.length > 0 ? Math.max(...completedSets.map(set => set.weight)) : 0;
  
  const completionRate = exerciseSets.length > 0 ? (completedSets.length / exerciseSets.length) * 100 : 0;
  const exerciseVariety = new Set(completedSets.map(set => set.exercise_name)).size;
  const workoutDensity = duration > 0 ? totalVolume / duration : 0;

  return {
    totalVolume,
    avgWeight,
    maxWeight,
    totalReps,
    totalSets,
    completionRate,
    exerciseVariety,
    workoutDensity,
    // Add required properties with defaults
    tonnage: totalVolume,
    density: workoutDensity,
    intensity: 0,
    efficiency: 0,
    volumeLoad: totalVolume,
    averageRestTime: 0,
  };
}

function assessWorkoutQuality(
  exerciseSets: any[], 
  workout: any, 
  exerciseCount: any
): WorkoutQualityIndicators {
  const completedSets = exerciseSets.filter(set => set.completed);
  const completionRate = exerciseSets.length > 0 ? (completedSets.length / exerciseSets.length) * 100 : 0;
  
  const isComplete = completionRate >= 80;
  const hasIncompleteData = !exerciseCount || exerciseCount.exercises === 0 || exerciseCount.sets === 0;
  
  // Calculate quality score based on multiple factors
  let qualityScore = 0;
  qualityScore += Math.min(completionRate, 100) * 0.4; // 40% weight on completion
  qualityScore += Math.min(workout.duration / 60, 1) * 30; // 30% weight on duration
  qualityScore += Math.min(exerciseSets.length / 15, 1) * 30; // 30% weight on volume
  
  const performanceLevel = 
    qualityScore >= 80 ? 'excellent' :
    qualityScore >= 60 ? 'good' :
    qualityScore >= 40 ? 'average' : 'poor';

  const badges: WorkoutBadge[] = [];
  
  if (hasIncompleteData) {
    badges.push({
      id: 'incomplete-data',
      type: 'incomplete',
      title: 'Incomplete Data',
      description: 'This workout has incomplete data',
      label: 'Incomplete Data',
      color: '#f59e0b',
      icon: 'AlertTriangle'
    });
  }
  
  if (completionRate === 100) {
    badges.push({
      id: 'workout-complete',
      type: 'progress',
      title: 'Complete',
      description: 'This workout was completed successfully',
      label: 'Complete',
      color: '#10b981',
      icon: 'CheckCircle'
    });
  }

  return {
    isComplete,
    hasIncompleteData,
    qualityScore: Math.round(qualityScore),
    performanceLevel,
    badges,
    // Add required properties with defaults
    consistency: 0,
    progression: 0,
    balance: 0,
    recovery: 0,
    overall: performanceLevel,
  };
}

function createExercisePreview(exerciseSets: any[]): ExercisePreview[] {
  const exerciseGroups = exerciseSets.reduce((groups, set) => {
    if (!groups[set.exercise_name]) {
      groups[set.exercise_name] = [];
    }
    groups[set.exercise_name].push(set);
    return groups;
  }, {} as Record<string, any[]>);

  return Object.entries(exerciseGroups).map(([name, sets]: [string, any[]]) => {
    const completedSets = sets.filter((set: any) => set.completed);
    const reps = completedSets.map((set: any) => set.reps);
    const weights = completedSets.map((set: any) => set.weight);
    const totalVolume = completedSets.reduce((sum: number, set: any) => sum + (set.weight * set.reps), 0);

    return {
      name,
      sets: completedSets.length,
      reps,
      weight: weights,
      weights,
      volume: totalVolume,
    };
  }).slice(0, 5); // Show top 5 exercises
}
