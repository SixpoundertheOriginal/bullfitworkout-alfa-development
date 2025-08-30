-- Phase 2: Fix duplicate exercise names and nullable critical fields

-- First, fix nullable is_custom field (critical for RLS policies)
UPDATE exercises 
SET is_custom = false 
WHERE is_custom IS NULL;

-- Set NOT NULL constraint and default
ALTER TABLE exercises 
ALTER COLUMN is_custom SET NOT NULL,
ALTER COLUMN is_custom SET DEFAULT false;

-- Fix nullable created_by field
UPDATE exercises 
SET created_by = (
  SELECT id FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE created_by IS NULL;

-- For exercises that still don't have a created_by, create a system user concept
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@bullfitapp.internal',
  '$2a$10$dummy.encrypted.password.hash',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update remaining NULL created_by to system user
UPDATE exercises 
SET created_by = '00000000-0000-0000-0000-000000000000'
WHERE created_by IS NULL;

-- Now resolve duplicate exercise names
-- Strategy: Keep most recent version, merge references to older versions
WITH duplicate_exercises AS (
  SELECT 
    name,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rank
  FROM exercises
  WHERE name IN (
    SELECT name 
    FROM exercises 
    GROUP BY name 
    HAVING COUNT(*) > 1
  )
),
exercises_to_merge AS (
  SELECT 
    name,
    ARRAY_AGG(id ORDER BY created_at ASC) as old_ids,
    ARRAY_AGG(id ORDER BY created_at DESC)[1] as canonical_id
  FROM duplicate_exercises
  GROUP BY name
)

-- Log the merge operation first
INSERT INTO exercise_merge_audit (original_name, merged_ids, canonical_id, affected_workout_count)
SELECT 
  etm.name,
  etm.old_ids,
  etm.canonical_id,
  COALESCE((
    SELECT COUNT(DISTINCT es.workout_id)
    FROM exercise_sets es
    WHERE es.exercise_name = etm.name
  ), 0)
FROM exercises_to_merge etm;

-- Create table for merge audit if it doesn't exist
CREATE TABLE IF NOT EXISTS exercise_merge_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  merged_ids UUID[],
  canonical_id UUID,
  merge_date TIMESTAMP DEFAULT NOW(),
  affected_workout_count INTEGER
);

-- Update exercise_sets to reference canonical exercise name
WITH duplicate_exercises AS (
  SELECT 
    name,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rank
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
  WHERE rank = 1
)
UPDATE exercise_sets 
SET exercise_name = ce.name
FROM canonical_exercises ce
WHERE exercise_sets.exercise_name = ce.name;

-- Delete duplicate exercises (keep only the most recent one)
DELETE FROM exercises e
WHERE e.id IN (
  SELECT de.id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rank
    FROM exercises
    WHERE name IN (
      SELECT name 
      FROM exercises 
      GROUP BY name 
      HAVING COUNT(*) > 1
    )
  ) de
  WHERE de.rank > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE exercises 
ADD CONSTRAINT exercises_name_unique UNIQUE (name);