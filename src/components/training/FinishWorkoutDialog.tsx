import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy, Clock, Target, Zap } from "lucide-react";

interface FinishWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  workoutStats: {
    exerciseCount: number;
    completedSets: number;
    totalSets: number;
    elapsedTime: number;
    estimatedTonnage?: number;
  };
  isSaving: boolean;
}

export const FinishWorkoutDialog: React.FC<FinishWorkoutDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  workoutStats,
  isSaving
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const completionPercentage = workoutStats.totalSets > 0 
    ? Math.round((workoutStats.completedSets / workoutStats.totalSets) * 100)
    : 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md mx-auto bg-gray-900 border border-gray-800">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-white">
            Finish Workout?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-base">
            You're about to end your session and save your progress.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Workout Summary */}
        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Duration</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatTime(workoutStats.elapsedTime)}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Exercises</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {workoutStats.exerciseCount}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-4 h-4 text-purple-400 mr-1" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Sets</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {workoutStats.completedSets}/{workoutStats.totalSets}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Progress</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {completionPercentage}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <AlertDialogFooter className="flex-col gap-3">
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Workout...
              </div>
            ) : (
              "🏁 Finish & Save"
            )}
          </AlertDialogAction>
          
          <AlertDialogCancel
            disabled={isSaving}
            className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white py-3 rounded-full"
          >
            Continue Workout
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};