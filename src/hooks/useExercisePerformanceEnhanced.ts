
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PersonalRecordsService } from "@/services/personalRecordsService";

export interface EnhancedExercisePerformance {
  exerciseName: string;
  totalVolume: number;
  averageWeight: number;
  maxWeight: number;
  setCount: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange: number;
  strengthProgression: {
    weightProgression: number;
    volumeProgression: number;
    consistencyScore: number;
  };
  personalRecords: {
    weight: number | null;
    reps: number | null;
    volume: number | null;
    lastPRDate: string | null;
  };
  timeOfDayPerformance: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export function useExercisePerformanceEnhanced(exerciseName?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise-performance-enhanced', user?.id, exerciseName],
    queryFn: async (): Promise<EnhancedExercisePerformance | null> => {
      if (!user || !exerciseName) return null;
      
      // Get exercise sets data
      const { data: sets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*, workout_sessions!inner(*)')
        .eq('exercise_name', exerciseName)
        .eq('workout_sessions.user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (setsError) throw setsError;
      
      if (!sets?.length) return null;
      
      // Get personal records
      const personalRecords = await PersonalRecordsService.getExerciseRecords(user.id, exerciseName);
      
      // Calculate basic metrics
      let totalVolume = 0;
      let totalWeight = 0;
      let maxWeight = 0;
      const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      
      sets.forEach(set => {
        const volume = set.weight * set.reps;
        totalVolume += volume;
        totalWeight += set.weight;
        maxWeight = Math.max(maxWeight, set.weight);
        
        const hour = new Date(set.created_at).getHours();
        const period = 
          hour >= 5 && hour < 11 ? 'morning' :
          hour >= 11 && hour < 17 ? 'afternoon' :
          hour >= 17 && hour < 22 ? 'evening' : 'night';
          
        timeOfDay[period] += volume;
      });
      
      // Calculate strength progression (last 4 weeks vs previous 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      
      const recentSets = sets.filter(set => new Date(set.created_at) >= fourWeeksAgo);
      const previousSets = sets.filter(set => 
        new Date(set.created_at) >= eightWeeksAgo && 
        new Date(set.created_at) < fourWeeksAgo
      );
      
      const recentAvgWeight = recentSets.length ? 
        recentSets.reduce((sum, set) => sum + set.weight, 0) / recentSets.length : 0;
      const previousAvgWeight = previousSets.length ? 
        previousSets.reduce((sum, set) => sum + set.weight, 0) / previousSets.length : 0;
      
      const recentAvgVolume = recentSets.length ? 
        recentSets.reduce((sum, set) => sum + (set.weight * set.reps), 0) / recentSets.length : 0;
      const previousAvgVolume = previousSets.length ? 
        previousSets.reduce((sum, set) => sum + (set.weight * set.reps), 0) / previousSets.length : 0;
      
      // Calculate trend
      const firstSetVolume = sets[0].weight * sets[0].reps;
      const lastSetVolume = sets[sets.length - 1].weight * sets[sets.length - 1].reps;
      const percentChange = firstSetVolume ? ((lastSetVolume - firstSetVolume) / firstSetVolume) * 100 : 0;
      
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
      
      // Extract PR data
      const weightPR = personalRecords.find(pr => pr.type === 'weight');
      const repsPR = personalRecords.find(pr => pr.type === 'reps');
      const volumePR = personalRecords.find(pr => pr.type === 'volume');
      
      const lastPRDate = personalRecords.length > 0 ? 
        personalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;
      
      return {
        exerciseName,
        totalVolume,
        averageWeight: totalWeight / sets.length,
        maxWeight,
        setCount: sets.length,
        trend,
        percentChange,
        strengthProgression: {
          weightProgression: previousAvgWeight ? ((recentAvgWeight - previousAvgWeight) / previousAvgWeight) * 100 : 0,
          volumeProgression: previousAvgVolume ? ((recentAvgVolume - previousAvgVolume) / previousAvgVolume) * 100 : 0,
          consistencyScore: Math.min(100, (recentSets.length / 12) * 100) // 3 sessions per week = 100%
        },
        personalRecords: {
          weight: weightPR?.value || null,
          reps: repsPR?.value || null,
          volume: volumePR?.value || null,
          lastPRDate
        },
        timeOfDayPerformance: timeOfDay
      };
    },
    enabled: !!user && !!exerciseName
  });
}
