import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCursorFilter, Cursor } from './pagination.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function fetchTrainingData(userId: string) {
  const pageSize = parseInt(Deno.env.get('AI_PAGE_SIZE') ?? '500', 10);
  const nMax = parseInt(Deno.env.get('AI_N_MAX') ?? '50000', 10);
  let cursor: Cursor | null = null;
  const sessions: any[] = [];
  let pages = 0;
  let totalFetched = 0;
  let minUTC: string | null = null;
  let maxUTC: string | null = null;

  while (true) {
    let q = supabaseAdmin
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(pageSize);

    const filter = buildCursorFilter(cursor);
    if (filter) q = q.or(filter);

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;

    sessions.push(...data);
    pages++;
    totalFetched += data.length;

    const firstTs = data[0].start_time ?? data[0].created_at;
    const last = data[data.length - 1];
    const lastTs = last.start_time ?? last.created_at;
    if (!minUTC || firstTs < minUTC) minUTC = firstTs;
    if (!maxUTC || lastTs > maxUTC) maxUTC = lastTs;

    if (Deno.env.get('AI_AUDIT') === '1') {
      console.info({
        tag: 'AI_COACH_FETCH',
        userId,
        role: 'service',
        page: pages,
        pageSize,
        got: data.length,
        minUTC: firstTs,
        maxUTC: lastTs,
        totalFetched,
      });
    }

    if (data.length < pageSize || totalFetched >= nMax) break;
    cursor = { ts: lastTs, id: last.id };
  }

  const earliestSessionUTC = sessions[0]?.start_time ?? sessions[0]?.created_at ?? null;

  if (Deno.env.get('AI_AUDIT') === '1') {
    console.info({
      tag: 'AI_COACH_FETCH_SUMMARY',
      userId,
      totalFetched,
      pages,
      minUTC,
      maxUTC,
      earliestSessionUTC,
    });
  }

  const workoutIds = sessions.map((w) => w.id);

  const { data: exerciseSets } = await supabaseAdmin
    .from('exercise_sets')
    .select('*')
    .in('workout_id', workoutIds)
    .order('workout_id', { ascending: true });

  const { data: personalRecords } = await supabaseAdmin
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(10);

  const totalWorkouts = sessions.length;
  const totalSets = exerciseSets?.filter((set: any) => set.completed).length || 0;
  const totalVolume =
    exerciseSets?.reduce(
      (sum: number, set: any) => (set.completed ? sum + set.weight * set.reps : sum),
      0,
    ) || 0;

  const detailedWorkouts = sessions.map((workout) => {
    const workoutSets = exerciseSets?.filter((set: any) => set.workout_id === workout.id) || [];

    const exerciseGroups = workoutSets.reduce((acc: any, set: any) => {
      if (!acc[set.exercise_name]) {
        acc[set.exercise_name] = {
          exercise_name: set.exercise_name,
          sets: [],
        };
      }
      acc[set.exercise_name].sets.push({
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        completed: set.completed,
        rest_time: set.rest_time,
      });
      return acc;
    }, {} as Record<string, { exercise_name: string; sets: any[] }>);

    return {
      ...workout,
      exercises: Object.values(exerciseGroups),
      total_sets: workoutSets.length,
      total_volume: workoutSets.reduce(
        (sum: number, set: any) => (set.completed ? sum + set.weight * set.reps : sum),
        0,
      ),
      exercises_performed: Object.keys(exerciseGroups).length,
    };
  });

  const exerciseStats = exerciseSets?.reduce((acc: any, set: any) => {
    if (!set.completed) return acc;
    if (!acc[set.exercise_name]) {
      acc[set.exercise_name] = {
        volume: 0,
        frequency: 0,
        total_sets: 0,
        max_weight: 0,
        total_reps: 0,
        workouts_performed: new Set(),
        rest_times: [],
      };
    }
    const stats = acc[set.exercise_name];
    stats.volume += set.weight * set.reps;
    stats.frequency += 1;
    stats.total_sets += 1;
    stats.total_reps += set.reps;
    stats.max_weight = Math.max(stats.max_weight, set.weight);
    stats.workouts_performed.add(set.workout_id);
    if (set.rest_time && set.rest_time > 0) {
      stats.rest_times.push(set.rest_time);
    }
    return acc;
  }, {} as Record<string, {
    volume: number;
    frequency: number;
    total_sets: number;
    max_weight: number;
    total_reps: number;
    workouts_performed: Set<string>;
    rest_times: number[];
  }>);

  const exerciseRestAnalytics = Object.entries(exerciseStats || {}).reduce(
    (acc: any, [name, stats]: any) => {
      if (stats.rest_times.length > 0) {
        const avgRestTime =
          stats.rest_times.reduce((sum: number, time: number) => sum + time, 0) /
          stats.rest_times.length;
        const minRestTime = Math.min(...stats.rest_times);
        const maxRestTime = Math.max(...stats.rest_times);
        acc[name] = {
          average_rest: Math.round(avgRestTime),
          min_rest: minRestTime,
          max_rest: maxRestTime,
          rest_consistency:
            stats.rest_times.length > 1
              ? Math.round(
                  stats.rest_times.reduce((variance: number, time: number) => {
                    const diff = time - avgRestTime;
                    return variance + diff * diff;
                  }, 0) / stats.rest_times.length,
                )
              : 0,
        };
      }
      return acc;
    },
    {} as Record<string, { average_rest: number; min_rest: number; max_rest: number; rest_consistency: number }>,
  );

  const topExercises = Object.entries(exerciseStats || {})
    .map(([name, stats]: [string, any]) => ({
      name,
      volume: stats.volume,
      frequency: stats.frequency,
      total_sets: stats.total_sets,
      max_weight: stats.max_weight,
      total_reps: stats.total_reps,
      workouts_performed: stats.workouts_performed.size,
      average_rest_time: exerciseRestAnalytics[name]?.average_rest || null,
    }))
    .sort((a: any, b: any) => b.volume - a.volume)
    .slice(0, 10);

  return {
    totalWorkouts,
    totalVolume,
    totalSets,
    recentWorkouts: detailedWorkouts.slice(0, 10),
    allWorkouts: detailedWorkouts,
    topExercises,
    personalRecords: personalRecords || [],
    exerciseBreakdown: exerciseStats,
    restAnalytics: exerciseRestAnalytics,
    earliestSessionUTC,
    totalFetched,
    pages,
    minUTC,
    maxUTC,
  };
}
