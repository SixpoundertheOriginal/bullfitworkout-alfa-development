-- Phase 2: Fix duplicate exercise names and nullable critical fields (UUID Compatible)

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

-- Now resolve duplicate exercise names using created_at as tiebreaker
-- First, identify and log duplicates before merging
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

-- Delete duplicate exercises, keeping only the most recent one (by created_at)
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

-- Update any remaining NULL created_by fields to a system user
-- First ensure we have a system entry in user_profiles
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