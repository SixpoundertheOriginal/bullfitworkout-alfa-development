import React from 'react';
import { useBasicWorkoutStats } from "@/hooks/useBasicWorkoutStats";
import { useDateRange } from '@/context/DateRangeContext';
import { format } from "date-fns";

export const WeeklySummaryStats = React.memo(() => {
  const { dateRange } = useDateRange();
  const { data: stats, isLoading } = useBasicWorkoutStats(dateRange);

  // Calculate date range text
  const getDateRangeText = () => {
    if (!dateRange || !dateRange.from) {
      return "All time";
    }
    
    const from = dateRange.from;
    const to = dateRange.to || new Date();
    
    return `${format(from, "MMM d")} - ${format(to, "MMM d")}`;
  };

  // Get the most active day of the week
  const getMostActiveDay = () => {
    if (!stats?.dailyWorkouts) return "None";
    
    let maxCount = 0;
    let mostActiveDay = '';
    
    Object.entries(stats.dailyWorkouts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });
    
    return mostActiveDay ? `${mostActiveDay.charAt(0).toUpperCase() + mostActiveDay.slice(1)} (${maxCount})` : "None";
  };

  const workoutsCount = isLoading ? "..." : stats?.weeklyWorkouts?.toString() || "0";
  const totalVolume = isLoading ? "..." : `${Math.round(stats?.weeklyVolume || 0).toLocaleString()} kg`;
  const mostActiveDay = getMostActiveDay();
  const dateRangeText = getDateRangeText();

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pt-4">
        <h3 className="text-lg font-semibold">📊 Your Week</h3>
        {stats?.streakDays && stats.streakDays > 0 && (
          <div className="rounded-xl bg-muted/40 px-2 py-1 text-xs">
            🔥 {stats.streakDays}-Day Streak
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Workouts */}
        <div className="bg-muted/30 p-3 rounded-xl text-start">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">📅</span>
            <span className="text-sm text-muted-foreground">Workouts</span>
          </div>
          <div className="text-xl font-semibold">{workoutsCount}</div>
          <div className="text-xs text-muted-foreground">{dateRangeText}</div>
        </div>

        {/* Total Volume */}
        <div className="bg-muted/30 p-3 rounded-xl text-start">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">🏋️</span>
            <span className="text-sm text-muted-foreground">Total Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold">{totalVolume}</div>
            {!isLoading && stats?.weeklyVolume && stats.weeklyVolume > 0 && (
              <span className="text-xs text-green-600 font-medium">+12%</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">Weight lifted</div>
        </div>

        {/* Most Active Day - spans both columns */}
        <div className="col-span-2 bg-muted/30 p-3 rounded-xl text-start">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">🔥</span>
            <span className="text-sm text-muted-foreground">Most Active Day</span>
          </div>
          <div className="text-xl font-semibold">{mostActiveDay}</div>
          <div className="text-xs text-muted-foreground">Peak training day</div>
        </div>
      </div>
    </div>
  );
});

WeeklySummaryStats.displayName = 'WeeklySummaryStats';