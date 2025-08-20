-- Add estimated set duration and actual timing fields to exercise_sets
ALTER TABLE exercise_sets 
ADD COLUMN estimated_set_duration INTEGER DEFAULT NULL,
ADD COLUMN actual_start_time TIMESTAMP DEFAULT NULL,
ADD COLUMN actual_end_time TIMESTAMP DEFAULT NULL;

-- Create learning table for personalized estimates
CREATE TABLE set_duration_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_id UUID REFERENCES exercises(id),
  avg_duration_seconds INTEGER NOT NULL DEFAULT 30,
  sample_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, exercise_name)
);

-- Add RLS policies
ALTER TABLE set_duration_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own duration patterns" ON set_duration_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Update user preferences
ALTER TABLE user_profiles 
ADD COLUMN rest_timer_preferences JSONB DEFAULT '{"precisionMode": false, "showAdjustedRest": true}';
