import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'ai-coach-chat-messages';

export const useChatPersistence = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedMessages = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
        // Initialize with welcome message if no stored messages
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm your AI Training Coach. I have access to your complete workout history and can help you analyze your progress, identify patterns, and optimize your training. What would you like to know about your fitness journey?",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      // Fallback to welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your AI Training Coach. I have access to your complete workout history and can help you analyze your progress, identify patterns, and optimize your training. What would you like to know about your fitness journey?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (isLoaded && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving chat messages:', error);
      }
    }
  }, [messages, isLoaded]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const clearMessages = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI Training Coach. I have access to your complete workout history and can help you analyze your progress, identify patterns, and optimize your training. What would you like to know about your fitness journey?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    addMessage,
    clearMessages,
    isLoaded
  };
};