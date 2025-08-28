import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns, typography, effects } from '@/utils/tokenUtils';

interface BrutalCardProps {
  children: React.ReactNode;
  variant?: 'brutal' | 'industrial' | 'metric';
  className?: string;
  onClick?: () => void;
  title?: string;
  icon?: React.ReactNode;
}

export const BrutalCard: React.FC<BrutalCardProps> = ({
  children,
  variant = 'brutal',
  className,
  onClick,
  title,
  icon,
}) => {
  const cardClass = variant === 'metric' 
    ? componentPatterns.card.metricBrutal()
    : variant === 'industrial'
    ? componentPatterns.card.industrial()
    : componentPatterns.card.brutal();

  return (
    <div
      className={cn(cardClass, className)}
      onClick={onClick}
    >
      {/* Header with icon and title */}
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="p-2 bg-white/10 rounded-none border border-white/20">
              {icon}
            </div>
          )}
          {title && (
            <h3 className={typography.cardTitleBrutal()}>{title}</h3>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};