import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Archive, Trash2, MoreVertical, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ConversationThread } from '@/hooks/useThreadedConversation';

interface EnhancedConversationThreadListProps {
  threads: ConversationThread[];
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onArchiveThread: (threadId: string, archive: boolean) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function EnhancedConversationThreadList({ 
  threads,
  currentThreadId, 
  onThreadSelect, 
  onNewThread,
  onDeleteThread,
  onArchiveThread,
  onRefresh,
  loading = false
}: EnhancedConversationThreadListProps) {
  const [filteredThreads, setFilteredThreads] = useState<ConversationThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  useEffect(() => {
    filterThreads();
  }, [threads, searchQuery, showArchived]);

  const filterThreads = () => {
    let filtered = threads.filter(thread => showArchived ? thread.is_archived : !thread.is_archived);
    
    if (searchQuery) {
      filtered = filtered.filter(thread => 
        thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.context_tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredThreads(filtered);
  };

  const handleDeleteClick = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (threadToDelete) {
      onDeleteThread(threadToDelete);
      setThreadToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleArchiveClick = (threadId: string, archive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    onArchiveThread(threadId, archive);
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'form-check': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      'progress': 'bg-green-500/10 text-green-700 dark:text-green-300',
      'nutrition': 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
      'equipment': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      'recovery': 'bg-red-500/10 text-red-700 dark:text-red-300',
    };
    return colors[tag as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const activeThreads = threads.filter(t => !t.is_archived);
  const archivedThreads = threads.filter(t => t.is_archived);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-12 bg-muted rounded-lg" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold">Conversations</span>
            </div>
            <Button 
              size="sm" 
              onClick={onNewThread}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
          
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background/50"
              />
            </div>
            
            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
              <Button
                variant={!showArchived ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowArchived(false)}
                className={cn(
                  "flex-1 h-8 text-xs font-medium transition-all",
                  !showArchived && "bg-background shadow-sm"
                )}
              >
                Active ({activeThreads.length})
              </Button>
              <Button
                variant={showArchived ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowArchived(true)}
                className={cn(
                  "flex-1 h-8 text-xs font-medium transition-all",
                  showArchived && "bg-background shadow-sm"
                )}
              >
                <Archive className="h-3 w-3 mr-1" />
                Archived ({archivedThreads.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {searchQuery 
                    ? 'No conversations found' 
                    : showArchived 
                      ? 'No archived conversations'
                      : 'No conversations yet'
                  }
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : showArchived 
                      ? 'Archive conversations to see them here'
                      : 'Start chatting with your AI coach'
                  }
                </p>
                {!searchQuery && !showArchived && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={onNewThread}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    New Conversation
                  </Button>
                )}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200",
                    "hover:bg-muted/40 hover:border-primary/20 hover:shadow-sm",
                    currentThreadId === thread.id 
                      ? 'bg-primary/5 border-primary/30 shadow-sm' 
                      : 'bg-background/80 border-border/50'
                  )}
                  onClick={() => onThreadSelect(thread.id)}
                >
                  <div className="space-y-2">
                    {/* Header with title and menu */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium line-clamp-2 flex-1 min-w-0">
                        {thread.title || 'New Conversation'}
                      </h4>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => handleArchiveClick(thread.id, !thread.is_archived, e)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {thread.is_archived ? 'Restore' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(thread.id, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{thread.message_count || 0} messages</span>
                        {thread.is_archived && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                            <Archive className="h-2 w-2 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      <span className="shrink-0">
                        {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Context tags */}
                    {thread.context_tags && thread.context_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {thread.context_tags.slice(0, 2).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className={cn("text-xs h-5 px-2 font-medium", getTagColor(tag))}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {thread.context_tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs h-5 px-2">
                            +{thread.context_tags.length - 2}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and will permanently remove all messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}