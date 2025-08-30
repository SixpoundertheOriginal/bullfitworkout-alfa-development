-- CRITICAL: Create complete backup before ANY changes
CREATE TABLE exercises_backup_20250830 AS 
SELECT * FROM exercises 
WHERE created_at IS NOT NULL;

-- Audit current data integrity issues
CREATE OR REPLACE VIEW exercise_integrity_audit AS
SELECT 
  'duplicate_names' as issue_type,
  name,
  COUNT(*) as occurrence_count,
  ARRAY_AGG(id) as affected_ids
FROM exercises 
GROUP BY name 
HAVING COUNT(*) > 1
UNION ALL
SELECT 
  'nullable_is_custom' as issue_type,
  'is_custom field' as name,
  COUNT(*) as occurrence_count,
  ARRAY_AGG(id) as affected_ids
FROM exercises 
WHERE is_custom IS NULL
UNION ALL
SELECT 
  'nullable_created_by' as issue_type,
  'created_by field' as name,
  COUNT(*) as occurrence_count,
  ARRAY_AGG(id) as affected_ids
FROM exercises 
WHERE created_by IS NULL;

-- Check exercise_name vs exercise_id inconsistencies in sets
CREATE OR REPLACE VIEW orphaned_exercise_references AS
SELECT 
  'orphaned_workout_exercises' as issue_type,
  'missing_exercise_id' as name,
  COUNT(*) as occurrence_count,
  ARRAY_AGG(id) as affected_ids
FROM workout_sessions ws
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = ws.name
)
UNION ALL
SELECT 
  'orphaned_exercise_sets' as issue_type,
  'missing_exercise_reference' as name,
  COUNT(*) as occurrence_count,
  ARRAY_AGG(es.id) as affected_ids
FROM exercise_sets es
LEFT JOIN exercises e ON es.exercise_name = e.name
WHERE e.id IS NULL;