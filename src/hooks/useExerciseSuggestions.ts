
import { useMemo } from "react";
import { Exercise } from "@/types/exercise";
import { useExercises } from "./useExercises";

export function useExerciseSuggestions(trainingType: string = "") {
  const { exercises } = useExercises();

  const suggestedExercises = useMemo(() => {
    if (!exercises?.length) return [];

    // Filter exercises based on training type
    let filtered = [...exercises];
    
    if (trainingType.toLowerCase() === "strength") {
      filtered = filtered.filter(e => 
        e.is_compound || 
        e.equipment_type.some(t => ["barbell", "dumbbell", "machine"].includes(t)) ||
        e.primary_muscle_groups.some(m => ["chest", "back", "shoulders", "legs", "arms"].includes(m))
      );
    } else if (trainingType.toLowerCase() === "cardio") {
      filtered = filtered.filter(e => 
        e.equipment_type.some(t => ["bodyweight", "cardio machine"].includes(t)) ||
        e.primary_muscle_groups.some(m => ["heart", "lungs", "full body"].includes(m))
      );
    } else if (trainingType.toLowerCase() === "yoga") {
      filtered = filtered.filter(e => 
        e.equipment_type.includes("bodyweight") ||
        e.primary_muscle_groups.some(m => ["core", "flexibility", "balance"].includes(m))
      );
    } else if (trainingType.toLowerCase() === "calisthenics") {
      filtered = filtered.filter(e => 
        e.equipment_type.includes("bodyweight") ||
        e.primary_muscle_groups.some(m => ["core", "chest", "back", "arms"].includes(m))
      );
    }

    // Sort by compound exercises first
    filtered.sort((a, b) => {
      if (a.is_compound && !b.is_compound) return -1;
      if (!a.is_compound && b.is_compound) return 1;
      return 0;
    });

    return filtered.slice(0, 10);
  }, [exercises, trainingType]);

  return { suggestedExercises };
}
