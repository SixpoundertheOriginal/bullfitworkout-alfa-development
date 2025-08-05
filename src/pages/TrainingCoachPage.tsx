import React, { useState } from 'react';
import { Send, Bot, TrendingUp, Target, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEnhancedChatState } from '@/hooks/useEnhancedChatState';
import VirtualizedChatContainer from '@/components/chat/VirtualizedChatContainer';


interface TrainingInsight {
  type: 'trend' | 'goal' | 'performance';
  text: string;
}

export default function TrainingCoachPage() {
  const { user } = useAuth();
  const { 
    messages, 
    addMessage, 
    updateMessageStatus, 
    retryMessage, 
    clearMessages, 
    isLoaded, 
    isLoading,
    setLoading,
    setError,
    getRecentContext 
  } = useEnhancedChatState();
  
  const [input, setInput] = useState('');
  const [insights, setInsights] = useState<TrainingInsight[]>([]);

  const sendMessage = async () => {
    if (!input.trim() || !user || isLoading) return;

    // Add user message immediately
    const userMessage = addMessage({ role: 'user', content: input });
    const userInput = input; // Store input before clearing
    setInput('');
    setLoading(true);
    setError(null);

    try {
      console.log('Sending message to training coach...');
      
      // Mark user message as delivered
      updateMessageStatus(userMessage.id, 'delivered');
      
      const { data, error } = await supabase.functions.invoke('openai-training-coach', {
        body: {
          message: userInput,
          userId: user.id,
          conversationHistory: getRecentContext()
        }
      });

      if (error) {
        console.error('Training coach error:', error);
        updateMessageStatus(userMessage.id, 'failed');
        throw error;
      }

      console.log('Training coach response:', data);

      if (data?.reply) {
        console.log('Adding assistant message:', data.reply);
        addMessage({ role: 'assistant', content: data.reply });
      } else {
        console.error('No reply in response data:', data);
        addMessage({ 
          role: 'assistant', 
          content: "I received your message but couldn't generate a proper response. Please try again." 
        });
      }
      
      if (data.trainingInsights) {
        setInsights(data.trainingInsights.map((text: string, index: number) => ({
          type: index % 3 === 0 ? 'trend' : index % 3 === 1 ? 'goal' : 'performance',
          text
        })));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      updateMessageStatus(userMessage.id, 'failed');
      setError('Failed to send message');
      
      toast({
        title: "Error",
        description: "Failed to get response from AI coach. Please try again.",
        variant: "destructive",
      });
      
      addMessage({ 
        role: 'assistant', 
        content: "I'm having trouble accessing your training data right now. Please try again in a moment." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "How has my strength progressed over the last month?",
    "What muscle groups should I focus on more?", 
    "Analyze my workout consistency patterns",
    "What are my top exercises by volume?",
    "How can I improve my training efficiency?"
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'goal': return <Target className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                AI Training Coach
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Clear Chat
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Quick Insights */}
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insights.map((insight, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {getInsightIcon(insight.type)}
                    {insight.text}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="flex flex-col">
          <CardContent className="flex-1 p-0">
            <VirtualizedChatContainer
              messages={messages}
              isLoading={isLoading}
              isLoaded={isLoaded}
              onRetry={retryMessage}
            />
          </CardContent>

          {/* Input Area - Fixed at bottom */}
          <div className="border-t bg-background p-4 rounded-b-lg">
            {messages.length <= 1 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your training progress, goals, or get personalized advice..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}