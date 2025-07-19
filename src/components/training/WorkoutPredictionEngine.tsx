
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { WorkoutExercises } from '@/store/workoutStore';

interface WorkoutPredictionEngineProps {
  exercises: WorkoutExercises;
  elapsedTime: number;
  targetDuration?: number;
  className?: string;
}

export const WorkoutPredictionEngine: React.FC<WorkoutPredictionEngineProps> = ({
  exercises,
  elapsedTime,
  targetDuration = 60, // Default 60 minutes
  className = ""
}) => {
  const predictions = useMemo(() => {
    const totalSets = Object.values(exercises).reduce((acc, exerciseData) => {
      const sets = Array.isArray(exerciseData) ? exerciseData : exerciseData.sets;
      return acc + sets.length;
    }, 0);

    const completedSets = Object.values(exercises).reduce((acc, exerciseData) => {
      const sets = Array.isArray(exerciseData) ? exerciseData : exerciseData.sets;
      return acc + sets.filter(set => set.completed).length;
    }, 0);

    const completionRate = totalSets > 0 ? completedSets / totalSets : 0;
    const currentPace = completedSets > 0 ? elapsedTime / completedSets : 0; // seconds per set

    // Predict remaining time based on current pace
    const remainingSets = totalSets - completedSets;
    const predictedRemainingTime = remainingSets * currentPace;
    const predictedTotalTime = elapsedTime + predictedRemainingTime;

    // Calculate efficiency predictions
    const currentSetsPerMinute = completedSets > 0 ? (completedSets / (elapsedTime / 60)) : 0;
    const predictedFinalSetsPerMinute = totalSets > 0 ? (totalSets / (predictedTotalTime / 60)) : 0;

    // Determine workout status
    const isOnTrack = predictedTotalTime <= (targetDuration * 60 * 1.1); // 10% tolerance
    const isAheadOfSchedule = predictedTotalTime < (targetDuration * 60 * 0.9); // 10% ahead
    const isBehindSchedule = predictedTotalTime > (targetDuration * 60 * 1.2); // 20% behind

    return {
      completionRate,
      currentPace,
      predictedRemainingTime,
      predictedTotalTime,
      currentSetsPerMinute,
      predictedFinalSetsPerMinute,
      isOnTrack,
      isAheadOfSchedule,
      isBehindSchedule,
      remainingSets,
      completedSets,
      totalSets
    };
  }, [exercises, elapsedTime, targetDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (predictions.isAheadOfSchedule) return 'text-green-400 border-green-400';
    if (predictions.isBehindSchedule) return 'text-red-400 border-red-400';
    if (predictions.isOnTrack) return 'text-blue-400 border-blue-400';
    return 'text-yellow-400 border-yellow-400';
  };

  const getStatusIcon = () => {
    if (predictions.isAheadOfSchedule) return <CheckCircle className="w-4 h-4" />;
    if (predictions.isBehindSchedule) return <AlertTriangle className="w-4 h-4" />;
    if (predictions.isOnTrack) return <TrendingUp className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (predictions.isAheadOfSchedule) return 'Ahead';
    if (predictions.isBehindSchedule) return 'Behind';
    if (predictions.isOnTrack) return 'On Track';
    return 'Starting';
  };

  if (predictions.completedSets === 0) return null;

  return (
    <Card className={`bg-gray-900/80 border-gray-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Workout Predictions</h3>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-300">
                {predictions.completedSets}/{predictions.totalSets} sets
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${predictions.completionRate * 100}%` }}
              />
            </div>
          </div>

          {/* Time predictions */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Remaining</span>
                <span className="font-mono text-white">
                  {formatTime(predictions.predictedRemainingTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Est.</span>
                <span className="font-mono text-white">
                  {formatTime(predictions.predictedTotalTime)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Pace</span>
                <span className="font-mono text-white">
                  {predictions.currentSetsPerMinute.toFixed(1)}/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Final Pace</span>
                <span className="font-mono text-white">
                  {predictions.predictedFinalSetsPerMinute.toFixed(1)}/min
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {predictions.isBehindSchedule && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-800/30 rounded text-xs">
              <p className="text-red-300">
                💡 Consider reducing rest times or skipping optional sets to stay on track
              </p>
            </div>
          )}

          {predictions.isAheadOfSchedule && (
            <div className="mt-3 p-2 bg-green-900/20 border border-green-800/30 rounded text-xs">
              <p className="text-green-300">
                🎯 Great pace! You could add extra sets or focus on form
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
