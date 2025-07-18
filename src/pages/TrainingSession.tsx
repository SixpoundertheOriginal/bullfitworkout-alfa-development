
import React, { useState, useEffect } from "react";
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
import { adaptExerciseSets, adaptToStoreFormat } from "@/utils/exerciseAdapter";

const TrainingSessionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { exercises: allExercises, isLoading: loadingExercises } = useExercises();
  
  const {
    exercises: storeExercises,
    setExercises: setStoreExercises,
    activeExercise,
    setActiveExercise,
    elapsedTime,
    resetSession,
    clearAllRestTimers,
    handleCompleteSet,
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
    setWorkoutStatus
  } = useWorkoutStore();
  
  // Convert store exercises to the format expected by components
  const exercises = adaptExerciseSets(storeExercises);
  
  const [completedSets, totalSets] = Object.entries(exercises).reduce(
    ([completed, total], [_, sets]) => [
      completed + sets.filter(s => s.completed).length,
      total + sets.length
    ],
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

  const exerciseCount = Object.keys(exercises).length;
  const hasExercises = exerciseCount > 0;
  const hasSubstantialProgress = completedSets >= 3 || exerciseCount >= 2;
  
  useEffect(() => { setPageLoaded(true); }, []);

  useEffect(() => {
    if (Object.keys(exercises).length > 0 && workoutStatus === 'saving') {
      setIsSaving(false);
      if (isActive) setWorkoutStatus('active');
    }
  }, [exercises, workoutStatus, isActive, setWorkoutStatus]);

  useEffect(() => {
    if (location.pathname === '/training-session') {
      updateLastActiveRoute('/training-session');
    }
    console.log('TrainingSession page state:', { isActive, exerciseCount, elapsedTime, workoutStatus, isSaving });
  }, []);

  useEffect(() => {
    if (pageLoaded && workoutStatus === 'idle' && hasExercises) {
      startWorkout();
    }
  }, [pageLoaded, workoutStatus, hasExercises, startWorkout]);

  useEffect(() => {
    if (location.state?.trainingConfig && !isActive) {
      setTrainingConfig(location.state.trainingConfig);
    }
    if (location.state?.fromDiscard) {
      setIsSaving(false);
    }
  }, [location.state, isActive, setTrainingConfig]);

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
    setStoreExercises(prev => ({
      ...prev,
      [exerciseName]: [...prev[exerciseName], { weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false }]
    }));
  };

  const handleAddExercise = (exercise: Exercise | string) => {
    const name = typeof exercise === 'string' ? exercise : exercise.name;
    if (storeExercises[name]) {
      toast({ title: "Exercise already added", description: `${name} is already in your workout` });
      return;
    }
    setStoreExercises(prev => ({ ...prev, [name]: [{ weight: 0, reps: 0, restTime: 60, completed: false, isEditing: false }] }));
    setActiveExercise(name);
    if (workoutStatus === 'idle') startWorkout();
    setIsAddExerciseSheetOpen(false);
  };

  const handleShowRestTimer = () => { setShowRestTimerModal(true); playBell(); };
  const handleRestTimerComplete = () => { setShowRestTimerModal(false); playBell(); };

  const handleFinishWorkout = async () => {
    if (!hasExercises) {
      toast.error("Add at least one exercise before finishing your workout");
      return;
    }
    try {
      setIsSaving(true);
      markAsSaving();
      const now = new Date();
      const startTime = new Date(now.getTime() - elapsedTime * 1000);
      const workoutData = {
        exercises: Object.fromEntries(
          Object.entries(storeExercises).map(([name, sets]) => [
            name,
            sets.map(s => ({ ...s, isEditing: s.isEditing || false }))
          ])
        ),
        duration: elapsedTime,
        startTime,
        endTime: now,
        trainingType: trainingConfig?.trainingType || "Strength",
        name: trainingConfig?.trainingType || "Workout",
        trainingConfig: trainingConfig || null,
        notes: "",
        metrics: {
          trainingConfig: trainingConfig || null,
          performance: { completedSets, totalSets, restTimers: { defaultTime: 60, wasUsed: false } },
          progression: {
            timeOfDay: startTime.getHours() < 12 ? 'morning' :
                       startTime.getHours() < 17 ? 'afternoon' : 'evening',
            totalVolume: Object.values(storeExercises).flat().reduce((acc, s) => acc + (s.weight * s.reps), 0)
          },
          sessionDetails: { exerciseCount, averageRestTime: 60, workoutDensity: completedSets / (elapsedTime / 60) }
        }
      };
      navigate("/workout-complete", { state: { workoutData } });
    } catch (err) {
      console.error("Error preparing workout data:", err);
      markAsFailed({ type: 'unknown', message: err instanceof Error ? err.message : 'Save failed', timestamp: new Date().toISOString(), recoverable: true });
      toast.error("Failed to complete workout");
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

  // Set up the adapter function to convert between the different exercise formats
  const handleSetExercises = (updatedExercises) => {
    if (typeof updatedExercises === 'function') {
      setStoreExercises(prev => adaptToStoreFormat(updatedExercises(adaptExerciseSets(prev))));
    } else {
      setStoreExercises(adaptToStoreFormat(updatedExercises));
    }
  };

  return (
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
              hasSubstantialProgress={hasSubstantialProgress}
            />
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
            exercises={exercises}
            activeExercise={activeExercise}
            onAddSet={handleAddSet}
            onCompleteSet={handleCompleteSet}
            onDeleteExercise={deleteExercise}
            onRemoveSet={(name, i) => {
              setStoreExercises(prev => ({ ...prev, [name]: prev[name].filter((_, idx) => idx !== i) }));
            }}
            onEditSet={(name, i) => {
              setStoreExercises(prev => ({ ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, isEditing: true } : s) }));
            }}
            onSaveSet={(name, i) => {
              setStoreExercises(prev => ({ ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, isEditing: false } : s) }));
            }}
            onWeightChange={(name, i, v) => {
              setStoreExercises(prev => ({ ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, weight: +v || 0 } : s) }));
            }}
            onRepsChange={(name, i, v) => {
              setStoreExercises(prev => ({ ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, reps: parseInt(v) || 0 } : s) }));
            }}
            onRestTimeChange={(name, i, v) => {
              setStoreExercises(prev => ({ ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, restTime: parseInt(v) || 60 } : s) }));
            }}
            onWeightIncrement={(name, i, inc) => {
              setStoreExercises(prev => {
                const set = prev[name][i];
                return { ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, weight: Math.max(0, (set.weight || 0) + inc) } : s) };
              });
            }}
            onRepsIncrement={(name, i, inc) => {
              setStoreExercises(prev => {
                const set = prev[name][i];
                return { ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, reps: Math.max(0, (set.reps || 0) + inc) } : s) };
              });
            }}
            onRestTimeIncrement={(name, i, inc) => {
              setStoreExercises(prev => {
                const set = prev[name][i];
                return { ...prev, [name]: prev[name].map((s, idx) => idx === i ? { ...s, restTime: Math.max(0, (set.restTime || 60) + inc) } : s) };
              });
            }}
            onShowRestTimer={handleShowRestTimer}
            onResetRestTimer={triggerRestTimerReset}
            onOpenAddExercise={() => setIsAddExerciseSheetOpen(true)}
            setExercises={handleSetExercises}
          />

          {/* Premium Add Exercise Button */}
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
              {/* Inner highlight overlay */}
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)'
                }}
              />
              
              {/* Premium glow effect on hover */}
              <div 
                className="absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0.8) 50%, rgba(249,115,22,0.8) 100%)',
                  filter: 'blur(2px)'
                }}
              />
              
              {/* Content */}
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
    </div>
  );
};

export default TrainingSessionPage;
