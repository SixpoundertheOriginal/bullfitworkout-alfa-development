
import { useState } from 'react';
import { PersonalRecordsService } from '@/services/personalRecordsService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export function usePRBootstrap() {
  const { user } = useAuth();
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const runBootstrap = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to bootstrap your personal records",
        variant: "destructive"
      });
      return;
    }

    setIsBootstrapping(true);
    
    try {
      console.log('🚀 Starting PR bootstrap process...');
      
      await PersonalRecordsService.bootstrapPersonalRecords(user.id);
      
      toast({
        title: "Personal Records Updated! 🎉",
        description: "Your PRs have been calculated from your workout history"
      });
      
      // Refresh the page to show new PRs
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Bootstrap error:', error);
      toast({
        title: "Error updating PRs",
        description: "There was a problem calculating your personal records",
        variant: "destructive"
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  return {
    runBootstrap,
    isBootstrapping
  };
}
