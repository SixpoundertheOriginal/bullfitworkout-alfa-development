
import React from "react";
import { Card } from "@/components/ui/card";
import { ExerciseSet, WorkoutExercises } from '@/types/workout-enhanced';
import { WorkoutExerciseCard } from '@/components/exercises/WorkoutExerciseCard';
import { useSmartRestSuggestions } from '@/hooks/useSmartRestSuggestions';
import { useGlobalRestTimers } from '@/hooks/useGlobalRestTimers';

interface ExerciseListProps {
  exercises: WorkoutExercises;
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
  setExercises: (exercises: WorkoutExercises | ((prev: WorkoutExercises) => WorkoutExercises)) => void;
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
  const { generateTimerId, startTimer, getTimer, stopTimer } = useGlobalRestTimers();
  const exerciseList = Object.keys(exercises);
  
  // Helper function to get sets from either format
  const getExerciseSets = (exerciseData: any): ExerciseSet[] => {
    if (Array.isArray(exerciseData)) {
      return exerciseData;
    }
    return exerciseData.sets || [];
  };
  
  if (exerciseList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-lg mb-4">No exercises added yet</p>
      </div>
    );
  }

  // Function to handle adding a set that copies the previous set values
  const handleAddSet = async (exerciseName: string) => {
    const exerciseData = exercises[exerciseName];
    const existingSets = getExerciseSets(exerciseData);
    const lastSet = existingSets.length > 0 ? existingSets[existingSets.length - 1] : null;
    
    // Check if there's an active rest timer for the previous set and capture actual rest time
    let actualRestTime: number | null = null;
    if (lastSet && existingSets.length > 0) {
      const lastSetTimerId = generateTimerId(exerciseName, existingSets.length);
      const timerState = getTimer(lastSetTimerId);
      
      if (timerState && timerState.isActive) {
        // Capture the actual elapsed rest time
        actualRestTime = timerState.elapsedTime;
        // Stop the timer since we're adding a new set
        stopTimer(lastSetTimerId);
      }
    }
    
    // Call the onAddSet function that was passed as prop
    // This lets the parent component handle the actual set creation
    onAddSet(exerciseName);
    
    // If there's a last set, update the newly created set with its values
    if (lastSet && existingSets.length >= 0) {
      // Get smart rest suggestion based on actual or planned rest time
      const baseRestTime = actualRestTime || lastSet.restTime;
      const suggestion = await getSuggestionForExercise(
        exerciseName,
        baseRestTime,
        existingSets.length + 1
      );
      
      // Update the exercise with enhanced values immediately
      setExercises(prev => {
        const updatedExercises = { ...prev };
        const currentExerciseData = updatedExercises[exerciseName];
        
        if (Array.isArray(currentExerciseData)) {
          // Legacy format
          const sets = [...currentExerciseData];
          const newSetIndex = sets.length - 1;
          const lastSetIndex = newSetIndex - 1;
          
          if (newSetIndex >= 0) {
            // Update the previous set with actual rest time if captured
            if (actualRestTime && lastSetIndex >= 0) {
              sets[lastSetIndex] = {
                ...sets[lastSetIndex],
                restTime: actualRestTime
              };
            }
            
            // Clone the last set's values to the new set with smart rest time
            sets[newSetIndex] = {
              ...sets[newSetIndex],
              weight: lastSet.weight,
              reps: lastSet.reps,
              restTime: suggestion.suggestedTime || baseRestTime || 60
            };
          }
          
          updatedExercises[exerciseName] = sets;
        } else if (currentExerciseData) {
          // New format
          const sets = [...currentExerciseData.sets];
          const newSetIndex = sets.length - 1;
          const lastSetIndex = newSetIndex - 1;
          
          if (newSetIndex >= 0) {
            // Update the previous set with actual rest time if captured
            if (actualRestTime && lastSetIndex >= 0) {
              sets[lastSetIndex] = {
                ...sets[lastSetIndex],
                restTime: actualRestTime
              };
            }
            
            // Clone the last set's values to the new set with smart rest time
            sets[newSetIndex] = {
              ...sets[newSetIndex],
              weight: lastSet.weight,
              reps: lastSet.reps,
              restTime: suggestion.suggestedTime || baseRestTime || 60
            };
          }
          
          updatedExercises[exerciseName] = {
            ...currentExerciseData,
            sets: sets
          };
        }
        
        return updatedExercises;
      });
    }
  };

  return (
    <div className="space-y-6 mb-32">
      {exerciseList.map(exerciseName => {
        const exerciseData = exercises[exerciseName];
        const sets = getExerciseSets(exerciseData);
        
        return (
          <WorkoutExerciseCard
            key={exerciseName}
            exercise={exerciseName}
            sets={sets}
            isActive={activeExercise === exerciseName}
            onAddSet={() => handleAddSet(exerciseName)}
            onCompleteSet={(setIndex) => {
              // Call the original completion handler
              onCompleteSet(exerciseName, setIndex);
              
              // Start rest timer after completing the set
              const set = sets[setIndex];
              if (set && set.restTime && set.restTime > 0) {
                const timerId = generateTimerId(exerciseName, setIndex + 1);
                startTimer(timerId, set.restTime);
              }
            }}
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
        );
      })}
    </div>
  );
}
