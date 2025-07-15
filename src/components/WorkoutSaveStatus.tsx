import React from "react";
import { SaveProgress, WorkoutStatus } from "@/types/workout";
import { Loader2, CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkoutSaveStatusProps {
  status: WorkoutStatus;
  saveProgress?: SaveProgress;
  onRetry?: () => void;
  className?: string;
}

export const WorkoutSaveStatus = ({ 
  status, 
  saveProgress, 
  onRetry,
  className 
}: WorkoutSaveStatusProps) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-purple-400" />
              <span>
                {saveProgress?.step === 'workout' && "Creating workout record..."}
                {saveProgress?.step === 'exercise-sets' && "Saving exercise sets..."}
                {saveProgress?.step === 'analytics' && "Updating analytics..."}
              </span>
            </div>
            <Progress value={(saveProgress?.completed ?? 0) * 100} className="h-1.5 bg-gray-700" />
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-400">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Workout saved successfully</span>
          </div>
        );
      case 'partial':
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-amber-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Workout partially saved</span>
            </div>
            {onRetry && (
              <Button 
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="bg-amber-800/30 border-amber-700 text-amber-300 hover:bg-amber-800/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Save
              </Button>
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Failed to save workout</span>
            </div>
            {onRetry && (
              <Button 
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="bg-red-800/30 border-red-700 text-red-300 hover:bg-red-800/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Save
              </Button>
            )}
          </div>
        );
      case 'recovering':
        return (
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-400" />
            <span className="text-blue-400">Recovering workout data...</span>
          </div>
        );
      case 'idle':
      default:
        return null;
    }
  };

  if (status === 'idle' || status === 'active') {
    return null;
  }

  return (
    <div className={cn(
      "p-3 bg-gray-900/80 border border-gray-800 rounded-lg",
      className
    )}>
      {getStatusDisplay()}
    </div>
  );
};
