
-- Phase 1: Database Schema Enhancement

-- 1.1 Create Exercise Variants Table
CREATE TABLE IF NOT EXISTS public.exercise_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Variant specifications
  variant_name TEXT NOT NULL,
  grip_type TEXT CHECK (grip_type IN ('overhand', 'underhand', 'neutral', 'mixed', 'hook')),
  grip_width TEXT CHECK (grip_width IN ('shoulder_width', 'wide', 'close', 'extra_wide', 'narrow')),
  technique_type TEXT CHECK (technique_type IN ('standard', 'weighted', 'unilateral', 'explosive', 'isometric', 'pause_rep', 'cluster')),
  range_of_motion TEXT CHECK (range_of_motion IN ('full', 'top_half', 'bottom_half', 'dead_hang', 'partial')),
  tempo TEXT, -- Format: "3-1-2-0" (eccentric-pause-concentric-pause)
  assistance_type TEXT CHECK (assistance_type IN ('resistance_band', 'rest_pause', 'cluster_sets', 'assisted', 'deficit', 'elevated')),
  
  -- Progression data
  difficulty_modifier DECIMAL DEFAULT 1.0,
  progression_order INTEGER,
  ai_recommended BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  instructions JSONB,
  tips TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for exercise_variants
ALTER TABLE public.exercise_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_variants
CREATE POLICY "Users can view their own exercise variants" 
  ON public.exercise_variants 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise variants" 
  ON public.exercise_variants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise variants" 
  ON public.exercise_variants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise variants" 
  ON public.exercise_variants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 1.2 Enhance Exercise Sets Table
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.exercise_variants(id);
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS tempo TEXT;
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS range_of_motion TEXT;
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS added_weight DECIMAL DEFAULT 0;
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS assistance_used TEXT;
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10);
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS notes TEXT;

-- 1.3 Create Exercise Recommendations Table
CREATE TABLE IF NOT EXISTS public.exercise_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.exercise_variants(id) ON DELETE CASCADE,
  
  recommendation_type TEXT CHECK (recommendation_type IN ('weakness_target', 'progression', 'recovery', 'volume_match')),
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(user_id, exercise_id, variant_id, recommendation_type)
);

-- Enable RLS for exercise_recommendations
ALTER TABLE public.exercise_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_recommendations
CREATE POLICY "Users can view their own exercise recommendations" 
  ON public.exercise_recommendations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise recommendations" 
  ON public.exercise_recommendations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise recommendations" 
  ON public.exercise_recommendations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise recommendations" 
  ON public.exercise_recommendations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 1.4 Create Exercise Performance Analytics Table
CREATE TABLE IF NOT EXISTS public.exercise_variant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.exercise_variants(id),
  
  -- Performance metrics
  total_volume DECIMAL DEFAULT 0,
  max_weight DECIMAL DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  average_rpe DECIMAL,
  
  -- Progression tracking
  last_performed_at TIMESTAMPTZ,
  progression_trend TEXT CHECK (progression_trend IN ('improving', 'stable', 'declining')),
  personal_record JSONB,
  
  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for exercise_variant_analytics
ALTER TABLE public.exercise_variant_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_variant_analytics
CREATE POLICY "Users can view their own exercise analytics" 
  ON public.exercise_variant_analytics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise analytics" 
  ON public.exercise_variant_analytics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise analytics" 
  ON public.exercise_variant_analytics 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise analytics" 
  ON public.exercise_variant_analytics 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_variants_base_exercise ON public.exercise_variants(base_exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_variants_user ON public.exercise_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_user ON public.exercise_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_exercise ON public.exercise_recommendations(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_variant_analytics_user ON public.exercise_variant_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_variant_analytics_exercise ON public.exercise_variant_analytics(exercise_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_exercise_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercise_variants_updated_at
  BEFORE UPDATE ON public.exercise_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_variants_updated_at();

CREATE TRIGGER update_exercise_variant_analytics_updated_at
  BEFORE UPDATE ON public.exercise_variant_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_variants_updated_at();

-- Insert some sample exercise variants for popular exercises
INSERT INTO public.exercise_variants (base_exercise_id, user_id, variant_name, grip_type, grip_width, technique_type, range_of_motion, difficulty_modifier, progression_order, ai_recommended, description) 
SELECT 
  e.id,
  '00000000-0000-0000-0000-000000000000', -- System variants (will be visible to all users)
  'Standard Pull-up',
  'overhand',
  'shoulder_width',
  'standard',
  'full',
  1.0,
  1,
  true,
  'Classic pull-up with overhand grip at shoulder width'
FROM public.exercises e 
WHERE e.name ILIKE '%pull%up%' OR e.name ILIKE '%pull-up%'
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_variants (base_exercise_id, user_id, variant_name, grip_type, grip_width, technique_type, range_of_motion, difficulty_modifier, progression_order, ai_recommended, description) 
SELECT 
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'Wide-Grip Pull-up',
  'overhand',
  'wide',
  'standard',
  'full',
  1.2,
  2,
  true,
  'Pull-up with wide grip for increased lat activation'
FROM public.exercises e 
WHERE e.name ILIKE '%pull%up%' OR e.name ILIKE '%pull-up%'
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_variants (base_exercise_id, user_id, variant_name, grip_type, grip_width, technique_type, range_of_motion, difficulty_modifier, progression_order, ai_recommended, description) 
SELECT 
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'Chin-up',
  'underhand',
  'shoulder_width',
  'standard',
  'full',
  0.9,
  1,
  true,
  'Underhand grip pull-up emphasizing bicep involvement'
FROM public.exercises e 
WHERE e.name ILIKE '%pull%up%' OR e.name ILIKE '%pull-up%'
ON CONFLICT DO NOTHING;
