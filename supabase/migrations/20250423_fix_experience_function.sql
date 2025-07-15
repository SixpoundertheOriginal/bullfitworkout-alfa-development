
-- Fix the update_user_experience function to not use jsonb_set
CREATE OR REPLACE FUNCTION public.update_user_experience()
RETURNS TRIGGER AS $$
DECLARE
  xp_gained INTEGER;
  workout_duration INTEGER;
  user_exp JSONB;
  training_type TEXT;
  new_total_xp INTEGER;
  type_xp INTEGER;
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
  
  -- Update total XP directly without using jsonb_set
  new_total_xp := COALESCE((user_exp->>'totalXp')::INTEGER, 0) + xp_gained;
  user_exp = user_exp || jsonb_build_object('totalXp', new_total_xp);
  
  -- Update training type specific XP if it exists in the data structure
  training_type := NEW.training_type;
  IF training_type IS NOT NULL AND user_exp->'trainingTypeLevels'->training_type IS NOT NULL THEN
    type_xp := COALESCE((user_exp->'trainingTypeLevels'->training_type->>'xp')::INTEGER, 0) + xp_gained;
    
    -- Use alternative approach without jsonb_set
    user_exp := user_exp || 
      jsonb_build_object(
        'trainingTypeLevels', 
        user_exp->'trainingTypeLevels' || 
          jsonb_build_object(
            training_type, 
            jsonb_build_object('xp', type_xp)
          )
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

-- Make sure the trigger is properly created
DROP TRIGGER IF EXISTS on_workout_completed ON public.workout_sessions;

CREATE TRIGGER on_workout_completed
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  WHEN (NEW.end_time IS NOT NULL)
  EXECUTE FUNCTION public.update_user_experience();
