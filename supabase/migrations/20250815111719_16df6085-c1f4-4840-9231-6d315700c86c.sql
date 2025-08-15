-- Fix critical security issue: Profile data exposure
-- Remove overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Add secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Add SET search_path security protection to database functions
-- This prevents search path manipulation attacks

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.templates
  SET 
    usage_count = usage_count + 1,
    last_used = now()
  WHERE id = template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_workout(workout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete associated exercise sets first
  DELETE FROM exercise_sets WHERE workout_id = $1;
  
  -- Delete the workout session
  DELETE FROM workout_sessions WHERE id = $1;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_logged_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.logged_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_frequency_goals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update frequency-based goals
  UPDATE public.user_goals
  SET current_value = current_value + 1,
      last_updated = now()
  WHERE user_id = NEW.user_id
    AND goal_type = 'frequency'
    AND status = 'active';
    
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_rls_optimization()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count integer, index_count integer, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    COALESCE(c.relrowsecurity, false) as rls_enabled,
    COALESCE(pol_count.count, 0)::integer as policy_count,
    COALESCE(idx_count.count, 0)::integer as index_count,
    CASE 
      WHEN COALESCE(c.relrowsecurity, false) AND COALESCE(pol_count.count, 0) > 0 
      THEN 'Optimized'
      ELSE 'Needs Attention'
    END as status
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN (
    SELECT tablename, COUNT(*) as count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) pol_count ON pol_count.tablename = t.table_name
  LEFT JOIN (
    SELECT tablename, COUNT(*) as count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) idx_count ON idx_count.tablename = t.table_name
  WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'exercises', 'workout_sessions', 'exercise_sets', 
    'user_profiles', 'experience_logs', 'personal_records', 
    'exercise_performances'
  )
  ORDER BY t.table_name;
END;
$$;