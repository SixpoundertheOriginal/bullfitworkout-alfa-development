
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates a workout's details
 */
export async function updateWorkout(workoutId: string, data: {
  name?: string;
  training_type?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  notes?: string | null;
}) {
  // Ensure duration is a proper number
  if (data.duration !== undefined) {
    data.duration = Number(data.duration);
  }
  
  // Calculate end_time based on start_time and duration if only one is provided
  if (data.start_time && data.duration !== undefined && !data.end_time) {
    const startDate = new Date(data.start_time);
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + data.duration);
    data.end_time = endDate.toISOString();
  }
  
  const { data: workout, error } = await supabase
    .from('workout_sessions')
    .update(data)
    .eq('id', workoutId)
    .select()
    .single();
    
  if (error) throw error;
  return workout;
}

/**
 * Fetches a single workout with its exercise sets
 */
export async function getWorkoutWithExercises(workoutId: string) {
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
  
  return {
    ...workout,
    exerciseSets: sets || []
  };
}

/**
 * Deletes a workout and its associated exercise sets
 */
export async function deleteWorkout(workoutId: string) {
  const { error: setsError } = await supabase
    .from('exercise_sets')
    .delete()
    .eq('workout_id', workoutId);
    
  if (setsError) throw setsError;
  
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', workoutId);
    
  if (error) throw error;
  return true;
}

/**
 * Bulk deletes multiple workouts and their associated exercise sets
 */
export async function bulkDeleteWorkouts(workoutIds: string[]) {
  if (!workoutIds.length) return { success: true, count: 0 };
  
  try {
    const { error: setsError } = await supabase
      .from('exercise_sets')
      .delete()
      .in('workout_id', workoutIds);
      
    if (setsError) throw setsError;
    
    const { data, error } = await supabase
      .from('workout_sessions')
      .delete()
      .in('id', workoutIds)
      .select('id');
      
    if (error) throw error;
    
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Error bulk deleting workouts:", error);
    throw error;
  }
}

/**
 * Bulk updates multiple workouts with the same values
 */
export async function bulkUpdateWorkouts(workoutIds: string[], data: {
  name?: string;
  training_type?: string;
  notes?: string | null;
}) {
  if (!workoutIds.length) return { success: true, count: 0 };
  
  try {
    const { data: updatedWorkouts, error } = await supabase
      .from('workout_sessions')
      .update(data)
      .in('id', workoutIds)
      .select('id');
      
    if (error) throw error;
    
    return { success: true, count: updatedWorkouts?.length || 0 };
  } catch (error) {
    console.error("Error bulk updating workouts:", error);
    throw error;
  }
}
