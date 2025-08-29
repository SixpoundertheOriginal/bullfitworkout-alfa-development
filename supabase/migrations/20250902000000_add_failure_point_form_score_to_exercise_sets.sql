BEGIN;
ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS failure_point TEXT CHECK (failure_point IN ('none','technical','muscular')),
  ADD COLUMN IF NOT EXISTS form_score INTEGER CHECK (form_score >= 1 AND form_score <= 5);

CREATE OR REPLACE FUNCTION public.save_workout_transaction(
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
  v_user_id := (p_workout_data->>'user_id')::UUID;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  BEGIN
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

    WITH sets_data AS (
      SELECT * FROM jsonb_to_recordset(p_exercise_sets) AS sets(
        exercise_name TEXT,
        weight NUMERIC,
        reps INTEGER,
        set_number INTEGER,
        completed BOOLEAN,
        rest_time INTEGER,
        rpe NUMERIC,
        variant_id UUID,
        tempo TEXT,
        range_of_motion TEXT,
        added_weight NUMERIC,
        assistance_used NUMERIC,
        notes TEXT,
        failure_point TEXT,
        form_score INTEGER
      )
    )
    INSERT INTO public.exercise_sets (
      workout_id,
      exercise_name,
      weight,
      reps,
      set_number,
      completed,
      rest_time,
      rpe,
      variant_id,
      tempo,
      range_of_motion,
      added_weight,
      assistance_used,
      notes,
      failure_point,
      form_score
    )
    SELECT
      v_workout_id,
      sets.exercise_name,
      sets.weight,
      sets.reps,
      sets.set_number,
      sets.completed,
      sets.rest_time,
      sets.rpe,
      sets.variant_id,
      sets.tempo,
      sets.range_of_motion,
      sets.added_weight,
      sets.assistance_used,
      sets.notes,
      sets.failure_point,
      sets.form_score
    FROM sets_data sets;

    BEGIN
      PERFORM pg_notify('refresh_workout_analytics', v_workout_id::TEXT);
      BEGIN
        PERFORM public.refresh_workout_analytics();
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    v_result := jsonb_build_object(
      'success', true,
      'workout_id', v_workout_id
    );
    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
  END;
END;
$$;
COMMIT;
