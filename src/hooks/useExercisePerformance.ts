
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ExercisePerformance {
  exerciseName: string;
  totalVolume: number;
  averageWeight: number;
  setCount: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange: number;
  timeOfDayPerformance: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export function useExercisePerformance(exerciseName?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise-performance', user?.id, exerciseName],
    queryFn: async (): Promise<ExercisePerformance | null> => {
      if (!user || !exerciseName) return null;
      
      // Get exercise progression data
      const { data: progressionData, error: progressionError } = await supabase
        .from('exercise_progression')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_name', exerciseName)
        .order('created_at', { ascending: true });
        
      if (progressionError) throw progressionError;
      
      // Get exercise sets data
      const { data: sets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*, workout_sessions!inner(*)')
        .eq('exercise_name', exerciseName)
        .order('created_at', { ascending: true });
        
      if (setsError) throw setsError;
      
      if (!sets?.length) return null;
      
      // Calculate metrics
      let totalVolume = 0;
      let totalWeight = 0;
      const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      
      sets.forEach(set => {
        const hour = new Date(set.created_at).getHours();
        const period = 
          hour >= 5 && hour < 11 ? 'morning' :
          hour >= 11 && hour < 17 ? 'afternoon' :
          hour >= 17 && hour < 22 ? 'evening' : 'night';
          
        timeOfDay[period] += set.weight * set.reps;
        totalVolume += set.weight * set.reps;
        totalWeight += set.weight;
      });
      
      // Calculate trend
      const firstSetVolume = sets[0].weight * sets[0].reps;
      const lastSetVolume = sets[sets.length - 1].weight * sets[sets.length - 1].reps;
      const percentChange = ((lastSetVolume - firstSetVolume) / firstSetVolume) * 100;
      
      let trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' = 'stable';
      if (percentChange > 5) trend = 'increasing';
      else if (percentChange < -5) trend = 'decreasing';
      else {
        // Check for fluctuation
        let fluctuationCount = 0;
        for (let i = 1; i < sets.length; i++) {
          const prevVolume = sets[i-1].weight * sets[i-1].reps;
          const currVolume = sets[i].weight * sets[i].reps;
          if (Math.abs((currVolume - prevVolume) / prevVolume) > 0.1) {
            fluctuationCount++;
          }
        }
        if (fluctuationCount > sets.length / 3) trend = 'fluctuating';
      }
      
      return {
        exerciseName,
        totalVolume,
        averageWeight: totalWeight / sets.length,
        setCount: sets.length,
        trend,
        percentChange,
        timeOfDayPerformance: timeOfDay
      };
    },
    enabled: !!user && !!exerciseName
  });
}
