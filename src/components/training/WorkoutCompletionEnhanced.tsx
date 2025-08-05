import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Clock, 
  Dumbbell, 
  Target, 
  TrendingUp, 
  Award,
  Star,
  Home,
  BarChart3,
  Zap,
  AlertTriangle,
  RefreshCw,
  Search,
  Save
} from 'lucide-react';
import { useWorkoutStore } from '@/store/workoutStore';
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { EfficiencyMetricsCard } from '@/components/metrics/EfficiencyMetricsCard';
import { toast } from "@/hooks/use-toast";
import { useWorkoutById } from "@/hooks/useWorkoutById";

interface ExerciseSet {
  weight: number;
  reps: number;
  completed: boolean;
  restTime?: number;
}

interface CompletedWorkout {
  startTime: number;
  endTime: number;
  exercises: Record<string, ExerciseSet[]>;
}

// Recovery data interface
interface RecoveryData {
  exercises?: Record<string, any>;
  elapsedTime?: number;
  startTime?: string;
  activeExercise?: string;
  sessionId?: string;
  savedAt?: number;
}

// Helper function to extract sets from workout store data
const getExerciseSets = (exerciseData: any): ExerciseSet[] => {
  if (Array.isArray(exerciseData)) {
    return exerciseData;
  }
  if (exerciseData && exerciseData.sets) {
    return exerciseData.sets;
  }
  return [];
};

// Recovery utility functions
const checkForRecoveryData = (): RecoveryData | null => {
  try {
    // Check sessionStorage backup first
    const backup = sessionStorage.getItem('workout-backup');
    if (backup) {
      const backupData = JSON.parse(backup);
      if (backupData.exercises && Object.keys(backupData.exercises).length > 0) {
        console.log('🔍 Found sessionStorage backup:', backupData);
        return backupData;
      }
    }

    // Check localStorage for any workout fragments
    const workoutStorage = localStorage.getItem('workout-storage');
    if (workoutStorage) {
      const storageData = JSON.parse(workoutStorage);
      if (storageData.state?.exercises && Object.keys(storageData.state.exercises).length > 0) {
        console.log('🔍 Found localStorage fragments:', storageData.state);
        return {
          exercises: storageData.state.exercises,
          elapsedTime: storageData.state.elapsedTime,
          startTime: storageData.state.startTime,
          activeExercise: storageData.state.activeExercise,
          sessionId: storageData.state.sessionId
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking recovery data:', error);
    return null;
  }
};

const restoreFromRecoveryData = (recoveryData: RecoveryData, workoutStore: any): CompletedWorkout | null => {
  try {
    if (!recoveryData.exercises) return null;

    // Restore to workout store
    workoutStore.setExercises(recoveryData.exercises);
    if (recoveryData.elapsedTime) {
      workoutStore.setElapsedTime(recoveryData.elapsedTime);
    }
    if (recoveryData.activeExercise) {
      workoutStore.setActiveExercise(recoveryData.activeExercise);
    }

    // Create completed workout from recovery data
    const now = Date.now();
    const startTime = recoveryData.startTime ? new Date(recoveryData.startTime).getTime() : (now - (recoveryData.elapsedTime || 0) * 1000);
    
    const exerciseData: Record<string, ExerciseSet[]> = {};
    Object.entries(recoveryData.exercises).forEach(([name, data]) => {
      const sets = getExerciseSets(data);
      exerciseData[name] = sets.map(set => ({
        weight: set.weight || 0,
        reps: set.reps || 0,
        completed: set.completed || false,
        restTime: set.restTime || 60
      }));
    });

    return {
      startTime,
      endTime: now,
      exercises: exerciseData
    };
  } catch (error) {
    console.error('Error restoring from recovery data:', error);
    return null;
  }
};

export const WorkoutCompletionEnhanced = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    exercises, 
    startTime, 
    elapsedTime, 
    resetSession, 
    getExerciseDisplayName,
    isActive,
    workoutStatus,
    setSavedWorkout 
  } = useWorkoutStore();
  const { weightUnit } = useWeightUnit();
  
  // Check for saved workout ID from navigation state
  const savedWorkoutId = location.state?.workoutId;
  const isFromSuccessfulSave = location.state?.success && savedWorkoutId;
  
  // Fetch saved workout if we have an ID
  const { workout: savedWorkout, loading: savedWorkoutLoading } = useWorkoutById(savedWorkoutId);
  
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOKS
  const [showCelebration, setShowCelebration] = useState(true);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [shouldFixCorruption, setShouldFixCorruption] = useState(false);

  // Check if we have a completed workout - prioritize saved workout from backend
  const hasCompletedWorkout = Boolean(savedWorkout) || workoutStatus === 'saved' || (!isActive && Object.keys(exercises).length > 0);
  
  // Detect corruption: user reached this page but no workout data OR corrupted time data
  const isTimeCorrupted = elapsedTime > (12 * 60 * 60); // More than 12 hours
  const isCorrupted = !hasCompletedWorkout && !recoveryData;
  
  // Auto-fix corrupted elapsed time on component mount
  useEffect(() => {
    if (isTimeCorrupted && elapsedTime > 0) {
      console.warn(`🔧 Auto-fixing corrupted elapsed time: ${elapsedTime}s`);
      const fixedTime = Math.min(2 * 60 * 60, elapsedTime); // Cap at 2 hours
      const workoutStore = useWorkoutStore.getState();
      workoutStore.setElapsedTime(fixedTime);
      setShouldFixCorruption(true);
      
      toast({
        title: "Fixed workout timing",
        description: "Corrected invalid workout duration automatically"
      });
    }
  }, [isTimeCorrupted, elapsedTime]);

  // Store saved workout ID for future reference
  useEffect(() => {
    if (savedWorkoutId && isFromSuccessfulSave) {
      console.log('📝 Storing saved workout ID:', savedWorkoutId);
      setSavedWorkout(savedWorkoutId);
    }
  }, [savedWorkoutId, isFromSuccessfulSave, setSavedWorkout]);

  // Check for recovery data only if no saved workout and no store data
  useEffect(() => {
    if (!savedWorkout && !hasCompletedWorkout && !savedWorkoutLoading) {
      console.log('🔍 No completed workout found, checking for recovery data...');
      const recovery = checkForRecoveryData();
      if (recovery) {
        setRecoveryData(recovery);
        console.log('✅ Recovery data found:', recovery);
      } else {
        console.log('❌ No recovery data available');
      }
    }
  }, [savedWorkout, hasCompletedWorkout, savedWorkoutLoading]);

  // Create completed workout data - prioritize saved workout from backend
  const completedWorkout: CompletedWorkout | null = useMemo(() => {
    // First priority: Saved workout from backend (successful save)
    if (savedWorkout) {
      console.log('✅ Using saved workout from backend:', savedWorkout.id);
      
      // Transform saved workout to CompletedWorkout format
      const exerciseData: Record<string, ExerciseSet[]> = {};
      Object.entries(savedWorkout.exercises).forEach(([name, sets]) => {
        exerciseData[name] = sets.map(set => ({
          weight: set.weight || 0,
          reps: set.reps || 0,
          completed: set.completed || false,
          restTime: (set as any).rest_time || set.restTime || 60
        }));
      });

      const workoutDate = new Date(savedWorkout.date);
      return {
        startTime: workoutDate.getTime(),
        endTime: workoutDate.getTime() + (savedWorkout.duration * 60 * 1000), // duration is in minutes
        exercises: exerciseData
      };
    }
    
    // Fallback: Use store data if available
    if (hasCompletedWorkout && startTime) {
      console.log('⚠️ Falling back to store data for completed workout');
      const exerciseData: Record<string, ExerciseSet[]> = {};
      Object.entries(exercises).forEach(([name, data]) => {
        const sets = getExerciseSets(data);
        exerciseData[name] = sets.map(set => ({
          weight: set.weight || 0,
          reps: set.reps || 0,
          completed: set.completed || false,
          restTime: set.restTime || 60
        }));
      });

      return {
        startTime: new Date(startTime).getTime(),
        endTime: new Date(startTime).getTime() + (elapsedTime * 1000),
        exercises: exerciseData
      };
    }
    
    return null;
  }, [savedWorkout, hasCompletedWorkout, startTime, elapsedTime, exercises]);

  // Clear workout after completion
  useEffect(() => {
    if (!completedWorkout) return;

    const timer = setTimeout(() => {
      resetSession();
    }, 5000);

    return () => clearTimeout(timer);
  }, [completedWorkout, resetSession]);

  // Celebration timer
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  // Handle recovery actions
  const handleQuickRecover = async () => {
    if (!recoveryData) return;
    
    setIsRecovering(true);
    try {
      const workoutStore = useWorkoutStore.getState();
      const recovered = restoreFromRecoveryData(recoveryData, workoutStore);
      
      if (recovered) {
        toast({
          title: "Workout recovered!",
          description: "Your exercise data has been restored successfully"
        });
        // Refresh the component by clearing recovery data
        setRecoveryData(null);
      } else {
        throw new Error('Could not restore workout data');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      toast({
        title: "Recovery failed",
        description: "Could not restore your workout data",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleClearAndStart = () => {
    // Clear all storage
    localStorage.removeItem('workout-storage');
    sessionStorage.removeItem('workout-backup');
    resetSession();
    
    toast({
      title: "Workout data cleared",
      description: "You can start a fresh workout now"
    });
    
    navigate('/training-session');
  };

  const handleSavePartial = () => {
    if (!recoveryData) return;
    
    // Navigate to completion page with recovery data
    navigate('/workout-complete-page', {
      state: {
        workoutData: {
          exercises: recoveryData.exercises || {},
          duration: recoveryData.elapsedTime || 0,
          startTime: recoveryData.startTime ? new Date(recoveryData.startTime) : new Date(),
          endTime: new Date(),
          trainingType: 'recovered',
          name: 'Recovered Workout',
          trainingConfig: null,
          notes: 'This workout was recovered from corrupted session data',
          metadata: { recovered: true }
        }
      }
    });
  };

  // Enhanced metrics processing with efficiency calculations
  const processedMetrics = useMemo(() => {
    if (!completedWorkout) return null;
    
    // Transform store ExerciseSet format to database ExerciseSet format
    const transformedExercises: Record<string, import('@/types/exercise').ExerciseSet[]> = {};
    
    Object.entries(completedWorkout.exercises).forEach(([exerciseName, exerciseData]) => {
      const sets = exerciseData; // exerciseData is already ExerciseSet[] from CompletedWorkout interface
      transformedExercises[exerciseName] = sets.map((set, index) => ({
        id: `${exerciseName}-${index}`,
        workout_id: 'temp-id',
        exercise_name: exerciseName,
        weight: set.weight,
        reps: set.reps,
        completed: set.completed,
        set_number: index + 1,
        rest_time: set.restTime,
        created_at: new Date().toISOString(),
      }));
    });
    
    const duration = Math.round((completedWorkout.endTime - completedWorkout.startTime) / (1000 * 60));
    
    return processWorkoutMetrics(
      transformedExercises,
      duration,
      weightUnit as 'kg' | 'lb',
      { weight: 70, unit: 'kg' }, // You might want to get this from user profile
      {
        start_time: new Date(completedWorkout.startTime).toISOString(),
        duration: duration
      }
    );
  }, [completedWorkout, weightUnit]);

  // NOW ALL CONDITIONAL LOGIC AND EARLY RETURNS COME AFTER ALL HOOKS

  // Show loading state while fetching saved workout
  if (savedWorkoutLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your completed workout...</p>
        </div>
      </div>
    );
  }

  // Show corruption recovery UI only if no saved workout
  if (!savedWorkout && isCorrupted && recoveryData) {
    const exerciseCount = Object.keys(recoveryData.exercises || {}).length;
    const duration = Math.round((recoveryData.elapsedTime || 0) / 60);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-full">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Workout Recovery</h1>
            <p className="text-gray-400">We found your workout data! Choose how to proceed.</p>
          </div>

          <Card className="bg-gray-900/40 border-gray-800/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-5 w-5 text-blue-400" />
                Found Workout Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <Dumbbell className="h-5 w-5 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{exerciseCount}</p>
                  <p className="text-xs text-gray-400">Exercises</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{duration}m</p>
                  <p className="text-xs text-gray-400">Duration</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleQuickRecover}
                  disabled={isRecovering}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Recovering...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Quick Recover & Continue
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSavePartial}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Partial Workout
                </Button>

                <Button
                  onClick={handleClearAndStart}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Clear & Start Fresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Your workout session was interrupted, but we saved your progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show no data found UI only if no saved workout (true corruption with no recovery data)
  if (!savedWorkout && isCorrupted && !recoveryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-full">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Workout Data Lost</h2>
            <p className="text-gray-400 mb-6">
              Your workout session was interrupted and we couldn't recover your data. This sometimes happens due to browser issues or network problems.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/training-session')} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start New Workout
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show regular completion UI if we have workout data
  if (!completedWorkout) {
    // Check if we're stuck loading due to corruption
    const hasExerciseData = Object.keys(exercises).length > 0;
    const hasElapsedTime = elapsedTime > 0;
    
    if (hasExerciseData && hasElapsedTime && !isTimeCorrupted) {
      // We have data but no completed workout - force creation
      const exerciseData: Record<string, ExerciseSet[]> = {};
      Object.entries(exercises).forEach(([name, data]) => {
        const sets = getExerciseSets(data);
        exerciseData[name] = sets.map(set => ({
          weight: set.weight || 0,
          reps: set.reps || 0,
          completed: set.completed || false,
          restTime: set.restTime || 60
        }));
      });

      const forceCompletedWorkout: CompletedWorkout = {
        startTime: startTime ? new Date(startTime).getTime() : Date.now() - (elapsedTime * 1000),
        endTime: Date.now(),
        exercises: exerciseData
      };
      
      const duration = Math.round((forceCompletedWorkout.endTime - forceCompletedWorkout.startTime) / (1000 * 60));
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Workout Complete!</h1>
              <p className="text-gray-400">Great job on completing your workout</p>
            </div>
            <div className="text-center space-y-4">
              <Button onClick={() => navigate('/')} className="w-full max-w-xs">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">Loading workout completion...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const duration = Math.round((completedWorkout.endTime - completedWorkout.startTime) / (1000 * 60));
  
  const totalSets = Object.values(completedWorkout.exercises).flat().length;
  const completedSets = Object.values(completedWorkout.exercises)
    .flat()
    .filter(set => set.completed).length;
  const totalVolume = Object.values(completedWorkout.exercises)
    .flat()
    .filter(set => set.completed)
    .reduce((sum, set) => sum + (set.weight * set.reps), 0);

  const completionRate = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {showCelebration && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
          <div className="confetti-container">
            {[...Array(100)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}vw`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout Complete!</h1>
          <p className="text-gray-400">Outstanding work! Here's your performance summary.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900/40 border-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{duration}m</p>
                  <p className="text-xs text-gray-400">Duration</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <Dumbbell className="h-5 w-5 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{totalVolume.toFixed(0)}</p>
                  <p className="text-xs text-gray-400">Total Volume ({weightUnit})</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <Target className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{completedSets}/{totalSets}</p>
                  <p className="text-xs text-gray-400">Sets Completed</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{completionRate.toFixed(0)}%</p>
                  <p className="text-xs text-gray-400">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {processedMetrics && <EfficiencyMetricsCard metrics={processedMetrics} />}
        </div>

        <Card className="bg-gray-900/40 border-gray-800/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Exercises Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-none space-y-2">
              {Object.entries(completedWorkout.exercises).map(([exerciseName, sets]) => {
                const displayName = getExerciseDisplayName(exerciseName);
                const completedSetsCount = sets.filter(set => set.completed).length;
                return (
                  <li key={exerciseName} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                    <span className="text-gray-300">{displayName}</span>
                    <Badge variant="secondary" className="bg-purple-900/30 text-purple-300 border-purple-500/30">
                      {completedSetsCount} / {sets.length} Sets
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/40 border-gray-800/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="h-5 w-5 text-yellow-400" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Consistency</span>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">3-Day Streak</span>
                </div>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Total Volume</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">+15% from last week</span>
                </div>
              </div>
              <Progress value={60} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {processedMetrics && (
          <Card className="bg-gray-900/40 border-gray-800/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-yellow-400" />
                Advanced Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-lg font-bold text-cyan-400">
                    {processedMetrics.densityMetrics.formattedOverallDensity}
                  </p>
                  <p className="text-xs text-gray-400">Workout Density</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-lg font-bold text-pink-400">
                    {processedMetrics.intensityMetrics.averageLoad.toFixed(1)} {weightUnit}
                  </p>
                  <p className="text-xs text-gray-400">Average Load</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-lg font-bold text-emerald-400">
                    {processedMetrics.estimatedEnergyExpenditure} cal
                  </p>
                  <p className="text-xs text-gray-400">Est. Calories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => navigate('/workouts')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            View Workout History
          </Button>
        </div>
      </div>
    </div>
  );
};
