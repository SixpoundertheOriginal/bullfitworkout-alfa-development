import React, { useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import OptimizedChatMessage from './OptimizedChatMessage';
import { ChatMessage } from '@/hooks/useEnhancedChatState';

interface VirtualizedChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoaded: boolean;
  onRetry?: (messageId: string) => void;
}

const VirtualizedChatContainer = ({ 
  messages, 
  isLoading, 
  isLoaded, 
  onRetry 
}: VirtualizedChatContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Optimized scroll to bottom function
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current) return;
    
    // Only auto-scroll if user hasn't manually scrolled up or if forced
    if (shouldAutoScroll.current || force) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Handle user scroll to detect manual scrolling
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    shouldAutoScroll.current = isNearBottom;
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Add scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const LoadingSkeleton = () => (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-lg px-4 py-3 max-w-[75%]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[60vh] max-h-[600px] min-h-[400px]">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="p-6 space-y-4">
          {isLoaded ? (
            <>
              {messages.map((message) => (
                <OptimizedChatMessage
                  key={message.id}
                  message={message}
                  onRetry={onRetry}
                />
              ))}
              
              {isLoading && <LoadingSkeleton />}
            </>
          ) : (
            <div className="flex items-center justify-center p-8">
              <Skeleton className="h-4 w-48" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default VirtualizedChatContainer;