import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadedImage } from './ImageUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image';
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
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const uploadedImages: UploadedImage[] = [];
    for (let i = 0; i < Math.min(files.length, maxImages); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImage(file);
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
        const { data, error } = await supabase.storage
          .from('ai-coach-images')
          .upload(fileName, compressed);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('ai-coach-images')
          .getPublicUrl(fileName);

        uploadedImages.push({
          id: data?.id || Math.random().toString(36).substr(2, 9),
          url: publicUrl,
          type: 'general',
          metadata: {
            timestamp: new Date(),
            description: file.name,
          },
        });
      } catch (err) {
        console.error('Upload error:', err);
        toast({
          title: 'Upload failed',
          description: 'Failed to upload image. Please try again.',
          variant: 'destructive',
        });
      }
    }

    if (uploadedImages.length) onImagesSelect(uploadedImages);
    e.target.value = '';
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
