
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkoutSaveStatus } from "@/components/WorkoutSaveStatus";
import { WorkoutMetricsGrid } from "@/components/metrics/core/WorkoutMetricsGrid";
import { WorkoutStatus } from "@/types/workout";
import { WorkoutMetricsData } from "@/components/metrics/calculators/MetricCalculator";

interface WorkoutSessionHeaderProps {
  elapsedTime: number;
  exerciseCount: number;
  completedSets: number;
  totalSets: number;
  workoutStatus: WorkoutStatus;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
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
  exercises: any;
  onFinishWorkout: () => void;
  isSaving: boolean;
  hasSubstantialProgress: boolean;
}

export const WorkoutSessionHeader: React.FC<WorkoutSessionHeaderProps> = ({
  elapsedTime,
  exerciseCount,
  completedSets,
  totalSets,
  workoutStatus,
  isPaused,
  onPause,
  onResume,
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
  exercises,
  onFinishWorkout,
  isSaving,
  hasSubstantialProgress
}) => {
  const navigate = useNavigate();

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

  const handleDone = () => {
    navigate('/');
  };

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
      {/* iOS-Native Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-b border-gray-800/50">
        <div className="flex items-center justify-between h-16 px-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">Workout</h1>
            {isPaused && (
              <div className="text-sm text-orange-400 font-medium">
                Paused
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Pause/Resume Button */}
            <Button
              onClick={isPaused ? onResume : onPause}
              variant="ghost"
              className="
                h-11 w-11 p-0 rounded-full
                text-white hover:text-gray-300 hover:bg-white/10
                transition-all duration-200
              "
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </Button>

            {/* Smart Finish Button - Shows based on progress */}
            {hasSubstantialProgress && (
              <Button
                onClick={onFinishWorkout}
                disabled={isSaving}
                className="
                  h-11 px-6 text-sm font-medium rounded-full
                  bg-green-600 hover:bg-green-700 active:bg-green-800
                  text-white shadow-md hover:shadow-lg
                  transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                "
              >
                {isSaving ? "Saving..." : "Finish"}
              </Button>
            )}
            
            {/* iOS Done Button */}
            <Button
              onClick={handleDone}
              variant="ghost"
              className="
                h-11 w-11 p-0 rounded-full
                text-blue-500 hover:text-blue-400 hover:bg-blue-500/10
                transition-all duration-200
              "
            >
              <X size={24} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards with iOS Styling */}
      <div className="pt-20 pb-4">
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-4 mx-4 shadow-lg border border-gray-800/50">
          <WorkoutMetricsGrid
            workoutData={workoutData}
            onRestTimerComplete={onRestTimerComplete}
            onRestTimerStart={onShowRestTimer}
            onRestTimerReset={onRestTimerReset}
            restTimerResetSignal={restTimerResetSignal}
          />
        </div>
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
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-sm font-medium mb-1">Workout recovery available</h3>
            <p className="text-gray-400 text-xs mb-3">
              We found an unsaved workout. Continue your session or reset to start fresh.
            </p>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onResetWorkout}
              className="w-full rounded-lg"
            >
              Reset & Start Fresh
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
