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
        <div className="text-xl font-semibold">{totalVolume}</div>
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
  );
});

WeeklySummaryStats.displayName = 'WeeklySummaryStats';