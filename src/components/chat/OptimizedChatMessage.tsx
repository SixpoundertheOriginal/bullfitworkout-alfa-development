import React, { memo } from 'react';
import { Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '@/hooks/useEnhancedChatState';

interface OptimizedChatMessageProps {
  message: ChatMessage;
  onRetry?: (messageId: string) => void;
}

const OptimizedChatMessage = memo(({ message, onRetry }: OptimizedChatMessageProps) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}
    >
      {isAssistant && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 relative ${
          isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted'
        }`}
      >
        {/* Message Status Indicator */}
        {message.status === 'sending' && (
          <div className="absolute -top-2 -right-2">
            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {message.status === 'failed' && (
          <div className="absolute -top-2 -right-2">
            <AlertCircle className="h-3 w-3 text-destructive" />
          </div>
        )}

        <div className="text-sm leading-relaxed">
          {isAssistant ? (
            <div className="space-y-2 overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground leading-relaxed text-sm">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-foreground pl-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-foreground pl-2">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground text-sm break-words">{children}</li>,
                  code: ({ children }) => <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground mb-2 text-sm">{children}</blockquote>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-border rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => <tr className="border-b border-border hover:bg-muted/30">{children}</tr>,
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-2 text-left font-semibold text-foreground text-xs">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2 text-foreground text-xs">
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
              {message.content}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          
          {message.status === 'failed' && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(message.id)}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});

OptimizedChatMessage.displayName = 'OptimizedChatMessage';

export default OptimizedChatMessage;