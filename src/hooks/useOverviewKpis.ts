import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutStats } from '@/types/workout-metrics';

// Hook providing KPI data for the Overview page over the last 30 days
export function useOverviewKpis() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalExercises: 0,
    totalSets: 0,
    totalDuration: 0,
    avgDuration: 0,
    workoutTypes: [],
    tags: [],
    recommendedType: undefined,
    recommendedDuration: 0,
    recommendedTags: [],
    progressMetrics: { volumeChangePercentage: 0, strengthTrend: 'stable', consistencyScore: 0 },
    streakDays: 0,
    workouts: [],
    timePatterns: {
      daysFrequency: { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 },
      durationByTimeOfDay: { morning:0, afternoon:0, evening:0, night:0 }
    },
    muscleFocus: {},
    exerciseVolumeHistory: [],
    lastWorkoutDate: undefined
  });

  // Fixed 30-day window ignoring DateRangeContext
  const queryDates = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const adjustedTo = new Date(now);
    adjustedTo.setDate(adjustedTo.getDate() + 1);

    return {
      from: from.toISOString(),
      to: adjustedTo.toISOString()
    };
  }, []);

  // Fetch workout data for the fixed window
  const fetchWorkoutData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*, duration, exercises:exercise_sets(*)')
        .gte('start_time', queryDates.from)
        .lt('start_time', queryDates.to)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const workoutsData = sessions || [];
      setWorkouts(workoutsData);

      const processedStats = processWorkoutStats(workoutsData);
      setStats(processedStats);
    } catch (err) {
      console.error('[useOverviewKpis] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, queryDates.from, queryDates.to]);

  // Process stats from sessions
  const processWorkoutStats = useCallback((sessions: any[]): WorkoutStats => {
    if (!sessions.length) return stats;

    const totalWorkouts = sessions.length;
    const totalDuration = sessions.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    const counters = sessions.reduce((acc, workout) => {
      const type = workout.training_type || 'Unknown';
      acc.typeCounts[type] = (acc.typeCounts[type] || 0) + 1;

      const dayKey = new Date(workout.start_time)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase() as keyof typeof acc.daysFrequency;
      if (acc.daysFrequency[dayKey] !== undefined) {
        acc.daysFrequency[dayKey] = (acc.daysFrequency[dayKey] || 0) + 1;
      }

      const hr = new Date(workout.start_time).getHours();
      const duration = workout.duration || 0;
      if (hr < 12) acc.durationByTimeOfDay.morning += duration;
      else if (hr < 17) acc.durationByTimeOfDay.afternoon += duration;
      else if (hr < 21) acc.durationByTimeOfDay.evening += duration;
      else acc.durationByTimeOfDay.night += duration;

      if (Array.isArray(workout.exercises)) {
        const uniqueExercises = Array.from(new Set(workout.exercises.map((e: any) => e.exercise_name)));
        acc.exerciseCount += uniqueExercises.length;
        acc.setCount += workout.exercises.length;

        workout.exercises.forEach((set: any) => {
          if (set.weight && set.reps && set.completed) {
            const volume = set.weight * set.reps;
            if (!acc.exerciseStats[set.exercise_name]) {
              acc.exerciseStats[set.exercise_name] = { totalVolume: 0, totalSets: 0 };
            }
            acc.exerciseStats[set.exercise_name].totalVolume += volume;
            acc.exerciseStats[set.exercise_name].totalSets += 1;
          }
        });
      }

      return acc;
    }, {
      typeCounts: {} as Record<string, number>,
      daysFrequency: { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 },
      durationByTimeOfDay: { morning:0, afternoon:0, evening:0, night:0 },
      exerciseCount: 0,
      setCount: 0,
      exerciseStats: {} as Record<string, { totalVolume: number; totalSets: number }>
    });

    const workoutTypes = Object.entries(counters.typeCounts)
      .map(([type, count]: [string, number]) => ({
        type,
        count,
        percentage: (count / totalWorkouts) * 100
      }))
      .sort((a, b) => b.count - a.count);

    const exerciseVolumeHistory = Object.entries(counters.exerciseStats)
      .map(([exerciseName, stats]: [string, { totalVolume: number; totalSets: number }]) => ({
        exerciseName,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        averageWeight: 0,
        trend: 'stable' as const,
        percentChange: 0
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);

    return {
      totalWorkouts,
      totalExercises: counters.exerciseCount,
      totalSets: counters.setCount,
      totalDuration,
      avgDuration: Math.round(avgDuration),
      workoutTypes,
      tags: [],
      recommendedType: workoutTypes[0]?.type,
      recommendedDuration: Math.round(avgDuration),
      recommendedTags: [],
      progressMetrics: { volumeChangePercentage: 0, strengthTrend: 'stable', consistencyScore: 0 },
      streakDays: 0,
      workouts: sessions,
      timePatterns: {
        daysFrequency: counters.daysFrequency,
        durationByTimeOfDay: counters.durationByTimeOfDay
      },
      muscleFocus: {},
      exerciseVolumeHistory,
      lastWorkoutDate: sessions[0]?.start_time
    };
  }, [stats]);

  useEffect(() => {
    fetchWorkoutData();
  }, [fetchWorkoutData]);

  const refetch = useCallback(() => fetchWorkoutData(), [fetchWorkoutData]);

  return {
    stats,
    workouts,
    loading,
    refetch
  };
}
