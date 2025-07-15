
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Dumbbell,
  ChartLine,
  GaugeCircle
} from "lucide-react";
import { WorkoutStats } from "@/types/workout-metrics";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MuscleFocusChart } from "../metrics/MuscleFocusChart";

interface InsightsDashboardProps {
  stats: WorkoutStats;
  className?: string;
}

export function InsightsDashboard({ stats, className = "" }: InsightsDashboardProps) {
  // Prepare data for visualization
  const frequencyData = Object.entries(stats?.timePatterns?.daysFrequency || {}).map(([day, count]) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1).substring(0, 2),
    workouts: count
  }));
  
  // Prepare time of day data
  const timeOfDayData = [
    { name: 'Morning', value: stats?.timePatterns?.durationByTimeOfDay?.morning || 0 },
    { name: 'Afternoon', value: stats?.timePatterns?.durationByTimeOfDay?.afternoon || 0 },
    { name: 'Evening', value: stats?.timePatterns?.durationByTimeOfDay?.evening || 0 },
    { name: 'Night', value: stats?.timePatterns?.durationByTimeOfDay?.night || 0 }
  ].filter(item => item.value > 0);
  
  // Calculate most active days and times
  const mostActiveDay = [...frequencyData].sort((a, b) => b.workouts - a.workouts)[0];
  const mostActiveTime = [...timeOfDayData].sort((a, b) => b.value - a.value)[0];
  
  // Format time display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };
  
  // Get training volume trend
  const volumeTrend = stats?.progressMetrics?.volumeChangePercentage || 0;
  const volumeTrendText = volumeTrend > 5 
    ? `Up ${Math.round(volumeTrend)}%` 
    : volumeTrend < -5 
      ? `Down ${Math.abs(Math.round(volumeTrend))}%` 
      : "Stable";
  
  // Get training volume trend color
  const getTrendColor = () => {
    if (volumeTrend > 5) return "text-green-400";
    if (volumeTrend < -5) return "text-red-400";
    return "text-blue-400";
  };

  // Calculate muscle focus data for chart
  const muscleFocusData = React.useMemo(() => {
    if (!stats?.muscleFocus) return {};
    
    // Convert muscle focus data to format needed by chart
    const focusData: Record<string, number> = {};
    
    // Map exercise counts to muscle groups
    Object.entries(stats.muscleFocus || {}).forEach(([muscle, count]) => {
      // Ensure count is treated as a number
      focusData[muscle] = typeof count === 'number' ? count : 0;
    });
    
    return focusData;
  }, [stats?.muscleFocus]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-bold mb-2">Training Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Frequency patterns */}
        <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                Workout Patterns
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Workout day frequency */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Most Active Day</p>
                <div className="text-xl font-semibold">
                  {mostActiveDay?.day || "N/A"}
                  <span className="text-sm text-gray-400 ml-1">
                    ({mostActiveDay?.workouts || 0})
                  </span>
                </div>
              </div>
              
              {/* Preferred time */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Preferred Time</p>
                <div className="text-xl font-semibold">
                  {mostActiveTime?.name || "N/A"}
                  <span className="text-sm text-gray-400 ml-1">
                    ({formatTime(mostActiveTime?.value || 0)})
                  </span>
                </div>
              </div>
            </div>
            
            {/* Frequency visualization */}
            <div className="mt-4 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={frequencyData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#aaa' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#222', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${value} workouts`, 'Frequency']}
                  />
                  <Bar 
                    dataKey="workouts" 
                    fill="url(#colorGradient)" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9B87F5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D946EF" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      
        {/* Progress */}
        <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              <div className="flex items-center">
                <ChartLine className="h-4 w-4 mr-2 text-purple-400" />
                Progress Overview
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Volume Trend */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Volume Trend</p>
                <div className="flex items-center">
                  <span className={`text-xl font-semibold ${getTrendColor()}`}>
                    {volumeTrendText}
                  </span>
                  <TrendingUp 
                    className={`h-4 w-4 ml-1 ${volumeTrend > 0 ? 'text-green-400' : volumeTrend < 0 ? 'text-red-400' : 'text-blue-400'}`} 
                  />
                </div>
              </div>
              
              {/* Consistency */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Consistency Score</p>
                <div className="text-xl font-semibold">
                  {Math.round(stats?.progressMetrics?.consistencyScore || 0)}%
                </div>
              </div>
            </div>
            
            {/* Consistency progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                  style={{ width: `${stats?.progressMetrics?.consistencyScore || 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0%</span>
                <span>Target: 50%</span>
                <span>100%</span>
              </div>
            </div>
            
            {/* Recommendations */}
            {stats.recommendedType && (
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-300 font-medium mb-1">Recommended Next Workout</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">{stats.recommendedType}</span>
                    {stats.recommendedDuration && (
                      <span className="text-xs text-gray-400 ml-2">
                        {stats.recommendedDuration} min
                      </span>
                    )}
                  </div>
                  <div>
                    {stats.recommendedTags?.length > 0 && (
                      <div className="flex gap-1">
                        {stats.recommendedTags.slice(0, 2).map(tag => (
                          <span 
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Muscle Focus Chart */}
        <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              <div className="flex items-center">
                <Dumbbell className="h-4 w-4 mr-2 text-purple-400" />
                Muscle Group Focus
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <MuscleFocusChart muscleGroups={muscleFocusData} />
            </div>
          </CardContent>
        </Card>

        {/* Exercise Progress */}
        <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
                Top Exercise Progress
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.exerciseVolumeHistory?.slice(0, 3).map(exercise => {
              // Get trend color
              const trendColor = 
                exercise.trend === 'increasing' ? 'text-green-400' :
                exercise.trend === 'decreasing' ? 'text-red-400' :
                exercise.trend === 'fluctuating' ? 'text-yellow-400' :
                'text-blue-400';
              
              // Format percent
              const percentText = exercise.percentChange > 0 
                ? `+${Math.round(exercise.percentChange)}%` 
                : exercise.percentChange < 0 
                  ? `${Math.round(exercise.percentChange)}%` 
                  : 'Stable';
              
              return (
                <div key={exercise.exercise_name} className="p-3 bg-gray-800/60 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{exercise.exercise_name}</span>
                    <span className={`text-xs font-medium ${trendColor}`}>{percentText}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        exercise.trend === 'increasing' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        exercise.trend === 'decreasing' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                        exercise.trend === 'fluctuating' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-r from-blue-500 to-blue-400'
                      }`}
                      style={{ 
                        width: `${exercise.trend === 'decreasing' 
                          ? Math.max(30, 100 - Math.abs(exercise.percentChange)) 
                          : Math.min(100, 50 + exercise.percentChange/2)}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
            
            {(!stats.exerciseVolumeHistory || stats.exerciseVolumeHistory.length === 0) && (
              <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                <BarChart3 size={32} className="mb-2 text-gray-700" />
                <p>No exercise progress data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
