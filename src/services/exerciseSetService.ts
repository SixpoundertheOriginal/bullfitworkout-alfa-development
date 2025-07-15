
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates or creates sets for an exercise in a workout
 */
export async function updateExerciseSets(workoutId: string, exerciseName: string, sets: {
  id: string;
  exercise_name: string;
  workout_id: string;
  weight: number;
  reps: number;
  set_number: number;
  completed: boolean;
  rest_time?: number;
}[]) {
  // Get existing set IDs for this exercise in this workout
  const { data: existingSets, error: fetchError } = await supabase
    .from('exercise_sets')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('exercise_name', exerciseName);
    
  if (fetchError) throw fetchError;
  
  const existingIds = new Set(existingSets?.map(set => set.id) || []);
  const setsToUpdate = sets.filter(set => set.id && !set.id.startsWith('temp-') && existingIds.has(set.id));
  const setsToInsert = sets.filter(set => !set.id || set.id.startsWith('temp-') || !existingIds.has(set.id))
    .map(set => ({
      workout_id: workoutId,
      exercise_name: exerciseName,
      weight: set.weight,
      reps: set.reps,
      set_number: set.set_number,
      completed: set.completed,
      rest_time: set.rest_time || 60
    }));
  
  // Sets to delete - those that exist in the database but not in our updated list
  const setIdsToKeep = new Set(setsToUpdate.map(set => set.id));
  const setsToDelete = existingIds.size > 0 
    ? Array.from(existingIds).filter(id => !setIdsToKeep.has(id as string))
    : [];
  
  // Perform the operations
  const operations = [];
  
  // Update existing sets
  if (setsToUpdate.length > 0) {
    const updatePromise = supabase
      .from('exercise_sets')
      .upsert(setsToUpdate.map(set => ({
        id: set.id,
        workout_id: workoutId,
        exercise_name: exerciseName,
        weight: set.weight,
        reps: set.reps,
        set_number: set.set_number,
        completed: set.completed,
        rest_time: set.rest_time || 60
      })));
    operations.push(updatePromise);
  }
  
  // Insert new sets
  if (setsToInsert.length > 0) {
    const insertPromise = supabase
      .from('exercise_sets')
      .insert(setsToInsert);
    operations.push(insertPromise);
  }
  
  // Delete removed sets
  if (setsToDelete.length > 0) {
    const deletePromise = supabase
      .from('exercise_sets')
      .delete()
      .in('id', setsToDelete);
    operations.push(deletePromise);
  }
  
  // Execute all operations
  const results = await Promise.all(operations);
  
  // Check for errors
  for (const result of results) {
    if (result.error) throw result.error;
  }
  
  // Fetch the updated sets
  const { data: updatedSets, error: finalError } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('workout_id', workoutId)
    .eq('exercise_name', exerciseName)
    .order('set_number', { ascending: true });
    
  if (finalError) throw finalError;
  return updatedSets;
}

/**
 * Adds a new exercise to a workout
 */
export async function addExerciseToWorkout(workoutId: string, exerciseName: string, initialSets: number = 1) {
  const sets = Array.from({ length: initialSets }, (_, i) => ({
    workout_id: workoutId,
    exercise_name: exerciseName,
    weight: 0,
    reps: 0,
    set_number: i + 1,
    completed: true
  }));
  
  const { data, error } = await supabase
    .from('exercise_sets')
    .insert(sets)
    .select();
    
  if (error) throw error;
  return data;
}

/**
 * Removes an exercise from a workout by deleting all its sets
 */
export async function removeExerciseFromWorkout(workoutId: string, exerciseName: string) {
  const { error } = await supabase
    .from('exercise_sets')
    .delete()
    .eq('workout_id', workoutId)
    .eq('exercise_name', exerciseName);
    
  if (error) throw error;
  return true;
}

/**
 * Resets exercise sets for a workout (marks all as incomplete with zero weight/reps)
 */
export async function resetWorkoutSets(workoutId: string) {
  try {
    const { data, error } = await supabase
      .from('exercise_sets')
      .update({
        weight: 0,
        reps: 0,
        completed: false
      })
      .eq('workout_id', workoutId)
      .select();
      
    if (error) throw error;
    
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Error resetting workout sets:", error);
    throw error;
  }
}

/**
 * Bulk resets exercise sets for multiple workouts
 */
export async function bulkResetWorkoutSets(workoutIds: string[]) {
  if (!workoutIds.length) return { success: true, count: 0 };
  
  try {
    const { data, error } = await supabase
      .from('exercise_sets')
      .update({
        weight: 0,
        reps: 0,
        completed: false
      })
      .in('workout_id', workoutIds)
      .select();
      
    if (error) throw error;
    
    return { success: true, count: data?.length || 0, workoutCount: workoutIds.length };
  } catch (error) {
    console.error("Error bulk resetting workout sets:", error);
    throw error;
  }
}
