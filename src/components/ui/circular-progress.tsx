
import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  valueClassName?: string;
  className?: string;
  progressColor?: string;
  trackColor?: string;
  children?: React.ReactNode;
  animated?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 40,
  strokeWidth = 4,
  showValue = false,
  valueClassName,
  className,
  progressColor = 'stroke-primary',
  trackColor = 'stroke-gray-200/20',
  children,
  animated = false,
}) => {
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className={cn(
          "transform -rotate-90",
          animated && "animate-pulse"
        )}
      >
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackColor}
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={progressColor}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>

      {showValue && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center text-xs font-medium',
            valueClassName
          )}
        >
          {Math.round(percentage)}%
        </div>
      )}
      
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};
