import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PersonalRecordsService } from "@/services/personalRecordsService";
import { supabase } from "@/integrations/supabase/client";

export interface ExerciseStats {
  progressionTrend: 'improving' | 'stable' | 'declining';
  lastPerformed: string | null;
  personalBest: {
    weight: number;
    reps: number;
    date: string;
  } | null;
  totalSets: number;
  totalVolume: number;
}

export const useRealExerciseStats = (exerciseName?: string) => {
  const { user } = useAuth();

  const { data: exerciseStats, isLoading } = useQuery({
    queryKey: ['exercise-stats', user?.id, exerciseName],
    queryFn: async (): Promise<ExerciseStats | null> => {
      if (!user?.id || !exerciseName) return null;

      // Get historical exercise data
      const historicalData = await PersonalRecordsService.getHistoricalExerciseData(user.id, exerciseName);
      
      if (historicalData.length === 0) {
        return {
          progressionTrend: 'stable',
          lastPerformed: null,
          personalBest: null,
          totalSets: 0,
          totalVolume: 0
        };
      }

      // Calculate last performed
      const lastPerformed = historicalData[historicalData.length - 1]?.created_at || null;

      // Calculate personal best
      const maxWeight = Math.max(...historicalData.map(set => set.weight));
      const maxReps = Math.max(...historicalData.map(set => set.reps));
      const bestWeightSet = historicalData.find(set => set.weight === maxWeight);
      
      const personalBest = bestWeightSet ? {
        weight: bestWeightSet.weight,
        reps: bestWeightSet.reps,
        date: bestWeightSet.created_at
      } : null;

      // Calculate progression trend (last 4 weeks vs previous 4 weeks)
      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

      const recentSets = historicalData.filter(set => 
        new Date(set.created_at) >= fourWeeksAgo
      );
      const previousSets = historicalData.filter(set => 
        new Date(set.created_at) >= eightWeeksAgo && new Date(set.created_at) < fourWeeksAgo
      );

      let progressionTrend: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (recentSets.length > 0 && previousSets.length > 0) {
        const recentAvgVolume = recentSets.reduce((sum, set) => sum + (set.weight * set.reps), 0) / recentSets.length;
        const previousAvgVolume = previousSets.reduce((sum, set) => sum + (set.weight * set.reps), 0) / previousSets.length;
        
        if (recentAvgVolume > previousAvgVolume * 1.05) {
          progressionTrend = 'improving';
        } else if (recentAvgVolume < previousAvgVolume * 0.95) {
          progressionTrend = 'declining';
        }
      }

      // Calculate totals
      const totalSets = historicalData.length;
      const totalVolume = historicalData.reduce((sum, set) => sum + (set.weight * set.reps), 0);

      return {
        progressionTrend,
        lastPerformed,
        personalBest,
        totalSets,
        totalVolume
      };
    },
    enabled: !!user?.id && !!exerciseName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    exerciseStats,
    isLoading,
  };
};