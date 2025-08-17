import React, { useCallback, useState } from 'react';
import { Upload, X, Camera, Zap, Target, Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export interface UploadedImage {
  id: string;
  url: string;
  type: 'form-check' | 'progress' | 'equipment' | 'general';
  metadata: {
    description?: string;
    timestamp: Date;
    exerciseType?: string;
  };
}

const IMAGE_TYPES = [
  { value: 'form-check', label: 'Form Check', icon: Zap },
  { value: 'progress', label: 'Progress Photo', icon: Target },
  { value: 'equipment', label: 'Equipment', icon: Dumbbell },
  { value: 'general', label: 'General', icon: Camera },
];

export function ImageUpload({ onImagesChange, maxImages = 4 }: ImageUploadProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!user || files.length === 0) return;
    if (images.length >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images at once.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newImages: UploadedImage[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, maxImages - images.length); i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please select only image files.",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select images smaller than 2MB.",
            variant: "destructive",
          });
          continue;
        }

        // Compress and convert to WebP if needed
        const compressedFile = await compressImage(file);
        
        // Upload to Supabase Storage
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
        const { data, error } = await supabase.storage
          .from('ai-coach-images')
          .upload(fileName, compressedFile);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('ai-coach-images')
          .getPublicUrl(fileName);

        const newImage: UploadedImage = {
          id: data.id || Date.now().toString(),
          url: publicUrl,
          type: 'general',
          metadata: {
            timestamp: new Date(),
          },
        };

        newImages.push(newImage);
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);

      if (newImages.length > 0) {
        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${newImages.length} image(s).`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading images.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [user, images, maxImages, onImagesChange]);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1024;
        const maxHeight = 1024;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const updateImageType = (id: string, type: UploadedImage['type']) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, type } : img
    );
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors hover:border-primary/50"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-xs text-muted-foreground/75 mb-4">
              Supports JPG, PNG, WebP up to 2MB each (max {maxImages} images)
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              id="image-upload"
            />
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              disabled={uploading || images.length >= maxImages}
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Select Images'}
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => {
            const TypeIcon = IMAGE_TYPES.find(t => t.value === image.type)?.icon || Camera;
            return (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="h-4 w-4" />
                    <Select 
                      value={image.type} 
                      onValueChange={(value) => updateImageType(image.id, value as UploadedImage['type'])}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-3 w-3" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(image.metadata.timestamp).toLocaleTimeString()}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}