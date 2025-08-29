-- Add missing foreign key for exercise_sets.exercise_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exercise_sets_exercise_id_fkey'
  ) THEN
    ALTER TABLE public.exercise_sets
    ADD CONSTRAINT exercise_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);
  END IF;
END $$;
