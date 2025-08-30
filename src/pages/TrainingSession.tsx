import React, { useState, useEffect } from "react";
import { FinishWorkoutDialog } from "@/components/training/FinishWorkoutDialog";
import { restAuditLog, isRestAuditEnabled } from "@/utils/restAudit";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutStore } from '@/store/workoutStore';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useExercises } from "@/hooks/useExercises";
import { WorkoutSessionHeader } from "@/components/training/WorkoutSessionHeader";
import { ExerciseList } from "@/components/training/ExerciseList";
import { AddExerciseSheet } from "@/components/training/AddExerciseSheet";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Exercise } from "@/types/exercise";
import { useSound } from "@/hooks/useSound";
import { RestTimer } from "@/components/RestTimer";
import { RealTimeEfficiencyMonitor } from "@/components/training/RealTimeEfficiencyMonitor";
import { WorkoutPredictionEngine } from "@/components/training/WorkoutPredictionEngine";
import { useEnhancedRestAnalytics } from "@/hooks/useEnhancedRestAnalytics";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { WorkoutSessionLayout } from '@/components/training/WorkoutSessionLayout';
import { useWorkoutSave } from "@/hooks/useWorkoutSave";
import { TimingDebugPanel } from '@/components/TimingDebugPanel';
import { AppBackground } from '@/components/ui/AppBackground';
import { UniversalCard } from '@/components/ui/UniversalCard';
import { logExerciseFeedback } from "@/services/exerciseFeedbackService";
import { SET_COMPLETE_NOTIFICATIONS_ENABLED } from '@/constants/featureFlags';

const TrainingSessionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { exercises: allExercises, isLoading: loadingExercises } = useExercises();
  const { weightUnit } = useWeightUnit();
  
  const {
    exercises: storeExercises,
    setExercises: setStoreExercises,
    addEnhancedExercise,
    activeExercise,
    setActiveExercise,
    elapsedTime,
    isPaused,
    pauseWorkout,
    resumeWorkout,
    resetSession,
    clearAllRestTimers,
    setCurrentRest,
    handleCompleteSet,
    toggleWarmupSet,
    workoutStatus,
    markAsSaving,
    markAsFailed,
    workoutId,
    deleteExercise,
    startWorkout,
    startSessionIfNeeded,
    updateLastActiveRoute,
    trainingConfig,
    isActive,
    setTrainingConfig,
    setWorkoutStatus,
    getExerciseDisplayName,
    getExerciseConfig,
    currentRest
  } = useWorkoutStore();

  const {
    startRestTimer: startEnhancedRestTimer,
    endRestTimer: endEnhancedRestTimer,
    getRestAnalytics,
    getCurrentRestTime,
    getOptimalRestSuggestion,
  } = useEnhancedRestAnalytics();

  // Transform exercises for useWorkoutSave hook (expects simple Record<string, ExerciseSet[]>)
  const exercisesForSave = Object.fromEntries(
    Object.entries(storeExercises).map(([name, data]) => [
      name,
      Array.isArray(data) ? data : data.sets
    ])
  );

  // Initialize workout save functionality
  const { handleCompleteWorkout, saveStatus, savingErrors } = useWorkoutSave(exercisesForSave, elapsedTime, resetSession);
  
  const [completedSets, totalSets] = Object.entries(storeExercises).reduce(
    ([completed, total], [_, data]) => {
      const sets = Array.isArray(data) ? data : data.sets;
      return [
        completed + sets.filter(s => s.completed).length,
        total + sets.length
      ];
    },
    [0, 0]
  );

  useWorkoutTimer();
  const { play: playBell } = useSound('/sounds/bell.mp3');
  const { play: playTick } = useSound('/sounds/tick.mp3');
  const isManual = location.state?.manual;
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(!!isManual);
  const [isSaving, setIsSaving] = useState(false);
  const [showRestTimerModal, setShowRestTimerModal] = useState(false);
  const [restTimerResetSignal, setRestTimerResetSignal] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const exerciseCount = Object.keys(storeExercises).length;
  const hasExercises = exerciseCount > 0;
  
  useEffect(() => { setPageLoaded(true); }, []);

  useEffect(() => {
    if (Object.keys(storeExercises).length > 0 && workoutStatus === 'saving') {
      setIsSaving(false);
      if (isActive) setWorkoutStatus('active');
    }
  }, [storeExercises, workoutStatus, isActive, setWorkoutStatus]);

  useEffect(() => {
    if (location.pathname === '/training-session') {
      updateLastActiveRoute('/training-session');
    }
    console.log('TrainingSession page state:', { isActive, exerciseCount, elapsedTime, workoutStatus, isSaving });
  }, []);

  useEffect(() => {
    if (pageLoaded && workoutStatus === 'idle' && hasExercises) {
      // Auto-start if we have valid training config (came from setup wizard)
      const hasValidConfig = trainingConfig && Object.keys(trainingConfig).length > 0;
      if (hasValidConfig) {
        console.log('🎯 Auto-starting workout with enhanced config');
        startWorkout();
      } else {
        console.log('⚠️ Redirecting to setup - no valid config');
        navigate('/');
      }
    }
    
    // Redirect to setup if accessed without proper config
    if (pageLoaded && workoutStatus === 'idle' && !hasExercises && !trainingConfig && !isManual) {
      console.log('⚠️ Redirecting to setup wizard - empty session');
      navigate('/');
    }
  }, [pageLoaded, workoutStatus, hasExercises, startWorkout, trainingConfig, navigate, isManual]);

  useEffect(() => {
    if (location.state?.trainingConfig && !isActive) {
      const config = location.state.trainingConfig;
      setTrainingConfig(config);
      
      // Pre-populate exercises from smart template
      if (config.smartTemplate?.exercises && config.smartTemplate.exercises.length > 0) {
        console.log('🎯 Pre-populating exercises from smart template');
        
        config.smartTemplate.exercises.forEach((exerciseTemplate: any) => {
          const sets = Array.from({ length: exerciseTemplate.sets }, () => ({
            weight: exerciseTemplate.weight,
            reps: exerciseTemplate.reps,
            restTime: exerciseTemplate.restTime,
            completed: false,
            isEditing: false
          }));
          
          addEnhancedExercise(exerciseTemplate.name, sets);
        });
        
        toast({
          title: "Smart Workout Ready!",
          description: `Pre-loaded ${config.smartTemplate.exercises.length} exercises based on your goals`,
        });
      }
    }
    if (location.state?.fromDiscard) {
      setIsSaving(false);
    }
  }, [location.state, isActive, setTrainingConfig, addEnhancedExercise]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === 'true') {
      resetSession();
      toast.info("Workout session reset");
      navigate('/training-session', { replace: true });
    }
  }, [location.search, resetSession, navigate]);

  useEffect(() => {
    if (workoutStatus === 'saved') {
      console.log('Workout saved successfully');
    }
  }, [workoutStatus]);

  const triggerRestTimerReset = () => setRestTimerResetSignal(x => x + 1);

  // Define the onAddSet function to add a basic set to an exercise
  const handleAddSet = (exerciseName: string) => {
    const exerciseConfig = getExerciseConfig(exerciseName);
    if (!exerciseConfig) return;
    
    const newSet = { weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false };
    
    setStoreExercises(prev => {
      const exerciseData = prev[exerciseName];
      
      if (Array.isArray(exerciseData)) {
        // Legacy format
        return { ...prev, [exerciseName]: [...exerciseData, newSet] };
      } else if (exerciseData) {
        // New format
        return {
          ...prev,
          [exerciseName]: {
            ...exerciseData,
            sets: [...exerciseData.sets, newSet]
          }
        };
      }
      
      return prev;
    });
  };

  // Enhanced exercise completion with timing data
  const handleCompleteSetWithTiming = (exerciseName: string, setIndex: number, timingData?: {
    startTime?: string;
    endTime?: string;
    actualRestTime?: number;
    failurePoint?: 'none'|'technical'|'muscular';
    formScore?: number;
  }) => {
    // Update the exercise with timing metadata
    if (timingData) {
      setStoreExercises(prev => {
        const exerciseData = prev[exerciseName];
        const newExercises = { ...prev };
        
        if (Array.isArray(exerciseData)) {
          // Legacy format
          const updatedSets = exerciseData.map((set, i) => 
            i === setIndex ? { 
              ...set, 
              completed: true,
              metadata: {
                ...set.metadata,
                startTime: timingData.startTime,
                endTime: timingData.endTime,
                actualRestTime: timingData.actualRestTime,
              },
              failurePoint: timingData.failurePoint ?? set.failurePoint,
              formScore: timingData.formScore ?? set.formScore,
            } : set
          );
          newExercises[exerciseName] = updatedSets;
        } else if (exerciseData) {
          // New format
          const updatedSets = exerciseData.sets.map((set, i) => 
            i === setIndex ? { 
              ...set, 
              completed: true,
              metadata: {
                ...set.metadata,
                startTime: timingData.startTime,
                endTime: timingData.endTime,
                actualRestTime: timingData.actualRestTime,
              },
              failurePoint: timingData.failurePoint ?? set.failurePoint,
              formScore: timingData.formScore ?? set.formScore,
            } : set
          );
          newExercises[exerciseName] = {
            ...exerciseData,
            sets: updatedSets
          };
        }
        
        return newExercises;
      });

      // Audit: set completed
      if (isRestAuditEnabled()) {
        restAuditLog('set_complete', {
          exerciseName,
          setIndex: setIndex + 1,
          completedAt: timingData?.endTime || new Date().toISOString(),
          restSeconds: timingData?.actualRestTime ?? null,
          note: timingData?.actualRestTime == null ? 'pending' : 'finalized'
        });
      }

      // Start rest timer for next set if there is one
      const exerciseData = storeExercises[exerciseName];
      const sets = Array.isArray(exerciseData) ? exerciseData : exerciseData.sets;
      if (setIndex < sets.length - 1) {
        const nextSetRestTime = sets[setIndex + 1]?.restTime || 60;
        startEnhancedRestTimer(exerciseName, setIndex + 2, nextSetRestTime);
        setCurrentRest({
          startedAt: Date.now(),
          targetSetKey: `${exerciseName}_${setIndex + 2}`,
        });
        if (isRestAuditEnabled()) {
          restAuditLog('start_next_set', {
            exerciseName,
            nextSetIndex: setIndex + 2,
            plannedRestSeconds: sets[setIndex + 1]?.restTime ?? null,
            fallbackApplied: sets[setIndex + 1]?.restTime == null
          });
        }
      }
    }

    // Call original completion handler
    handleCompleteSet(exerciseName, setIndex, { failurePoint: timingData?.failurePoint, formScore: timingData?.formScore });

    const state = useWorkoutStore.getState();
    const exerciseDataAfter = state.exercises[exerciseName];
    const setsAfter = Array.isArray(exerciseDataAfter) ? exerciseDataAfter : exerciseDataAfter.sets;
    const allCompleted = setsAfter.every(s => s.completed);

    if (allCompleted) {
      let perceivedDifficulty: number | null = null;
      let satisfaction: number | null = null;

      if (SET_COMPLETE_NOTIFICATIONS_ENABLED) {
        const difficultyStr = window.prompt(`Rate difficulty for ${getExerciseDisplayName(exerciseName)} (1-10)`);
        const satisfactionStr = window.prompt(`Rate satisfaction for ${getExerciseDisplayName(exerciseName)} (1-10)`);
        perceivedDifficulty = Number(difficultyStr);
        satisfaction = Number(satisfactionStr);
      }

      const workoutId = state.workoutId;
      const exerciseId = Array.isArray(exerciseDataAfter)
        ? (exerciseDataAfter[0] as any)?.exercise_id
        : (exerciseDataAfter.exercise?.id || (exerciseDataAfter.sets[0] as any)?.exercise_id);

      if (workoutId && exerciseId) {
        logExerciseFeedback({
          workoutId,
          exerciseId,
          perceivedDifficulty: Number.isNaN(perceivedDifficulty) ? null : perceivedDifficulty,
          satisfaction: Number.isNaN(satisfaction) ? null : satisfaction,
        }).catch((err) => console.error('Failed to log exercise feedback', err));
      }
    }
  };

  // Enhanced exercise addition with full Exercise object support
  const handleAddExercise = (exercise: Exercise | string) => {
    const name = typeof exercise === 'string' ? exercise : exercise.name;
    
    // Check if exercise already exists
    if (storeExercises[name]) {
      toast({ 
        title: "Exercise already added", 
        description: `${name} is already in your workout` 
      });
      return;
    }
    
    // Use the enhanced store method
    addEnhancedExercise(exercise);

    const sessionStarted = startSessionIfNeeded();

    // Close the sheet
    setIsAddExerciseSheetOpen(false);

    // Show success toast with enhanced display name
    const displayName = typeof exercise === 'string' ? exercise : getExerciseDisplayName(exercise.name);
    if (sessionStarted) {
      console.log('exercise_added_first', { exercise_name: displayName, via: 'choose_exercises' });
      toast({
        title: "Exercise added",
        description: `Added ${displayName}. You can keep adding or start training.`
      });
    } else {
      toast({
        title: "Exercise added",
        description: `Added ${displayName} to your workout`
      });
    }
  };

  const handleShowRestTimer = () => { setShowRestTimerModal(true); playBell(); };
  const handleRestTimerComplete = () => { setShowRestTimerModal(false); playBell(); };

  const handleFinishWorkout = () => {
    // Show confirmation dialog instead of finishing immediately
    setShowFinishDialog(true);
  };

  const handleConfirmFinish = async () => {
    // Handle empty workout case
    if (!hasExercises) {
      setShowFinishDialog(false);
      toast({
        title: "Empty workout",
        description: "You haven't added any exercises. Do you want to end this session?",
        action: {
          label: "End Session",
          onClick: () => {
            resetSession();
            navigate('/');
            toast.success("Workout session ended");
          }
        }
      });
      return;
    }

    try {
      setShowFinishDialog(false);
      setIsSaving(true);
      
      // Freeze any pending rest for the targeted set (compute on finish)
      if (currentRest && currentRest.targetSetKey) {
        try {
          const key = currentRest.targetSetKey;
          const lastUnderscore = key.lastIndexOf('_');
          const exerciseId = key.slice(0, lastUnderscore);
          const setNumber = parseInt(key.slice(lastUnderscore + 1), 10);
          const restBeforeMs = Date.now() - currentRest.startedAt;
          setStoreExercises(prev => {
            const updated = { ...prev } as any;
            const ex = updated[exerciseId];
            const sets = Array.isArray(ex) ? ex : ex?.sets;
            if (sets && sets[setNumber - 1]) {
              const original = sets[setNumber - 1];
              sets[setNumber - 1] = {
                ...original,
                metadata: { ...(original.metadata || {}), restBefore: restBeforeMs }
              };
              if (!Array.isArray(ex) && ex) {
                updated[exerciseId] = { ...ex, sets };
              } else {
                updated[exerciseId] = sets;
              }
            }
            return updated;
          });
          if (isRestAuditEnabled()) {
            restAuditLog('finish_freeze_pending_rest', {
              key,
              exerciseId,
              setNumber,
              restSeconds: Math.floor(restBeforeMs / 1000)
            });
          }
          setCurrentRest(null);
        } catch (e) {
          console.warn('Failed to freeze pending rest on finish:', e);
        }
      }

      // Audit: finishing workout
      if (isRestAuditEnabled()) {
        restAuditLog('finish_workout', {
          exerciseCount,
          totalSets,
          completedSets,
          elapsedTime,
        });
      }

      // Actually save the workout to the database using useWorkoutSave
      const workoutId = await handleCompleteWorkout(trainingConfig);
      
      if (workoutId) {
        // Navigate to completion page with saved workout ID
        navigate("/workout-complete", { 
          state: { 
            workoutId: workoutId,
            success: true 
          } 
        });
        toast.success("Workout saved successfully!");
      } else {
        // Handle save failure
        throw new Error("Failed to save workout");
      }
    } catch (err) {
      console.error("Error saving workout:", err);
      toast.error("Failed to save workout");
      setIsSaving(false);
    }
  };

  const attemptRecovery = () => {
    console.log("Recovery attempt for workout:", workoutId);
    toast.info("Attempting to recover workout data...");
  };

  if (loadingExercises) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading exercises...
      </div>
    );
  }

  return (
    <AppBackground variant="primary">
      <WorkoutSessionLayout>
        <div className="flex flex-col min-h-screen text-white">
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-6 relative">
            <WorkoutSessionHeader
              elapsedTime={elapsedTime}
              exerciseCount={exerciseCount}
              completedSets={completedSets}
              totalSets={totalSets}
              workoutStatus={workoutStatus}
              isPaused={isPaused}
              onPause={pauseWorkout}
              onResume={resumeWorkout}
              isRecoveryMode={!!workoutId}
              saveProgress={0}
              onRetrySave={() => workoutId && attemptRecovery()}
              onResetWorkout={resetSession}
              restTimerActive={false}
              onRestTimerComplete={handleRestTimerComplete}
              onShowRestTimer={handleShowRestTimer}
              onRestTimerReset={triggerRestTimerReset}
              restTimerResetSignal={restTimerResetSignal}
              currentRestTime={60}
              exercises={storeExercises}
              onFinishWorkout={handleFinishWorkout}
              isSaving={isSaving}
              hasSubstantialProgress={true}
            />
            
            {/* Enhanced monitoring section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <UniversalCard variant="glass" intensity="medium" className="p-4">
                <RealTimeEfficiencyMonitor
                  exercises={storeExercises}
                  elapsedTime={elapsedTime}
                  weightUnit={weightUnit}
                />
              </UniversalCard>
              
              <UniversalCard variant="glass" intensity="medium" className="p-4">
                <WorkoutPredictionEngine
                  exercises={storeExercises}
                  elapsedTime={elapsedTime}
                  targetDuration={trainingConfig?.duration || 60}
                />
              </UniversalCard>
            </div>
            
            {showRestTimerModal && (
              <div className="absolute right-4 top-full z-50 mt-2 w-72">
                <RestTimer
                  isVisible={showRestTimerModal}
                  onClose={() => { setShowRestTimerModal(false); }}
                  onComplete={handleRestTimerComplete}
                  maxTime={60}
                />
              </div>
            )}
          </div>
          
          <ExerciseList
            exercises={storeExercises}
            activeExercise={activeExercise}
            onAddSet={handleAddSet}
            onCompleteSet={handleCompleteSetWithTiming}
            onDeleteExercise={deleteExercise}
            onRemoveSet={(name, i) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { ...prev, [name]: exerciseData.filter((_, idx) => idx !== i) };
                } else if (exerciseData) {
                  return { 
                    ...prev, 
                    [name]: { 
                      ...exerciseData, 
                      sets: exerciseData.sets.filter((_, idx) => idx !== i) 
                    } 
                  };
                }
                return prev;
              });
            }}
            onEditSet={(name, i) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, isEditing: true } : s) };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, isEditing: true } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onSaveSet={(name, i) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, isEditing: false } : s) };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, isEditing: false } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onWeightChange={(name, setIndex, value) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { 
                    ...prev, 
                    [name]: exerciseData.map((s, idx) => 
                      idx === setIndex ? { ...s, weight: parseFloat(value) || 0 } : s
                    ) 
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => 
                        idx === setIndex ? { ...s, weight: parseFloat(value) || 0 } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onRepsChange={(name, setIndex, value) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { 
                    ...prev, 
                    [name]: exerciseData.map((s, idx) => 
                      idx === setIndex ? { ...s, reps: parseInt(value) || 0 } : s
                    ) 
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => 
                        idx === setIndex ? { ...s, reps: parseInt(value) || 0 } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onRestTimeChange={(name, setIndex, value) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { 
                    ...prev, 
                    [name]: exerciseData.map((s, idx) => 
                      idx === setIndex ? { ...s, restTime: parseInt(value) || 60 } : s
                    ) 
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => 
                        idx === setIndex ? { ...s, restTime: parseInt(value) || 60 } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onWeightIncrement={(name, setIndex, increment) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { 
                    ...prev, 
                    [name]: exerciseData.map((s, idx) => 
                      idx === setIndex ? { ...s, weight: Math.max(0, (s.weight || 0) + increment) } : s
                    ) 
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => 
                        idx === setIndex ? { ...s, weight: Math.max(0, (s.weight || 0) + increment) } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onRepsIncrement={(name, setIndex, increment) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { 
                    ...prev, 
                    [name]: exerciseData.map((s, idx) => 
                      idx === setIndex ? { ...s, reps: Math.max(0, (s.reps || 0) + increment) } : s
                    ) 
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => 
                        idx === setIndex ? { ...s, reps: Math.max(0, (s.reps || 0) + increment) } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onRestTimeIncrement={(name, setIndex, increment) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return {
                    ...prev,
                    [name]: exerciseData.map((s, idx) =>
                      idx === setIndex ? { ...s, restTime: Math.max(0, (s.restTime || 60) + increment) } : s
                    )
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) =>
                        idx === setIndex ? { ...s, restTime: Math.max(0, (s.restTime || 60) + increment) } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onFailurePointChange={(name, setIndex, value) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return {
                    ...prev,
                    [name]: exerciseData.map((s, idx) =>
                      idx === setIndex ? { ...s, failurePoint: value } : s
                    )
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) =>
                        idx === setIndex ? { ...s, failurePoint: value } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onFormScoreChange={(name, setIndex, value) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return {
                    ...prev,
                    [name]: exerciseData.map((s, idx) =>
                      idx === setIndex ? { ...s, formScore: value } : s
                    )
                  };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) =>
                        idx === setIndex ? { ...s, formScore: value } : s
                      )
                    }
                  };
                }
                return prev;
              });
            }}
            onShowRestTimer={() => {}}
            onResetRestTimer={() => {}}
            onOpenAddExercise={() => setIsAddExerciseSheetOpen(true)}
            setExercises={setStoreExercises}
          />

          <div className="mt-8 text-center">
            <Button
              onClick={() => setIsAddExerciseSheetOpen(true)}
              variant="gradient"
              size="lg"
              shape="pill"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Exercise
            </Button>
          </div>

          {!loadingExercises && hasExercises && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleFinishWorkout}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finishing Workout...
                  </>
                ) : (
                  "Finish Workout"
                )}
              </Button>
            </div>
          )}

          <AddExerciseSheet
            open={isAddExerciseSheetOpen}
            onOpenChange={setIsAddExerciseSheetOpen}
            onSelectExercise={handleAddExercise}
            trainingType={trainingConfig?.trainingType}
          />

          <FinishWorkoutDialog
            open={showFinishDialog}
            onOpenChange={setShowFinishDialog}
            onConfirm={handleConfirmFinish}
            workoutStats={{
              exerciseCount,
              completedSets,
              totalSets,
              elapsedTime
            }}
            isSaving={isSaving}
          />

        {/* Timing Debug Panel - only visible in development */}
        <TimingDebugPanel />
            </div>
          </main>
        </div>
      </WorkoutSessionLayout>
    </AppBackground>
  );
};

export default TrainingSessionPage;
