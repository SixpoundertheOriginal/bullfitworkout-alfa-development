
import React from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface WorkoutIntensityGaugeProps {
  intensity: number;
  className?: string;
}

export const WorkoutIntensityGauge: React.FC<WorkoutIntensityGaugeProps> = ({
  intensity,
  className
}) => {
  // Determine color based on intensity level
  const getIntensityColor = () => {
    if (intensity < 30) return 'from-blue-500 to-blue-700';
    if (intensity < 60) return 'from-green-500 to-green-700';
    if (intensity < 80) return 'from-yellow-500 to-yellow-700';
    return 'from-red-500 to-red-700';
  };
  
  // Determine description based on intensity level
  const getIntensityDescription = () => {
    if (intensity < 30) return 'Light';
    if (intensity < 60) return 'Moderate';
    if (intensity < 80) return 'Intense';
    return 'Very Intense';
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-gray-700/30"></div>
        
        {/* Colored arc (intensity indicator) */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${getIntensityColor()} rounded-full`}
          style={{
            clipPath: `polygon(50% 50%, 50% 0%, ${
              50 + 50 * Math.sin((Math.min(intensity, 100) / 100) * Math.PI * 2)
            }% ${
              50 - 50 * Math.cos((Math.min(intensity, 100) / 100) * Math.PI * 2)
            }%, ${intensity > 75 ? '100% 50%, 50% 50%' : ''})`
          }}
        ></div>
        
        {/* Center circle with icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-gray-800 w-14 h-14 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      
      <div className="text-center mt-2">
        <div className="text-lg font-bold">{Math.round(intensity)}%</div>
        <div className="text-xs text-gray-400">{getIntensityDescription()} Intensity</div>
      </div>
    </div>
  );
};
