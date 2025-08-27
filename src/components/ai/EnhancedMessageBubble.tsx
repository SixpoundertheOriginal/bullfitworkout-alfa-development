import React, { useState } from 'react';
import { User, Bot, Image as ImageIcon, Maximize2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { formatTime } from '@/utils/formatTime';
import type { UploadedImage } from './ImageUpload';
import { componentPatterns, typography, gradients } from '@/utils/tokenUtils';

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
    <div className={`flex items-start gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className={`
            w-10 h-10 rounded-full flex-shrink-0
            bg-gradient-to-r ${gradients.brand.primary()}
            shadow-[0_0_20px_rgba(168,85,247,0.15)]
            flex items-center justify-center
          `}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={isUser ? componentPatterns.chat.userMessage() : componentPatterns.chat.aiMessage()}>
          {/* Message Text */}
          <div className="prose prose-sm max-w-none">
            <p className={`mb-0 ${typography.chatMessage()} ${isUser ? 'text-white' : 'text-white'} whitespace-pre-wrap`}>
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
        </div>

        {/* Message metadata */}
        {message.timestamp && (
          <div className={componentPatterns.chat.timestamp()}>
            {message.timestamp.toLocaleTimeString()}
            
            {isUser && (
              <>
                <span className={`ml-2 ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                
                {message.status === 'failed' && onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRetry(message.id)}
                    className="h-6 px-2 text-xs ml-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className={`
            w-10 h-10 rounded-full bg-gradient-to-r ${gradients.brand.primary()}
            flex items-center justify-center
          `}>
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}