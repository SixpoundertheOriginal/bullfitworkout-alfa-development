import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, Target, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TrainingInsight {
  type: 'trend' | 'goal' | 'performance';
  text: string;
}

export default function TrainingCoachPage() {
  const { user } = useAuth();
  const { messages, addMessage, clearMessages, isLoaded } = useChatPersistence();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<TrainingInsight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || isLoading) return;

    // Add user message immediately
    addMessage({ role: 'user', content: input });
    const userInput = input; // Store input before clearing
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending message to training coach...');
      
      const { data, error } = await supabase.functions.invoke('openai-training-coach', {
        body: {
          message: userInput,
          userId: user.id,
          conversationHistory: messages.slice(-8).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) {
        console.error('Training coach error:', error);
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
      setIsLoading(false);
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
        <Card className="h-[500px] flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-6">
              <div className="space-y-4">
                {isLoaded && messages?.length > 0 ? messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                       <div className="text-sm leading-relaxed">
                         {message.role === 'assistant' ? (
                           <div className="space-y-2">
                             <ReactMarkdown
                               components={{
                                 h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
                                 h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
                                 h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
                                 p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                                 strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                 em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                                 ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-foreground">{children}</ul>,
                                 ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-foreground">{children}</ol>,
                                 li: ({ children }) => <li className="text-foreground">{children}</li>,
                                 code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                                 blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-2">{children}</blockquote>,
                               }}
                             >
                               {message.content}
                             </ReactMarkdown>
                           </div>
                         ) : (
                           <p className="text-sm whitespace-pre-wrap leading-relaxed">
                             {message.content}
                           </p>
                         )}
                       </div>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )) : (
                  !isLoaded && (
                    <div className="flex items-center justify-center p-8">
                      <Skeleton className="h-4 w-48" />
                    </div>
                  )
                )}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="border-t p-4">
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