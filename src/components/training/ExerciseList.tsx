
import React from "react";
import { Card } from "@/components/ui/card";
import { ExerciseSet } from "@/types/exercise";
import { WorkoutExerciseCard } from '@/components/exercises/WorkoutExerciseCard';
import { useSmartRestSuggestions } from '@/hooks/useSmartRestSuggestions';

interface ExerciseListProps {
  exercises: Record<string, ExerciseSet[]>;
  activeExercise: string | null;
  onAddSet: (exerciseName: string) => void;
  onCompleteSet: (exerciseName: string, setIndex: number) => void;
  onDeleteExercise: (exerciseName: string) => void;
  onRemoveSet: (exerciseName: string, setIndex: number) => void;
  onEditSet: (exerciseName: string, setIndex: number) => void;
  onSaveSet: (exerciseName: string, setIndex: number) => void;
  onWeightChange: (exerciseName: string, setIndex: number, value: string) => void;
  onRepsChange: (exerciseName: string, setIndex: number, value: string) => void;
  onRestTimeChange: (exerciseName: string, setIndex: number, value: string) => void;
  onWeightIncrement: (exerciseName: string, setIndex: number, increment: number) => void;
  onRepsIncrement: (exerciseName: string, setIndex: number, increment: number) => void;
  onRestTimeIncrement: (exerciseName: string, setIndex: number, increment: number) => void;
  onShowRestTimer: () => void;
  onResetRestTimer: () => void;
  onOpenAddExercise: () => void;
  setExercises: (exercises: Record<string, ExerciseSet[]> | ((prev: Record<string, ExerciseSet[]>) => Record<string, ExerciseSet[]>)) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  activeExercise,
  onAddSet,
  onCompleteSet,
  onDeleteExercise,
  onRemoveSet,
  onEditSet,
  onSaveSet,
  onWeightChange,
  onRepsChange,
  onRestTimeChange,
  onWeightIncrement,
  onRepsIncrement,
  onRestTimeIncrement,
  onShowRestTimer,
  onResetRestTimer,
  setExercises
}) => {
  const { getSuggestionForExercise } = useSmartRestSuggestions();
  const exerciseList = Object.keys(exercises);
  
  if (exerciseList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-lg mb-4">No exercises added yet</p>
      </div>
    );
  }

  // Function to handle adding a set that copies the previous set values
  const handleAddSet = async (exerciseName: string) => {
    const existingSets = exercises[exerciseName];
    const lastSet = existingSets.length > 0 ? existingSets[existingSets.length - 1] : null;
    
    // Call the onAddSet function that was passed as prop
    // This lets the parent component handle the actual set creation
    onAddSet(exerciseName);
    
    // If there's a last set, update the newly created set with its values
    if (lastSet && existingSets.length > 0) {
      // Get smart rest suggestion
      const suggestion = await getSuggestionForExercise(
        exerciseName,
        lastSet.restTime,
        existingSets.length + 1
      );
      
      // We need to access the new set that was just added
      setTimeout(() => {
        setExercises(prev => {
          const updatedExercises = { ...prev };
          const sets = [...updatedExercises[exerciseName]];
          const newSetIndex = sets.length - 1;
          
          if (newSetIndex >= 0) {
            // Clone the last set's values to the new set with smart rest time
            sets[newSetIndex] = {
              ...sets[newSetIndex],
              weight: lastSet.weight,
              reps: lastSet.reps,
              restTime: suggestion.suggestedTime || lastSet.restTime || 60
            };
          }
          
          updatedExercises[exerciseName] = sets;
          return updatedExercises;
        });
      }, 0);
    }
  };

  return (
    <div className="space-y-6 mb-32">
      {exerciseList.map(exerciseName => (
        <WorkoutExerciseCard
          key={exerciseName}
          exercise={exerciseName}
          sets={exercises[exerciseName]}
          isActive={activeExercise === exerciseName}
          onAddSet={() => handleAddSet(exerciseName)}
          onCompleteSet={(setIndex) => onCompleteSet(exerciseName, setIndex)}
          onDeleteExercise={() => onDeleteExercise(exerciseName)}
          onRemoveSet={(setIndex) => onRemoveSet(exerciseName, setIndex)}
          onEditSet={(setIndex) => onEditSet(exerciseName, setIndex)}
          onSaveSet={(setIndex) => onSaveSet(exerciseName, setIndex)}
          onWeightChange={(setIndex, value) => onWeightChange(exerciseName, setIndex, value)}
          onRepsChange={(setIndex, value) => onRepsChange(exerciseName, setIndex, value)}
          onRestTimeChange={(setIndex, value) => onRestTimeChange(exerciseName, setIndex, value)}
          onWeightIncrement={(setIndex, increment) => onWeightIncrement(exerciseName, setIndex, increment)}
          onRepsIncrement={(setIndex, increment) => onRepsIncrement(exerciseName, setIndex, increment)}
          onRestTimeIncrement={(setIndex, increment) => onRestTimeIncrement(exerciseName, setIndex, increment)}
          onShowRestTimer={onShowRestTimer}
          onResetRestTimer={onResetRestTimer}
        />
      ))}
    </div>
  );
}
