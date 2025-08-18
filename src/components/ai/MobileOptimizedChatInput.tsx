import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatImageUpload } from './ChatImageUpload';
import type { UploadedImage } from './ImageUpload';

interface MobileOptimizedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  selectedImages: UploadedImage[];
  onImagesSelect: (images: UploadedImage[]) => void;
  onImageRemove: (index: number) => void;
  disabled?: boolean;
  placeholder?: string;
  quickActions?: string[];
  onQuickAction?: (action: string) => void;
  showQuickActions?: boolean;
}

export function MobileOptimizedChatInput({
  value,
  onChange,
  onSend,
  onPaste,
  selectedImages,
  onImagesSelect,
  onImageRemove,
  disabled = false,
  placeholder = "Type your message...",
  quickActions = [],
  onQuickAction,
  showQuickActions = false
}: MobileOptimizedChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = (value.trim() || selectedImages.length > 0) && !disabled;

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedImages.length} image(s) selected</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative shrink-0 group">
                <img 
                  src={image.url} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border-2 border-border" 
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onImageRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Badge 
                  variant="secondary" 
                  className="absolute bottom-0 left-0 text-xs capitalize bg-background/90"
                >
                  {image.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-4">
        <div className="flex gap-3 items-end">
          {/* Image Upload Button */}
          <div className="shrink-0">
            <ChatImageUpload
              onImagesSelect={onImagesSelect}
              maxImages={4 - selectedImages.length}
              disabled={selectedImages.length >= 4 || disabled}
              className="relative"
            />
          </div>

          {/* Text Input Container */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onPaste={onPaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "resize-none min-h-[44px] max-h-[120px] pr-12 transition-all duration-200",
                "bg-background border-2 rounded-xl",
                "focus:border-primary focus:ring-0 focus:ring-offset-0",
                "placeholder:text-muted-foreground/70",
                isFocused && "shadow-sm",
                "text-base md:text-sm" // Larger text on mobile
              )}
              rows={1}
            />
            
            {/* Character count - only show on long messages */}
            {value.length > 100 && (
              <div className="absolute bottom-2 right-12 text-xs text-muted-foreground bg-background/80 px-1 rounded">
                {value.length}/2000
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button 
            onClick={onSend} 
            disabled={!canSend}
            size="default"
            className={cn(
              "h-11 w-11 p-0 shrink-0 rounded-xl transition-all duration-200",
              canSend 
                ? "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl" 
                : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        {showQuickActions && quickActions.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => onQuickAction?.(action)}
                className="shrink-0 h-8 px-3 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 rounded-full"
              >
                {action}
              </Button>
            ))}
          </div>
        )}

        {/* Input hints for mobile */}
        {isFocused && (
          <div className="mt-2 text-xs text-muted-foreground/70 flex items-center gap-4">
            <span>Enter to send</span>
            <span>Shift+Enter for new line</span>
          </div>
        )}
      </div>
    </div>
  );
}