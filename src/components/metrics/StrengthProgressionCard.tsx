import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, Trophy } from "lucide-react";

interface StrengthProgressionCardProps {
  workouts: any[];
  userBodyweight?: number;
  className?: string;
}

interface StrengthMetrics {
  estimatedOneRepMax: Record<string, number>;
  strengthToBodyweightRatios: {
    bench?: number;
    squat?: number;
    deadlift?: number;
    pullup?: number;
  };
  plateauDetection: {
    stallingExercises: string[];
    progressionRate: number;
    deloadRecommendation: boolean;
  };
  strengthProgression: Array<{
    exerciseName: string;
    currentMax: number;
    trend: 'improving' | 'declining' | 'stable';
    weeklyGain: number;
  }>;
}

export const StrengthProgressionCard: React.FC<StrengthProgressionCardProps> = ({
  workouts,
  userBodyweight = 70, // Default bodyweight in kg
  className = ""
}) => {
  const strengthMetrics = useMemo<StrengthMetrics>(() => {
    if (!workouts || workouts.length === 0) {
      return {
        estimatedOneRepMax: {},
        strengthToBodyweightRatios: {},
        plateauDetection: {
          stallingExercises: [],
          progressionRate: 0,
          deloadRecommendation: false
        },
        strengthProgression: []
      };
    }

    // Collect exercise data with weights and reps
    const exerciseData: Record<string, Array<{
      weight: number;
      reps: number;
      date: string;
      estimatedMax: number;
    }>> = {};

    workouts.forEach(workout => {
      const exercises = workout.exercises || workout.exercise_sets || [];
      const workoutDate = workout.start_time || new Date().toISOString();

      exercises.forEach((set: any) => {
        if (set.weight && set.reps && set.completed && set.weight > 0 && set.reps > 0) {
          const exerciseName = set.exercise_name || 'Unknown';
          
          // Estimate 1RM using Brzycki formula: weight / (1.0278 - 0.0278 * reps)
          let estimatedMax: number;
          if (set.reps === 1) {
            estimatedMax = set.weight;
          } else if (set.reps <= 12) {
            estimatedMax = set.weight / (1.0278 - 0.0278 * set.reps);
          } else {
            // For high rep sets, use modified formula
            estimatedMax = set.weight * (1 + set.reps / 30);
          }

          if (!exerciseData[exerciseName]) {
            exerciseData[exerciseName] = [];
          }

          exerciseData[exerciseName].push({
            weight: set.weight,
            reps: set.reps,
            date: workoutDate,
            estimatedMax: Math.round(estimatedMax * 10) / 10
          });
        }
      });
    });

    // Calculate current estimated 1RMs (best from recent workouts)
    const estimatedOneRepMax: Record<string, number> = {};
    Object.entries(exerciseData).forEach(([exerciseName, data]) => {
      // Sort by date descending and take best from last 4 weeks
      const recentData = data
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Last 10 sets

      if (recentData.length > 0) {
        estimatedOneRepMax[exerciseName] = Math.max(...recentData.map(d => d.estimatedMax));
      }
    });

    // Calculate strength-to-bodyweight ratios for key lifts
    const strengthToBodyweightRatios: { bench?: number; squat?: number; deadlift?: number; pullup?: number } = {};
    
    Object.entries(estimatedOneRepMax).forEach(([exerciseName, max]) => {
      const nameLower = exerciseName.toLowerCase();
      if (nameLower.includes('bench')) {
        strengthToBodyweightRatios.bench = Math.round((max / userBodyweight) * 100) / 100;
      } else if (nameLower.includes('squat')) {
        strengthToBodyweightRatios.squat = Math.round((max / userBodyweight) * 100) / 100;
      } else if (nameLower.includes('deadlift')) {
        strengthToBodyweightRatios.deadlift = Math.round((max / userBodyweight) * 100) / 100;
      } else if (nameLower.includes('pull-up') || nameLower.includes('pullup') || nameLower.includes('chin')) {
        // For pull-ups, calculate bodyweight multiple
        strengthToBodyweightRatios.pullup = Math.round((max / userBodyweight) * 100) / 100;
      }
    });

    // Plateau detection and progression analysis
    const stallingExercises: string[] = [];
    const strengthProgression: Array<{
      exerciseName: string;
      currentMax: number;
      trend: 'improving' | 'declining' | 'stable';
      weeklyGain: number;
    }> = [];

    let totalProgressionRate = 0;
    let exercisesWithTrend = 0;

    Object.entries(exerciseData).forEach(([exerciseName, data]) => {
      if (data.length < 3) return; // Need at least 3 data points

      // Sort by date ascending for trend analysis
      const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Group by weeks and get best estimated max per week
      const weeklyMaxes: { [week: string]: number } = {};
      sortedData.forEach(set => {
        const weekKey = new Date(set.date).toISOString().slice(0, 10); // Use date as week key
        weeklyMaxes[weekKey] = Math.max(weeklyMaxes[weekKey] || 0, set.estimatedMax);
      });

      const weeklyValues = Object.values(weeklyMaxes);
      if (weeklyValues.length < 2) return;

      // Calculate trend over recent weeks
      const recentWeeks = weeklyValues.slice(-4); // Last 4 weeks
      const oldestMax = recentWeeks[0];
      const newestMax = recentWeeks[recentWeeks.length - 1];
      
      const weeklyGain = ((newestMax - oldestMax) / Math.max(recentWeeks.length - 1, 1));
      const percentageGain = oldestMax > 0 ? ((newestMax - oldestMax) / oldestMax) * 100 : 0;

      let trend: 'improving' | 'declining' | 'stable';
      if (Math.abs(percentageGain) < 2) {
        trend = 'stable';
        if (recentWeeks.length >= 3) {
          stallingExercises.push(exerciseName);
        }
      } else if (percentageGain > 0) {
        trend = 'improving';
      } else {
        trend = 'declining';
      }

      strengthProgression.push({
        exerciseName,
        currentMax: estimatedOneRepMax[exerciseName] || newestMax,
        trend,
        weeklyGain: Math.round(weeklyGain * 10) / 10
      });

      totalProgressionRate += percentageGain;
      exercisesWithTrend++;
    });

    const progressionRate = exercisesWithTrend > 0 ? totalProgressionRate / exercisesWithTrend : 0;
    const deloadRecommendation = stallingExercises.length >= 2 && progressionRate < 1;

    return {
      estimatedOneRepMax,
      strengthToBodyweightRatios,
      plateauDetection: {
        stallingExercises,
        progressionRate: Math.round(progressionRate * 10) / 10,
        deloadRecommendation
      },
      strengthProgression: strengthProgression
        .sort((a, b) => b.currentMax - a.currentMax)
        .slice(0, 5) // Top 5 by current max
    };
  }, [workouts, userBodyweight]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRatioCategory = (ratio: number, exerciseType: string) => {
    // Strength standards (approximate)
    const standards = {
      bench: { beginner: 0.75, intermediate: 1.0, advanced: 1.25 },
      squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0 },
      deadlift: { beginner: 1.25, intermediate: 1.75, advanced: 2.5 },
      pullup: { beginner: 0.8, intermediate: 1.0, advanced: 1.25 }
    };

    const standard = standards[exerciseType as keyof typeof standards];
    if (!standard) return { category: 'Unknown', color: 'text-gray-400' };

    if (ratio >= standard.advanced) return { category: 'Advanced', color: 'text-purple-400' };
    if (ratio >= standard.intermediate) return { category: 'Intermediate', color: 'text-blue-400' };
    if (ratio >= standard.beginner) return { category: 'Beginner', color: 'text-green-400' };
    return { category: 'Novice', color: 'text-yellow-400' };
  };

  const hasData = Object.keys(strengthMetrics.estimatedOneRepMax).length > 0;

  if (!hasData) {
    return (
      <Card className={`bg-gray-900/40 border-gray-800/50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-orange-400" />
            Strength Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 text-sm">
            Complete strength workouts to track progression
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-900/40 border-gray-800/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="h-5 w-5 text-orange-400" />
          Strength Progression
          {strengthMetrics.plateauDetection.deloadRecommendation && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Deload
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strength-to-Bodyweight Ratios */}
        {Object.keys(strengthMetrics.strengthToBodyweightRatios).length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-300">Strength Ratios</div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(strengthMetrics.strengthToBodyweightRatios).map(([exercise, ratio]) => {
                const { category, color } = getRatioCategory(ratio!, exercise);
                return (
                  <div key={exercise} className="p-2 bg-gray-800/30 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 capitalize">{exercise}</span>
                      <span className={`text-xs ${color}`}>{category}</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {ratio!.toFixed(1)}x
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progression Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Monthly Progress Rate</span>
            <span className={strengthMetrics.plateauDetection.progressionRate >= 2 ? 'text-emerald-400' : 
                           strengthMetrics.plateauDetection.progressionRate >= 0 ? 'text-yellow-400' : 'text-red-400'}>
              {strengthMetrics.plateauDetection.progressionRate > 0 ? '+' : ''}{strengthMetrics.plateauDetection.progressionRate}%
            </span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, (strengthMetrics.plateauDetection.progressionRate + 5) * 10))} 
            className="h-2"
          />
        </div>

        {/* Top Exercises by Current Max */}
        {strengthMetrics.strengthProgression.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Top Exercises</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {strengthMetrics.strengthProgression.slice(0, 4).map((exercise, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-400 truncate">
                      {exercise.exerciseName}
                    </span>
                    {index === 0 && <Trophy className="h-3 w-3 text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono">
                      {exercise.currentMax.toFixed(0)}kg
                    </span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(exercise.trend)}
                      <span className="text-xs text-gray-400">
                        {exercise.weeklyGain > 0 ? '+' : ''}{exercise.weeklyGain}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plateau Warning */}
        {strengthMetrics.plateauDetection.stallingExercises.length > 0 && (
          <div className="pt-2 border-t border-gray-700/50">
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              {strengthMetrics.plateauDetection.stallingExercises.length} exercise(s) may be plateauing
            </div>
            {strengthMetrics.plateauDetection.deloadRecommendation && (
              <div className="text-xs text-gray-400 mt-1">
                Consider a deload week or technique refinement
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};