import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Paperclip, Image as ImageIcon, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import type { UploadedImage } from '@/components/ai/ImageUpload';
import { ChatImageUpload } from '@/components/ai/ChatImageUpload';
import { EnhancedConversationThreadList } from '@/components/ai/EnhancedConversationThreadList';
import { MobileOptimizedChatInput } from '@/components/ai/MobileOptimizedChatInput';
import { EnhancedMessageBubble } from '@/components/ai/EnhancedMessageBubble';
import { useThreadedConversation } from '@/hooks/useThreadedConversation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { uploadImages } from '@/lib/uploadImage';
export default function EnhancedTrainingCoachPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentThreadId,
    messages,
    isLoading,
    threads,
    loadThreadMessages,
    loadThreads,
    startNewThread,
    sendMessage,
    retryMessage,
    deleteThread,
    toggleArchiveThread,
  } = useThreadedConversation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mobile responsive sidebar
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSendMessage = async () => {
    if (!input.trim() && selectedImages.length === 0) return;
    
    await sendMessage(input || "Please analyze these images", selectedImages);
    setInput('');
    setSelectedImages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image helpers

  const uploadFiles = async (files: File[]): Promise<UploadedImage[]> => {
    if (!user) return [];
    const limit = 4 - selectedImages.length;
    return uploadImages(files, user.id, limit);
  };

  // Handle paste events for images
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (!files.length) return;
    const uploaded = await uploadFiles(files);
    if (uploaded.length) {
      setSelectedImages(prev => [...prev, ...uploaded].slice(0, 4));
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    const uploaded = await uploadFiles(files);
    if (uploaded.length) {
      setSelectedImages(prev => [...prev, ...uploaded]);
    }
  };
  const quickActions = [
    "Analyze my form in this video",
    "Compare my progress photos",
    "What equipment do I need?",
    "Review my workout consistency"
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">AI Training Coach</h2>
            <p className="text-muted-foreground">Please sign in to access your personal AI training coach.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex w-full bg-gradient-to-br from-background to-muted/20"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-primary/10 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg p-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium text-center">Drop images to upload</p>
            <p className="text-sm text-muted-foreground text-center">Up to 4 images supported</p>
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur-sm border-b flex items-center px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-2"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <h1 className="font-semibold">AI Training Coach</h1>
      </div>

      {/* Conversation Thread Sidebar */}
      <div className={cn(
        "fixed lg:relative z-30 bg-background border-r transition-transform duration-300",
        "w-80 h-full",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"
      )}>
        <div className="h-full pt-14 lg:pt-0">
          <div className="p-4 border-b lg:hidden">
            <Button
              onClick={() => setSidebarOpen(false)}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
          
          {(sidebarOpen || !isMobile) && (
            <EnhancedConversationThreadList
              threads={threads}
              currentThreadId={currentThreadId || undefined}
              onThreadSelect={(id) => {
                loadThreadMessages(id);
                if (isMobile) setSidebarOpen(false);
              }}
              onNewThread={() => {
                startNewThread();
                if (isMobile) setSidebarOpen(false);
              }}
              onDeleteThread={deleteThread}
              onArchiveThread={toggleArchiveThread}
              onRefresh={loadThreads}
              loading={false}
            />
          )}
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        "pt-14 lg:pt-0",
        !sidebarOpen && "lg:ml-16"
      )}>
        {/* Chat Header */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="font-semibold">AI Training Coach</h1>
              <p className="text-sm text-muted-foreground">
                Your personal fitness assistant with image analysis
              </p>
            </div>
          </div>
          
          <Button onClick={startNewThread} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-primary/10 to-blue-100 dark:to-primary/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to your AI Training Coach!</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  I can analyze your form, track progress, suggest exercises, and help optimize your training.
                  Try uploading photos or asking questions!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(action)}
                      className="text-xs"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                onRetry={retryMessage}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted/50 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="max-w-4xl mx-auto">
          <MobileOptimizedChatInput
            value={input}
            onChange={setInput}
            onSend={handleSendMessage}
            onPaste={handlePaste}
            selectedImages={selectedImages}
            onImagesSelect={(newImages) => {
              setSelectedImages(prev => [...prev, ...newImages.slice(0, 4 - prev.length)]);
            }}
            onImageRemove={(index) => {
              setSelectedImages(prev => prev.filter((_, i) => i !== index));
            }}
            disabled={isLoading}
            placeholder="Ask about your training, upload form check photos, or share progress pics..."
            quickActions={quickActions}
            onQuickAction={setInput}
            showQuickActions={messages.length === 0}
          />
        </div>
      </main>
    </div>
  );
}