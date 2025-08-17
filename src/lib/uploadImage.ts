import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/image';
import { toast } from '@/hooks/use-toast';
import type { UploadedImage } from '@/components/ai/ImageUpload';

/**
 * Compresses and uploads images to Supabase Storage.
 * Returns an array of UploadedImage objects for successfully uploaded images.
 */
export async function uploadImages(
  files: File[],
  userId: string,
  maxImages: number
): Promise<UploadedImage[]> {
  const uploaded: UploadedImage[] = [];
  for (const file of files.slice(0, maxImages)) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const compressed = await compressImage(file);
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
      const { data, error } = await supabase.storage
        .from('ai-coach-images')
        .upload(fileName, compressed);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('ai-coach-images')
        .getPublicUrl(fileName);
      uploaded.push({
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
  return uploaded;
}
