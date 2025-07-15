
-- This is a SQL function to create a transactional save operation for workouts
-- This will be executed separately by the user 

CREATE OR REPLACE FUNCTION public.save_complete_workout(
  p_workout_data JSONB,
  p_exercise_sets JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workout_id UUID;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Extract user_id from the workout data
  v_user_id := (p_workout_data->>'user_id')::UUID;
  
  -- Validate user_id
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  -- Start a transaction
  BEGIN
    -- Insert the workout record
    INSERT INTO public.workout_sessions (
      user_id,
      name,
      training_type,
      start_time,
      end_time,
      duration,
      notes
    ) VALUES (
      v_user_id,
      p_workout_data->>'name',
      p_workout_data->>'training_type',
      (p_workout_data->>'start_time')::TIMESTAMPTZ,
      (p_workout_data->>'end_time')::TIMESTAMPTZ,
      (p_workout_data->>'duration')::INTEGER,
      p_workout_data->>'notes'
    )
    RETURNING id INTO v_workout_id;
    
    -- Insert exercise sets
    WITH sets_data AS (
      SELECT * FROM jsonb_to_recordset(p_exercise_sets) AS sets(
        exercise_name TEXT,
        weight NUMERIC,
        reps INTEGER,
        set_number INTEGER,
        completed BOOLEAN,
        rest_time INTEGER
      )
    )
    INSERT INTO public.exercise_sets (
      workout_id,
      exercise_name,
      weight,
      reps,
      set_number,
      completed,
      rest_time
    )
    SELECT 
      v_workout_id,
      sets.exercise_name,
      sets.weight,
      sets.reps,
      sets.set_number,
      sets.completed,
      sets.rest_time
    FROM sets_data sets;
    
    -- Try to refresh materialized views if available
    BEGIN
      PERFORM pg_notify('refresh_workout_analytics', v_workout_id::TEXT);
      
      -- Try direct refresh if function exists
      BEGIN
        PERFORM public.refresh_workout_analytics();
      EXCEPTION WHEN OTHERS THEN
        -- Function may not exist, just continue
        NULL;
      END;
      
    EXCEPTION WHEN OTHERS THEN
      -- Not critical, continue even if this fails
      NULL;
    END;

    -- Return success result
    v_result := jsonb_build_object(
      'success', true,
      'workout_id', v_workout_id
    );
    
    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    -- Handle transaction failure
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    
    RETURN v_result;
  END;
END;
$$;

-- Create or replace the function to manually refresh analytics
CREATE OR REPLACE FUNCTION public.refresh_workout_analytics(
  p_workout_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to refresh the materialized views if they exist
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY workout_type_distribution;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- View doesn't exist, ignore
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_performance_summary;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- View doesn't exist, ignore
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY workout_time_preferences;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- View doesn't exist, ignore
  END;
  
  -- Add this field to exercise_sets if it doesn't exist
  BEGIN
    ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS rest_time INTEGER DEFAULT 60;
  EXCEPTION WHEN others THEN
    NULL; -- Column already exists or other issue, ignore
  END;
END;
$$;
