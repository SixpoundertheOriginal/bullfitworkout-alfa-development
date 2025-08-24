import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface RestPatternAnalyticsProps {
  workouts: any[];
  className?: string;
}

interface RestAnalytics {
  averageRestBetweenSets: number;
  restConsistency: number;
  optimalRestAdherence: number;
  restTrendDirection: 'improving' | 'declining' | 'stable';
  recentPatterns: Array<{
    exerciseName: string;
    averageRest: number;
    consistency: number;
  }>;
  totalSetsAnalyzed: number;
}

export const RestPatternAnalytics: React.FC<RestPatternAnalyticsProps> = ({
  workouts,
  className = ""
}) => {
  const restAnalytics = useMemo<RestAnalytics>(() => {
    if (!workouts || workouts.length === 0) {
      return {
        averageRestBetweenSets: 0,
        restConsistency: 0,
        optimalRestAdherence: 0,
        restTrendDirection: 'stable',
        recentPatterns: [],
        totalSetsAnalyzed: 0
      };
    }

    const allRestTimes: number[] = [];
    const exerciseRestData: Record<string, number[]> = {};
    let totalSets = 0;

    // Collect all rest times from workouts
    workouts.forEach(workout => {
      const exercises = workout.exercises || workout.exercise_sets || [];
      exercises.forEach((set: any) => {
        if (set.rest_time && set.rest_time > 0) {
          allRestTimes.push(set.rest_time);
          totalSets++;
          
          // Group by exercise for pattern analysis
          const exerciseName = set.exercise_name || 'Unknown';
          if (!exerciseRestData[exerciseName]) {
            exerciseRestData[exerciseName] = [];
          }
          exerciseRestData[exerciseName].push(set.rest_time);
        }
      });
    });

    if (allRestTimes.length === 0) {
      return {
        averageRestBetweenSets: 0,
        restConsistency: 0,
        optimalRestAdherence: 0,
        restTrendDirection: 'stable',
        recentPatterns: [],
        totalSetsAnalyzed: 0
      };
    }

    // Calculate average rest time
    const averageRestBetweenSets = allRestTimes.reduce((sum, time) => sum + time, 0) / allRestTimes.length;

    // Calculate consistency (inverse of coefficient of variation)
    const variance = allRestTimes.reduce((sum, time) => sum + Math.pow(time - averageRestBetweenSets, 2), 0) / allRestTimes.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = averageRestBetweenSets > 0 ? standardDeviation / averageRestBetweenSets : 0;
    const restConsistency = Math.max(0, (1 - coefficientOfVariation) * 100);

    // Calculate optimal rest adherence (60-180s is generally optimal for strength/hypertrophy)
    const optimalRestSets = allRestTimes.filter(time => time >= 60 && time <= 180).length;
    const optimalRestAdherence = (optimalRestSets / allRestTimes.length) * 100;

    // Calculate trend direction (compare first half vs second half)
    const midpoint = Math.floor(allRestTimes.length / 2);
    const firstHalf = allRestTimes.slice(0, midpoint);
    const secondHalf = allRestTimes.slice(midpoint);

    const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length : averageRestBetweenSets;
    const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length : averageRestBetweenSets;

    const trendDifference = secondHalfAvg - firstHalfAvg;
    let restTrendDirection: 'improving' | 'declining' | 'stable';
    
    if (Math.abs(trendDifference) < 5) {
      restTrendDirection = 'stable';
    } else if (trendDifference > 0) {
      // Longer rest times might be "improving" for strength work, "declining" for conditioning
      restTrendDirection = 'improving'; // Assuming strength focus
    } else {
      restTrendDirection = 'declining';
    }

    // Calculate recent patterns by exercise
    const recentPatterns = Object.entries(exerciseRestData)
      .map(([exerciseName, restTimes]) => {
        const averageRest = restTimes.reduce((sum, time) => sum + time, 0) / restTimes.length;
        const exerciseVariance = restTimes.reduce((sum, time) => sum + Math.pow(time - averageRest, 2), 0) / restTimes.length;
        const exerciseSD = Math.sqrt(exerciseVariance);
        const exerciseCV = averageRest > 0 ? exerciseSD / averageRest : 0;
        const consistency = Math.max(0, (1 - exerciseCV) * 100);

        return {
          exerciseName,
          averageRest: Math.round(averageRest),
          consistency: Math.round(consistency)
        };
      })
      .sort((a, b) => b.consistency - a.consistency)
      .slice(0, 5); // Top 5 most consistent

    return {
      averageRestBetweenSets: Math.round(averageRestBetweenSets),
      restConsistency: Math.round(restConsistency),
      optimalRestAdherence: Math.round(optimalRestAdherence),
      restTrendDirection,
      recentPatterns,
      totalSetsAnalyzed: totalSets
    };
  }, [workouts]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConsistencyColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAdherenceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (restAnalytics.totalSetsAnalyzed === 0) {
    return (
      <Card className={`bg-gray-900/40 border-gray-800/50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-blue-400" />
            Rest Pattern Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            Complete workouts with rest tracking to see analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-900/40 border-gray-800/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="h-5 w-5 text-blue-400" />
          Rest Pattern Analytics
          <Badge variant="outline" className="text-xs">
            {restAnalytics.totalSetsAnalyzed} sets
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-400">Average Rest</div>
            <div className="text-2xl font-bold text-white">
              {restAnalytics.averageRestBetweenSets}s
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(restAnalytics.restTrendDirection)}
              <span className="text-gray-400 capitalize">
                {restAnalytics.restTrendDirection}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-400">Consistency</div>
            <div className={`text-2xl font-bold ${getConsistencyColor(restAnalytics.restConsistency)}`}>
              {restAnalytics.restConsistency}%
            </div>
            <div className="text-xs text-gray-400">Low variance</div>
          </div>
        </div>

        {/* Optimal Rest Adherence */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Optimal Range (60-180s)</span>
            <span className={getAdherenceColor(restAnalytics.optimalRestAdherence)}>
              {restAnalytics.optimalRestAdherence}%
            </span>
          </div>
          <Progress 
            value={restAnalytics.optimalRestAdherence} 
            className="h-2"
          />
        </div>

        {/* Exercise Patterns */}
        {restAnalytics.recentPatterns.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Most Consistent Exercises</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {restAnalytics.recentPatterns.slice(0, 3).map((pattern, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 truncate flex-1">
                    {pattern.exerciseName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono">
                      {pattern.averageRest}s
                    </span>
                    <span className={`text-xs ${getConsistencyColor(pattern.consistency)}`}>
                      {pattern.consistency}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="pt-2 border-t border-gray-700/50">
          <div className="text-xs text-gray-400">
            {restAnalytics.optimalRestAdherence >= 80 
              ? "Excellent rest timing for strength/hypertrophy goals"
              : restAnalytics.optimalRestAdherence >= 60
              ? "Good rest patterns, consider 60-180s range for optimal results"
              : "Consider adjusting rest periods to 60-180s for better recovery"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};