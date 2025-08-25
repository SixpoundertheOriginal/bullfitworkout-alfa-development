
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { SetsList } from './SetsList';
import { ExerciseVolumeMetrics } from './ExerciseVolumeMetrics';
import { ExerciseActions } from './ExerciseActions';
import { useExerciseCard } from './hooks/useExerciseCard';
import { ExerciseSet } from '@/types/workout-enhanced';
import { ExerciseSet as DatabaseExerciseSet } from '@/types/exercise';
import { useWorkoutStore } from '@/store/workoutStore';
import { Badge } from "@/components/ui/badge";

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

// Convert workout state ExerciseSet to database ExerciseSet format
const convertToDBExerciseSet = (sets: ExerciseSet[], exerciseName: string): DatabaseExerciseSet[] => {
  return sets.map((set, index) => ({
    ...set,
    id: `${exerciseName}-${index}`,
    set_number: index + 1,
    exercise_name: exerciseName,
    workout_id: 'current-workout',
    restTime: set.restTime || 60,
    duration: 0,
  }));
};

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = (props) => {
  const {
    exercise,
    sets,
    isActive,
    onDeleteExercise,
    ...restProps
  } = props;

  const { getExerciseConfig, getExerciseDisplayName } = useWorkoutStore();
  const exerciseConfig = getExerciseConfig(exercise);
  const displayName = getExerciseDisplayName(exercise);

  const {
    previousSession,
    currentVolume,
    previousVolume,
    volumeMetrics,
    loadingPreviousSession
  } = useExerciseCard(exercise, sets);

  // Extract variant information for enhanced display
  const variant = exerciseConfig?.variant;
  const fullExercise = exerciseConfig?.exercise;

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
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {displayName}
                </h3>
                {variant?.primaryModifier && (
                  <Badge variant="secondary" className="text-xs bg-purple-900/30 text-purple-300 border-purple-500/30">
                    {variant.primaryModifier}
                  </Badge>
                )}
              </div>
              
              {/* Enhanced exercise details */}
              {fullExercise && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {fullExercise.primary_muscle_groups?.slice(0, 2).map((muscle, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-gray-800/50 text-gray-300 border-gray-600/50"
                    >
                      {muscle}
                    </Badge>
                  ))}
                  {fullExercise.equipment_type?.[0] && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-blue-900/30 text-blue-300 border-blue-500/30"
                    >
                      {fullExercise.equipment_type[0]}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Variant technique details */}
              {variant && (variant.gripType || variant.technique) && (
                <div className="text-sm text-gray-400 mb-2">
                  {variant.gripType && (
                    <span className="mr-3">Grip: {variant.gripType}</span>
                  )}
                  {variant.technique && (
                    <span>Technique: {variant.technique}</span>
                  )}
                </div>
              )}
              
              {loadingPreviousSession ? (
                <p className="text-sm text-gray-400">Loading last session…</p>
              ) : previousSession ? (
                <p className="text-sm text-gray-400">
                  Last session:{' '}
                  <span className="text-gray-300 font-mono">
                    {previousSession.weight} kg × {previousSession.reps} × {previousSession.sets}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-400">No previous session</p>
              )}
            </div>
            
            <button
              onClick={onDeleteExercise}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Delete exercise"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <SetsList
            sets={convertToDBExerciseSet(sets, exercise)}
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
