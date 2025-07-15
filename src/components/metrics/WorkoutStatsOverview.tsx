
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { formatWeightWithUnit } from '@/utils/unitConversion';
import { WorkoutDensityTrendChart } from '@/components/metrics/WorkoutDensityTrendChart';
import { Activity, BarChart3, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { ProcessedWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

interface WorkoutStatsOverviewProps {
  recentWorkouts: any[];
  allTimeStats?: {
    totalWorkouts: number;
    totalVolume: number;
    avgDensity?: number;
    bestDensity?: number;
  };
  className?: string;
}

export const WorkoutStatsOverview = React.memo(({ 
  recentWorkouts,
  allTimeStats,
  className = ''
}: WorkoutStatsOverviewProps) => {
  const { weightUnit } = useWeightUnit();
  
  // Process workout data for density chart - memoized to prevent recalculation
  const densityTrendData = useMemo(() => {
    console.log("Processing density trend data from workouts:", recentWorkouts?.length || 0);
    
    if (!Array.isArray(recentWorkouts) || recentWorkouts.length === 0) {
      return [];
    }
    
    return recentWorkouts.map(workout => {
      const date = new Date(workout.start_time);
      return {
        date: workout.start_time,
        formattedDate: `${date.getMonth() + 1}/${date.getDate()}`,
        overallDensity: workout.metrics?.densityMetrics?.overallDensity || 0,
        activeOnlyDensity: workout.metrics?.densityMetrics?.activeOnlyDensity || 0,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [recentWorkouts]);
  
  // Calculate average density and find most efficient workout - memoized
  const densityStats = useMemo(() => {
    if (!Array.isArray(densityTrendData) || densityTrendData.length === 0) {
      return { 
        avgOverallDensity: 0, 
        avgActiveOnlyDensity: 0, 
        mostEfficientWorkout: null 
      };
    }
    
    const avgOverallDensity = densityTrendData.reduce((sum, data) => sum + data.overallDensity, 0) / densityTrendData.length;
    const avgActiveOnlyDensity = densityTrendData.reduce((sum, data) => sum + data.activeOnlyDensity, 0) / densityTrendData.length;
    const mostEfficientWorkout = [...densityTrendData].sort((a, b) => b.activeOnlyDensity - a.activeOnlyDensity)[0];
    
    return { avgOverallDensity, avgActiveOnlyDensity, mostEfficientWorkout };
  }, [densityTrendData]);
  
  const { avgOverallDensity, avgActiveOnlyDensity, mostEfficientWorkout } = densityStats;
  const hasData = Array.isArray(densityTrendData) && densityTrendData.length > 0;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-bold mb-2">Performance Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Density Trend Chart with fixed height container */}
        <div className="md:col-span-8">
          <div className="min-h-[240px] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <WorkoutDensityTrendChart 
              data={densityTrendData} 
              className="h-full"
              height={220}
            />
          </div>
        </div>
        
        {/* Stats Summary Cards */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <Card className="bg-gray-900 border-gray-800 min-h-[120px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-purple-400" />
                Workout Density
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-gray-400">Average</span>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold">
                    {avgOverallDensity.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    {weightUnit}/min
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-gray-400">Active Time Only</span>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold">
                    {avgActiveOnlyDensity.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    {weightUnit}/min
                  </span>
                </div>
              </div>
              
              {mostEfficientWorkout && (
                <div className="pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-400">Most efficient workout</span>
                  <div className="flex items-baseline">
                    <span className="text-lg font-bold">
                      {mostEfficientWorkout.activeOnlyDensity.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-400 ml-1">
                      {weightUnit}/min ({mostEfficientWorkout.formattedDate})
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800 min-h-[120px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allTimeStats ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total Volume</span>
                    <span className="font-medium">
                      {formatWeightWithUnit(allTimeStats.totalVolume, weightUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total Workouts</span>
                    <span className="font-medium">{allTimeStats.totalWorkouts}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 text-gray-500">
                  No stats available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

WorkoutStatsOverview.displayName = 'WorkoutStatsOverview';
