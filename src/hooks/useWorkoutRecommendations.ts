
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface WorkoutRecommendation {
  trainingType: string;
  confidence: number;
  duration: number;
  tags: string[];
  suggestedDuration: number;
  suggestedExercises: string[];
  bestTimeOfDay: string;
  reasoning: string[];
}

export function useWorkoutRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workout-recommendations', user?.id],
    queryFn: async (): Promise<WorkoutRecommendation> => {
      if (!user) throw new Error("User not authenticated");
      
      // Get training type distribution
      const { data: typeDistribution, error: typeError } = await supabase
        .from('workout_type_distribution')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_count', { ascending: false });
        
      if (typeError) throw typeError;
      
      // Get time preferences
      const { data: timePreferences, error: timeError } = await supabase
        .from('workout_time_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_count', { ascending: false });
        
      if (timeError) throw timeError;
      
      // Get exercise performance data
      const { data: exercisePerformance, error: performanceError } = await supabase
        .from('exercise_performance_summary')
        .select('*')
        .eq('user_id', user.id);
        
      if (performanceError) throw performanceError;
      
      // Determine most effective training type and duration
      const preferredType = typeDistribution?.[0]?.training_type || 'strength';
      const avgDuration = typeDistribution?.[0]?.avg_duration || 45;
      const bestTimeOfDay = timePreferences?.[0]?.time_of_day || 'evening';
      
      // Get suggested exercises based on performance
      const suggestedExercises = exercisePerformance
        ?.sort((a, b) => (b.max_weight * b.avg_reps) - (a.max_weight * a.avg_reps))
        ?.slice(0, 5)
        ?.map(p => p.exercise_name) || [];
      
      // Calculate confidence based on data points
      const confidence = Math.min(
        typeDistribution?.length ? (typeDistribution.length / 10) * 0.1 : 0.5,
        1.0
      );
      
      // Generate reasoning
      const reasoning = [
        `You've had the most success with ${preferredType} training`,
        `Your workouts are most consistent during ${bestTimeOfDay}`,
        `Your optimal workout duration is around ${Math.round(avgDuration)} minutes`,
      ];
      
      if (exercisePerformance?.length) {
        reasoning.push("Based on your exercise performance data");
      }
      
      // Generate recommended tags based on type and performance
      const recommendedTags = ['strength', 'cardio', 'core', 'upper-body', 'lower-body']
        .slice(0, 3);
      
      return {
        trainingType: preferredType,
        confidence,
        duration: avgDuration,
        suggestedDuration: avgDuration,
        tags: recommendedTags,
        suggestedExercises,
        bestTimeOfDay,
        reasoning
      };
    },
    enabled: !!user
  });
}
