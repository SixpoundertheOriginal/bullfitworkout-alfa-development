-- Create the missing exercise_feedback table
CREATE TABLE public.exercise_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  perceived_difficulty INTEGER NOT NULL CHECK (perceived_difficulty >= 1 AND perceived_difficulty <= 10),
  satisfaction INTEGER NOT NULL CHECK (satisfaction >= 1 AND satisfaction <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.exercise_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own exercise feedback" ON public.exercise_feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own exercise feedback" ON public.exercise_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exercise feedback" ON public.exercise_feedback
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own exercise feedback" ON public.exercise_feedback
  FOR DELETE USING (user_id = auth.uid());