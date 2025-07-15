
import React from "react";
import { ChevronRight } from "lucide-react";

const ExercisesCompletedList = ({
  exercises,
  workoutId,
  handleExerciseClick
}: {
  exercises: Record<string, any>;
  workoutId: string | null;
  handleExerciseClick: (exerciseName: string) => void;
}) => (
  <div className="mb-6">
    <h3 className="title-small mb-3">Exercises Completed</h3>
    {Object.keys(exercises || {}).map((exercise) => (
      <div 
        key={exercise} 
        className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-800/70 transition-all duration-200"
        onClick={() => handleExerciseClick(exercise)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">{exercise}</h4>
            <p className="text-sm text-gray-400">
              {exercises[exercise].filter((set: any) => set.completed).length} sets completed
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-600" />
        </div>
      </div>
    ))}
  </div>
);

export default ExercisesCompletedList;
