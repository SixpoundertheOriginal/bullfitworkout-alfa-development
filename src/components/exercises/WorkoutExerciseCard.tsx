
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseCardHeader } from './ExerciseCardHeader';
import { SetsList } from './SetsList';
import { ExerciseVolumeMetrics } from './ExerciseVolumeMetrics';
import { ExerciseActions } from './ExerciseActions';
import { useExerciseCard } from './hooks/useExerciseCard';
import { ExerciseSet } from '@/types/exercise';

interface WorkoutExerciseCardProps {
  exercise: string;
  sets: ExerciseSet[];
  onAddSet: () => void;
  onCompleteSet: (setIndex: number) => void;
  onRemoveSet: (setIndex: number) => void;
  onEditSet: (setIndex: number) => void;
  onSaveSet: (setIndex: number) => void;
  onWeightChange: (setIndex: number, value: string) => void;
  onRepsChange: (setIndex: number, value: string) => void;
  onRestTimeChange?: (setIndex: number, value: string) => void;
  onWeightIncrement: (setIndex: number, increment: number) => void;
  onRepsIncrement: (setIndex: number, increment: number) => void;
  onRestTimeIncrement?: (setIndex: number, increment: number) => void;
  isActive: boolean;
  onShowRestTimer: () => void;
  onResetRestTimer: () => void;
  onDeleteExercise: () => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = (props) => {
  const {
    exercise,
    sets,
    isActive,
    onDeleteExercise,
    ...restProps
  } = props;

  const {
    previousSession,
    currentVolume,
    previousVolume,
    volumeMetrics,
    progressData
  } = useExerciseCard(exercise, sets);

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300 
      bg-gradient-to-br from-gray-900/90 to-gray-900/60
      border border-gray-800/50 rounded-xl shadow-lg
      backdrop-blur-sm
      ${isActive ? 
        "ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10 border-blue-500/30" : 
        "hover:shadow-xl hover:border-gray-700/60"
      }
    `}>
      <CardContent className="p-0">
        <ExerciseCardHeader
          exerciseName={exercise}
          previousSession={previousSession}
          progressData={progressData}
          onDeleteExercise={onDeleteExercise}
        />
        
        <div className="p-4">
          <SetsList
            sets={sets}
            exercise={exercise}
            {...restProps}
          />
          
          <ExerciseVolumeMetrics
            currentVolume={currentVolume}
            previousVolume={previousVolume}
            volumeMetrics={volumeMetrics}
          />
          
          <ExerciseActions
            onAddSet={props.onAddSet}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutExerciseCard;
