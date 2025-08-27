import React, { useRef, useCallback, useEffect } from 'react';
import { componentPatterns } from '@/utils/tokenUtils';
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard';

interface EnhancedChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function EnhancedChatContainer({ children, className }: EnhancedChatContainerProps) {
  const { isKeyboardVisible } = useMobileKeyboard();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);
  
  return (
    <div className={`
      ${componentPatterns.chatLayout.container()}
      ${isKeyboardVisible ? 'keyboard-aware' : ''}
      ${className || ''}
    `}>
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
}