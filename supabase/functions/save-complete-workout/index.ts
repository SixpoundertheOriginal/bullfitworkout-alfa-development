
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkoutSet {
  actual_start_time?: string;
  actual_end_time?: string;
  exercise_name: string;
  exercise_id?: string;
  rest_time?: number | null;
  rpe?: number | null;
  variant_id?: string | null;
  tempo?: string | null;
  range_of_motion?: string | null;
  added_weight?: number | null;
  assistance_used?: number | null;
  notes?: string | null;
  failure_point?: string | null;
  form_score?: number | null;
  [key: string]: unknown;
}

const calculateRestTimes = (sets: WorkoutSet[]) => {
  let lastEnd: number | null = null;
  return sets.map((set) => {
    const updated = { ...set };
    if (set.actual_start_time && lastEnd) {
      updated.rest_time = Math.round(
        (new Date(set.actual_start_time).getTime() - lastEnd) / 1000,
      );
    }
    if (set.actual_end_time) {
      lastEnd = new Date(set.actual_end_time).getTime();
    }
    return updated;
  });
};

const updateDurationPatterns = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  sets: WorkoutSet[],
) => {
  for (const set of sets) {
    if (set.actual_start_time && set.actual_end_time) {
      const duration = Math.round(
        (new Date(set.actual_end_time).getTime() -
          new Date(set.actual_start_time).getTime()) / 1000,
      );
      const { data: existing } = await supabase
        .from('set_duration_patterns')
        .select('avg_duration_seconds, sample_count')
        .eq('user_id', userId)
        .eq('exercise_name', set.exercise_name)
        .single();
      const count = existing?.sample_count ? existing.sample_count + 1 : 1;
      const avg = existing
        ? Math.round(
            (existing.avg_duration_seconds * existing.sample_count + duration) /
              count,
          )
        : duration;
      await supabase.from('set_duration_patterns').upsert({
        user_id: userId,
        exercise_name: set.exercise_name,
        exercise_id: set.exercise_id || null,
        avg_duration_seconds: avg,
        sample_count: count,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id,exercise_name' });
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { workout_data, exercise_sets } = await req.json();

    if (!workout_data || !exercise_sets || !workout_data.user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedSets = calculateRestTimes(exercise_sets);
    console.log(`Processing workout save for user ${workout_data.user_id} with ${processedSets.length} sets`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use transaction function for atomic operations
    const { data: result, error: transactionError } = await supabase.rpc('save_workout_transaction', {
      p_workout_data: workout_data,
      p_exercise_sets: processedSets
    });

    if (transactionError) {
      console.error("Transaction error:", transactionError);
      
      // Try a fallback approach if the transaction fails
      try {
        // 1. First insert the workout
        const { data: workout, error: workoutError } = await supabase
          .from('workout_sessions')
          .insert(workout_data)
          .select('id')
          .single();

        if (workoutError) {
          throw workoutError;
        }

        // 2. Then insert the exercise sets
        const formattedSets = processedSets.map(set => ({
          ...set,
          workout_id: workout.id
        }));

        const { error: setsError } = await supabase
          .from('exercise_sets')
          .insert(formattedSets);

        if (setsError) {
          console.error("Error inserting exercise sets:", setsError);
          // Even with errors, we return success with the workout ID so the client knows
          // this is a partial save that might need recovery
          return new Response(
            JSON.stringify({ 
              workout_id: workout.id, 
              partial: true, 
              error: "Some exercise sets could not be saved"
            }),
            { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 3. Try to refresh analytics
        try {
          // Make multiple attempts to refresh analytics
          for (let i = 0; i < 3; i++) {
            try {
              await supabase.rpc('refresh_workout_analytics');
              console.log("Analytics refreshed successfully");
              break;
            } catch (refreshError) {
              console.warn(`Analytics refresh attempt ${i+1} failed:`, refreshError);
              if (i < 2) {
                // Wait 500ms before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
          
          // Mark the workout as complete by updating the updated_at timestamp
          await supabase
            .from('workout_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', workout.id);
        } catch (analyticsError) {
          console.warn("Analytics refresh failed but workout was saved:", analyticsError);
        }
        await updateDurationPatterns(supabase, workout_data.user_id, processedSets);

        return new Response(
          JSON.stringify({ workout_id: workout.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error("Fallback approach failed:", fallbackError);
        throw fallbackError;
      }
    }

    // Try to ensure analytics are up to date
    try {
      await supabase.rpc('refresh_workout_analytics');
    } catch (refreshError) {
      // Non-blocking error; workout saved successfully
      console.warn("Analytics refresh failed after transaction:", refreshError);
    }

    await updateDurationPatterns(supabase, workout_data.user_id, processedSets);

    return new Response(
      JSON.stringify({ workout_id: result.workout_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in save-complete-workout function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
