import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns, typography } from '@/utils/tokenUtils';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  unit?: string;
  comparison?: {
    percentage: number;
    label: string;
    color: string;
    message?: string;
  };
  encouragement?: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  unit,
  comparison,
  encouragement,
  isLoading = false,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn(componentPatterns.card.metric(), className)}
      onClick={onClick}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-2 min-w-0 mb-2">
        <div className="p-2 bg-zinc-800/50 rounded-lg">
          {icon}
        </div>
        <span className={typography.cardTitle()}>{title}</span>
        {comparison?.message?.includes('vs last') && comparison.percentage > 0 && (
          <span className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
            On track!
          </span>
        )}
      </div>

      {/* Value display */}
      <div className="space-y-1">
        <p className={typography.metricNumber()}>
          {isLoading ? "..." : value}
          {unit && <span className={typography.metricUnit()}>{unit}</span>}
        </p>

        {/* Comparison text */}
        {!isLoading && comparison && (
          <p className={typography.comparison()}>
            {comparison.label}
            {comparison.message ? ` ${comparison.message}` : ''}
          </p>
        )}

        {/* Encouragement text */}
        {encouragement && !isLoading && (
          <p className={cn(typography.encouragement(), "mt-2")}>{encouragement}</p>
        )}
      </div>
    </div>
  );
};