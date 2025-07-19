
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { useWorkoutStore } from '@/store/workoutStore';
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { EfficiencyMetricsCard } from '@/components/metrics/EfficiencyMetricsCard';

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

export const WorkoutCompletionEnhanced = () => {
  const navigate = useNavigate();
  const { 
    exercises, 
    startTime, 
    elapsedTime, 
    resetSession, 
    getExerciseDisplayName,
    isActive,
    workoutStatus 
  } = useWorkoutStore();
  const { weightUnit } = useWeightUnit();
  const [showCelebration, setShowCelebration] = useState(true);

  // Check if we have a completed workout based on store state
  const hasCompletedWorkout = workoutStatus === 'saved' || (!isActive && Object.keys(exercises).length > 0);
  
  // Create completed workout data from store
  const completedWorkout: CompletedWorkout | null = useMemo(() => {
    if (!hasCompletedWorkout || !startTime) return null;
    
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
  }, [hasCompletedWorkout, startTime, elapsedTime, exercises]);

  useEffect(() => {
    if (!completedWorkout) return;

    // Clear workout after 5 seconds
    const timer = setTimeout(() => {
      resetSession();
    }, 5000);

    return () => clearTimeout(timer);
  }, [completedWorkout, resetSession]);

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  if (!completedWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">No completed workout found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const duration = Math.round((completedWorkout.endTime - completedWorkout.startTime) / (1000 * 60));
  
  // Enhanced metrics processing with efficiency calculations
  const processedMetrics = useMemo(() => {
    return processWorkoutMetrics(
      completedWorkout.exercises,
      duration,
      weightUnit as 'kg' | 'lb',
      { weight: 70, unit: 'kg' }, // You might want to get this from user profile
      {
        start_time: new Date(completedWorkout.startTime).toISOString(),
        duration: duration
      }
    );
  }, [completedWorkout.exercises, duration, weightUnit]);

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

          {/* Enhanced Efficiency Metrics Card */}
          <EfficiencyMetricsCard metrics={processedMetrics} />
        </div>

        {/* Exercises Completed Section */}
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

        {/* Achievements Section */}
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

        {/* Advanced Metrics Section */}
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
