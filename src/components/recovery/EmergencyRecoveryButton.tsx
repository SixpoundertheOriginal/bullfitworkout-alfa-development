import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { clearCorruption } from '@/utils/immediateCorruptionCleanup';
import { RotateCcw } from 'lucide-react';

interface EmergencyRecoveryButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  showIcon?: boolean;
}

export const EmergencyRecoveryButton: React.FC<EmergencyRecoveryButtonProps> = ({
  variant = 'destructive',
  className = '',
  showIcon = true
}) => {
  const handleEmergencyReset = () => {
    toast({
      title: "Emergency workout reset",
      description: "Cleaning up stuck workout data...",
      duration: 3000,
    });
    
    const success = clearCorruption(true); // Skip confirmation for better UX
    
    if (success) {
      toast({
        title: "Workout reset successful",
        description: "Your workout has been reset. The page will refresh.",
        duration: 3000,
      });
      
      // Auto-refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast({
        title: "Reset failed",
        description: "Please try refreshing the page manually",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Button 
      variant={variant}
      className={className}
      onClick={handleEmergencyReset}
    >
      {showIcon && <RotateCcw className="h-4 w-4 mr-2" />}
      Reset Stuck Workout
    </Button>
  );
};