-- Create cache table for AI-generated motivational text
CREATE TABLE IF NOT EXISTS public.ai_motivation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT CHECK (period_type IN ('week','month')),
  period_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, period_type, period_id, locale)
);

-- Enable row level security
ALTER TABLE public.ai_motivation_cache ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own cached motivation
CREATE POLICY "Users can view own motivation cache" ON public.ai_motivation_cache
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own cached motivation
CREATE POLICY "Users can insert own motivation cache" ON public.ai_motivation_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own cached motivation
CREATE POLICY "Users can update own motivation cache" ON public.ai_motivation_cache
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Optional: service role can read all entries
CREATE POLICY "Service role can read motivation cache" ON public.ai_motivation_cache
  FOR SELECT USING (auth.role() = 'service_role');
