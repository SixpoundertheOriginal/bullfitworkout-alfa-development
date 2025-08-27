import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatImageUpload } from './ChatImageUpload';
import type { UploadedImage } from './ImageUpload';
import { componentPatterns, typography, gradients, effects } from '@/utils/tokenUtils';

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
    <div className={componentPatterns.chatLayout.inputArea()}>
      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="p-3 border-b bg-zinc-800/30 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-zinc-400" />
            <span className={`${typography.bodySmall()} text-zinc-300`}>{selectedImages.length} image(s) selected</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative shrink-0 group">
                <img 
                  src={image.url} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border-2 border-zinc-700" 
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
                  className="absolute bottom-0 left-0 text-xs capitalize bg-zinc-900/90 text-zinc-300"
                >
                  {image.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Input Container */}
      <div className={`
        ${componentPatterns.chat.inputContainer()}
        ${isFocused ? `border-purple-400/50 ${effects.glow.subtle()}` : ''}
        transition-all duration-200 rounded-xl
      `}>
        {/* Image Upload Button */}
        <div className="shrink-0">
          <ChatImageUpload
            onImagesSelect={onImagesSelect}
            maxImages={4 - selectedImages.length}
            disabled={selectedImages.length >= 4 || disabled}
            className={`
              p-2 rounded-lg transition-colors duration-200
              text-zinc-400 hover:text-white hover:bg-zinc-700/50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
            `}
          />
        </div>

        {/* Enhanced Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onPaste={onPaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={componentPatterns.chat.inputField()}
          rows={1}
          style={{ resize: 'none' }}
        />

        {/* Enhanced Send Button */}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={componentPatterns.chat.sendButton()}
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white transform rotate-45" />
          )}
        </button>
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
              className="shrink-0 h-8 px-3 text-xs text-zinc-400 hover:text-white bg-zinc-800/30 hover:bg-zinc-700/50 rounded-full border border-zinc-700/30"
            >
              {action}
            </Button>
          ))}
        </div>
      )}

      {/* Input hints for mobile */}
      {isFocused && (
        <div className={`mt-2 ${typography.caption()} text-zinc-500 flex items-center gap-4`}>
          <span>Enter to send</span>
          <span>Shift+Enter for new line</span>
        </div>
      )}
    </div>
  );
}