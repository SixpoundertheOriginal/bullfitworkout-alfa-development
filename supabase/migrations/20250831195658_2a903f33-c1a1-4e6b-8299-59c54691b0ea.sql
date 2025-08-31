-- Phase 1: Enhanced Database Schema for Rest Timing Architecture
-- Add timing fields to exercise_sets table for accurate rest calculations

-- Add started_at timestamp field to capture when user begins each set
ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add completed_at timestamp field to capture when user marks set complete  
ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add actual_rest_ms field to store calculated rest time from previous set
ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS actual_rest_ms INTEGER;

-- Add timing_source enum to track data quality
DO $$ BEGIN
    CREATE TYPE timing_source AS ENUM ('actual', 'estimated', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS timing_source timing_source DEFAULT 'estimated';

-- Create index for timing queries
CREATE INDEX IF NOT EXISTS idx_exercise_sets_timing 
ON public.exercise_sets (workout_id, started_at, completed_at);

-- Update existing data to use created_at as fallback for completed_at
UPDATE public.exercise_sets 
SET completed_at = created_at 
WHERE completed_at IS NULL;

-- Update RLS policies to include new timing fields
DROP POLICY IF EXISTS "Users can insert their own exercise sets" ON public.exercise_sets;
CREATE POLICY "Users can insert their own exercise sets" 
ON public.exercise_sets 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM workout_sessions 
  WHERE workout_sessions.id = exercise_sets.workout_id 
  AND workout_sessions.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update their own exercise sets" ON public.exercise_sets;
CREATE POLICY "Users can update their own exercise sets" 
ON public.exercise_sets 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1 FROM workout_sessions 
  WHERE workout_sessions.id = exercise_sets.workout_id 
  AND workout_sessions.user_id = auth.uid()
));

-- Create function to calculate and update rest times
CREATE OR REPLACE FUNCTION public.calculate_rest_times(p_workout_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  set_record RECORD;
  prev_completed_at TIMESTAMP WITH TIME ZONE;
  rest_ms INTEGER;
BEGIN
  FOR set_record IN 
    SELECT id, started_at, completed_at, set_number
    FROM public.exercise_sets 
    WHERE workout_id = p_workout_id 
    ORDER BY set_number, created_at
  LOOP
    IF prev_completed_at IS NOT NULL AND set_record.started_at IS NOT NULL THEN
      -- Calculate rest as: start(n+1) - complete(n)
      rest_ms := EXTRACT(EPOCH FROM (set_record.started_at - prev_completed_at)) * 1000;
      
      -- Update the set with calculated rest time
      UPDATE public.exercise_sets 
      SET actual_rest_ms = rest_ms,
          timing_source = CASE 
            WHEN set_record.started_at IS NOT NULL AND prev_completed_at IS NOT NULL 
            THEN 'actual'::timing_source
            ELSE 'estimated'::timing_source
          END
      WHERE id = set_record.id;
    END IF;
    
    prev_completed_at := set_record.completed_at;
  END LOOP;
END;
$$;

-- Create trigger to automatically calculate rest times when sets are inserted/updated
CREATE OR REPLACE FUNCTION public.trigger_calculate_rest_times()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalculate rest times for the entire workout when any set changes
  PERFORM public.calculate_rest_times(NEW.workout_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_rest_times_trigger ON public.exercise_sets;
CREATE TRIGGER calculate_rest_times_trigger
  AFTER INSERT OR UPDATE ON public.exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_rest_times();