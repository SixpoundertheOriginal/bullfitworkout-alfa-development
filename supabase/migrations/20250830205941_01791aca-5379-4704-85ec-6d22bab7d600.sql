-- Phase 2: Critical Data Integrity Fixes (Simplified Approach)

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
  merged_ids TEXT[],
  canonical_id UUID,
  merge_date TIMESTAMP DEFAULT NOW(),
  affected_workout_count INTEGER
);

-- Enable RLS on audit table
ALTER TABLE exercise_merge_audit ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for audit table (admin access only for now)
CREATE POLICY "Restrict access to merge audit" 
ON exercise_merge_audit 
FOR ALL 
USING (false);

-- Log duplicate exercises before resolving them
WITH duplicate_exercises AS (
  SELECT 
    name,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM exercises
  WHERE name IN (
    SELECT name 
    FROM exercises 
    GROUP BY name 
    HAVING COUNT(*) > 1
  )
),
canonical_exercises AS (
  SELECT name, id as canonical_id
  FROM duplicate_exercises 
  WHERE rn = 1
)
INSERT INTO exercise_merge_audit (original_name, canonical_id, affected_workout_count)
SELECT 
  ce.name,
  ce.canonical_id,
  COALESCE((
    SELECT COUNT(DISTINCT es.workout_id)
    FROM exercise_sets es
    WHERE es.exercise_name = ce.name
  ), 0) as affected_workout_count
FROM canonical_exercises ce;

-- Delete duplicate exercises, keeping only the most recent one
WITH duplicate_exercises AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM exercises
  WHERE name IN (
    SELECT name 
    FROM exercises 
    GROUP BY name 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM exercises 
WHERE id IN (
  SELECT id 
  FROM duplicate_exercises 
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE exercises 
ADD CONSTRAINT exercises_name_unique UNIQUE (name);

-- Handle NULL created_by fields by setting them to an existing user
-- Find the first user and use their ID, or skip if no users exist
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the first user ID from user_profiles
  SELECT id INTO first_user_id 
  FROM user_profiles 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- Only update if we found a user
  IF first_user_id IS NOT NULL THEN
    UPDATE exercises 
    SET created_by = first_user_id
    WHERE created_by IS NULL;
  END IF;
END $$;