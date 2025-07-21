
import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { quickHealthCheck, clearCorruption } from '@/utils/immediateCorruptionCleanup';
import { toast } from '@/hooks/use-toast';

export const useCorruptionMonitor = () => {
  const statusHistory = useRef<string[]>([]);
  const lastCheck = useRef<number>(0);
  
  const { workoutStatus, isActive, elapsedTime } = useWorkoutStore();

  useEffect(() => {
    if (!isActive) return;

    const checkForCorruption = () => {
      const now = Date.now();
      
      // Track status changes for rapid oscillation detection
      if (statusHistory.current[statusHistory.current.length - 1] !== workoutStatus) {
        statusHistory.current.push(workoutStatus);
        if (statusHistory.current.length > 10) {
          statusHistory.current = statusHistory.current.slice(-10);
        }
      }

      // Check for rapid status changes (3+ changes in 60 seconds)
      const recentChanges = statusHistory.current.slice(-3);
      if (recentChanges.length >= 3 && (now - lastCheck.current) < 60000) {
        showFixButton('Rapid status changes detected');
        return;
      }

      // Check for stuck saving state (>30 seconds)
      if (workoutStatus === 'saving' && (now - lastCheck.current) > 30000) {
        showFixButton('Workout stuck while saving');
        return;
      }

      // Use the new quick health check
      const health = quickHealthCheck();
      if (!health.isHealthy) {
        showFixButton(`Health issues detected: ${health.issues[0]}`);
        return;
      }

      lastCheck.current = now;
    };

    const interval = setInterval(checkForCorruption, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isActive, workoutStatus]);

  const showFixButton = (message: string) => {
    toast({
      title: "Your workout needs a quick fix to continue",
      description: message,
      action: {
        label: "Fix Workout",
        onClick: () => {
          // Use the new aggressive cleanup utility
          const success = clearCorruption(true); // Skip confirmation for auto-fix
          
          if (success) {
            toast({
              title: "Workout fixed!",
              description: "Refresh the page to continue with a clean session"
            });
            
            // Auto-refresh after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            toast({
              title: "Fix failed",
              description: "Please try manually refreshing the page",
              variant: "destructive"
            });
          }
        }
      },
      duration: 0, // Don't auto-dismiss
    });
  };
};
