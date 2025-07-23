
import { useEffect, useRef, useState } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { quickHealthCheck, clearCorruption, scanForCorruption } from '@/utils/immediateCorruptionCleanup';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useCorruptionMonitor = () => {
  const statusHistory = useRef<string[]>([]);
  const lastCheck = useRef<number>(0);
  const timeInSavingState = useRef<number>(0);
  const stuckDetected = useRef<boolean>(false);
  const navigate = useNavigate();
  
  const { 
    workoutStatus, 
    isActive, 
    elapsedTime,
    lastTabActivity,
    markAsFailed,
    markAsSaved,
    resetSession
  } = useWorkoutStore();

  // Track saving state to detect stuck workouts
  useEffect(() => {
    if (workoutStatus === 'saving') {
      const now = Date.now();
      if (timeInSavingState.current === 0) {
        timeInSavingState.current = now;
      } else {
        const stuckDuration = now - timeInSavingState.current;
        
        // Auto-transition from 'saving' to 'failed' after 1 minute (faster recovery)
        if (stuckDuration > 60 * 1000 && !stuckDetected.current) {
          console.warn(`🔄 Auto-recovering from stuck 'saving' state after ${Math.round(stuckDuration / 1000)}s`);
          stuckDetected.current = true;
          
          // Clear all storage to break the loop
          try {
            sessionStorage.removeItem('workout-backup');
            sessionStorage.removeItem('workout-session-recovery');
            localStorage.removeItem('workout-storage');
          } catch (error) {
            console.error('Failed to clear storage during auto-recovery:', error);
          }
          
          // Force transition to failed state
          markAsFailed({
            message: 'Save operation timed out - cleared stuck data',
            type: 'unknown',
            timestamp: new Date().toISOString(),
            recoverable: false // Not recoverable since we cleared the data
          });
          
          toast({
            title: "Workout save timed out",
            description: "Cleared stuck data. Please start a new workout.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } else {
      // Reset timer when not in saving state
      timeInSavingState.current = 0;
      stuckDetected.current = false;
    }
  }, [workoutStatus, markAsFailed]);

  // Main corruption detection effect
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

      // Check for session age > 24 hours (very likely corrupted)
      if (lastTabActivity && (now - lastTabActivity > 24 * 60 * 60 * 1000)) {
        console.warn('🕰️ Extremely old session detected (> 24h). Likely corrupted.');
        showFixButton('Workout session is too old and needs reset');
        return;
      }

      // Check for excessive elapsed time (> 12 hours)
      const MAX_REASONABLE_DURATION = 12 * 60 * 60; // 12 hours in seconds
      if (elapsedTime > MAX_REASONABLE_DURATION) {
        console.warn(`⏱️ Excessive workout duration: ${elapsedTime}s (> 12h). Likely corrupted.`);
        showFixButton('Workout duration is unreasonably long');
        return;
      }

      // Deep scan for corruption (every 5 minutes)
      if (now - lastCheck.current > 5 * 60 * 1000) {
        const report = scanForCorruption();
        if (report.summary.severity === 'critical' || report.summary.severity === 'major') {
          console.warn('🚨 Critical corruption detected:', report);
          showFixButton(`Serious workout data issues detected (${report.summary.totalIssues} issues)`);
          return;
        }
      }

      // Quick health check (every check interval)
      const health = quickHealthCheck();
      if (!health.isHealthy) {
        showFixButton(`Health issues detected: ${health.issues[0]}`);
        return;
      }

      lastCheck.current = now;
    };

    // Check every 30 seconds
    const interval = setInterval(checkForCorruption, 30000);
    return () => clearInterval(interval);
  }, [isActive, workoutStatus, elapsedTime, lastTabActivity]);

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
