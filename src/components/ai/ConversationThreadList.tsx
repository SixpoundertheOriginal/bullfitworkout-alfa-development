import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Archive, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ConversationThread {
  id: string;
  title: string;
  message_count: number;
  context_tags: string[];
  updated_at: string;
  is_archived: boolean;
}

interface ConversationThreadListProps {
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export function ConversationThreadList({ 
  currentThreadId, 
  onThreadSelect, 
  onNewThread 
}: ConversationThreadListProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ConversationThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  useEffect(() => {
    filterThreads();
  }, [threads, searchQuery, showArchived]);

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_threads')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterThreads = () => {
    let filtered = threads.filter(thread => showArchived ? thread.is_archived : !thread.is_archived);
    
    if (searchQuery) {
      filtered = filtered.filter(thread => 
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.context_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredThreads(filtered);
  };

  const archiveThread = async (threadId: string) => {
    try {
      await supabase
        .from('ai_conversation_threads')
        .update({ is_archived: true })
        .eq('id', threadId);
      
      loadThreads();
    } catch (error) {
      console.error('Error archiving thread:', error);
    }
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'form-check': 'bg-blue-100 text-blue-800',
      'progress': 'bg-green-100 text-green-800',
      'nutrition': 'bg-orange-100 text-orange-800',
      'equipment': 'bg-purple-100 text-purple-800',
      'recovery': 'bg-red-100 text-red-800',
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </div>
          <Button size="sm" onClick={onNewThread}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
        
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={!showArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowArchived(false)}
              className="text-xs"
            >
              Active ({threads.filter(t => !t.is_archived).length})
            </Button>
            <Button
              variant={showArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowArchived(true)}
              className="text-xs"
            >
              <Archive className="h-3 w-3 mr-1" />
              Archived ({threads.filter(t => t.is_archived).length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery 
                  ? 'No conversations match your search' 
                  : showArchived 
                    ? 'No archived conversations'
                    : 'No conversations yet'
                }
              </p>
              {!searchQuery && !showArchived && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={onNewThread}
                >
                  Start a conversation
                </Button>
              )}
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  currentThreadId === thread.id 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-background border-border'
                }`}
                onClick={() => onThreadSelect(thread.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium line-clamp-2 flex-1 pr-2">
                      {thread.title || 'Untitled Conversation'}
                    </h4>
                    {!showArchived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveThread(thread.id);
                        }}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{thread.message_count} messages</span>
                    <span>
                      {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                    </span>
                  </div>

                  {thread.context_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {thread.context_tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className={`text-xs ${getTagColor(tag)}`}
                        >
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {thread.context_tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{thread.context_tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}