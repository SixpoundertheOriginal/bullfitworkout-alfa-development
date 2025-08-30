-- Phase 2: Fix duplicate exercise names and nullable critical fields (Corrected)

-- First, fix nullable is_custom field (critical for RLS policies)
UPDATE exercises 
SET is_custom = false 
WHERE is_custom IS NULL;

-- Set NOT NULL constraint and default
ALTER TABLE exercises 
ALTER COLUMN is_custom SET NOT NULL,
ALTER COLUMN is_custom SET DEFAULT false;

-- Create table for merge audit if it doesn't exist
CREATE TABLE IF NOT EXISTS exercise_merge_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  merged_ids TEXT[], -- Using TEXT array instead of UUID array for simplicity
  canonical_id UUID,
  merge_date TIMESTAMP DEFAULT NOW(),
  affected_workout_count INTEGER
);

-- Now resolve duplicate exercise names using a simpler approach
-- First, log duplicates before merging
INSERT INTO exercise_merge_audit (original_name, canonical_id, affected_workout_count)
SELECT 
  name,
  MAX(id) as canonical_id, -- Keep the one with the max ID (likely most recent)
  COALESCE((
    SELECT COUNT(DISTINCT es.workout_id)
    FROM exercise_sets es
    WHERE es.exercise_name = exercises.name
  ), 0) as affected_workout_count
FROM exercises 
WHERE name IN (
  SELECT name 
  FROM exercises 
  GROUP BY name 
  HAVING COUNT(*) > 1
)
GROUP BY name;

-- Delete duplicate exercises, keeping only one per name (the one with max ID)
DELETE FROM exercises 
WHERE id NOT IN (
  SELECT MAX(id)
  FROM exercises 
  GROUP BY name
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE exercises 
ADD CONSTRAINT exercises_name_unique UNIQUE (name);

-- Update any remaining NULL created_by fields to a system user
-- First ensure we have a system entry in user_profiles (not auth.users)
INSERT INTO user_profiles (id, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'System User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update exercises with NULL created_by
UPDATE exercises 
SET created_by = '00000000-0000-0000-0000-000000000000'
WHERE created_by IS NULL;