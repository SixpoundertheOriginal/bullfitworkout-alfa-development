-- Enable row level security on exercise_sets and exercises
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow users to manage exercise_sets tied to their workout sessions
CREATE POLICY "Users can manage own exercise_sets"
ON public.exercise_sets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = exercise_sets.workout_id
      AND ws.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = exercise_sets.workout_id
      AND ws.user_id = auth.uid()
  )
);

-- Allow users to manage exercises they created
CREATE POLICY "Users can manage own exercises"
ON public.exercises
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
