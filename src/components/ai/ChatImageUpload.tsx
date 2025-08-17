import React from 'react';
import { Paperclip, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UploadedImage } from './ImageUpload';

interface ChatImageUploadProps {
  onImagesSelect: (images: UploadedImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ChatImageUpload({ 
  onImagesSelect, 
  maxImages = 4, 
  disabled = false,
  className 
}: ChatImageUploadProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    
    for (let i = 0; i < Math.min(files.length, maxImages); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          url,
          type: 'general',
          metadata: {
            timestamp: new Date(),
            description: file.name
          }
        });
      }
    }

    onImagesSelect(newImages);
    e.target.value = ''; // Reset input
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="chat-image-upload"
        disabled={disabled}
      />
      <Button
        asChild
        variant="ghost"
        size="sm"
        disabled={disabled}
        className="h-11 w-11 p-0 shrink-0 hover:bg-muted"
      >
        <label htmlFor="chat-image-upload" className="cursor-pointer">
          <ImageIcon className="h-4 w-4" />
        </label>
      </Button>
    </div>
  );
}