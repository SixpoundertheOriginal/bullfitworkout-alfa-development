
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWorkoutHistory } from '@/services/workout/workoutDataService';
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
      return await getWorkoutHistory(filters);
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
