
import { useState, useCallback } from 'react';
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { saveWorkout, processRetryQueue, recoverPartiallyCompletedWorkout } from "@/services/workoutSaveService";
import { WorkoutError, EnhancedExerciseSet } from "@/types/workout";
import { ExerciseSet, useWorkoutStore } from '@/store/workoutStore';

export const useWorkoutSave = (exercises: Record<string, ExerciseSet[]>, elapsedTime: number, resetSession: () => void) => {
  const [saveStatus, setSaveStatus] = useState<{
    status: 'idle' | 'saving' | 'partial' | 'saved' | 'failed' | 'recovering';
    errors: WorkoutError[];
    workoutId?: string | null;
    saveProgress?: {
      step: 'workout' | 'exercise-sets' | 'analytics';
      total: number;
      completed: number;
      errors: WorkoutError[];
    };
  }>({
    status: 'idle',
    errors: []
  });

  const { user } = useAuth();
  const { markAsSaved: markAsSavedStore } = useWorkoutStore();

  const markAsSaving = useCallback(() => {
    // Clear backup data BEFORE marking as saving to prevent recovery loops
    try {
      sessionStorage.removeItem('workout-backup');
      sessionStorage.removeItem('workout-session-recovery');
    } catch (error) {
      console.error('Failed to clear backup data:', error);
    }
    
    setSaveStatus(prev => ({
      ...prev,
      status: 'saving',
      saveProgress: {
        step: 'workout',
        total: 3,
        completed: 0,
        errors: []
      }
    }));
  }, []);

  const markAsPartialSave = useCallback((errors: WorkoutError[]) => {
    setSaveStatus(prev => ({
      ...prev,
      status: 'partial',
      errors: [...prev.errors, ...errors]
    }));

    toast({
      title: "Workout partially saved",
      description: "Some data couldn't be saved. You can try again later."
    });
  }, []);

  const markAsSaved = useCallback((workoutId: string) => {
    setSaveStatus({
      status: 'saved',
      errors: [],
      workoutId
    });
    
    // Storage clearing is handled by the store markAsSaved function
    console.log('✅ Workout save status updated');
  }, []);

  const markAsFailed = useCallback((error: WorkoutError) => {
    setSaveStatus(prev => ({
      ...prev,
      status: 'failed',
      errors: [...prev.errors, error]
    }));

    toast.error("Workout save failed", {
      description: error.message,
      duration: 5000,
    });
  }, []);

  const updateSaveProgress = useCallback((step: 'workout' | 'exercise-sets' | 'analytics', completed: number) => {
    setSaveStatus(prev => {
      if (!prev.saveProgress) return prev;
      return {
        ...prev,
        saveProgress: {
          ...prev.saveProgress,
          step,
          completed
        }
      };
    });
  }, []);

  const handleCompleteWorkout = async (trainingConfig?: any) => {
    if (!Object.keys(exercises).length) {
      toast.error("No exercises added - Please add at least one exercise before completing your workout");
      return null;
    }
    
    if (!user) {
      toast.error("Authentication required", {
        description: "You need to be logged in to save workouts"
      });
      return null;
    }
    
    // Corruption Detection & Auto-Fix
    const MAX_REASONABLE_DURATION = 12 * 60 * 60; // 12 hours in seconds
    const MIN_REASONABLE_DURATION = 60; // 1 minute in seconds
    let cleanedElapsedTime = elapsedTime;
    
    if (elapsedTime > MAX_REASONABLE_DURATION) {
      console.warn(`🔧 Detected corrupted elapsed time: ${elapsedTime}s (${Math.round(elapsedTime/3600)}h). Capping to 2 hours.`);
      cleanedElapsedTime = 2 * 60 * 60; // Cap at 2 hours for corrupted data
      toast({
        title: "Fixed workout duration",
        description: "Detected and corrected an invalid workout duration"
      });
    } else if (elapsedTime < MIN_REASONABLE_DURATION) {
      console.warn(`🔧 Detected very short elapsed time: ${elapsedTime}s. Setting to minimum.`);
      cleanedElapsedTime = MIN_REASONABLE_DURATION;
    }
    
    try {
      markAsSaving();
      
      const now = new Date();
      const startTime = new Date(now.getTime() - cleanedElapsedTime * 1000);
      
      // Format data for the workout save service
      const workoutData = {
        name: trainingConfig?.trainingType ? `${trainingConfig.trainingType} Workout` : `Workout ${now.toLocaleDateString()}`,
        training_type: trainingConfig?.trainingType || 'strength',
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration: cleanedElapsedTime || 0,
        notes: null,
        metadata: trainingConfig ? JSON.stringify({ trainingConfig }) : null
      };
      
      console.log("Saving workout with data:", workoutData);
      
      // Get actual rest times from the rest analytics service
      let actualRestTimes = new Map<string, number>();
      try {
        // Try to get rest data from localStorage where the rest analytics hook stores it
        const restDataRaw = localStorage.getItem('rest-analytics-sessions');
        if (restDataRaw) {
          const restData = JSON.parse(restDataRaw);
          if (Array.isArray(restData)) {
            restData.forEach((session: any) => {
              if (session.exerciseName && session.setNumber && session.actualRestTime) {
                const key = `${session.exerciseName}-${session.setNumber}`;
                actualRestTimes.set(key, Math.round(session.actualRestTime));
              }
            });
            console.log(`📊 Loaded ${actualRestTimes.size} actual rest time measurements`);
          }
        }
      } catch (error) {
        console.warn('Could not load rest analytics data:', error);
      }
      
      // Convert ExerciseSet to EnhancedExerciseSet and inject actual rest times
      const enhancedExercises: Record<string, EnhancedExerciseSet[]> = {};
      Object.entries(exercises).forEach(([exerciseName, sets]) => {
        enhancedExercises[exerciseName] = sets.map((set, setIndex) => {
          // Try to get actual rest time from analytics for this specific set
          let actualRestTime = set.restTime || 60; // fallback to preset
          
          const restKey = `${exerciseName}-${setIndex + 1}`;
          if (actualRestTimes.has(restKey)) {
            actualRestTime = actualRestTimes.get(restKey)!;
            console.log(`📊 Using actual rest time for ${exerciseName} set ${setIndex + 1}: ${actualRestTime}s`);
          }
          
          return {
            ...set,
            restTime: actualRestTime,
            isEditing: set.isEditing === undefined ? false : set.isEditing
          };
        });
      });
      
      const saveResult = await saveWorkout({
        userData: user,
        workoutData,
        exercises: enhancedExercises,
        onProgressUpdate: (progress) => {
          updateSaveProgress(progress.step, progress.completed);
        }
      });
      
      if (saveResult.success) {
        if (saveResult.partialSave) {
          markAsPartialSave(saveResult.error ? [saveResult.error] : []);
          return saveResult.workoutId;
        } else {
          // Call both local and global store markAsSaved
          markAsSaved(saveResult.workoutId || '');
          markAsSavedStore();
          return saveResult.workoutId;
        }
      } else {
        markAsFailed(saveResult.error || {
          type: 'unknown',
          message: 'Unknown error during save',
          timestamp: new Date().toISOString(),
          recoverable: false
        });
        return null;
      }
    } catch (error) {
      markAsFailed({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        recoverable: true
      });
      
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      return null;
    }
  };

  const attemptRecovery = useCallback(async (workoutId: string) => {
    try {
      setSaveStatus(prev => ({ ...prev, status: 'recovering' }));
      
      const { success, error } = await recoverPartiallyCompletedWorkout(workoutId);
      
      if (!success) {
        // This is the problematic section - need to ensure we create a proper WorkoutError
        setSaveStatus(prev => ({
          ...prev,
          status: 'partial',
          errors: [...prev.errors, error || {
            type: 'database' as const, // Use const assertion to ensure it's the right type
            message: 'Failed to recover workout data',
            timestamp: new Date().toISOString(),
            recoverable: false
          }]
        }));
        
        toast.error("Recovery failed", {
          description: "We couldn't recover your workout data. Please try again."
        });
        
        return false;
      }
      
      if (user?.id) {
        await processRetryQueue(user.id);
      }
      
      setSaveStatus({
        status: 'saved',
        errors: [],
        workoutId
      });
      
      toast({
        title: "Workout recovered",
        description: "Your workout data has been successfully recovered."
      });
      
      return true;
    } catch (error) {
      setSaveStatus(prev => ({
        ...prev,
        status: 'partial',
        errors: [...prev.errors, {
          type: 'database' as const, // Use const assertion to ensure it's the right type
          message: 'Failed to recover workout data',
          details: error,
          timestamp: new Date().toISOString(),
          recoverable: false
        }]
      }));
      
      toast.error("Recovery failed", {
        description: "We couldn't recover your workout data. Please try again."
      });
      
      return false;
    }
  }, [user]);

  return {
    saveStatus: saveStatus.status,
    saveProgress: saveStatus.saveProgress,
    savingErrors: saveStatus.errors,
    workoutId: saveStatus.workoutId,
    handleCompleteWorkout,
    attemptRecovery,
    updateSaveProgress
  };
};
