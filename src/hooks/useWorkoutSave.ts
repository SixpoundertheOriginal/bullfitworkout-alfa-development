
import { useState, useCallback } from 'react';
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { saveWorkout, processRetryQueue, recoverPartiallyCompletedWorkout } from "@/services/workoutSaveService";
import { WorkoutError, EnhancedExerciseSet } from "@/types/workout";
import { ExerciseSet } from '@/hooks/useWorkoutState';

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

  const markAsSaving = useCallback(() => {
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
    
    try {
      markAsSaving();
      
      const now = new Date();
      const startTime = new Date(now.getTime() - elapsedTime * 1000);
      
      // Format data for the workout save service
      const workoutData = {
        name: trainingConfig?.trainingType ? `${trainingConfig.trainingType} Workout` : `Workout ${now.toLocaleDateString()}`,
        training_type: trainingConfig?.trainingType || 'strength',
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration: elapsedTime || 0,
        notes: null,
        metadata: trainingConfig ? JSON.stringify({ trainingConfig }) : null
      };
      
      console.log("Saving workout with data:", workoutData);
      
      // Convert ExerciseSet to EnhancedExerciseSet by ensuring isEditing is always defined
      const enhancedExercises: Record<string, EnhancedExerciseSet[]> = {};
      Object.entries(exercises).forEach(([exerciseName, sets]) => {
        enhancedExercises[exerciseName] = sets.map(set => ({
          ...set,
          isEditing: set.isEditing === undefined ? false : set.isEditing
        }));
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
          markAsSaved(saveResult.workoutId || '');
          resetSession();
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
