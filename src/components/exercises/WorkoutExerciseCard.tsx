
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
      group relative overflow-hidden transition-all duration-500 ease-out
      bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
      border border-slate-700/30 rounded-2xl shadow-2xl
      backdrop-blur-md
      hover:shadow-slate-500/20 hover:border-slate-600/40
      before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-secondary/5 before:opacity-0 before:transition-opacity before:duration-500
      hover:before:opacity-100
      ${isActive ? 
        "ring-2 ring-primary/50 shadow-2xl shadow-primary/20 border-primary/40 scale-[1.02]" + 
        " before:bg-gradient-to-br before:from-primary/10 before:to-secondary/10 before:opacity-100" : 
        "hover:scale-[1.01] hover:shadow-3xl"
      }
    `}>
      <CardContent className="p-0 relative z-10">
        {/* Neural Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-secondary/60 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-accent/60 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="p-6 border-b border-slate-700/40">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                  {isActive && (
                    <div className="absolute -inset-1 bg-primary/20 rounded-xl animate-ping"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
                    {displayName}
                  </h3>
                  {variant?.primaryModifier && (
                    <Badge variant="secondary" className="mt-1 text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-500/30 shadow-lg">
                      {variant.primaryModifier}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Enhanced exercise details with holographic styling */}
              {fullExercise && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {fullExercise.primary_muscle_groups?.slice(0, 2).map((muscle, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-slate-200 border-slate-500/40 shadow-lg hover:shadow-slate-400/20 transition-all duration-300 hover:scale-105"
                    >
                      {muscle}
                    </Badge>
                  ))}
                  {fullExercise.equipment_type?.[0] && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 hover:scale-105"
                    >
                      {fullExercise.equipment_type[0]}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Variant technique details with futuristic styling */}
              {variant && (variant.gripType || variant.technique) && (
                <div className="text-sm text-slate-300 mb-3 p-2 bg-slate-800/30 rounded-lg border-l-2 border-primary/50">
                  {variant.gripType && (
                    <span className="mr-4 font-medium">Grip: <span className="text-primary">{variant.gripType}</span></span>
                  )}
                  {variant.technique && (
                    <span className="font-medium">Technique: <span className="text-secondary">{variant.technique}</span></span>
                  )}
                </div>
              )}
              
              {/* AI-enhanced session data display */}
              <div className="relative p-3 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-xl border border-slate-600/30">
                <div className="absolute top-2 right-2 w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                {loadingPreviousSession ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">Loading last session…</p>
                  </div>
                ) : previousSession ? (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Previous Session</p>
                    <p className="text-sm font-mono bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
                      {previousSession.weight} kg × {previousSession.reps} × {previousSession.sets}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Session Data</p>
                    <p className="text-sm text-slate-500">No previous session</p>
                  </div>
                )}</div>
            </div>
            
            <button
              onClick={onDeleteExercise}
              className="group/delete relative p-3 text-slate-500 hover:text-red-400 transition-all duration-300 hover:scale-110"
              aria-label="Delete exercise"
            >
              <div className="absolute inset-0 bg-red-500/10 rounded-lg opacity-0 group-hover/delete:opacity-100 transition-opacity duration-300"></div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Main content area with enhanced spacing */}
        <div className="p-6 space-y-6">
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
