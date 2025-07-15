
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define WorkoutHistoryFilters interface to use throughout the application
export interface WorkoutHistoryFilters {
  limit?: number;
  offset?: number;
  startDate?: string | null;
  endDate?: string | null;
  trainingTypes?: string[];
}

// Interface for workout dates used by the calendar
export interface WorkoutDates {
  [date: string]: number;
}

// Hook to get workout dates for calendar view
export function useWorkoutDates(year: number, month: number) {
  return useQuery({
    queryKey: ['workout-dates', year, month],
    queryFn: async () => {
      // Create date range for the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, start_time')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());
      
      if (error) throw error;
      
      // Create a mapping of dates to workout counts
      const workoutDates: WorkoutDates = {};
      
      (data || []).forEach(workout => {
        const dateStr = workout.start_time.split('T')[0];
        workoutDates[dateStr] = (workoutDates[dateStr] || 0) + 1;
      });
      
      return workoutDates;
    },
  });
}

export function useWorkoutHistory(filters: WorkoutHistoryFilters = { limit: 30 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, { exercises: number; sets: number }>>({});
  const [totalCount, setTotalCount] = useState<number>(0);
  const queryClient = useQueryClient();
  
  const fetchWorkouts = useCallback(async () => {
    try {
      // Build the count query first to get total number of workouts
      const countQuery = supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true });
        
      // Apply filters to count query
      if (filters.startDate) {
        countQuery.gte('start_time', filters.startDate);
      }
      
      if (filters.endDate) {
        countQuery.lte('start_time', filters.endDate);
      }
      
      if (filters.trainingTypes && filters.trainingTypes.length > 0) {
        countQuery.in('training_type', filters.trainingTypes);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      // Now build the main query
      let query = supabase
        .from('workout_sessions')
        .select('*')
        .order('start_time', { ascending: false });
        
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 30) - 1);
      }
      
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('start_time', filters.endDate);
      }
      
      if (filters.trainingTypes && filters.trainingTypes.length > 0) {
        query = query.in('training_type', filters.trainingTypes);
      }
      
      const { data, error: workoutsError } = await query;
      
      if (workoutsError) throw workoutsError;
      
      // For each workout, get the exercise count and set count
      const exerciseCountData: Record<string, { exercises: number; sets: number }> = {};
      
      await Promise.all(
        (data || []).map(async (workout) => {
          const { data: exerciseSets, error: exerciseSetsError } = await supabase
            .from('exercise_sets')
            .select('exercise_name, id')
            .eq('workout_id', workout.id);
            
          if (exerciseSetsError) throw exerciseSetsError;
          
          // Count unique exercise names
          const exerciseNames = new Set();
          exerciseSets?.forEach(set => exerciseNames.add(set.exercise_name));
          
          exerciseCountData[workout.id] = {
            exercises: exerciseNames.size,
            sets: exerciseSets?.length || 0
          };
        })
      );
      
      return {
        workouts: data || [],
        exerciseCounts: exerciseCountData,
        totalCount: count || 0
      };
    } catch (err) {
      console.error('Error fetching workout history:', err);
      throw err;
    }
  }, [filters]);
  
  const { data, error: queryError, isLoading: queryLoading, refetch } = useQuery({
    queryKey: [
      'workout-history', 
      filters.limit, 
      filters.offset, 
      filters.startDate, 
      filters.endDate, 
      filters.trainingTypes
    ],
    queryFn: fetchWorkouts,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
  
  useEffect(() => {
    if (data) {
      setWorkouts(data.workouts);
      setExerciseCounts(data.exerciseCounts);
      setTotalCount(data.totalCount);
      setIsLoading(false);
    }
    if (queryError) {
      setError(queryError as Error);
      setIsLoading(false);
    }
  }, [data, queryError]);
  
  // Set up a subscription for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('workout-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workout_sessions' 
        }, 
        () => {
          // When any changes occur to the workout_sessions table, invalidate the queries
          queryClient.invalidateQueries({ queryKey: ['workout-history'] });
          queryClient.invalidateQueries({ queryKey: ['workouts'] });
          queryClient.invalidateQueries({ queryKey: ['workout-dates'] });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return { 
    workouts, 
    data, 
    exerciseCounts,
    totalCount, 
    isLoading: isLoading || queryLoading, 
    error, 
    refetch 
  };
}
