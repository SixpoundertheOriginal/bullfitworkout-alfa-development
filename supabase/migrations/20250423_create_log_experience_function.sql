
-- Create a function to log experience gains
CREATE OR REPLACE FUNCTION public.log_experience_gain(
  user_id UUID,
  xp_amount INTEGER,
  training_type_value TEXT,
  source_value TEXT,
  metadata_value JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.experience_logs (
    user_id,
    amount,
    training_type,
    source,
    metadata
  ) VALUES (
    user_id,
    xp_amount,
    training_type_value,
    source_value,
    metadata_value
  );
END;
$$;
