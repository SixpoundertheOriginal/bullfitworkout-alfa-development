import React, { useState } from 'react';
import { User, Bot, Image as ImageIcon, Maximize2, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { formatTime } from '@/utils/formatTime';
import type { UploadedImage } from './ImageUpload';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'delivered' | 'failed';
  images?: UploadedImage[];
  retryCount?: number;
}

interface EnhancedMessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
}

export function EnhancedMessageBubble({ message, onRetry }: EnhancedMessageBubbleProps) {
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const getStatusColor = () => {
    switch (message.status) {
      case 'sending': return 'text-yellow-600';
      case 'delivered': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (message.status) {
      case 'sending': return 'Sending...';
      case 'delivered': return 'Delivered';
      case 'failed': return 'Failed';
      default: return '';
    }
  };

  const getImageTypeLabel = (type: string) => {
    const labels = {
      'form-check': 'Form Check',
      'progress': 'Progress',
      'equipment': 'Equipment',
      'general': 'General'
    };
    return labels[type as keyof typeof labels] || 'Image';
  };

  const getImageTypeBadgeColor = (type: string) => {
    const colors = {
      'form-check': 'bg-blue-100 text-blue-800',
      'progress': 'bg-green-100 text-green-800',
      'equipment': 'bg-purple-100 text-purple-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'order-1' : ''}`}>
        <Card className={`${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <CardContent className="p-3">
            {/* Message Text */}
            <div className="prose prose-sm max-w-none">
              <p className={`mb-0 ${isUser ? 'text-primary-foreground' : 'text-foreground'} whitespace-pre-wrap`}>
                {message.content}
              </p>
            </div>

            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <ImageIcon className="h-3 w-3" />
                  <span className={isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                    {message.images.length} image{message.images.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {message.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-md overflow-hidden border">
                        <img
                          src={image.url}
                          alt={getImageTypeLabel(image.type)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Image overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSelectedImage(image)}
                            >
                              <Maximize2 className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Badge className={getImageTypeBadgeColor(image.type)}>
                                  {getImageTypeLabel(image.type)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(image.metadata.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-center">
                                <img
                                  src={image.url}
                                  alt={getImageTypeLabel(image.type)}
                                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {/* Image type badge */}
                      <Badge 
                        className={`absolute top-1 left-1 text-xs ${getImageTypeBadgeColor(image.type)}`}
                      >
                        {getImageTypeLabel(image.type)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message metadata */}
        <div className={`flex items-center gap-2 text-xs ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
          
          {isUser && (
            <>
              <span className={getStatusColor()}>
                {getStatusText()}
              </span>
              
              {message.status === 'failed' && onRetry && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRetry(message.id)}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}