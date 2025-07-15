import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Clock, BarChart3, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

interface WorkoutSummaryPreviewProps {
  workoutId: string;
  exerciseCount: number;
  setCount: number;
  exerciseData?: Record<string, any>;
  duration: number;
  weightUnit: string;
  isLoading?: boolean;
}

export const WorkoutSummaryPreview: React.FC<WorkoutSummaryPreviewProps> = ({
  workoutId,
  exerciseCount,
  setCount,
  exerciseData,
  duration,
  weightUnit = 'kg',
  isLoading = false
}) => {
  // Use the centralized workout metrics processor with type assertion
  const metrics = processWorkoutMetrics(
    exerciseData || {},
    duration,
    weightUnit as 'kg' | 'lb'
  );

  // Get the primary muscle focus
  const muscleGroups = Object.entries(metrics.muscleFocus).sort((a, b) => b[1] - a[1]);
  const primaryMuscle = muscleGroups.length > 0 ? muscleGroups[0][0] : null;
  const secondaryMuscle = muscleGroups.length > 1 ? muscleGroups[1][0] : null;

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2 pb-1 px-1">
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-1/3 rounded-md" />
          <Skeleton className="h-12 w-1/3 rounded-md" />
          <Skeleton className="h-12 w-1/3 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-1 px-1 space-y-4">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Dumbbell className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
                <span className="text-xs text-gray-300">Volume</span>
              </div>
              <span className="text-sm font-semibold">
                {Math.round(metrics.totalVolume)} {weightUnit}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                <span className="text-xs text-gray-300">Density</span>
              </div>
              <span className="text-sm font-semibold">
                {metrics.density.toFixed(1)} sets/min
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Muscle Focus */}
      {muscleGroups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-300">Muscle Focus</span>
            <div className="flex gap-1">
              {primaryMuscle && (
                <Badge variant="outline" className="text-xs py-0 h-5 bg-gray-800 border-gray-700">
                  {primaryMuscle.charAt(0).toUpperCase() + primaryMuscle.slice(1)}
                </Badge>
              )}
              {secondaryMuscle && (
                <Badge variant="outline" className="text-xs py-0 h-5 bg-gray-800 border-gray-700">
                  {secondaryMuscle.charAt(0).toUpperCase() + secondaryMuscle.slice(1)}
                </Badge>
              )}
            </div>
          </div>

          {/* Muscle Distribution Bars */}
          <div className="space-y-1.5">
            {muscleGroups.slice(0, 3).map(([muscle, value], index) => {
              // Calculate percentage based on total across all muscle groups
              const totalValue = muscleGroups.reduce((sum, [_, val]) => sum + val, 0);
              const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

              return (
                <div key={muscle} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </span>
                    <span className="text-gray-400">{Math.round(percentage)}%</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" 
                    indicatorClassName={`${index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-blue-500' : 'bg-pink-500'}`} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise Composition */}
      {metrics.composition.totalExercises > 0 && (
        <div>
          <div className="flex items-center mb-1.5">
            <Activity className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
            <span className="text-xs text-gray-300">Exercise Types</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {metrics.composition.compound.count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Compound</span>
                <span>{Math.round(metrics.composition.compound.percentage)}%</span>
              </div>
            )}
            {metrics.composition.isolation.count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Isolation</span>
                <span>{Math.round(metrics.composition.isolation.percentage)}%</span>
              </div>
            )}
            {metrics.composition.bodyweight.count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Bodyweight</span>
                <span>{Math.round(metrics.composition.bodyweight.percentage)}%</span>
              </div>
            )}
            {metrics.composition.isometric.count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Isometric</span>
                <span>{Math.round(metrics.composition.isometric.percentage)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Distribution */}
      <div>
        <div className="flex items-center mb-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
          <span className="text-xs text-gray-300">Time Distribution</span>
        </div>

        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-600"
            style={{ width: `${metrics.timeDistribution.activeTimePercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs mt-1 text-gray-400">
          <span>Active: {Math.round(metrics.timeDistribution.activeTime)}min</span>
          <span>Rest: {Math.round(metrics.timeDistribution.restTime)}min</span>
        </div>
      </div>
    </div>
  );
}
