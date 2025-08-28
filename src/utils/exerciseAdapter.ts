
import { ExerciseSet as TypesExerciseSet } from "@/types/exercise";
import { ExerciseSet as StoreExerciseSet } from "@/store/workoutStore";
import { restAuditLog, isRestAuditEnabled } from "@/utils/restAudit";

/**
 * Adapts workout store exercise sets to the format expected by exercise components
 */
export const adaptExerciseSets = (
  storeExercises: Record<string, StoreExerciseSet[]>
): Record<string, TypesExerciseSet[]> => {
  const adaptedExercises: Record<string, TypesExerciseSet[]> = {};
  
  Object.entries(storeExercises).forEach(([exerciseName, sets]) => {
    adaptedExercises[exerciseName] = sets.map((set, index) => ({
      id: `temp-${exerciseName}-set-${index}`,
      weight: set.weight,
      reps: set.reps,
      duration: undefined,
      restTime: set.restTime,
      completed: set.completed,
      isEditing: set.isEditing,
      set_number: index + 1,
      exercise_name: exerciseName,
      workout_id: 'temp'
    }));
  });
  
  return adaptedExercises;
};

/**
 * Adapts exercise component sets back to workout store format
 */
export const adaptToStoreFormat = (
  exerciseSets: Record<string, TypesExerciseSet[]>
): Record<string, StoreExerciseSet[]> => {
  const storeExercises: Record<string, StoreExerciseSet[]> = {};
  
  Object.entries(exerciseSets).forEach(([exerciseName, sets]) => {
    storeExercises[exerciseName] = sets.map(set => ({
      weight: set.weight,
      reps: set.reps,
      restTime: set.restTime || 60,
      completed: set.completed,
      isEditing: set.isEditing || false
    }));
    if (isRestAuditEnabled()) {
      const fallbacks = sets.filter(s => s.restTime == null).length;
      if (fallbacks > 0) {
        restAuditLog('adapter_rest_fallback', { exerciseName, fallbackCount: fallbacks });
      }
    }
  });
  
  return storeExercises;
};
