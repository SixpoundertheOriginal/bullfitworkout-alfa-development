-- Fix security issues: Enable RLS and add proper policies for backup table and views

-- Enable RLS on the backup table
ALTER TABLE exercises_backup_20250830 ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for backup table (admin access only)
CREATE POLICY "Only admins can access exercise backup data" 
ON exercises_backup_20250830 
FOR ALL 
USING (false); -- Restrict access completely for now

-- Drop the views that are causing security issues and recreate as functions
DROP VIEW IF EXISTS exercise_integrity_audit;
DROP VIEW IF EXISTS orphaned_exercise_references;

-- Create secure functions instead of views for auditing
CREATE OR REPLACE FUNCTION get_exercise_integrity_audit()
RETURNS TABLE(
  issue_type text,
  name text,
  occurrence_count bigint,
  affected_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'duplicate_names'::text as issue_type,
    e.name,
    COUNT(*) as occurrence_count,
    ARRAY_AGG(e.id) as affected_ids
  FROM exercises e
  GROUP BY e.name 
  HAVING COUNT(*) > 1
  UNION ALL
  SELECT 
    'nullable_is_custom'::text as issue_type,
    'is_custom field'::text as name,
    COUNT(*) as occurrence_count,
    ARRAY_AGG(e.id) as affected_ids
  FROM exercises e
  WHERE e.is_custom IS NULL
  UNION ALL
  SELECT 
    'nullable_created_by'::text as issue_type,
    'created_by field'::text as name,
    COUNT(*) as occurrence_count,
    ARRAY_AGG(e.id) as affected_ids
  FROM exercises e
  WHERE e.created_by IS NULL;
END;
$$;

-- Create function for orphaned references audit
CREATE OR REPLACE FUNCTION get_orphaned_exercise_references()
RETURNS TABLE(
  issue_type text,
  name text,
  occurrence_count bigint,
  affected_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'orphaned_exercise_sets'::text as issue_type,
    'missing_exercise_reference'::text as name,
    COUNT(*) as occurrence_count,
    ARRAY_AGG(es.id) as affected_ids
  FROM exercise_sets es
  LEFT JOIN exercises e ON es.exercise_name = e.name
  WHERE e.id IS NULL;
END;
$$;