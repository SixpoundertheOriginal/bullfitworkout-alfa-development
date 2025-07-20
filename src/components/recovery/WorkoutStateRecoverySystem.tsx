import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { WorkoutRecoveryDialog } from './WorkoutRecoveryDialog';
import { validateWorkoutState, StateCorruptionIssue } from '@/utils/workoutStateDebug';

/**
 * Automatic corruption detection and recovery system
 * This component should be mounted at the app level to monitor workout state
 */
export const WorkoutStateRecoverySystem: React.FC = () => {
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [detectedIssues, setDetectedIssues] = useState<StateCorruptionIssue[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const { 
    corruptionDetected, 
    recoverFromCorruption, 
    clearWorkoutState,
    validateCurrentState 
  } = useWorkoutStore();

  // Monitor for corruption on mount and when corruption flag changes
  useEffect(() => {
    if (corruptionDetected) {
      const issues = validateCurrentState();
      if (issues.length > 0) {
        setDetectedIssues(issues);
        setShowRecoveryDialog(true);
      }
    }
  }, [corruptionDetected, validateCurrentState]);

  // Periodic state validation (every 5 minutes when active)
  useEffect(() => {
    const interval = setInterval(() => {
      const issues = validateCurrentState();
      if (issues.length > 0) {
        setDetectedIssues(issues);
        setShowRecoveryDialog(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [validateCurrentState]);

  const handleRecover = async () => {
    setIsRecovering(true);
    
    try {
      recoverFromCorruption();
      setShowRecoveryDialog(false);
      setDetectedIssues([]);
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleStartFresh = () => {
    clearWorkoutState();
    setShowRecoveryDialog(false);
    setDetectedIssues([]);
  };

  const handleViewDetails = () => {
    // Open browser console with debug info
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Workout Recovery Details');
      console.log('Detected Issues:', detectedIssues);
      console.log('State Validation:', validateCurrentState());
      
      // Call global debug function if available
      if ((window as any).debugWorkoutState) {
        (window as any).debugWorkoutState();
      }
      
      console.groupEnd();
    }
  };

  if (!showRecoveryDialog || detectedIssues.length === 0) {
    return null;
  }

  return (
    <WorkoutRecoveryDialog
      isOpen={showRecoveryDialog}
      onClose={() => setShowRecoveryDialog(false)}
      issues={detectedIssues}
      onRecover={handleRecover}
      onStartFresh={handleStartFresh}
      onViewDetails={process.env.NODE_ENV === 'development' ? handleViewDetails : undefined}
      isRecovering={isRecovering}
    />
  );
};