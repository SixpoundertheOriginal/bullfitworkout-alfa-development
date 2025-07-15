
import React from 'react';
import { Exercise } from '@/types/exercise';
import { CommonExerciseCard } from '../exercises/CommonExerciseCard';

interface ExerciseCardProps {
  exercise: Exercise;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
  // This component is typically used in the workout context, so we default to 'workout-add'
  return (
    <CommonExerciseCard
      exercise={exercise}
      variant="workout-add"
      onAdd={() => {/* Handler will be provided via props in parent components */}}
    />
  );
};
