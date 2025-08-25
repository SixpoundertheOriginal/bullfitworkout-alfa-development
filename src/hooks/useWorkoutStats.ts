
// src/hooks/useWorkoutStats.ts

import { useMemo, useState, useEffect, useCallback } from 'react';
import { ExerciseSet } from '@/types/exercise';
import { processWorkoutMetrics, ProcessedWorkoutMetrics } from '@/utils/workoutMetricsProcessor';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { useAuth } from '@/context/AuthContext';
import { WorkoutStats, WorkoutStatsResult } from '@/types/workout-metrics';
import { useDateRange } from '@/context/DateRangeContext';
import { getWorkoutStats } from '@/services/workout/workoutDataService';

export function useWorkoutStats(
  exercises?: Record<string, ExerciseSet[]>,
  duration?: number,
  userBodyInfo?: { weight: number; unit: string }
): WorkoutStatsResult {
  const { weightUnit } = useWeightUnit();
  const { user } = useAuth();
  const { dateRange } = useDateRange();

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

  // Backfill for individual workout metrics (used when you pass exercises+duration)
  const workoutMetrics = useMemo<ProcessedWorkoutMetrics | null>(() => {
    if (exercises && duration !== undefined) {
      return processWorkoutMetrics(exercises, duration, weightUnit, userBodyInfo);
    }
    return null;
  }, [exercises, duration, weightUnit, userBodyInfo]);

  // Fetch from Supabase when no specific exercises are passed
  const fetchWorkoutData = useCallback(async () => {
    setLoading(true);
    console.log("[useWorkoutStats] Fetching workouts with dateRange:", dateRange);

    try {
      const { stats: fetchedStats, workouts: sessions } = await getWorkoutStats(dateRange);
      setWorkouts(sessions);
      setStats(fetchedStats);
    } catch (err) {
      console.error("[useWorkoutStats] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Run fetch on mount & whenever dateRange changes
  useEffect(() => {
    if (!exercises && user) {
      fetchWorkoutData();
    } else {
      setLoading(false);
    }
  }, [fetchWorkoutData, exercises, user]);

  const refetch = useCallback(() => {
    if (!exercises) fetchWorkoutData();
  }, [exercises, fetchWorkoutData]);

  // Return both processed & backward-compatible stats
  return {
    ...(workoutMetrics || {} as ProcessedWorkoutMetrics),
    stats,
    workouts,
    loading,
    refetch,
    dateRange
  } as WorkoutStatsResult;
}
