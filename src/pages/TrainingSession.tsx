import React, { useState, useEffect } from "react";
import { FinishWorkoutDialog } from "@/components/training/FinishWorkoutDialog";
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
    toggleWarmupSet,
    workoutStatus,
    markAsSaving,
    markAsFailed,
    workoutId,
    deleteExercise,
    startWorkout,
    updateLastActiveRoute,
    trainingConfig,
    isActive,
    setTrainingConfig,
    setWorkoutStatus,
    getExerciseDisplayName,
    getExerciseConfig
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
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
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
    if (pageLoaded && workoutStatus === 'idle' && !hasExercises && !trainingConfig) {
      console.log('⚠️ Redirecting to setup wizard - empty session');
      navigate('/');
    }
  }, [pageLoaded, workoutStatus, hasExercises, startWorkout, trainingConfig, navigate]);

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
    startTime: string;
    endTime: string;
    actualRestTime?: number;
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
              }
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
              }
            } : set
          );
          newExercises[exerciseName] = {
            ...exerciseData,
            sets: updatedSets
          };
        }
        
        return newExercises;
      });

      // Start rest timer for next set if there is one
      const exerciseData = storeExercises[exerciseName];
      const sets = Array.isArray(exerciseData) ? exerciseData : exerciseData.sets;
      if (setIndex < sets.length - 1) {
        const nextSetRestTime = sets[setIndex + 1]?.restTime || 60;
        startEnhancedRestTimer(exerciseName, setIndex + 2, nextSetRestTime);
      }
    }

    // Call original completion handler
    handleCompleteSet(exerciseName, setIndex);
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
    
    // Start workout if idle
    if (workoutStatus === 'idle') startWorkout();
    
    // Close the sheet
    setIsAddExerciseSheetOpen(false);
    
    // Show success toast with enhanced display name
    const displayName = typeof exercise === 'string' ? exercise : getExerciseDisplayName(exercise.name);
    toast({
      title: "Exercise added",
      description: `Added ${displayName} to your workout`
    });
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
    <WorkoutSessionLayout>
      <div className="flex flex-col min-h-screen bg-black text-white">
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
              <RealTimeEfficiencyMonitor
                exercises={storeExercises}
                elapsedTime={elapsedTime}
                weightUnit={weightUnit}
              />
              
              <WorkoutPredictionEngine
                exercises={storeExercises}
                elapsedTime={elapsedTime}
                targetDuration={trainingConfig?.duration || 60}
              />
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
            onWeightChange={(name, i, v) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, weight: +v || 0 } : s) };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, weight: +v || 0 } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onRepsChange={(name, i, v) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, reps: parseInt(v) || 0 } : s) };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, reps: parseInt(v) || 0 } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onRestTimeChange={(name, i, v) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, restTime: parseInt(v) || 60 } : s) };
                } else if (exerciseData) {
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, restTime: parseInt(v) || 60 } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onWeightIncrement={(name, i, inc) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  const set = exerciseData[i];
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, weight: Math.max(0, (set.weight || 0) + inc) } : s) };
                } else if (exerciseData) {
                  const set = exerciseData.sets[i];
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, weight: Math.max(0, (set.weight || 0) + inc) } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onRepsIncrement={(name, i, inc) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  const set = exerciseData[i];
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, reps: Math.max(0, (set.reps || 0) + inc) } : s) };
                } else if (exerciseData) {
                  const set = exerciseData.sets[i];
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, reps: Math.max(0, (set.reps || 0) + inc) } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onRestTimeIncrement={(name, i, inc) => {
              setStoreExercises(prev => {
                const exerciseData = prev[name];
                if (Array.isArray(exerciseData)) {
                  const set = exerciseData[i];
                  return { ...prev, [name]: exerciseData.map((s, idx) => idx === i ? { ...s, restTime: Math.max(0, (set.restTime || 60) + inc) } : s) };
                } else if (exerciseData) {
                  const set = exerciseData.sets[i];
                  return {
                    ...prev,
                    [name]: {
                      ...exerciseData,
                      sets: exerciseData.sets.map((s, idx) => idx === i ? { ...s, restTime: Math.max(0, (set.restTime || 60) + inc) } : s)
                    }
                  };
                }
                return prev;
              });
            }}
            onShowRestTimer={handleShowRestTimer}
            onResetRestTimer={triggerRestTimerReset}
            onOpenAddExercise={() => setIsAddExerciseSheetOpen(true)}
            setExercises={setStoreExercises}
          />

          {/* Enhanced rest analytics display */}
          {Object.keys(storeExercises).length > 0 && (
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <h3 className="text-sm font-medium mb-3">Session Analytics</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400">Current Rest</div>
                  <div className="font-mono text-white">{getCurrentRestTime()}s</div>
                </div>
                <div>
                  <div className="text-gray-400">Rest Efficiency</div>
                  <div className="font-mono text-white">
                    {getRestAnalytics().restEfficiencyScore.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 mb-16 px-4">
            <Button
              onClick={() => setIsAddExerciseSheetOpen(true)}
              className="
                w-full h-14 text-lg font-semibold rounded-xl
                text-white shadow-lg hover:shadow-xl
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center justify-center gap-3
                relative overflow-hidden group
              "
              style={{
                background: `
                  linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(236,72,153,0.9) 50%, rgba(249,115,22,0.9) 100%),
                  linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)
                `,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.3)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
              }}
            >
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)'
                }}
              />
              
              <div 
                className="absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0.8) 50%, rgba(249,115,22,0.8) 100%)',
                  filter: 'blur(2px)'
                }}
              />
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Plus size={24} strokeWidth={2.5} />
                Add Exercise
              </div>
            </Button>
          </div>
        </div>
      </main>

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
          elapsedTime,
          estimatedTonnage: Object.values(storeExercises).reduce((total, exerciseData) => {
            const sets = Array.isArray(exerciseData) ? exerciseData : exerciseData.sets;
            return total + sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          }, 0)
        }}
        isSaving={isSaving}
      />
      </div>
    </WorkoutSessionLayout>
  );
};

export default TrainingSessionPage;
