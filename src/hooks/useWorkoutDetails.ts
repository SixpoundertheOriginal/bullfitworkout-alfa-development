
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { ExerciseSet } from "@/types/exercise";
import { getWorkoutDetails } from "@/services/workout/workoutDataService";

export function useWorkoutDetails(workoutId: string | undefined) {
  const [workoutDetails, setWorkoutDetails] = useState<any>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, ExerciseSet[]>>({});
  const [loading, setLoading] = useState(workoutId ? true : false);

  useEffect(() => {
    if (!workoutId) return;
    
    const fetchWorkoutDetails = async () => {
      try {
        setLoading(true);
        
        const { workoutDetails, exerciseSets } = await getWorkoutDetails(workoutId);
        setWorkoutDetails(workoutDetails);
        setExerciseSets(exerciseSets);
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
