
import React, { useState, useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ProfileHeaderProps {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  fitnessGoal: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function ProfileHeader({ fullName, email, avatarUrl, fitnessGoal, onAvatarChange }: ProfileHeaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extract user's initials for the avatar fallback
  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const { user } = useAuth();
    if (!user) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
        
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      
      if (updateError) throw updateError;
      
      // Update local state
      onAvatarChange(publicUrl);
      
      toast({
        title: "Profile updated",
        description: "Your profile picture has been updated",
      });
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    const { user } = useAuth();
    if (!user) return;
    
    try {
      setIsUploading(true);
      
      // Clear avatar from user metadata
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });
      
      if (error) throw error;
      
      // Update local state
      onAvatarChange(null);
      
      toast({
        title: "Profile updated",
        description: "Profile picture removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative group">
          <Avatar className="h-24 w-24 mb-4 border-2 border-purple-500">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-purple-800 text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-black rounded-full opacity-50"></div>
            <div className="flex gap-2 z-10">
              <Button 
                size="sm" 
                variant="secondary"
                className="rounded-full"
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                aria-label="Upload new profile picture"
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              {avatarUrl && (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="rounded-full"
                  onClick={handleRemoveAvatar} 
                  disabled={isUploading}
                  aria-label="Remove profile picture"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />
        </div>
        
        <h2 className="text-2xl font-bold leading-relaxed">
          {fullName || "User"}
        </h2>
        
        <div className="mt-1 text-gray-400 mb-4">
          {email}
        </div>
        
        {fitnessGoal && (
          <div className="inline-block px-3 py-1 bg-purple-900/50 rounded-full text-sm border border-purple-800 transition-colors hover:bg-purple-800/60">
            Goal: {fitnessGoal.replace('_', ' ')}
          </div>
        )}
      </div>
    </Card>
  );
}
