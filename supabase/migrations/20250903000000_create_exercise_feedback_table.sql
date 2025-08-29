CREATE TABLE IF NOT EXISTS public.exercise_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  satisfaction INTEGER CHECK (satisfaction BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercise_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exercise feedback"
  ON public.exercise_feedback
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = exercise_feedback.workout_id
        AND ws.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = exercise_feedback.workout_id
        AND ws.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_exercise_feedback_workout ON public.exercise_feedback(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_exercise ON public.exercise_feedback(exercise_id);
