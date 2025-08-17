import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadedImage } from './ImageUpload';
import { useAuth } from '@/context/AuthContext';
import { uploadImages } from '@/lib/uploadImage';
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

    const uploadedImages = await uploadImages(
      Array.from(files),
      user.id,
      maxImages
    );

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
