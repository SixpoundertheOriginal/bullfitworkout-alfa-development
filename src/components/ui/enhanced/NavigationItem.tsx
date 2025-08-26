import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns, typography, gradients } from '@/utils/tokenUtils';

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        componentPatterns.navigation.item(),
        isActive 
          ? 'text-white' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
        className
      )}
    >
      {/* Icon container */}
      <div className={cn(
        componentPatterns.navigation.iconContainer(),
        isActive 
          ? `bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]` 
          : 'bg-transparent'
      )}>
        {React.cloneElement(icon as React.ReactElement, { 
          className: `w-5 h-5 ${isActive ? 'text-white' : 'inherit'}` 
        })}
      </div>
      
      {/* Label */}
      <span className={typography.navigationLabel()}>{label}</span>
      
      {/* Active indicator */}
      {isActive && (
        <div className={componentPatterns.navigation.activeIndicator()} />
      )}
    </button>
  );
};