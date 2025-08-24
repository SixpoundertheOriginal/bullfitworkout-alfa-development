// src/pages/Overview.tsx

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useParallelOverviewData } from "@/hooks/useParallelOverviewData";
import { Users2, Flame, Activity, Dumbbell, Target, TrendingUp } from "lucide-react";
import { PersonalRecordsCard } from '@/components/personalRecords/PersonalRecordsCard';
import { RestPatternAnalytics } from '@/components/metrics/RestPatternAnalytics';
import { StrengthProgressionCard } from '@/components/metrics/StrengthProgressionCard';
import { TransparentEfficiencyCard } from '@/components/metrics/TransparentEfficiencyCard';
import { LastWorkoutSummary } from '@/components/metrics/LastWorkoutSummary';
import { MuscleGroupBalance } from '@/components/metrics/MuscleGroupBalance';
import { InsightsPanel } from "@/components/ai/InsightsPanel";

// Lazy load heavy chart components for better performance
const WorkoutTypeChart = lazy(() => import("@/components/metrics/WorkoutTypeChart").then(m => ({ default: m.WorkoutTypeChart })));
const MuscleGroupChart = lazy(() => import("@/components/metrics/MuscleGroupChart").then(m => ({ default: m.MuscleGroupChart })));
const TimeOfDayChart = lazy(() => import("@/components/metrics/TimeOfDayChart").then(m => ({ default: m.TimeOfDayChart })));
const WorkoutDaysChart = lazy(() => import("@/components/metrics/WorkoutDaysChart").then(m => ({ default: m.WorkoutDaysChart })));
const TopExercisesTable = lazy(() => import("@/components/workouts/WorkoutsTopExercisesTable").then(m => ({ default: m.TopExercisesTable })));
const WorkoutVolumeOverTimeChart = lazy(() => import('@/components/metrics/WorkoutVolumeOverTimeChart').then(m => ({ default: m.WorkoutVolumeOverTimeChart })));
const WorkoutDensityOverTimeChart = lazy(() => import('@/components/metrics/WorkoutDensityOverTimeChart').then(m => ({ default: m.WorkoutDensityOverTimeChart })));

const Overview: React.FC = () => {
  const { user } = useAuth();
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [userWeightUnit, setUserWeightUnit] = useState<string | null>(null);

  // Use optimized parallel data loading
  const {
    stats,
    workouts,
    insights,
    processedMetrics,
    volumeOverTimeData,
    densityOverTimeData,
    densityStats,
    loading,
    insightsLoading,
    refetch,
    generateWorkoutInsights,
    chartData
  } = useParallelOverviewData();

  // Optimized insight generation with dependency array
  const generateInsightsCallback = useCallback(() => {
    if (workouts.length > 0) {
      generateWorkoutInsights();
    }
  }, [workouts.length, generateWorkoutInsights]);

  useEffect(() => {
    generateInsightsCallback();
  }, [generateInsightsCallback]);

  // Get user bodyweight for strength analytics
  const userBodyweight = useMemo(() => {
    if (userWeight && userWeightUnit) {
      return userWeightUnit === 'lb' ? userWeight * 0.453592 : userWeight;
    }
    return 70; // Default to 70kg
  }, [userWeight, userWeightUnit]);

  // Load user weight prefs
  useEffect(() => {
    const sw = localStorage.getItem('userWeight');
    const su = localStorage.getItem('userWeightUnit');
    if (sw) setUserWeight(Number(sw));
    if (su) setUserWeightUnit(su);
  }, []);

  // Memoized data validation for performance
  const hasData = useCallback((v: any) => 
    v != null && ((Array.isArray(v) && v.length > 0) || (typeof v === 'object' && Object.keys(v).length > 0)), 
    []
  );

  // Memoized chart configurations for performance  
  const chartConfigs = useMemo(() => ([
    {
      title: "Workout Types",
      icon: Target,
      renderComponent: (data: any) => (
        <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
          <WorkoutTypeChart workoutTypes={data} height={250} />
        </Suspense>
      ),
      data: chartData.workoutTypes
    },
    {
      title: "Muscle Focus", 
      icon: Dumbbell,
      renderComponent: (data: any) => (
        <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
          <MuscleGroupChart muscleFocus={data} height={250} />
        </Suspense>
      ),
      data: chartData.muscleFocus
    },
    {
      title: "Workout Days",
      icon: Activity,
      renderComponent: (data: any) => (
        <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
          <WorkoutDaysChart daysFrequency={data} height={250} />
        </Suspense>
      ),
      data: chartData.timePatterns.daysFrequency
    },
    {
      title: "Time of Day",
      icon: TrendingUp,
      renderComponent: (data: any) => (
        <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
          <TimeOfDayChart durationByTimeOfDay={data} height={250} />
        </Suspense>
      ),
      data: chartData.timePatterns.durationByTimeOfDay
    },
    {
      title: "Top Exercises",
      icon: Flame,
      renderComponent: (data: any) => (
        <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
          <TopExercisesTable exercises={data} />
        </Suspense>
      ),
      data: chartData.exerciseVolumeHistory
    }
  ]), [chartData]);

  // Premium card base styles
  const premiumCardStyles = "relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20";
  const gradientBackground = "bg-gradient-to-br from-gray-900/90 via-gray-900/95 to-gray-900/90";
  const glassmorphism = "backdrop-blur-xl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900/98 to-gray-900/95">
      <div className="container mx-auto py-6 px-4 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Workout Overview
          </h1>
        </div>

        {/* AI Insights Panel - Featured prominently at the top */}
        <div className="mb-8">
          <InsightsPanel 
            insights={insights}
            loading={insightsLoading}
            onInsightAction={(insightId, action) => {
              console.log('🎯 Insight action:', { insightId, action });
              // Future: Implement insight action handling (mark helpful, apply suggestion, etc.)
            }}
          />
        </div>

        {/* Recent Session & Strength Progression Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Last Workout Summary */}
          <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="relative z-10">
              <LastWorkoutSummary workouts={workouts} />
            </div>
          </div>

          {/* Strength Progression Analytics */}
          <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-orange-500/5 pointer-events-none" />
            <div className="relative z-10">
              <StrengthProgressionCard workouts={workouts} userBodyweight={userBodyweight} />
            </div>
          </div>
        </div>

        {/* Personal Records & Rest Pattern Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Records Card */}
          <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-yellow-500/5 pointer-events-none" />
            <div className="relative z-10">
              <PersonalRecordsCard />
            </div>
          </div>

          {/* Rest Pattern Analytics */}
          <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative z-10">
              <RestPatternAnalytics workouts={workouts} />
            </div>
          </div>
        </div>

        {/* Transparent Efficiency Metrics - Full Width */}
        {processedMetrics?.processedMetrics && (
          <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-emerald-500/5 pointer-events-none" />
            <div className="relative z-10">
              <TransparentEfficiencyCard metrics={processedMetrics.processedMetrics} />
            </div>
          </div>
        )}

        {/* Volume over time - Premium styled */}
        <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
          {/* Subtle inner highlight overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white/90">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Volume Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] relative z-10">
            {loading ? (
              <Skeleton className="w-full h-full bg-white/10" />
            ) : hasData(volumeOverTimeData) ? (
              <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
                <WorkoutVolumeOverTimeChart data={volumeOverTimeData} height={300} />
              </Suspense>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No volume data available</div>
            )}
          </CardContent>
        </div>

          {/* KPI cards - Premium styled */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {[
            { title: "Total Workouts", value: stats.totalWorkouts || 0, icon: Users2, color: "from-blue-500 to-purple-600" },
            { title: "Efficiency Score", value: processedMetrics?.processedMetrics ? `${Math.round(processedMetrics.processedMetrics.efficiencyMetrics.efficiencyScore)}/100` : 'N/A', icon: TrendingUp, color: "from-emerald-500 to-teal-600" }
          ].map((metric, idx) => (
            <div key={idx} className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism} p-6`}>
              {/* Subtle inner highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`mb-4 rounded-full bg-gradient-to-r ${metric.color} p-3 shadow-lg`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-white/70">
                  {metric.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced analysis grid with muscle balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Muscle Group Balance */}
          <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-green-500/5 pointer-events-none" />
            <div className="relative z-10">
              <MuscleGroupBalance muscleFocus={chartData.muscleFocus} />
            </div>
          </div>

          {/* Existing charts */}
          {chartConfigs.map(({ title, icon: Icon, renderComponent, data }, idx) => (
            <div key={idx} className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
              {/* Subtle inner highlight overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Icon className="h-5 w-5 text-purple-400" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center relative z-10">
                {loading
                  ? <Skeleton className="w-3/4 h-3/4 rounded-lg bg-white/10" />
                  : hasData(data)
                    ? renderComponent(data)
                    : <div className="text-gray-400">No data available</div>
                }
              </CardContent>
            </div>
          ))}
        </div>

        {/* Volume vs Rest Time Correlation - Enhanced chart */}
        <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
          {/* Subtle inner highlight overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Activity className="h-5 w-5 text-purple-400" />
              Workout Density Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] relative z-10">
            {loading ? (
              <Skeleton className="w-full h-full bg-white/10" />
            ) : hasData(densityOverTimeData) ? (
              <Suspense fallback={<Skeleton className="w-full h-full bg-white/10" />}>
                <WorkoutDensityOverTimeChart data={densityOverTimeData} height={250} />
              </Suspense>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No density data available</div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Overview);
