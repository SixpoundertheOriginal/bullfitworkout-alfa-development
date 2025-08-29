# Query Fallback Strategy

Some tables, such as `exercise_sets`, reference an `exercises` table by `exercise_id`. In
cases where the join returns `null` (for example when the reference record has been
removed or not yet migrated), queries should gracefully fall back to alternative
fields.

Preferred order when resolving an exercise name:

1. `exercises.name` from the joined `exercises` table.
2. `exercise_sets.exercise_name` stored alongside the set.
3. `exercise_sets.exercise_id` as a final identifier.

When implementing new Supabase queries, include the `exercise_name` column and apply
this cascade to avoid empty labels in dropdowns or analytics.
