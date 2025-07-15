
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface WorkoutTypeStats {
  type: string;
  count: number;
  totalDuration: number;
  percentage: number;
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  averageDuration: number;
}

export function useWorkoutTypeAnalysis() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workout-type-analysis', user?.id],
    queryFn: async (): Promise<WorkoutTypeStats[]> => {
      if (!user) throw new Error("User not authenticated");
      
      try {
        const { data: workouts, error } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        const typeCount: Record<string, {
          count: number;
          duration: number;
          morning: number;
          afternoon: number;
          evening: number;
          night: number;
          totalDuration: number;
        }> = {};
        
        workouts?.forEach(workout => {
          const type = workout.training_type;
          const hour = new Date(workout.start_time).getHours();
          const timeOfDay = 
            hour >= 5 && hour < 11 ? 'morning' :
            hour >= 11 && hour < 17 ? 'afternoon' :
            hour >= 17 && hour < 22 ? 'evening' : 'night';
          
          if (!typeCount[type]) {
            typeCount[type] = {
              count: 0,
              duration: 0,
              morning: 0,
              afternoon: 0,
              evening: 0,
              night: 0,
              totalDuration: 0
            };
          }
          
          typeCount[type].count++;
          typeCount[type].duration += workout.duration;
          typeCount[type][timeOfDay]++;
          typeCount[type].totalDuration += workout.duration;
        });
        
        const totalWorkouts = workouts?.length || 0;
        
        return Object.entries(typeCount).map(([type, data]) => ({
          type,
          count: data.count,
          totalDuration: data.totalDuration,
          percentage: (data.count / totalWorkouts) * 100,
          timeOfDay: {
            morning: data.morning,
            afternoon: data.afternoon,
            evening: data.evening,
            night: data.night
          },
          averageDuration: data.duration / data.count
        }));
      } catch (error) {
        console.error("Error fetching workout type analysis:", error);
        return [];
      }
    },
    enabled: !!user,
    retry: false
  });
}
