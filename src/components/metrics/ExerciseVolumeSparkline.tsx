
import React from 'react';
import { cn } from '@/lib/utils';

interface ExerciseVolumeSparklineProps {
  volumes: number[];
  positive?: boolean;
  negative?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const ExerciseVolumeSparkline = ({
  volumes,
  positive,
  negative,
  width = 50,
  height = 20,
  className
}: ExerciseVolumeSparklineProps) => {
  if (!volumes || volumes.length < 2) return null;
  
  const max = Math.max(...volumes);
  const min = Math.min(...volumes);
  const range = max - min || 1;
  
  const normalizeValue = (value: number) => {
    return height - ((value - min) / range) * height;
  };
  
  const points = volumes.map((volume, index) => {
    const x = (index / (volumes.length - 1)) * width;
    const y = normalizeValue(volume);
    return `${x},${y}`;
  }).join(' ');
  
  const strokeColor = positive ? 'stroke-green-500' : negative ? 'stroke-red-500' : 'stroke-blue-500';
  
  return (
    <svg width={width} height={height} className={cn("ml-1", className)}>
      <polyline
        points={points}
        fill="none"
        className={cn(
          "stroke-[1.5] transition-all duration-300", 
          strokeColor
        )}
      />
      {/* Add dots at each data point */}
      {volumes.map((volume, index) => {
        const x = (index / (volumes.length - 1)) * width;
        const y = normalizeValue(volume);
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="1.5"
            className={cn(
              "transition-all duration-300",
              index === volumes.length - 1 ? 'fill-white' : strokeColor
            )}
          />
        );
      })}
    </svg>
  );
};
