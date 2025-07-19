
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Zap, Target } from 'lucide-react';
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';
import { WorkoutExercises } from '@/store/workoutStore';

interface RealTimeEfficiencyMonitorProps {
  exercises: WorkoutExercises;
  elapsedTime: number;
  weightUnit: 'kg' | 'lb';
  className?: string;
}

export const RealTimeEfficiencyMonitor: React.FC<RealTimeEfficiencyMonitorProps> = ({
  exercises,
  elapsedTime,
  weightUnit,
  className = ""
}) => {
  const metrics = useMemo(() => {
    // Transform to database format for processing
    const transformedExercises: Record<string, import('@/types/exercise').ExerciseSet[]> = {};
    
    Object.entries(exercises).forEach(([exerciseName, exerciseData]) => {
      const sets = Array.isArray(exerciseData) ? exerciseData : exerciseData.sets;
      transformedExercises[exerciseName] = sets.map((set, index) => ({
        id: `${exerciseName}-${index}`,
        workout_id: 'temp-id',
        exercise_name: exerciseName,
        weight: set.weight,
        reps: set.reps,
        completed: set.completed,
        set_number: index + 1,
        rest_time: set.restTime || 60,
        created_at: new Date().toISOString(),
      }));
    });

    return processWorkoutMetrics(
      transformedExercises,
      elapsedTime,
      weightUnit,
      { weight: 70, unit: 'kg' },
      { start_time: new Date().toISOString(), duration: elapsedTime }
    );
  }, [exercises, elapsedTime, weightUnit]);

  // Calculate derived efficiency metrics from the processed metrics
  const efficiencyData = useMemo(() => {
    const efficiencyScore = metrics.efficiencyMetrics?.efficiencyScore || 0;
    const workoutDensityScore = efficiencyScore;
    const volumePerHour = (metrics.efficiencyMetrics?.volumePerActiveMinute || 0) * 60;
    const setsPerMinute = metrics.densityMetrics?.setsPerMinute || 0;
    const workToRestRatio = metrics.efficiencyMetrics?.workToRestRatio || 0;
    
    const efficiencyRating = efficiencyScore >= 80 ? 'excellent' :
                           efficiencyScore >= 60 ? 'good' :
                           efficiencyScore >= 40 ? 'average' : 'poor';

    return {
      efficiencyRating,
      workoutDensityScore,
      volumePerHour,
      setsPerMinute,
      workToRestRatio
    };
  }, [metrics]);

  const getEfficiencyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-400 border-green-400';
      case 'good': return 'text-blue-400 border-blue-400';
      case 'average': return 'text-yellow-400 border-yellow-400';
      case 'poor': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getEfficiencyIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <TrendingUp className="w-4 h-4" />;
      case 'good': return <Target className="w-4 h-4" />;
      case 'average': return <Clock className="w-4 h-4" />;
      case 'poor': return <TrendingDown className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  if (!metrics || !efficiencyData) return null;

  return (
    <Card className={`bg-gray-900/80 border-gray-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Real-Time Efficiency</h3>
          <Badge 
            variant="outline" 
            className={`${getEfficiencyColor(efficiencyData.efficiencyRating)} capitalize`}
          >
            {getEfficiencyIcon(efficiencyData.efficiencyRating)}
            <span className="ml-1">{efficiencyData.efficiencyRating}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Density Score</span>
              <span className="font-mono text-white">
                {efficiencyData.workoutDensityScore.toFixed(0)}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume/Hour</span>
              <span className="font-mono text-white">
                {efficiencyData.volumePerHour.toFixed(0)} {weightUnit}/hr
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Sets/Min</span>
              <span className="font-mono text-white">
                {efficiencyData.setsPerMinute.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Work:Rest</span>
              <span className="font-mono text-white">
                {efficiencyData.workToRestRatio.toFixed(1)}:1
              </span>
            </div>
          </div>
        </div>

        {/* Efficiency progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Efficiency Progress</span>
            <span className="text-gray-300">{efficiencyData.workoutDensityScore.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                efficiencyData.workoutDensityScore >= 80 ? 'bg-green-500' :
                efficiencyData.workoutDensityScore >= 60 ? 'bg-blue-500' :
                efficiencyData.workoutDensityScore >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(efficiencyData.workoutDensityScore, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
