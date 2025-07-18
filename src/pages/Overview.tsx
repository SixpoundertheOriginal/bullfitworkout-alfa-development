// src/pages/Overview.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutStats } from "@/hooks/useWorkoutStats";
import { Users2, Flame, Activity, Dumbbell, Target, TrendingUp } from "lucide-react";
import { WorkoutTypeChart } from "@/components/metrics/WorkoutTypeChart";
import { MuscleGroupChart } from "@/components/metrics/MuscleGroupChart";
import { TimeOfDayChart } from "@/components/metrics/TimeOfDayChart";
import { WorkoutDaysChart } from "@/components/metrics/WorkoutDaysChart";
import { TopExercisesTable } from "@/components/metrics/TopExercisesTable";
import { WorkoutVolumeOverTimeChart } from '@/components/metrics/WorkoutVolumeOverTimeChart';
import { WorkoutDensityOverTimeChart } from '@/components/metrics/WorkoutDensityOverTimeChart';
import { useWeightUnit } from "@/context/WeightUnitContext";
import { useDateRange } from '@/context/DateRangeContext';
import { useProcessWorkoutMetrics } from '@/hooks/useProcessWorkoutMetrics';

const Overview: React.FC = () => {
  const { user } = useAuth();
  const { weightUnit } = useWeightUnit();
  const { dateRange } = useDateRange();
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [userWeightUnit, setUserWeightUnit] = useState<string | null>(null);

  // Fetch historical stats
  const { stats, loading, refetch, workouts } = useWorkoutStats();
  
  // Process raw metrics
  const {
    volumeOverTimeData,
    densityOverTimeData,
    volumeStats,
    densityStats
  } = useProcessWorkoutMetrics(workouts, weightUnit);

  // Refetch on date range change
  useEffect(() => {
    if (dateRange) refetch();
  }, [dateRange, refetch]);

  // Load user weight prefs
  useEffect(() => {
    const sw = localStorage.getItem('userWeight');
    const su = localStorage.getItem('userWeightUnit');
    if (sw) setUserWeight(Number(sw));
    if (su) setUserWeightUnit(su);
  }, []);

  // Simple data‐exists guard
  const hasData = (v: any) => v != null && ((Array.isArray(v) && v.length > 0) || (typeof v === 'object' && Object.keys(v).length > 0));

  // Chart configurations (excluding density gauge)
  const chartConfigs = useMemo(() => ([
    {
      title: "Workout Types",
      icon: Target,
      renderComponent: (data: any) => <WorkoutTypeChart workoutTypes={data} height={250} />,
      data: stats.workoutTypes || []
    },
    {
      title: "Muscle Focus",
      icon: Dumbbell,
      renderComponent: (data: any) => <MuscleGroupChart muscleFocus={data} height={250} />,
      data: stats.muscleFocus || {}
    },
    {
      title: "Workout Days",
      icon: Activity,
      renderComponent: (data: any) => <WorkoutDaysChart daysFrequency={data} height={250} />,
      data: stats.timePatterns?.daysFrequency || {}
    },
    {
      title: "Time of Day",
      icon: TrendingUp,
      renderComponent: (data: any) => <TimeOfDayChart durationByTimeOfDay={data} height={250} />,
      data: stats.timePatterns?.durationByTimeOfDay || {}
    },
    {
      title: "Top Exercises",
      icon: Flame,
      renderComponent: (data: any) => <TopExercisesTable exerciseVolumeHistory={data} />,
      data: stats.exerciseVolumeHistory || []
    }
  ]), [stats, weightUnit]);

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
            {loading
              ? <Skeleton className="w-full h-full bg-white/10" />
              : hasData(volumeOverTimeData)
                ? <WorkoutVolumeOverTimeChart data={volumeOverTimeData} height={300} />
                : <div className="flex items-center justify-center h-full text-gray-400">No volume data available</div>
            }
          </CardContent>
        </div>

        {/* KPI cards - Premium styled */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: "Total Workouts", value: stats.totalWorkouts || 0, icon: Users2, color: "from-blue-500 to-purple-600" },
            { title: "Total Volume", value: `${Math.round(volumeStats.total).toLocaleString()} ${weightUnit}`, icon: Dumbbell, color: "from-purple-500 to-pink-600" },
            { title: "Avg Volume Rate", value: `${densityStats.avgOverallDensity.toFixed(1)} ${weightUnit}/min`, icon: Activity, color: "from-pink-500 to-orange-600" }
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

        {/* Other charts grid - Premium styled */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Density over time - Premium styled */}
        <div className={`${premiumCardStyles} ${gradientBackground} ${glassmorphism}`}>
          {/* Subtle inner highlight overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Activity className="h-5 w-5 text-purple-400" />
              Volume Rate Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] relative z-10">
            {loading
              ? <Skeleton className="w-full h-full bg-white/10" />
              : hasData(densityOverTimeData)
                ? <WorkoutDensityOverTimeChart data={densityOverTimeData} height={250} />
                : <div className="flex items-center justify-center h-full text-gray-400">No density data available</div>
            }
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Overview);
