
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { updateWorkout, updateExerciseSets, addExerciseToWorkout, removeExerciseFromWorkout } from "@/services/workoutService";
import { ExerciseSet, Exercise } from "@/types/exercise";

// Define a type for the update function to make the code more maintainable
type UpdateExerciseSetsFunction = (exerciseSets: Record<string, ExerciseSet[]> | ((prev: Record<string, ExerciseSet[]>) => Record<string, ExerciseSet[]>)) => void;

export function useExerciseManagement(workoutId: string | undefined, onUpdate: UpdateExerciseSetsFunction) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exerciseSetModalOpen, setExerciseSetModalOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState("");
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);
  const [exerciseSetsToEdit, setExerciseSetsToEdit] = useState<ExerciseSet[]>([]);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleSaveWorkoutEdit = async (updatedWorkout: any) => {
    if (!workoutId) return;
    
    try {
      const updated = await updateWorkout(workoutId, updatedWorkout);
      toast({
        title: "Workout updated successfully"
      });
      return updated;
    } catch (error) {
      console.error("Error updating workout:", error);
      toast({
        title: "Failed to update workout",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleEditExercise = (exerciseName: string, exerciseSets: Record<string, ExerciseSet[]>) => {
    const setsForExercise = exerciseSets[exerciseName];
    setCurrentExercise(exerciseName);
    setCurrentExerciseId(setsForExercise?.[0]?.exercise_id || null);
    setExerciseSetsToEdit(setsForExercise);
    setExerciseSetModalOpen(true);
  };

  const handleSaveExerciseSets = async (updatedSets: ExerciseSet[]): Promise<void> => {
    if (!workoutId || !currentExercise) return;
    
    try {
      const updated = await updateExerciseSets(workoutId, currentExerciseId, currentExercise, updatedSets);
      toast({
        title: "Exercise sets updated"
      });
      
      // Create a new object first, then pass it to onUpdate
      onUpdate((prev: Record<string, ExerciseSet[]>) => {
        const newSets = { ...prev };
        newSets[currentExercise] = updated;
        return newSets;
      });
      
    } catch (error) {
      console.error("Error updating exercise sets:", error);
      toast({
        title: "Failed to update exercise sets",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleAddExercise = async (exercise: Exercise | string): Promise<void> => {
    if (!workoutId) return;

    const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
    const exerciseId = typeof exercise === 'string' ? null : exercise.id;

    try {
      const newSets = await addExerciseToWorkout(workoutId, exerciseId, exerciseName, 3);

      // Create a new object first, then pass it to onUpdate
      onUpdate((prev: Record<string, ExerciseSet[]>) => {
        const newSetsRecord = { ...prev };
        newSetsRecord[exerciseName] = newSets;
        return newSetsRecord;
      });

      toast({
        title: `Added ${exerciseName} to workout`
      });
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast({
        title: "Failed to add exercise",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteExercise = async (): Promise<void> => {
    if (!workoutId || !exerciseToDelete) return;
    
    try {
      await removeExerciseFromWorkout(workoutId, exerciseToDelete);
      
      // Create a new object first, then pass it to onUpdate
      onUpdate((prev: Record<string, ExerciseSet[]>) => {
        const newSets = { ...prev };
        delete newSets[exerciseToDelete];
        return newSets;
      });
      
      toast({
        title: `Removed ${exerciseToDelete} from workout`
      });
      setDeleteAlertOpen(false);
      setExerciseToDelete("");
    } catch (error) {
      console.error("Error removing exercise:", error);
      toast({
        title: "Failed to remove exercise",
        variant: "destructive"
      });
    }
  };

  const confirmDeleteExercise = (exerciseName: string) => {
    setExerciseToDelete(exerciseName);
    setDeleteAlertOpen(true);
  };

  return {
    editModalOpen,
    setEditModalOpen,
    exerciseSetModalOpen,
    setExerciseSetModalOpen,
    currentExercise,
    exerciseSetsToEdit,
    deleteAlertOpen,
    setDeleteAlertOpen,
    exerciseToDelete,
    showAddDialog,
    setShowAddDialog,
    handleSaveWorkoutEdit,
    handleEditExercise,
    handleSaveExerciseSets,
    handleAddExercise,
    handleDeleteExercise,
    confirmDeleteExercise
  };
}
