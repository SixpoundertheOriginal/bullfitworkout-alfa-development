import { useState, useEffect, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'delivered' | 'failed';
  retryCount?: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isLoaded: boolean;
}

const STORAGE_KEY = 'ai-coach-chat-messages';
const MAX_RETRIES = 3;
const MESSAGE_BATCH_SIZE = 50;

export const useEnhancedChatState = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isLoaded: false,
  });
  
  const messageQueue = useRef<ChatMessage[]>([]);
  const persistenceTimer = useRef<NodeJS.Timeout>();

  // Initialize chat with welcome message
  const initializeChat = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: "Hi! I'm your AI Training Coach. I have access to your complete workout history and can help you analyze your progress, identify patterns, and optimize your training. What would you like to know about your fitness journey?",
      timestamp: new Date(),
      status: 'delivered'
    };
    return [welcomeMessage];
  }, []);

  // Load messages from localStorage with error handling
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedMessages = JSON.parse(stored).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            status: msg.status || 'delivered' // Ensure status exists
          }));
          setState(prev => ({
            ...prev,
            messages: parsedMessages,
            isLoaded: true
          }));
        } else {
          setState(prev => ({
            ...prev,
            messages: initializeChat(),
            isLoaded: true
          }));
        }
      } catch (error) {
        console.error('Error loading chat messages:', error);
        setState(prev => ({
          ...prev,
          messages: initializeChat(),
          isLoaded: true,
          error: 'Failed to load chat history'
        }));
      }
    };

    loadMessages();
  }, [initializeChat]);

  // Debounced persistence to avoid excessive localStorage writes
  const persistMessages = useCallback((messages: ChatMessage[]) => {
    if (persistenceTimer.current) {
      clearTimeout(persistenceTimer.current);
    }
    
    persistenceTimer.current = setTimeout(() => {
      try {
        // Only persist successfully delivered messages
        const messagesToPersist = messages.filter(msg => msg.status === 'delivered');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToPersist));
      } catch (error) {
        console.error('Error saving chat messages:', error);
      }
    }, 500); // 500ms debounce
  }, []);

  // Add message with proper state management
  const addMessage = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: messageData.role === 'user' ? 'sending' : 'delivered'
    };

    setState(prev => {
      const updatedMessages = [...prev.messages, newMessage];
      
      // Trigger persistence for new messages
      if (newMessage.status === 'delivered') {
        persistMessages(updatedMessages);
      }
      
      return {
        ...prev,
        messages: updatedMessages,
        error: null
      };
    });

    return newMessage;
  }, [persistMessages]);

  // Update message status (for delivery confirmation)
  const updateMessageStatus = useCallback((messageId: string, status: ChatMessage['status'], content?: string) => {
    setState(prev => {
      const updatedMessages = prev.messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, status, ...(content && { content }) }
          : msg
      );
      
      // Persist when message is successfully delivered
      if (status === 'delivered') {
        persistMessages(updatedMessages);
      }
      
      return {
        ...prev,
        messages: updatedMessages
      };
    });
  }, [persistMessages]);

  // Retry failed message
  const retryMessage = useCallback((messageId: string) => {
    setState(prev => {
      const updatedMessages = prev.messages.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              status: 'sending' as const,
              retryCount: (msg.retryCount || 0) + 1
            }
          : msg
      );
      
      return {
        ...prev,
        messages: updatedMessages
      };
    });
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: initializeChat(),
      error: null
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, [initializeChat]);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading
    }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }));
  }, []);

  // Get recent messages for context (last 8 delivered messages)
  const getRecentContext = useCallback(() => {
    return state.messages
      .filter(msg => msg.status === 'delivered')
      .slice(-8)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }, [state.messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (persistenceTimer.current) {
        clearTimeout(persistenceTimer.current);
      }
    };
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    isLoaded: state.isLoaded,
    addMessage,
    updateMessageStatus,
    retryMessage,
    clearMessages,
    setLoading,
    setError,
    getRecentContext
  };
};