
import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseVolumeCardProps {
  exerciseName: string;
  volume: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ExerciseVolumeCard = ({
  exerciseName,
  volume,
  trend,
  percentChange,
  className,
  style
}: ExerciseVolumeCardProps) => {
  const trendColors: Record<string, string> = {
    increasing: 'text-green-400',
    decreasing: 'text-red-400',
    stable: 'text-gray-400',
    fluctuating: 'text-yellow-400'
  };
  
  const trendIcons: Record<string, React.ReactNode> = {
    increasing: <ArrowUpRight className="w-4 h-4 text-green-400" />,
    decreasing: <ArrowDownRight className="w-4 h-4 text-red-400" />,
    stable: <Minus className="w-4 h-4 text-gray-400" />,
    fluctuating: <Minus className="w-4 h-4 text-yellow-400 rotate-45" />
  };

  return (
    <Card 
      className={cn(
        "bg-gray-800/50 border border-gray-700 p-3 hover:border-gray-600 transition-all",
        className
      )}
      style={style}
    >
      <div className="flex justify-between items-start">
        <div className="truncate mr-2">
          <h3 className="text-sm font-medium text-gray-200 truncate">{exerciseName}</h3>
          <p className="text-xs text-gray-400">Volume: {Math.round(volume * 10) / 10}</p>
        </div>
        <div className="flex items-center">
          {trendIcons[trend]}
          <span className={`text-xs ml-1 ${trendColors[trend]}`}>
            {Math.abs(percentChange).toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
};
