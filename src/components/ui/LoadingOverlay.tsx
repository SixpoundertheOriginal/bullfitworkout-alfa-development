import React from 'react';
import { cn } from '@/lib/utils';
import { componentPatterns } from '@/utils/tokenUtils';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Generating program...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className={cn(componentPatterns.cards.metric(), 'flex flex-col items-center gap-3 pointer-events-none')}>
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        {message && <p className="text-sm text-white/80">{message}</p>}
      </div>
    </div>
  );
}
