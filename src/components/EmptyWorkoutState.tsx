
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExerciseSelector } from "@/components/exercises/ExerciseSelector";
import { Exercise } from "@/types/exercise";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { typography } from "@/lib/typography";

interface EmptyWorkoutStateProps {
  onTemplateSelect: (exercise: string | Exercise) => void;
  className?: string;
}

export const EmptyWorkoutState: React.FC<EmptyWorkoutStateProps> = ({ 
  onTemplateSelect,
  className 
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const locationState = location.state as any;
  const trainingType = locationState?.trainingType || 'strength';
  
  // Get body focus from location state or default to common muscle groups
  const bodyFocus = locationState?.bodyFocus || ['chest', 'back', 'legs'];
  
  // Get movement pattern from location state or default based on training type
  const movementPattern = locationState?.movementPattern || 
    (trainingType === 'strength' ? ['push', 'pull'] : 
     trainingType === 'cardio' ? ['carry'] : 
     trainingType === 'yoga' ? ['isometric'] : 
     ['push', 'pull']);
     
  // Get difficulty from user profile or default to intermediate
  const difficulty = 'intermediate'; // This would come from user profile in a real app

  return (
    <div className={cn("flex flex-col items-center py-6", className)}>
      <Card className="w-full mb-4 bg-card/50 border-gray-800">
        <CardContent className="p-4">
          <h2 className={cn(typography.headings.h3, "text-white mb-2")}>
            Begin Your {trainingType.charAt(0).toUpperCase() + trainingType.slice(1)} Workout
          </h2>
          <p className={cn(typography.text.secondary, "mb-4")}>
            Add your first exercise to get started
          </p>
          
          <ExerciseSelector
            onSelectExercise={onTemplateSelect}
            trainingType={trainingType}
            bodyFocus={bodyFocus}
            movementPattern={movementPattern}
            difficulty={difficulty as any}
          />
        </CardContent>
      </Card>
    </div>
  );
}
