
-- Add a function to manually refresh workout analytics
-- This will be exposed as an RPC function that can be called from the client
CREATE OR REPLACE FUNCTION public.manual_refresh_workout_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Attempt to refresh materialized views
  -- We use CONCURRENTLY to avoid locking the view for reads
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY workout_type_distribution;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error refreshing workout_type_distribution: %', SQLERRM;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_performance_summary;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error refreshing exercise_performance_summary: %', SQLERRM;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY workout_time_preferences;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error refreshing workout_time_preferences: %', SQLERRM;
  END;
  
  -- Return success
  RETURN;
END;
$$;

-- Create function to fix permissions on materialized views
CREATE OR REPLACE FUNCTION public.fix_materialized_view_permissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  views text[];
  v text;
BEGIN
  views := ARRAY['workout_type_distribution', 'exercise_performance_summary', 'workout_time_preferences'];
  
  FOREACH v IN ARRAY views LOOP
    BEGIN
      EXECUTE format('GRANT SELECT ON %I TO authenticated', v);
      EXECUTE format('GRANT SELECT ON %I TO anon', v);
      EXECUTE format('GRANT SELECT ON %I TO service_role', v);
      RAISE NOTICE 'Granted permissions on %', v;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error granting permissions on %: %', v, SQLERRM;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Call the function to fix permissions right away
SELECT fix_materialized_view_permissions();

-- Allow authenticated users to call the manual_refresh_workout_analytics function
GRANT EXECUTE ON FUNCTION public.manual_refresh_workout_analytics() TO authenticated;

