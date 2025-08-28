import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns, typography, gradients } from '@/utils/tokenUtils';

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'brutal';
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className,
  variant = 'default',
}) => {
  const itemClass = variant === 'brutal' 
    ? componentPatterns.navigation.itemBrutal()
    : componentPatterns.navigation.item();
  
  const iconContainerClass = variant === 'brutal'
    ? componentPatterns.navigation.iconContainerBrutal()
    : componentPatterns.navigation.iconContainer();
    
  const activeIndicatorClass = variant === 'brutal'
    ? componentPatterns.navigation.activeIndicatorBrutal()
    : componentPatterns.navigation.activeIndicator();
  return (
    <button
      onClick={onClick}
      className={cn(
        itemClass,
        isActive 
          ? 'text-white' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
        className
      )}
    >
      {/* Icon container */}
      <div className={cn(
        iconContainerClass,
        isActive 
          ? variant === 'brutal'
            ? 'bg-white/20 border-white/40'
            : `bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]`
          : 'bg-transparent'
      )}>
        {React.cloneElement(icon as React.ReactElement, { 
          className: `w-5 h-5 ${isActive ? 'text-white' : 'inherit'}` 
        })}
      </div>
      
      {/* Label */}
      <span className={variant === 'brutal' ? typography.navigationLabelBrutal() : typography.navigationLabel()}>{label}</span>
      
      {/* Active indicator */}
      {isActive && (
        <div className={activeIndicatorClass} />
      )}
    </button>
  );
};