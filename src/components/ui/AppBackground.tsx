import React from 'react';
import { cn } from '@/lib/utils';

interface AppBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
  /**
   * When true, prevents enforcing a full screen height.
   * Useful when rendering inside constrained containers like sheets.
   */
  noMinHeight?: boolean;
}

export function AppBackground({
  children,
  variant = 'primary',
  className,
  noMinHeight = false
}: AppBackgroundProps) {
  const getBackgroundStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-gray-900 via-gray-900/98 to-gray-900/95';
      case 'secondary':
        return 'bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-900/85';
      case 'minimal':
        return 'bg-gray-900';
      default:
        return 'bg-gradient-to-br from-gray-900 via-gray-900/98 to-gray-900/95';
    }
  };

  return (
    <div
      className={cn(
        !noMinHeight && 'min-h-screen',
        'w-full',
        getBackgroundStyles(),
        className
      )}
    >
      {children}
    </div>
  );
}