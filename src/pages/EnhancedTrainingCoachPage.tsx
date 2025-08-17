import React, { useState } from 'react';
import { Send, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { ImageUpload, type UploadedImage } from '@/components/ai/ImageUpload';
import { ConversationThreadList } from '@/components/ai/ConversationThreadList';
import { EnhancedMessageBubble } from '@/components/ai/EnhancedMessageBubble';
import { useThreadedConversation } from '@/hooks/useThreadedConversation';

export default function EnhancedTrainingCoachPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([]);
  
  const {
    currentThreadId,
    messages,
    isLoading,
    loadThreadMessages,
    startNewThread,
    sendMessage,
    retryMessage,
  } = useThreadedConversation();

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

  if (!user) {
    return <div>Please sign in to access the AI Training Coach.</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar Trigger */}
        <header className="fixed top-0 left-0 z-50 h-12 flex items-center border-b bg-background">
          <SidebarTrigger className="ml-2" />
        </header>

        {/* Conversation Thread Sidebar */}
        <div className="w-80 border-r bg-background">
          <div className="pt-12">
            <ConversationThreadList
              currentThreadId={currentThreadId || undefined}
              onThreadSelect={loadThreadMessages}
              onNewThread={startNewThread}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col pt-12">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <EnhancedMessageBubble
                  key={message.id}
                  message={message}
                  onRetry={retryMessage}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">AI is analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-background p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Image Upload */}
              <ImageUpload
                onImagesChange={setSelectedImages}
                maxImages={4}
              />

              {/* Text Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your training, upload form check photos, or share progress pics..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}