import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns, typography, gradients } from '@/utils/tokenUtils';

interface ProgressCardProps {
  title: string;
  subtitle?: string;
  currentDay: number;
  totalDays?: number;
  encouragementMessage?: string;
  className?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  subtitle,
  currentDay,
  totalDays = 7,
  encouragementMessage,
  className,
}) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const progressPercentage = (currentDay / totalDays) * 100;

  return (
    <div className={cn(componentPatterns.card.progress(), className)}>
      {/* Header */}
      <div className="flex items-center gap-2 min-w-0 mb-3">
        <h3 className={typography.cardTitle()}>{title}</h3>
        {subtitle && (
          <span className={cn(typography.cardSubtitle(), "ml-auto shrink-0")}>
            {subtitle}
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className={cn(componentPatterns.progress.bar(), "mb-3")}>
        <div 
          className={componentPatterns.progress.fill()}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Day indicators */}
      <div className="flex justify-between">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              componentPatterns.progress.indicator(),
              index < currentDay 
                ? 'text-purple-400' 
                : index === currentDay - 1
                ? 'text-white'
                : 'text-zinc-600'
            )}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Encouragement message */}
      {encouragementMessage && currentDay <= 3 && (
        <p className={cn(typography.encouragement(), "mt-3 text-center")}>
          {encouragementMessage}
        </p>
      )}
    </div>
  );
};