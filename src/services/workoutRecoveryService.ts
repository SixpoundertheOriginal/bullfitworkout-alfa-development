
import { supabase } from "@/integrations/supabase/client";

/**
 * Restores a deleted workout with its exercise sets
 */
export async function restoreWorkout(workout: any) {
  if (!workout || !workout.id) {
    throw new Error("Invalid workout data");
  }
  
  // Insert the workout back
  const { data: restoredWorkout, error: workoutError } = await supabase
    .from('workout_sessions')
    .insert({
      id: workout.id,
      name: workout.name,
      training_type: workout.training_type,
      start_time: workout.start_time,
      end_time: workout.end_time,
      duration: workout.duration,
      notes: workout.notes,
      user_id: workout.user_id,
    })
    .select()
    .single();
  
  if (workoutError) {
    console.error("Error restoring workout:", workoutError);
    throw workoutError;
  }
  
  // Fetch the original exercise sets for this workout
  const { data: sets, error: fetchError } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('workout_id', workout.id);
    
  if (fetchError) {
    console.error("Error fetching associated exercise sets:", fetchError);
    return restoredWorkout;
  }
  
  if (sets && sets.length > 0) {
    const { error: insertError } = await supabase
      .from('exercise_sets')
      .insert(sets.map(set => ({
        workout_id: workout.id,
        exercise_name: set.exercise_name,
        weight: set.weight,
        reps: set.reps,
        set_number: set.set_number,
        completed: set.completed
      })));
      
    if (insertError) {
      console.error("Error restoring exercise sets:", insertError);
    }
  }
  
  return restoredWorkout;
}

/**
 * Recovers a partially saved workout by making sure it's visible in the workout history
 * This function attempts to fix issues with materialized views and analytics
 */
export async function recoverPartialWorkout(workoutId: string) {
  try {
    console.log(`Attempting to recover partially saved workout: ${workoutId}`);
    
    // 1. First check if the workout exists
    const { data: workout, error: workoutError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', workoutId)
      .single();
      
    if (workoutError) {
      console.error("Workout not found during recovery:", workoutError);
      return { success: false, error: "Workout not found" };
    }
    
    // 2. Check if there are exercise sets associated with this workout
    const { data: sets, error: setsError } = await supabase
      .from('exercise_sets')
      .select('count')
      .eq('workout_id', workoutId);
      
    if (setsError) {
      console.error("Error checking exercise sets during recovery:", setsError);
    }
    
    const setCount = sets && sets.length > 0 ? parseInt(String(sets[0].count), 10) : 0;
    console.log(`Found ${setCount} sets for workout ${workoutId}`);
    
    // 3. Update the workout to ensure it's visible in history
    // This is a hack that forces a refresh of the workout in the database
    // which can help with materialized view issues
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workout_sessions')
      .update({ 
        updated_at: new Date().toISOString(),
        logged_at: new Date().toISOString() // Ensure logged_at is updated
      })
      .eq('id', workoutId)
      .select();
      
    if (updateError) {
      console.error("Error updating workout during recovery:", updateError);
      return { success: false, error: "Failed to update workout" };
    }
    
    console.log("Successfully triggered workout update for recovery");
    
    // 4. Try to execute edge function to refresh analytics
    try {
      const { error: refreshError } = await supabase.functions.invoke('recover-workout', {
        body: { workoutId }
      });
      
      if (refreshError) {
        console.error("Error refreshing analytics during recovery:", refreshError);
        return {
          success: true,
          partial: true,
          workout: updatedWorkout?.[0] || workout,
          setCount,
          analyticsError: refreshError.message
        };
      }
      
      console.log("Successfully refreshed analytics via edge function");
    } catch (error) {
      console.warn("Error invoking recover-workout function:", error);
      // Try a direct approach as fallback - Remove the direct RPC call since it's not supported
      try {
        console.warn("Direct analytics refresh not available - Edge function failed");
      } catch (directError) {
        console.warn("Direct refresh failed:", directError);
      }
    }
    
    return { 
      success: true, 
      workout: updatedWorkout?.[0] || workout,
      setCount
    };
  } catch (error) {
    console.error("Error in recoverPartialWorkout:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Checks if a workout's exercises are properly visible in the workout history
 * and attempts to fix any issues
 */
export const diagnoseAndFixWorkout = async (workoutId: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
  workoutFixed?: boolean;
}> => {
  try {
    // First try using the edge function
    const { data: recoveryData, error: recoveryError } = await supabase.functions
      .invoke('recover-workout', {
        body: { workoutId }
      });
      
    if (recoveryError) {
      console.error('Edge function error:', recoveryError);
      throw new Error(`Failed to diagnose workout: ${recoveryError.message}`);
    }
    
    // If edge function was successful but no workout found
    if (!recoveryData.success) {
      console.warn('Recovery unsuccessful:', recoveryData);
      return {
        success: false,
        message: recoveryData.error || 'Could not find or fix the workout',
        details: recoveryData
      };
    }
    
    // Try to manually trigger analytics refresh - Remove direct RPC call
    try {
      console.log('Analytics refresh handled by edge function');
    } catch (refreshError) {
      console.warn('Failed to refresh analytics:', refreshError);
      // Continue despite analytics refresh failure
    }
    
    return {
      success: true,
      message: 'Successfully recovered workout data',
      details: recoveryData,
      workoutFixed: true
    };
  } catch (error) {
    console.error('Error in diagnoseAndFixWorkout:', error);
    
    // Fallback method if edge function fails
    return {
      success: false,
      message: `Error diagnosing workout: ${error.message}`,
      workoutFixed: false
    };
  }
};
