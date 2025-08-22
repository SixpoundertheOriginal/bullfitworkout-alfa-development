import React from 'react';
import { UniversalCard, UniversalCardContent } from './UniversalCard';
import { cn } from '@/lib/utils';

interface StatCardProps {
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

export function StatCard({ 
  icon, 
  title, 
  value, 
  unit, 
  comparison,
  encouragement,
  isLoading,
  className,
  onClick
}: StatCardProps) {
  return (
    <UniversalCard
      variant="glass"
      intensity="medium"
      className={cn("transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]", className)}
      onClick={onClick}
    >
      <UniversalCardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 min-w-0 mb-2">
          <div className="p-2 bg-zinc-800/50 rounded-lg">
            {icon}
          </div>
          <span className="text-sm truncate text-white/70">{title}</span>
          {comparison?.message?.includes('vs last') && comparison.percentage > 0 && (
            <span className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              On track!
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xl sm:text-2xl font-semibold tabular-nums text-white">
            {isLoading ? "..." : value}
            {unit && <span className="text-sm text-white/80 ml-1">{unit}</span>}
          </p>

          {!isLoading && comparison && (
            <p className="text-xs text-white/70 leading-snug">
              {comparison.label}
              {comparison.message ? ` ${comparison.message}` : ''}
            </p>
          )}

          {encouragement && !isLoading && (
            <p className="text-xs text-purple-400 mt-2">{encouragement}</p>
          )}
        </div>
      </UniversalCardContent>
    </UniversalCard>
  );
}