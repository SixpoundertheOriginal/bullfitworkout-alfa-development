ALTER TABLE public.exercise_sets
ADD CONSTRAINT exercise_sets_exercise_id_fkey
FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);
