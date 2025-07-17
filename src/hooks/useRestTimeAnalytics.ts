import { useCallback } from 'react';
import { logRestTimeAnalytics, getSuggestedRestTime } from '@/services/restTimeAnalyticsService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface RestTimeLog {
  exerciseName: string;
  plannedRestTime: number;
  actualRestTime: number;
  workoutId?: string;
  performanceImpact?: number;
}

export const useRestTimeAnalytics = () => {
  const { user } = useAuth();

  const logRestTime = useCallback(async (data: RestTimeLog) => {
    if (!user) return;

    try {
      await logRestTimeAnalytics({
        exercise_name: data.exerciseName,
        rest_duration: data.actualRestTime,
        subsequent_performance_impact: data.performanceImpact,
        workout_id: data.workoutId
      });

      // Show insights if rest time significantly differs from planned
      const difference = data.actualRestTime - data.plannedRestTime;
      if (Math.abs(difference) > 30) { // 30 seconds threshold
        const message = difference > 0 
          ? `You rested ${Math.round(difference)}s longer than planned for ${data.exerciseName}`
          : `You rested ${Math.round(Math.abs(difference))}s less than planned for ${data.exerciseName}`;
        
        toast({
          title: "Rest Time Insight",
          description: message,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to log rest time analytics:', error);
    }
  }, [user]);

  const getRestSuggestion = useCallback(async (exerciseName: string): Promise<number | null> => {
    if (!user) return null;

    try {
      return await getSuggestedRestTime(exerciseName);
    } catch (error) {
      console.error('Failed to get rest time suggestion:', error);
      return null;
    }
  }, [user]);

  return {
    logRestTime,
    getRestSuggestion
  };
};