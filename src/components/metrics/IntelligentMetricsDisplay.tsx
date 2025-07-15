
import React from 'react';
import { ExerciseVolumeCard } from './ExerciseVolumeCard';
import { WorkoutIntensityGauge } from './WorkoutIntensityGauge';
import { WorkoutEfficiencyScore } from './WorkoutEfficiencyScore';
import { calculateSetVolume, getTrendIndicator } from '@/utils/exerciseUtils';
import { cn } from '@/lib/utils';
import { ExerciseSet } from '@/types/exercise';

interface IntelligentMetricsDisplayProps {
  exercises: Record<string, ExerciseSet[]>;
  intensity: number;
  efficiency: number;
  className?: string;
}

export const IntelligentMetricsDisplay = ({
  exercises,
  intensity,
  efficiency,
  className
}: IntelligentMetricsDisplayProps) => {
  const volumeData = Object.entries(exercises || {}).map(([exerciseName, sets]) => {
    const currentVolume = sets.reduce((total, set) => total + calculateSetVolume(set), 0);
    const completedSets = sets.filter(set => set.completed);
    
    const setVolumes = completedSets.map(set => calculateSetVolume(set));
    const firstSetVolume = setVolumes[0] || 0;
    const lastSetVolume = setVolumes[setVolumes.length - 1] || 0;
    
    const trend = getTrendIndicator(lastSetVolume, firstSetVolume);
    const percentChange = firstSetVolume > 0 
      ? ((lastSetVolume - firstSetVolume) / firstSetVolume) * 100 
      : 0;

    return {
      exerciseName,
      volume: currentVolume,
      trend,
      percentChange
    };
  }).sort((a, b) => b.volume - a.volume);

  return (
    <div className={cn(
      "space-y-4",
      "bg-gray-900/50 p-4 rounded-xl border border-gray-800 mb-4",
      className
    )}>
      <h3 className="text-sm font-medium text-gray-300 mb-3">Workout Progress</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {volumeData.map((data, index) => (
          <ExerciseVolumeCard
            key={data.exerciseName}
            exerciseName={data.exerciseName}
            volume={data.volume}
            trend={data.trend}
            percentChange={data.percentChange}
            className="animate-[fadeIn_0.3s_ease-out_forwards]"
            style={{
              animationDelay: `${index * 0.1}s`,
              opacity: 0
            }}
          />
        ))}
      </div>
      
      <div className="flex flex-wrap gap-4 justify-around items-center mt-4">
        <WorkoutIntensityGauge intensity={intensity} />
        <WorkoutEfficiencyScore score={efficiency} />
      </div>
    </div>
  );
};
