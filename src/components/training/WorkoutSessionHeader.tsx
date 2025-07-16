
import React, { useEffect } from 'react';
import { WorkoutSaveStatus } from "@/components/WorkoutSaveStatus";
import { WorkoutMetricsGrid } from "@/components/metrics/core/WorkoutMetricsGrid";
import { Button } from "@/components/ui/button";
import { WorkoutStatus } from "@/types/workout";
import { WorkoutMetricsData } from "@/components/metrics/calculators/MetricCalculator";

interface WorkoutSessionHeaderProps {
  elapsedTime: number;
  exerciseCount: number;
  completedSets: number;
  totalSets: number;
  workoutStatus: WorkoutStatus;
  isRecoveryMode: boolean;
  saveProgress: any;
  onRetrySave: () => void;
  onResetWorkout: () => void;
  restTimerActive: boolean;
  onRestTimerComplete: () => void;
  onShowRestTimer: () => void;
  onRestTimerReset: () => void;
  restTimerResetSignal: number;
  currentRestTime: number;
  exercises: any; // Add exercises prop for the new metrics system
}

export const WorkoutSessionHeader: React.FC<WorkoutSessionHeaderProps> = ({
  elapsedTime,
  exerciseCount,
  completedSets,
  totalSets,
  workoutStatus,
  isRecoveryMode,
  saveProgress,
  onRetrySave,
  onResetWorkout,
  restTimerActive,
  onRestTimerComplete,
  onShowRestTimer,
  onRestTimerReset,
  restTimerResetSignal,
  currentRestTime,
  exercises
}) => {
  useEffect(() => {
    // Ensure timer continuity by setting document title when component mounts
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    document.title = `Workout - ${formatTime(elapsedTime)}`;
    
    // Cleanup on unmount
    return () => {
      document.title = 'Fitness App';
    };
  }, [elapsedTime]);

  // Prepare workout data for the new metrics system
  const workoutData: WorkoutMetricsData = {
    exercises,
    elapsedTime,
    restTimerActive,
    currentRestTime,
    activeExercise: null
  };

  return (
    <>
      <div className="sticky top-16 z-10 bg-gray-900/80 backdrop-blur-lg p-4">
        <WorkoutMetricsGrid
          workoutData={workoutData}
          onRestTimerComplete={onRestTimerComplete}
          onRestTimerStart={onShowRestTimer}
          onRestTimerReset={onRestTimerReset}
          restTimerResetSignal={restTimerResetSignal}
        />
      </div>
      
      {workoutStatus !== 'idle' && workoutStatus !== 'active' && (
        <div className="px-4 mt-2">
          <WorkoutSaveStatus 
            status={workoutStatus}
            saveProgress={saveProgress}
            onRetry={onRetrySave}
          />
        </div>
      )}
      
      {isRecoveryMode && (
        <div className="px-4 mt-2">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-1">Workout recovery available</h3>
            <p className="text-gray-400 text-xs mb-2">
              We found an unsaved workout. Continue your session or reset to start fresh.
            </p>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onResetWorkout}
              className="w-full"
            >
              Reset & Start Fresh
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
