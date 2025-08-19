import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { UploadedImage } from '@/components/ai/ImageUpload';

export interface ThreadedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: UploadedImage[];
  timestamp: Date;
  status: 'sending' | 'delivered' | 'failed';
  retryCount?: number;
}

export interface ConversationThread {
  id: string;
  title: string;
  message_count: number;
  context_tags: string[];
  updated_at: string;
  is_archived: boolean;
}

export const useThreadedConversation = () => {
  const { user } = useAuth();
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ConversationThread[]>([]);

  // Load messages for a specific thread
  const loadThreadMessages = useCallback(async (threadId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ThreadedMessage[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        images: Array.isArray(msg.images) ? msg.images as unknown as UploadedImage[] : [],
        timestamp: new Date(msg.created_at),
        status: 'delivered'
      }));

      setMessages(formattedMessages);
      setCurrentThreadId(threadId);
    } catch (error) {
      console.error('Error loading thread messages:', error);
      setError('Failed to load conversation');
      toast({
        title: "Error",
        description: "Failed to load conversation messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load all threads for the user
  const loadThreads = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_conversation_threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  }, [user]);

  // Start a new conversation thread
  const startNewThread = useCallback(() => {
    setCurrentThreadId(null);
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: "Hi! I'm your AI Training Coach. I have access to your complete workout history and can analyze images you share. What would you like to discuss about your fitness journey?",
      timestamp: new Date(),
      status: 'delivered'
    }]);
    setError(null);
    // Refresh threads list to ensure we have latest data
    loadThreads();
  }, [loadThreads]);

  // Send a message with optional images
  const sendMessage = useCallback(async (content: string, images: UploadedImage[] = []) => {
    if (!user || !content.trim()) return;

    // Add user message immediately
    const userMessage: ThreadedMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      images,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Mark user message as delivered
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'delivered' as const }
          : msg
      ));

      // Send to AI coach
      const { data, error } = await supabase.functions.invoke('openai-training-coach', {
        body: {
          message: content,
          userId: user.id,
          threadId: currentThreadId,
          images: images.map(img => ({
            url: img.url,
            type: img.type,
            metadata: img.metadata
          })),
          conversationHistory: messages
            .filter(msg => msg.status === 'delivered')
            .slice(-10)
            .map(msg => ({
              role: msg.role,
              content: msg.content
            }))
        }
      });

      if (error) throw error;

      // Add AI response
      if (data?.reply) {
        const assistantMessage: ThreadedMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          status: 'delivered'
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update current thread ID if we got one back
        if (data.threadId && !currentThreadId) {
          setCurrentThreadId(data.threadId);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      setError('Failed to send message');
      
      toast({
        title: "Error",
        description: "Failed to get response from AI coach. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentThreadId, messages]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'user') return;

    // Update retry count and status
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            status: 'sending' as const,
            retryCount: (msg.retryCount || 0) + 1
          }
        : msg
    ));

    // Resend the message
    await sendMessage(message.content, message.images || []);
  }, [messages, sendMessage]);


  // Delete a conversation thread
  const deleteThread = useCallback(async (threadId: string) => {
    if (!user) return;

    try {
      // Delete messages first
      await supabase
        .from('ai_conversation_messages')
        .delete()
        .eq('thread_id', threadId);

      // Then delete the thread
      const { error } = await supabase
        .from('ai_conversation_threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setThreads(prev => prev.filter(t => t.id !== threadId));
      
      // If current thread was deleted, start new one
      if (currentThreadId === threadId) {
        startNewThread();
      }

      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  }, [user, currentThreadId, startNewThread]);

  // Archive/unarchive thread
  const toggleArchiveThread = useCallback(async (threadId: string, archive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_conversation_threads')
        .update({ is_archived: archive, updated_at: new Date().toISOString() })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setThreads(prev => prev.map(t => 
        t.id === threadId 
          ? { ...t, is_archived: archive, updated_at: new Date().toISOString() }
          : t
      ));

      toast({
        title: "Success",
        description: archive ? "Conversation archived" : "Conversation restored",
      });
    } catch (error) {
      console.error('Error updating thread:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    }
  }, [user]);

  // Load threads on user change
  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user, loadThreads]);

  // Clear current conversation
  const clearConversation = useCallback(() => {
    startNewThread();
  }, [startNewThread]);

  return {
    currentThreadId,
    messages,
    isLoading,
    error,
    threads,
    loadThreadMessages,
    loadThreads,
    startNewThread,
    sendMessage,
    retryMessage,
    clearConversation,
    deleteThread,
    toggleArchiveThread
  };
};