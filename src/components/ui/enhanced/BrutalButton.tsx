import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns, createBrutalButton } from '@/utils/tokenUtils';

interface BrutalButtonProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'brutal' | 'cta';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  children,
  size = 'md',
  variant = 'brutal',
  className,
  onClick,
  disabled = false,
}) => {
  const getButtonClass = () => {
    switch (variant) {
      case 'primary':
        return componentPatterns.button.primary();
      case 'cta':
        return componentPatterns.cta.brutal();
      case 'brutal':
      default:
        return createBrutalButton(size);
    }
  };

  return (
    <button
      className={cn(
        getButtonClass(),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};