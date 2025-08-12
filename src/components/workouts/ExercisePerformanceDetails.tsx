
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, ArrowRight, Clock } from "lucide-react";
import { ExerciseSet } from "@/types/exercise";
import { ExercisePerformance } from "@/hooks/useExercisePerformance";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { formatTime } from "@/utils/formatTime";


interface ExercisePerformanceDetailsProps {
  exerciseName: string;
  performance: ExercisePerformance | null;
  isLoading: boolean;
  currentSets: ExerciseSet[];
}

export const ExercisePerformanceDetails: React.FC<ExercisePerformanceDetailsProps> = ({ 
  exerciseName,
  performance,
  isLoading,
  currentSets
}) => {
  const { weightUnit } = useWeightUnit();
  
  // Calculate current workout stats
  const completedSets = currentSets.filter(set => set.completed);
  const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
  const maxWeight = currentSets.reduce((max, set) => Math.max(max, set.weight), 0);
  const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
  
  // Calculate average rest time (exclude first set)
  const restTimes = currentSets.slice(1).map(set => (set.restTime ?? 0));
  const avgRestTimeSec = restTimes.length ?
    restTimes.reduce((sum, time) => sum + time, 0) / restTimes.length : 0;
  
  // Get performance trend indicators
  const getTrendIcon = (trend: string | undefined) => {
    if (!trend) return null;
    if (trend === 'increasing') return <TrendingUp className="text-green-400 h-4 w-4" />;
    if (trend === 'decreasing') return <TrendingDown className="text-red-400 h-4 w-4" />;
    return <ArrowRight className="text-gray-400 h-4 w-4" />;
  };
  
  if (isLoading) {
    return (
      <Card className="mt-6 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading performance data...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6 bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{exerciseName} Performance</span>
          <div className="flex items-center text-sm font-normal">
            <Clock className="h-3 w-3 mr-1 text-purple-400" />
            Average rest: <span className="font-mono ml-1">{formatTime(Math.round(avgRestTimeSec))}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volume comparison */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Volume</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">
                {totalVolume} {weightUnit}
              </span>
              {performance && (
                <div className="flex items-center">
                  {performance?.percentChange > 0 ? 
                    <span className="text-green-400 text-xs">+{performance.percentChange.toFixed(1)}%</span> :
                    performance?.percentChange < 0 ?
                    <span className="text-red-400 text-xs">{performance.percentChange.toFixed(1)}%</span> :
                    <span className="text-gray-400 text-xs">0%</span>
                  }
                  {getTrendIcon(performance?.trend)}
                </div>
              )}
            </div>
          </div>
          
          {performance?.totalVolume && (
            <Progress 
              value={(totalVolume / performance.totalVolume) * 100} 
              className="h-1.5 bg-gray-800"
            />
          )}
        </div>
        
        {/* Rest time distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-1">Max Weight</div>
            <div className="text-lg font-mono">{maxWeight} {weightUnit}</div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-1">Total Sets</div>
            <div className="text-lg font-mono">{completedSets.length} / {currentSets.length}</div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-1">Total Reps</div>
            <div className="text-lg font-mono">{totalReps}</div>
          </div>
        </div>
        
        {/* Rest time analysis */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Rest Time Analysis</h4>
          <div className="grid grid-cols-4 gap-2">
            {restTimes.map((time, index) => (
              <div 
                key={index}
                className={`h-10 rounded flex items-center justify-center font-mono text-xs
                  ${
                    !time ? 'bg-gray-800/30 text-gray-600' :
                    time < 30 ? 'bg-red-900/30 text-red-300' :
                    time < 60 ? 'bg-yellow-900/30 text-yellow-300' :
                    time < 120 ? 'bg-green-900/30 text-green-300' :
                    'bg-blue-900/30 text-blue-300'
                  }`}
              >
                {time || '-'}s
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-1 text-xs text-gray-500">
            <div className="text-center">Set 1</div>
            <div className="text-center">Set 2</div>
            <div className="text-center">Set 3</div>
            <div className="text-center">Set 4</div>
          </div>
          
          <div className="flex justify-between mt-4 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-400 mr-1"></div>
              <span>Short (&lt;30s)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
              <span>Medium (30-60s)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
              <span>Standard (60-120s)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-400 mr-1"></div>
              <span>Long (&gt;120s)</span>
            </div>
          </div>
        </div>
        
        {performance?.timeOfDayPerformance && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Time of Day Performance</h4>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(performance.timeOfDayPerformance).map(([time, value]) => {
                const maxValue = Math.max(
                  ...Object.values(performance.timeOfDayPerformance)
                );
                const percentage = maxValue ? (value / maxValue) * 100 : 0;
                
                return (
                  <div key={time} className="flex flex-col items-center">
                    <div className="h-20 w-full flex items-end justify-center">
                      <div 
                        className="w-3/5 bg-purple-500/30 rounded-t"
                        style={{ height: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs capitalize">{time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
