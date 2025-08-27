import React from 'react';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { componentPatterns, typography, effects } from '@/utils/tokenUtils';

interface EnhancedChatHeaderProps {
  onBack?: () => void;
  onNewChat?: () => void;
  title?: string;
  showBackButton?: boolean;
}

export function EnhancedChatHeader({ 
  onBack, 
  onNewChat, 
  title = "AI Coach", 
  showBackButton = false 
}: EnhancedChatHeaderProps) {
  return (
    <div className={componentPatterns.chatLayout.header()}>
      <div className="flex items-center justify-between">
        {/* Enhanced back button */}
        {showBackButton && onBack ? (
          <button
            onClick={onBack}
            className={`
              p-2 rounded-full transition-all duration-200
              bg-zinc-800/50 border border-zinc-700/50 ${effects.blur.card()}
              text-zinc-400 hover:text-white hover:bg-zinc-700/50
              hover:scale-110 active:scale-95
              focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400
            `}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9 h-9" /> // Spacer
        )}
        
        {/* Enhanced title with AI icon */}
        <div className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500
            ${effects.glow.subtle()} flex items-center justify-center
          `}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className={typography.chatHeader()}>{title}</h1>
        </div>
        
        {/* Enhanced new chat button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className={`
              p-2 rounded-full transition-all duration-200
              bg-zinc-800/50 border border-zinc-700/50 ${effects.blur.card()}
              text-zinc-400 hover:text-white hover:bg-zinc-700/50
              hover:scale-110 active:scale-95
              focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400
            `}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}