
import React from 'react';
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ExerciseSet } from '@/types/exercise';
import { calculateSetVolume } from '@/utils/exerciseUtils';

interface ExerciseVolumeChartProps {
  exercises: Record<string, ExerciseSet[]>;
  weightUnit: string;
  className?: string;
}

export const ExerciseVolumeChart: React.FC<ExerciseVolumeChartProps> = ({
  exercises,
  weightUnit,
  className
}) => {
  // Calculate volume per exercise
  const data = Object.entries(exercises).map(([exerciseName, sets]) => {
    const volume = sets.reduce((total, set) => {
      if (set.completed) {
        return total + calculateSetVolume(set, exerciseName);
      }
      return total;
    }, 0);
    
    return {
      name: exerciseName,
      volume: Math.round(volume * 10) / 10
    };
  }).sort((a, b) => b.volume - a.volume);
  
  // Chart configuration
  const chartConfig = {
    volume: { theme: { dark: '#9b87f5', light: '#9b87f5' } }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-2 text-gray-400">
        Volume by Exercise ({weightUnit})
      </h3>
      <div className="bg-gray-800/50 rounded-lg h-60 p-2">
        <ChartContainer 
          className="h-full w-full [&_.recharts-cartesian-axis-tick-value]:fill-gray-400 [&_.recharts-cartesian-axis-tick-value]:text-xs [&_.recharts-cartesian-axis-tick-value]:font-mono"
          config={chartConfig}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)} ${weightUnit}`, 'Volume']}
                labelFormatter={(label: string) => `Exercise: ${label}`}
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
              />
              <Bar 
                dataKey="volume" 
                name={`Volume (${weightUnit})`} 
                fill="var(--color-volume)"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};
