
-- Add training_experience to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS training_experience JSONB DEFAULT '{"totalXp": 0, "trainingTypeLevels": {"Strength": {"xp": 0}, "Cardio": {"xp": 0}, "Yoga": {"xp": 0}, "Calisthenics": {"xp": 0}}}'::jsonb;

-- Create experience_logs table to track experience gain history
CREATE TABLE IF NOT EXISTS public.experience_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  training_type TEXT,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.experience_logs ENABLE ROW LEVEL SECURITY;

-- Policy for experience_logs: users can only view their own logs
CREATE POLICY "Users can view their own experience logs"
  ON public.experience_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for experience_logs: users can insert their own logs
CREATE POLICY "Users can insert their own experience logs"
  ON public.experience_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for user_profiles: users can update their own training_experience
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update their own training_experience'
  ) THEN
    CREATE POLICY "Users can update their own training_experience"
      ON public.user_profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Function to update experience when completing workout
CREATE OR REPLACE FUNCTION public.update_user_experience()
RETURNS TRIGGER AS $$
DECLARE
  xp_gained INTEGER;
  workout_duration INTEGER;
  user_exp JSONB;
  training_type TEXT;
BEGIN
  -- Calculate XP based on workout duration (basic formula)
  workout_duration := COALESCE(NEW.duration, 0);
  xp_gained := GREATEST(10, workout_duration * 2); -- minimum 10 XP, otherwise 2 XP per minute
  
  -- Get user's current experience data
  SELECT training_experience INTO user_exp
  FROM public.user_profiles
  WHERE id = NEW.user_id;
  
  -- If no experience data, initialize it
  IF user_exp IS NULL THEN
    user_exp := '{"totalXp": 0, "trainingTypeLevels": {"Strength": {"xp": 0}, "Cardio": {"xp": 0}, "Yoga": {"xp": 0}, "Calisthenics": {"xp": 0}}}'::jsonb;
  END IF;
  
  -- Update total XP
  user_exp := jsonb_set(user_exp, '{totalXp}', to_jsonb(COALESCE((user_exp->>'totalXp')::INTEGER, 0) + xp_gained));
  
  -- Update training type specific XP if it exists in the data structure
  training_type := NEW.training_type;
  IF training_type IS NOT NULL AND user_exp->'trainingTypeLevels'->training_type IS NOT NULL THEN
    user_exp := jsonb_set(
      user_exp, 
      '{trainingTypeLevels, ' || training_type || ', xp}', 
      to_jsonb(COALESCE((user_exp->'trainingTypeLevels'->training_type->>'xp')::INTEGER, 0) + xp_gained)
    );
  END IF;
  
  -- Update user profile
  UPDATE public.user_profiles
  SET training_experience = user_exp
  WHERE id = NEW.user_id;
  
  -- Log the experience gain
  INSERT INTO public.experience_logs (
    user_id,
    amount,
    training_type,
    source,
    metadata
  ) VALUES (
    NEW.user_id,
    xp_gained,
    training_type,
    'workout_completion',
    jsonb_build_object(
      'workout_id', NEW.id,
      'workout_duration', workout_duration,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger for workout completion
DROP TRIGGER IF EXISTS on_workout_completed ON public.workout_sessions;

CREATE TRIGGER on_workout_completed
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  WHEN (NEW.end_time IS NOT NULL)
  EXECUTE FUNCTION public.update_user_experience();

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS experience_logs_user_id_idx ON public.experience_logs (user_id);
CREATE INDEX IF NOT EXISTS experience_logs_created_at_idx ON public.experience_logs (created_at);
