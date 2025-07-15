
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Dumbbell } from "lucide-react";
import { ExerciseSetsDisplay } from './ExerciseSetsDisplay';
import { ExerciseSet } from "@/types/exercise";
import { WorkoutMetricsSummary } from './WorkoutMetricsSummary';

interface WorkoutExercisesSectionProps {
  exerciseSets: Record<string, ExerciseSet[]>;
  onAddExercise: () => void;
  onEditExercise: (exerciseName: string) => void;
  onDeleteExercise: (exerciseName: string) => void;
}

export const WorkoutExercisesSection: React.FC<WorkoutExercisesSectionProps> = ({
  exerciseSets,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}) => {
  const allSets = Object.values(exerciseSets).flat();
  
  return (
    <div className="mt-6">
      <WorkoutMetricsSummary exerciseSets={allSets} className="mb-6" />
      
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium">Exercises</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onAddExercise}
          className="text-sm flex items-center text-gray-400 hover:text-white"
        >
          <PlusCircle size={16} className="mr-1" />
          Add Exercise
        </Button>
      </div>
      
      {Object.keys(exerciseSets).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(exerciseSets).map(([exerciseName, sets]) => (
            <ExerciseSetsDisplay
              key={exerciseName}
              exerciseName={exerciseName}
              sets={sets}
              onEdit={onEditExercise}
              onDelete={onDeleteExercise}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Dumbbell size={24} className="mx-auto mb-2 opacity-50" />
          <p>No exercises recorded for this workout</p>
        </div>
      )}
    </div>
  );
};
