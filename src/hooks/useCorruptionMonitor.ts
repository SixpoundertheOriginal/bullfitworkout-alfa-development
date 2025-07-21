import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { validateWorkoutState } from '@/utils/workoutStateDebug';
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

      // Run full validation check
      const state = useWorkoutStore.getState();
      const validation = validateWorkoutState(state);
      
      if (!validation.isValid) {
        const criticalIssues = validation.issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
          showFixButton('Workout session needs fixing');
        }
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
          const store = useWorkoutStore.getState();
          store.quickFix();
          toast({
            title: "Workout fixed!",
            description: "You can continue your workout normally"
          });
        }
      },
      duration: 0, // Don't auto-dismiss
    });
  };
};