import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { componentPatterns, typography } from '@/utils/tokenUtils';

interface EnhancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function EnhancedChatInput({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  placeholder = "Ask about your training, upload form check photos, or share progress pics"
}: EnhancedChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
    }
  }, []);
  
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);
  
  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className={componentPatterns.chatLayout.inputArea()}>
      <div className={`
        ${componentPatterns.chat.inputContainer()}
        ${isFocused ? `border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]` : ''}
        transition-all duration-200
      `}>
        {/* Attachment button */}
        <button
          type="button"
          className={`
            p-2 rounded-lg flex-shrink-0 transition-colors duration-200
            text-zinc-400 hover:text-white hover:bg-zinc-700/50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
          `}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={componentPatterns.chat.inputField()}
          rows={1}
          disabled={disabled}
          style={{ resize: 'none' }}
        />
        
        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={componentPatterns.chat.sendButton()}
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}