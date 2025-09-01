-- Add missing timing columns to exercise_sets table for analytics compatibility
-- This migration is idempotent and safe to run multiple times

-- Add timing columns if they don't exist
ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS timing_quality VARCHAR(50) DEFAULT 'legacy',
ADD COLUMN IF NOT EXISTS rest_ms INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS set_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS set_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rest_frozen_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_exercise_sets_timing_quality ON public.exercise_sets(timing_quality);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_rest_ms ON public.exercise_sets(rest_ms) WHERE rest_ms IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercise_sets_timing ON public.exercise_sets(set_started_at, set_completed_at) WHERE set_started_at IS NOT NULL AND set_completed_at IS NOT NULL;

-- Create analytics view for query stability
CREATE OR REPLACE VIEW public.v_exercise_sets_analytics AS
SELECT 
    id, workout_id, exercise_id, exercise_name, weight, reps, completed,
    set_number, created_at, rest_time, variant_id, rpe, form_quality,
    started_at, completed_at, actual_rest_ms, user_feedback, failure_point,
    COALESCE(timing_quality, 'legacy') as timing_quality,
    rest_ms, set_started_at, set_completed_at, rest_frozen_at,
    timing_source
FROM public.exercise_sets;

-- Update existing records to have legacy timing quality if NULL
UPDATE public.exercise_sets 
SET timing_quality = 'legacy' 
WHERE timing_quality IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.exercise_sets.timing_quality IS 'Data quality indicator for rest timing calculations: legacy, estimated, actual';
COMMENT ON COLUMN public.exercise_sets.rest_ms IS 'Calculated rest period in milliseconds between sets';
COMMENT ON COLUMN public.exercise_sets.set_started_at IS 'Timestamp when set execution started';
COMMENT ON COLUMN public.exercise_sets.set_completed_at IS 'Timestamp when set execution completed';
COMMENT ON VIEW public.v_exercise_sets_analytics IS 'Stable analytics view with guaranteed timing columns for metrics calculations';