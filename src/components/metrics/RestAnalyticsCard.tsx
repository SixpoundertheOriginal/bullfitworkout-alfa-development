import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getRestTimePatterns } from '@/services/restTimeAnalyticsService';

interface RestTimePattern {
  exercise_name: string;
  average_rest_time: number;
  optimal_rest_time: number;
  performance_correlation: number;
}

export const RestAnalyticsCard: React.FC = () => {
  const [patterns, setPatterns] = useState<RestTimePattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestAnalytics = async () => {
      try {
        const data = await getRestTimePatterns();
        setPatterns(data);
      } catch (error) {
        console.error('Failed to fetch rest analytics:', error);
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

  const averageRestTime = patterns.length > 0 
    ? Math.round(patterns.reduce((sum, p) => sum + p.average_rest_time, 0) / patterns.length)
    : 0;

  const efficiencyTrend = patterns.length > 0
    ? patterns.reduce((sum, p) => sum + p.performance_correlation, 0) / patterns.length
    : 0;

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

  if (patterns.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <Clock className="h-5 w-5 text-purple-400" />
            Recovery Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">
            Complete more workouts to see rest time insights
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