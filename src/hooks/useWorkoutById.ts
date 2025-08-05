import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ExerciseSet } from "@/types/exercise";

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
        const groupedSets = sets?.reduce<Record<string, ExerciseSet[]>>((acc, set) => {
          if (!acc[set.exercise_name]) {
            acc[set.exercise_name] = [];
          }
          acc[set.exercise_name].push(set as ExerciseSet);
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