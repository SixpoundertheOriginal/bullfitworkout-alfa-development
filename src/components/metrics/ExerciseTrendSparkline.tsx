
import React from 'react';
import { cn } from '@/lib/utils';
import { ExerciseVolumeSparkline } from './ExerciseVolumeSparkline';

interface ExerciseTrendSparklineProps {
  exerciseName: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange: number;
  volumes?: number[];
  className?: string;
}

export const ExerciseTrendSparkline: React.FC<ExerciseTrendSparklineProps> = ({
  exerciseName,
  trend,
  percentChange,
  volumes = [],
  className
}) => {
  const isPositive = trend === 'increasing';
  const isNegative = trend === 'decreasing';
  
  const getTrendClass = () => {
    switch(trend) {
      case 'increasing': return 'text-green-400';
      case 'decreasing': return 'text-red-400';
      case 'fluctuating': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };
  
  const getTrendText = () => {
    if (percentChange > 0) {
      return `+${percentChange.toFixed(1)}%`;
    } else if (percentChange < 0) {
      return `${percentChange.toFixed(1)}%`;
    }
    return 'Stable';
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="truncate flex-1">{exerciseName}</span>
      {volumes.length > 1 && (
        <ExerciseVolumeSparkline 
          volumes={volumes} 
          positive={isPositive} 
          negative={isNegative}
        />
      )}
      <span className={cn("text-xs", getTrendClass())}>
        {getTrendText()}
      </span>
    </div>
  );
};
