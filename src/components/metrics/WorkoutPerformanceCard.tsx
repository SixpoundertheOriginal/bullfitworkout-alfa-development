
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Percent, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseTrendSparkline } from './ExerciseTrendSparkline';

interface WorkoutPerformanceCardProps {
  intensity: number;
  efficiency: number;
  volume: number;
  duration: number;
  trendExercises?: {
    exerciseName: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    percentChange: number;
    volumes?: number[];
  }[];
  className?: string;
}

export const WorkoutPerformanceCard: React.FC<WorkoutPerformanceCardProps> = ({
  intensity,
  efficiency,
  volume,
  duration,
  trendExercises = [],
  className
}) => {
  return (
    <Card className={cn("bg-gray-900/90 border-gray-800 overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
          Workout Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Activity className="h-3 w-3 text-purple-400 mr-1" />
              <span className="text-xs text-gray-400">Intensity</span>
            </div>
            <div className="flex items-end">
              <div className="text-xl font-semibold">{Math.round(intensity)}%</div>
              <div className="text-xs text-gray-500 ml-1 mb-0.5">of max</div>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${Math.min(100, intensity)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Percent className="h-3 w-3 text-purple-400 mr-1" />
              <span className="text-xs text-gray-400">Efficiency</span>
            </div>
            <div className="flex items-end">
              <div className="text-xl font-semibold">{Math.round(efficiency)}%</div>
              <div className="text-xs text-gray-500 ml-1 mb-0.5">completion</div>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${Math.min(100, efficiency)}%` }}
              />
            </div>
          </div>
        </div>
        
        {trendExercises && trendExercises.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="text-xs text-gray-400 mb-1">Exercise Trends</div>
            {trendExercises.slice(0, 3).map(exercise => (
              <ExerciseTrendSparkline
                key={exercise.exerciseName}
                exerciseName={exercise.exerciseName}
                trend={exercise.trend}
                percentChange={exercise.percentChange}
                volumes={exercise.volumes}
                className="bg-gray-800/30 p-2 rounded-lg"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
