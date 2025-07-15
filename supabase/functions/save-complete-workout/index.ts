
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Processing workout save for user ${workout_data.user_id} with ${exercise_sets.length} sets`);

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
      p_exercise_sets: exercise_sets
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
        const formattedSets = exercise_sets.map(set => ({
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
