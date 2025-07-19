
-- Phase 1: Database Schema Enhancement
-- Add AI-specific fields to existing user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS 
  ai_training_profile JSONB DEFAULT '{"preferredNamingStyle": "descriptive", "insightPreferences": {"showProgress": true, "showRecommendations": true}, "confidenceThreshold": 0.7}'::jsonb,
  ai_feedback_data JSONB DEFAULT '{}'::jsonb,
  pattern_confidence DECIMAL(3,2) DEFAULT 0.0,
  last_pattern_analysis TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create AI workout patterns table for learning and feedback
CREATE TABLE IF NOT EXISTS public.ai_workout_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  pattern_type VARCHAR(50) NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  feedback_type VARCHAR(20) CHECK (feedback_type IN ('accepted', 'rejected', 'modified')),
  user_feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for ai_workout_patterns
ALTER TABLE public.ai_workout_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI patterns" ON public.ai_workout_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI patterns" ON public.ai_workout_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI patterns" ON public.ai_workout_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI patterns" ON public.ai_workout_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_workout_patterns_user_id ON public.ai_workout_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_workout_patterns_pattern_type ON public.ai_workout_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_workout_patterns_created_at ON public.ai_workout_patterns(created_at DESC);

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_workout_patterns_updated_at 
    BEFORE UPDATE ON public.ai_workout_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_ai_patterns_updated_at();
