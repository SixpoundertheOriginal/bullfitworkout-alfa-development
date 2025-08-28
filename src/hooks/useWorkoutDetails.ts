
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ExerciseSet } from "@/types/exercise";
import { restAuditLog, isRestAuditEnabled } from "@/utils/restAudit";

export function useWorkoutDetails(workoutId: string | undefined) {
  const [workoutDetails, setWorkoutDetails] = useState<any>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, ExerciseSet[]>>({});
  const [loading, setLoading] = useState(workoutId ? true : false);

  useEffect(() => {
    if (!workoutId) return;
    
    const fetchWorkoutDetails = async () => {
      try {
        setLoading(true);
        
        const { data: workout, error: workoutError } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('id', workoutId)
          .single();
          
        if (workoutError) {
          console.error('Error fetching workout:', workoutError);
          toast.error('Error loading workout details');
          return;
        }
        
        setWorkoutDetails(workout);
        
        const { data: sets, error: setsError } = await supabase
          .from('exercise_sets')
          .select('*')
          .eq('workout_id', workoutId)
          .order('exercise_name', { ascending: true })
          .order('set_number', { ascending: true });
          
        if (setsError) {
          console.error('Error fetching exercise sets:', setsError);
          toast.error('Error loading exercise data');
          return;
        }
        
        if (isRestAuditEnabled()) {
          restAuditLog('after_load_api_sets', {
            workoutId,
            count: sets?.length || 0,
            sample: (sets || []).slice(0, 10).map(s => ({
              id: s.id,
              exercise_name: s.exercise_name,
              set_number: s.set_number,
              rest_time: (s as any).rest_time ?? null
            }))
          });
        }

        const groupedSets = sets?.reduce<Record<string, ExerciseSet[]>>((acc, raw) => {
          const set = raw as any;
          const exerciseName = set.exercise_name;
          const mapped = {
            ...(set as ExerciseSet),
            restTime: (set.rest_time ?? null) as number | null,
          } as ExerciseSet;
          if (!acc[exerciseName]) {
            acc[exerciseName] = [];
          }
          acc[exerciseName].push(mapped);
          return acc;
        }, {}) || {};

        setExerciseSets(groupedSets);
        if (isRestAuditEnabled()) {
          const post = Object.fromEntries(Object.entries(groupedSets).map(([name, s]) => [
            name,
            s.slice(0, 5).map(x => ({ id: x.id, set_number: x.set_number, rest_raw: (x as any).rest_time ?? (x as any).restTime ?? null }))
          ]));
          restAuditLog('after_load_grouped_sets', { size: Object.keys(groupedSets).length, sample: post });
        }
      } catch (error) {
        console.error('Error in workout details fetch:', error);
        toast.error('Failed to load workout data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkoutDetails();
  }, [workoutId]);

  return { workoutDetails, exerciseSets, loading, setWorkoutDetails, setExerciseSets };
}
