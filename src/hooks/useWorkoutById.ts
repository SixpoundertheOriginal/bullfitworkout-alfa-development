import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ExerciseSet } from "@/types/exercise";
import type { Database } from "@/integrations/supabase/types";

type DbExerciseSet = Database["public"]["Tables"]["exercise_sets"]["Row"];

export interface SavedWorkout {
  id: string;
  user_id: string;
  date: string;
  duration: number;
  notes?: string;
  training_type?: string;
  name?: string;
  metadata?: any;
  created_at: string;
  exercises: Record<string, ExerciseSet[]>;
}

export function useWorkoutById(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<SavedWorkout | null>(null);
  const [loading, setLoading] = useState(workoutId ? true : false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutId) {
      setWorkout(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    const fetchWorkout = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch workout details
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('id', workoutId)
          .single();
          
        if (workoutError) {
          console.error('Error fetching workout:', workoutError);
          setError('Failed to load workout');
          return;
        }
        
        // Fetch exercise sets
        const { data: sets, error: setsError } = await supabase
          .from('exercise_sets')
          .select('*')
          .eq('workout_id', workoutId)
          .order('exercise_name', { ascending: true })
          .order('set_number', { ascending: true });
          
        if (setsError) {
          console.error('Error fetching exercise sets:', setsError);
          setError('Failed to load exercise data');
          return;
        }
        
        // Group sets by exercise name
        const groupedSets = sets?.reduce<Record<string, ExerciseSet[]>>((acc, raw) => {
          const set = raw as DbExerciseSet;
          if (!acc[set.exercise_name]) {
            acc[set.exercise_name] = [];
          }
          acc[set.exercise_name].push({
            id: set.id,
            workout_id: set.workout_id,
            exercise_name: set.exercise_name,
            exercise_id: set.exercise_id ?? undefined,
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
            set_number: set.set_number,
            restTime: set.rest_time ?? undefined,
            rpe: set.rpe ?? undefined,
            variant_id: set.variant_id ?? undefined,
            tempo: (set as any).tempo ?? undefined,
            range_of_motion: (set as any).range_of_motion ?? undefined,
            added_weight: (set as any).added_weight ?? undefined,
            assistance_used: (set as any).assistance_used ?? undefined,
            notes: (set as any).notes ?? undefined,
            failurePoint: (set.failure_point as any) ?? null,
            formScore: (set as any).form_quality ?? null,
          });
          return acc;
        }, {}) || {};
        
        // Create complete workout object
        const savedWorkout: SavedWorkout = {
          id: workoutData.id,
          user_id: workoutData.user_id,
          date: workoutData.start_time || workoutData.created_at, // Use start_time or fallback to created_at
          duration: workoutData.duration,
          notes: workoutData.notes,
          training_type: workoutData.training_type,
          name: workoutData.name,
          metadata: workoutData.metadata,
          created_at: workoutData.created_at,
          exercises: groupedSets
        };
        
        setWorkout(savedWorkout);
      } catch (err) {
        console.error('Error in workout fetch:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workout');
        toast({
          title: "Error loading workout",
          description: "Failed to fetch saved workout data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkout();
  }, [workoutId]);

  return { workout, loading, error };
}