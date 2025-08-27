import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export function BackButton({
  icon = <ArrowLeft className="h-4 w-4" />,
  className,
  ...props
}: BackButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'p-2 rounded-full bg-white/10 text-white backdrop-blur-sm',
        'transition-transform hover:scale-105 active:scale-95 hover:bg-white/20',
        className
      )}
    >
      {icon}
    </button>
  );
}

