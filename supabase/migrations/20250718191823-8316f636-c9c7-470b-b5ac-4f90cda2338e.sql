
-- Enhanced Exercise Tracking Schema Migration
-- This migration adds advanced tracking capabilities while preserving all existing data

-- 1. Add enhanced tracking columns to existing exercise_sets table
ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.exercises(id),
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.exercise_variants(id),
ADD COLUMN IF NOT EXISTS tempo TEXT,
ADD COLUMN IF NOT EXISTS range_of_motion TEXT CHECK (range_of_motion IN ('full', 'top_half', 'bottom_half', 'dead_hang', 'partial')),
ADD COLUMN IF NOT EXISTS added_weight DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS assistance_used TEXT CHECK (assistance_used IN ('resistance_band', 'rest_pause', 'cluster_sets', 'assisted', 'deficit', 'elevated')),
ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add constraint to ensure either exercise_id OR exercise_name exists (but not both null)
ALTER TABLE public.exercise_sets 
ADD CONSTRAINT exercise_reference_check 
CHECK (exercise_id IS NOT NULL OR exercise_name IS NOT NULL);

-- 3. Create index for performance on new foreign key relationships
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise_id ON public.exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_variant_id ON public.exercise_sets(variant_id);

-- 4. Create exercise_variants table if it doesn't exist (from previous migration)
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

-- 5. Enable RLS for exercise_variants if not already enabled
ALTER TABLE public.exercise_variants ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for exercise_variants if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exercise_variants' 
    AND policyname = 'Users can view their own exercise variants'
  ) THEN
    CREATE POLICY "Users can view their own exercise variants" 
      ON public.exercise_variants 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exercise_variants' 
    AND policyname = 'Users can create their own exercise variants'
  ) THEN
    CREATE POLICY "Users can create their own exercise variants" 
      ON public.exercise_variants 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exercise_variants' 
    AND policyname = 'Users can update their own exercise variants'
  ) THEN
    CREATE POLICY "Users can update their own exercise variants" 
      ON public.exercise_variants 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exercise_variants' 
    AND policyname = 'Users can delete their own exercise variants'
  ) THEN
    CREATE POLICY "Users can delete their own exercise variants" 
      ON public.exercise_variants 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Create helper function to migrate exercise_name to exercise_id (optional, for future use)
CREATE OR REPLACE FUNCTION public.migrate_exercise_name_to_id()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update exercise_sets to link to exercises table based on name matching
  UPDATE public.exercise_sets es
  SET exercise_id = e.id
  FROM public.exercises e
  WHERE es.exercise_name = e.name 
    AND es.exercise_id IS NULL
    AND e.is_custom = false; -- Only match to system exercises initially
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Add indexes for exercise_variants table
CREATE INDEX IF NOT EXISTS idx_exercise_variants_base_exercise ON public.exercise_variants(base_exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_variants_user ON public.exercise_variants(user_id);

-- 9. Add trigger for updated_at on exercise_variants
CREATE OR REPLACE FUNCTION public.update_exercise_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exercise_variants_updated_at ON public.exercise_variants;
CREATE TRIGGER update_exercise_variants_updated_at
  BEFORE UPDATE ON public.exercise_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_variants_updated_at();

-- 10. Verify the migration completed successfully
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'exercise_sets' 
    AND column_name IN ('exercise_id', 'variant_id', 'tempo', 'range_of_motion', 'added_weight', 'assistance_used', 'rpe', 'notes');
  
  IF column_count < 8 THEN
    RAISE EXCEPTION 'Migration incomplete: Expected 8 new columns, found %', column_count;
  END IF;
  
  RAISE NOTICE 'Migration completed successfully. Added % enhanced tracking columns to exercise_sets.', column_count;
END $$;
