-- Backfill exercise_id in exercise_sets by matching on exercise_name
UPDATE exercise_sets es
SET exercise_id = e.id
FROM exercises e
WHERE es.exercise_id IS NULL
  AND es.exercise_name = e.name;
