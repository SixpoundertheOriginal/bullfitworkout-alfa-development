import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistoryFilters } from "@/hooks/useWorkoutHistory";
import { ExerciseSet } from "@/types/exercise";
import { WorkoutStats } from "@/types/workout-metrics";
import { getExerciseGroup } from "@/utils/exerciseUtils";

export async function getWorkoutHistory(filters: WorkoutHistoryFilters = { limit: 30 }) {
  // Build the count query first to get total number of workouts
  const countQuery = supabase
    .from('workout_sessions')
    .select('id', { count: 'exact', head: true });

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

  const exerciseCountData: Record<string, { exercises: number; sets: number }> = {};

  await Promise.all(
    (data || []).map(async (workout) => {
      const { data: exerciseSets, error: exerciseSetsError } = await supabase
        .from('exercise_sets')
        .select('exercise_name, id')
        .eq('workout_id', workout.id);

      if (exerciseSetsError) throw exerciseSetsError;

      const exerciseNames = new Set<string>();
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
}

export async function getWorkoutDetails(workoutId: string) {
  const { data: workout, error: workoutError } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (workoutError) throw workoutError;

  const { data: sets, error: setsError } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('workout_id', workoutId)
    .order('exercise_name', { ascending: true })
    .order('set_number', { ascending: true });

  if (setsError) throw setsError;

  const groupedSets = sets?.reduce<Record<string, ExerciseSet[]>>((acc, set) => {
    if (!acc[set.exercise_name]) {
      acc[set.exercise_name] = [];
    }
    acc[set.exercise_name].push(set as ExerciseSet);
    return acc;
  }, {}) || {};

  return {
    workoutDetails: workout,
    exerciseSets: groupedSets
  };
}

export async function getExerciseSetsForWorkouts(workoutIds: string[]) {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .in('workout_id', workoutIds);

  if (error) throw error;
  return data || [];
}

export async function getWorkoutStats(dateRange?: { from?: Date; to?: Date }) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = dateRange?.from || defaultFrom;
  const to = dateRange?.to || now;
  const adjustedTo = new Date(to);
  adjustedTo.setDate(adjustedTo.getDate() + 1);

  const { data: workoutData, error } = await supabase
    .from('workout_sessions')
    .select('*, duration, exercises:exercise_sets(*)')
    .gte('start_time', from.toISOString())
    .lt('start_time', adjustedTo.toISOString())
    .order('start_time', { ascending: false });

  if (error) throw error;
  const sessions = workoutData || [];

  const totalWorkouts = sessions.length;
  const totalDuration = sessions.reduce((sum, w) => sum + (w.duration || 0), 0);
  const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

  let exerciseCount = 0;
  let setCount = 0;
  const typeCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const daysFrequency = { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 };
  const durationByTimeOfDay = { morning:0, afternoon:0, evening:0, night:0 };
  const muscleCounts: Record<string, number> = {};
  const exerciseStats: Record<string, {
    totalVolume: number;
    totalSets: number;
    totalWeight: number;
    weightCount: number;
  }> = {};

  sessions.forEach(w => {
    const t = w.training_type || 'Unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;

    const dayKey = new Date(w.start_time)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    if ((daysFrequency as any)[dayKey] !== undefined) (daysFrequency as any)[dayKey]++;

    const hr = new Date(w.start_time).getHours();
    if (hr < 12) durationByTimeOfDay.morning += w.duration || 0;
    else if (hr < 17) durationByTimeOfDay.afternoon += w.duration || 0;
    else if (hr < 21) durationByTimeOfDay.evening += w.duration || 0;
    else durationByTimeOfDay.night += w.duration || 0;

    if (w.metadata && typeof w.metadata === 'object' && w.metadata !== null) {
      const metadataObj = w.metadata as { tags?: string[] };
      if (metadataObj.tags && Array.isArray(metadataObj.tags)) {
        metadataObj.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    }

    if (Array.isArray(w.exercises)) {
      const names = w.exercises.map((e: any) => e.exercise_name);
      const unique = Array.from(new Set(names));
      exerciseCount += unique.length;
      setCount += w.exercises.length;

      unique.forEach(name => {
        const muscle = getExerciseMainMuscleGroup(name);
        muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
      });

      w.exercises.forEach((s: any) => {
        if (s.weight && s.reps && s.completed) {
          const volume = s.weight * s.reps;
          if (!exerciseStats[s.exercise_name]) {
            exerciseStats[s.exercise_name] = {
              totalVolume: 0,
              totalSets: 0,
              totalWeight: 0,
              weightCount: 0
            };
          }
          exerciseStats[s.exercise_name].totalVolume += volume;
          exerciseStats[s.exercise_name].totalSets += 1;
          exerciseStats[s.exercise_name].totalWeight += s.weight;
          exerciseStats[s.exercise_name].weightCount += 1;
        }
      });
    }
  });

  const workoutTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count, percentage: (count/totalWorkouts)*100 }))
    .sort((a,b) => b.count - a.count);

  const tags = Object.entries(tagCounts)
    .map(([name,count]) => ({ name, count }))
    .sort((a,b) => b.count - a.count);

  const recommendedType = workoutTypes[0]?.type;
  const recentAvg = sessions.slice(0,10)
    .reduce((sum,w) => sum + (w.duration||0),0) / (Math.min(sessions.length,10)||1);
  const recommendedTags = tags.slice(0,3).map(t=>t.name);

  const streakDays = calculateStreakDays(sessions);

  const exerciseVolumeHistory = Object.entries(exerciseStats)
    .map(([exerciseName, stats]) => ({
      exerciseName,
      totalVolume: stats.totalVolume,
      totalSets: stats.totalSets,
      averageWeight: stats.weightCount > 0 ? stats.totalWeight / stats.weightCount : 0,
      trend: 'stable' as const,
      percentChange: 0
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 10);

  const lastWorkoutDate = sessions[0]?.start_time;

  const stats: WorkoutStats = {
    totalWorkouts,
    totalExercises: exerciseCount,
    totalSets: setCount,
    totalDuration,
    avgDuration: Math.round(avgDuration),
    workoutTypes,
    tags,
    recommendedType,
    recommendedDuration: Math.round(recentAvg),
    recommendedTags,
    progressMetrics: { volumeChangePercentage:0, strengthTrend:'stable', consistencyScore:0 },
    streakDays,
    workouts: sessions,
    timePatterns: { daysFrequency, durationByTimeOfDay },
    muscleFocus: muscleCounts,
    exerciseVolumeHistory,
    lastWorkoutDate
  };

  return { stats, workouts: sessions };
}

function getExerciseMainMuscleGroup(exerciseName: string): string {
  const muscleGroup = getExerciseGroup(exerciseName);
  return muscleGroup || 'other';
}

function calculateStreakDays(sessions: any[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let currentStreak = 1;
  let maxStreak = 1;

  const uniqueDates = sortedSessions.map(session =>
    new Date(session.start_time).toISOString().split('T')[0]
  ).filter((date, index, self) => self.indexOf(date) === index);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i-1]);
    const currDate = new Date(uniqueDates[i]);
    prevDate.setDate(prevDate.getDate() + 1);
    if (prevDate.toISOString().split('T')[0] === uniqueDates[i]) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
