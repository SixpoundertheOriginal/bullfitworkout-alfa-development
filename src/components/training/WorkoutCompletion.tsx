
import React from 'react';
import { Button } from "@/components/ui/button";
import { IntelligentMetricsDisplay } from '@/components/metrics/IntelligentMetricsDisplay';
import { ExerciseVolumeChart } from '@/components/metrics/ExerciseVolumeChart';
import { ExerciseSet } from "@/types/exercise";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { useWorkoutStore } from "@/store/workoutStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Define a local version of ExerciseSet to match what's used in the workout state
interface LocalExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
}

export interface WorkoutCompletionProps {
  exercises: Record<string, LocalExerciseSet[]>;
  duration: number;
  intensity: number;
  efficiency: number;
  onComplete: () => void;
}

export const WorkoutCompletion = ({
  exercises,
  duration,
  intensity,
  efficiency,
  onComplete
}: WorkoutCompletionProps) => {
  const { weightUnit } = useWeightUnit();
  const { resetSession } = useWorkoutStore();
  const navigate = useNavigate();

  // Convert LocalExerciseSet to ExerciseSet for the chart components
  const convertedExercises = Object.entries(exercises).reduce((acc, [exerciseName, sets]) => {
    acc[exerciseName] = sets.map((set, index) => ({
      id: `temp-${exerciseName}-${index}`,
      weight: set.weight,
      reps: set.reps,
      completed: set.completed,
      set_number: index + 1,
      exercise_name: exerciseName,
      workout_id: 'temp-workout',
      ...(set.restTime !== undefined && { restTime: set.restTime })
    })) as ExerciseSet[];
    return acc;
  }, {} as Record<string, ExerciseSet[]>);
  
  const handleDiscard = () => {
    // Fully terminate the workout session
    resetSession();
    
    // Show confirmation toast
    toast({
      title: "Workout discarded",
      description: "Your workout session has been terminated"
    });
    
    // Navigate to main dashboard
    navigate('/');
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="flex w-full justify-between gap-3 mb-4">
        <Button
          variant="outline"
          className="w-1/2 py-3 border-gray-700 hover:bg-gray-800"
          onClick={handleDiscard}
        >
          Discard
        </Button>
        
        <Button
          className="w-1/2 py-3 bg-gradient-to-r from-green-600 to-emerald-500 
            hover:from-green-700 hover:to-emerald-600 text-white font-medium 
            rounded-full shadow-lg hover:shadow-xl"
          onClick={onComplete}
        >
          Complete Workout
        </Button>
      </div>
      
      <IntelligentMetricsDisplay 
        exercises={convertedExercises}
        intensity={intensity}
        efficiency={efficiency}
      />
      
      <div className="mt-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 w-full">
        <ExerciseVolumeChart 
          exercises={convertedExercises} 
          weightUnit={weightUnit}
        />
      </div>
    </div>
  );
};

export default WorkoutCompletion;
