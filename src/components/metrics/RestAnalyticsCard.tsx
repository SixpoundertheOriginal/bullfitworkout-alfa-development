import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getRestTimePatterns } from '@/services/restTimeAnalyticsService';
import { useWorkoutStats } from '@/hooks/useWorkoutStats';

interface RestTimePattern {
  exercise_name: string;
  average_rest_time: number;
  optimal_rest_time: number;
  performance_correlation: number;
}

export const RestAnalyticsCard: React.FC = () => {
  const [patterns, setPatterns] = useState<RestTimePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const { workouts } = useWorkoutStats();

  useEffect(() => {
    const fetchRestAnalytics = async () => {
      try {
        console.log('Fetching rest time patterns...');
        const data = await getRestTimePatterns();
        console.log('Rest time patterns received:', data);
        setPatterns(data);
      } catch (error) {
        console.error('Failed to fetch rest analytics:', error);
        // Set mock data for now if no data exists
        setPatterns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestAnalytics();
  }, []);

  const getTrendIcon = (correlation: number) => {
    if (correlation > 0.1) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (correlation < -0.1) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Calculate rest times from actual workout data instead of old analytics
  const calculateRestTimesFromWorkouts = () => {
    if (!workouts || workouts.length === 0) return { avgRestTime: 60, trend: 0 };
    
    const allRestTimes: number[] = [];
    workouts.forEach(workout => {
      const exerciseData = workout.exercises || workout.exercise_sets || [];
      exerciseData.forEach((set: any) => {
        if (set.rest_time && set.rest_time > 0) {
          allRestTimes.push(set.rest_time);
        }
      });
    });
    
    console.log('All rest times from workouts:', allRestTimes);
    
    if (allRestTimes.length === 0) return { avgRestTime: 60, trend: 0 };
    
    const avgRestTime = Math.round(allRestTimes.reduce((sum, time) => sum + time, 0) / allRestTimes.length);
    
    // Simple trend: compare first half vs second half
    const midpoint = Math.floor(allRestTimes.length / 2);
    const firstHalf = allRestTimes.slice(0, midpoint);
    const secondHalf = allRestTimes.slice(midpoint);
    
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length : avgRestTime;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length : avgRestTime;
    
    const trend = secondAvg - firstAvg;
    console.log('Rest time trend calculation:', { firstAvg, secondAvg, trend });
    
    return { avgRestTime, trend };
  };

  const { avgRestTime, trend } = calculateRestTimesFromWorkouts();
  
  const averageRestTime = patterns.length > 0 
    ? Math.round(patterns.reduce((sum, p) => sum + p.average_rest_time, 0) / patterns.length)
    : avgRestTime;

  const efficiencyTrend = patterns.length > 0
    ? patterns.reduce((sum, p) => sum + p.performance_correlation, 0) / patterns.length
    : trend;

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <Clock className="h-5 w-5 text-purple-400" />
            Recovery Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  // Show actual workout data when no analytics patterns exist
  if (patterns.length === 0 && workouts && workouts.length > 0) {
    const recentWorkoutRestTimes = workouts[0]?.exercises || workouts[0]?.exercise_sets || [];
    
    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <Clock className="h-5 w-5 text-purple-400" />
            Recovery Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Avg Rest Time</div>
              <div className="text-xl font-semibold text-white">
                {averageRestTime}s
              </div>
              <div className="text-xs text-gray-500">From workouts</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Efficiency Trend</div>
              <div className="flex items-center gap-2">
                {getTrendIcon(efficiencyTrend)}
                <span className="text-lg font-medium text-white">
                  {efficiencyTrend > 5 ? 'Increasing' : efficiencyTrend < -5 ? 'Decreasing' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
          
          {recentWorkoutRestTimes.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-300">Recent Rest Times</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentWorkoutRestTimes.slice(0, 3).map((set: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Set {set.set_number}</span>
                    <span className="text-white">{set.rest_time || 60}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (patterns.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <Clock className="h-5 w-5 text-purple-400" />
            Recovery Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Avg Rest Time</div>
              <div className="text-xl font-semibold text-white">
                60s
              </div>
              <div className="text-xs text-gray-500">Default</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Efficiency Trend</div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-gray-400" />
                <span className="text-lg font-medium text-white">
                  Stable
                </span>
              </div>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm">
            Complete more workouts with rest tracking to see detailed insights
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white/90">
          <Clock className="h-5 w-5 text-purple-400" />
          Recovery Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-400">Avg Rest Time</div>
            <div className="text-xl font-semibold text-white">
              {averageRestTime}s
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-400">Efficiency Trend</div>
            <div className="flex items-center gap-2">
              {getTrendIcon(efficiencyTrend)}
              <span className="text-lg font-medium text-white">
                {efficiencyTrend > 0 ? 'Improving' : efficiencyTrend < 0 ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-300">Exercise Patterns</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {patterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-400 truncate">{pattern.exercise_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white">{Math.round(pattern.average_rest_time)}s</span>
                  {getTrendIcon(pattern.performance_correlation)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};