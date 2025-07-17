import { supabase } from "@/integrations/supabase/client";

export interface RestTimeAnalyticsData {
  exercise_name: string;
  rest_duration: number;
  subsequent_performance_impact?: number;
  workout_id?: string;
}

export interface RestTimePattern {
  exercise_name: string;
  average_rest_time: number;
  optimal_rest_time: number;
  performance_correlation: number;
}

/**
 * Logs rest time analytics data to the database
 */
export async function logRestTimeAnalytics(data: RestTimeAnalyticsData) {
  const { error } = await supabase
    .from('rest_period_analytics')
    .insert({
      exercise_name: data.exercise_name,
      rest_duration: data.rest_duration,
      subsequent_performance_impact: data.subsequent_performance_impact,
      workout_id: data.workout_id,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });
    
  if (error) throw error;
}

/**
 * Gets rest time patterns for a user and exercise
 */
export async function getRestTimePatterns(exerciseName?: string): Promise<RestTimePattern[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  let query = supabase
    .from('rest_period_analytics')
    .select('*')
    .eq('user_id', user.user.id);

  if (exerciseName) {
    query = query.eq('exercise_name', exerciseName);
  }

  const { data, error } = await query;
  
  if (error) throw error;

  // Group by exercise and calculate patterns
  const exerciseGroups = data?.reduce((groups, record) => {
    const exercise = record.exercise_name;
    if (!groups[exercise]) {
      groups[exercise] = [];
    }
    groups[exercise].push(record);
    return groups;
  }, {} as Record<string, any[]>) || {};

  return Object.entries(exerciseGroups).map(([exercise, records]) => {
    const avgRestTime = records.reduce((sum, r) => sum + r.rest_duration, 0) / records.length;
    const recentRecords = records.slice(-10); // Last 10 records
    const optimalRestTime = recentRecords.reduce((sum, r) => sum + r.rest_duration, 0) / recentRecords.length;
    
    return {
      exercise_name: exercise,
      average_rest_time: Math.round(avgRestTime),
      optimal_rest_time: Math.round(optimalRestTime),
      performance_correlation: 0.8 // Simplified for now
    };
  });
}

/**
 * Gets suggested rest time for an exercise based on user history
 */
export async function getSuggestedRestTime(exerciseName: string): Promise<number | null> {
  const patterns = await getRestTimePatterns(exerciseName);
  const pattern = patterns.find(p => p.exercise_name === exerciseName);
  
  if (!pattern) return null;
  
  // Return optimal rest time or fall back to average
  return pattern.optimal_rest_time || pattern.average_rest_time || null;
}