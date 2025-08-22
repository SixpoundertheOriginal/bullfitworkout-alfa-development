import React from 'react';
import { cn } from '@/lib/utils';

export interface UniversalCardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'elevated' | 'minimal';
  intensity?: 'subtle' | 'medium' | 'premium';
  className?: string;
  onClick?: () => void;
}

export function UniversalCard({ 
  children, 
  variant = 'glass', 
  intensity = 'medium',
  className,
  onClick 
}: UniversalCardProps) {
  const getCardStyles = () => {
    const baseStyles = 'rounded-xl transition-all duration-300 relative overflow-hidden';
    
    // Interactive styles
    const interactiveStyles = onClick 
      ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] group'
      : '';

    // Variant styles
    const variantStyles = (() => {
      switch (variant) {
        case 'glass':
          return getGlassStyles(intensity);
        case 'elevated':
          return getElevatedStyles(intensity);
        case 'minimal':
          return getMinimalStyles(intensity);
        default:
          return getGlassStyles(intensity);
      }
    })();

    return cn(baseStyles, interactiveStyles, variantStyles);
  };

  const getGlassStyles = (intensity: string) => {
    const intensityMap = {
      subtle: {
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.08) 100%)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.1))'
      },
      medium: {
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.12) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        filter: 'drop-shadow(0 10px 20px rgba(139, 92, 246, 0.15)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      },
      premium: {
        background: 'linear-gradient(135deg, rgba(139,92,246,0.16) 0%, rgba(236,72,153,0.16) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        filter: 'drop-shadow(0 12px 24px rgba(139, 92, 246, 0.2)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))'
      }
    };

    return intensityMap[intensity as keyof typeof intensityMap] || intensityMap.medium;
  };

  const getElevatedStyles = (intensity: string) => {
    const intensityMap = {
      subtle: 'bg-gray-800/50 border border-gray-700/50 shadow-lg',
      medium: 'bg-gray-800/70 border border-gray-700/70 shadow-xl',
      premium: 'bg-gray-800/90 border border-gray-700/90 shadow-2xl'
    };

    return intensityMap[intensity as keyof typeof intensityMap] || intensityMap.medium;
  };

  const getMinimalStyles = (intensity: string) => {
    const intensityMap = {
      subtle: 'bg-gray-900/30 border border-gray-800/30',
      medium: 'bg-gray-900/50 border border-gray-800/50',
      premium: 'bg-gray-900/70 border border-gray-800/70'
    };

    return intensityMap[intensity as keyof typeof intensityMap] || intensityMap.medium;
  };

  const cardStyles = getCardStyles();
  const isGlass = variant === 'glass';

  return (
    <div 
      className={cn(cardStyles, className)}
      style={isGlass ? getGlassStyles(intensity) : undefined}
      onClick={onClick}
    >
      {/* Inner highlight for glass variant */}
      {isGlass && (
        <div 
          className="absolute inset-0 rounded-xl opacity-50"
          style={{
            background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
            mixBlendMode: 'overlay'
          }}
        />
      )}

      {/* Hover glow effect for glass variant */}
      {isGlass && onClick && (
        <div 
          className="absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 100%)',
            filter: 'blur(1px)'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Content components
export function UniversalCardHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('p-4 pb-2', className)}>
      {children}
    </div>
  );
}

export function UniversalCardContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('p-4 pt-0', className)}>
      {children}
    </div>
  );
}

export function UniversalCardTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-white/90', className)}>
      {children}
    </h3>
  );
}

export function UniversalCardDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <p className={cn('text-sm text-white/60 mt-1', className)}>
      {children}
    </p>
  );
}