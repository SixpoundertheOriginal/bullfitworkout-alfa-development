
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
  const totalReps = isLoading ? "..." : stats?.weeklyReps?.toLocaleString() || "0";
  const totalSets = isLoading ? "..." : stats?.weeklySets?.toString() || "0";
  const mostActiveDay = getMostActiveDay();
  const dateRangeText = getDateRangeText();

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.12) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    filter: 'drop-shadow(0 10px 20px rgba(139, 92, 246, 0.15)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(139, 92, 246, 0.1)'
  };

  const innerHighlightStyle = {
    background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
    mixBlendMode: 'overlay' as const
  };

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

      {/* 2x2 Grid for main metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Workouts */}
        <div 
          className="p-4 rounded-xl text-start relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={cardStyle}
        >
          <div 
            className="absolute inset-0 rounded-xl opacity-50"
            style={innerHighlightStyle}
          />
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">📅</span>
              <span className="text-sm text-muted-foreground">Workouts</span>
            </div>
            <div className="text-xl font-semibold">{workoutsCount}</div>
            <div className="text-xs text-muted-foreground opacity-80">{dateRangeText}</div>
          </div>
        </div>

        {/* Total Volume */}
        <div 
          className="p-4 rounded-xl text-start relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={cardStyle}
        >
          <div 
            className="absolute inset-0 rounded-xl opacity-50"
            style={innerHighlightStyle}
          />
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">🏋️</span>
              <span className="text-sm text-muted-foreground">Total Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-semibold">{totalVolume}</div>
              {!isLoading && stats?.weeklyVolume && stats.weeklyVolume > 0 && (
                <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded-md">+12%</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground opacity-80">Weight lifted</div>
          </div>
        </div>

        {/* Total Reps */}
        <div 
          className="p-4 rounded-xl text-start relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={cardStyle}
        >
          <div 
            className="absolute inset-0 rounded-xl opacity-50"
            style={innerHighlightStyle}
          />
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">💪</span>
              <span className="text-sm text-muted-foreground">Total Reps</span>
            </div>
            <div className="text-xl font-semibold">{totalReps}</div>
            <div className="text-xs text-muted-foreground opacity-80">Repetitions</div>
          </div>
        </div>

        {/* Total Sets */}
        <div 
          className="p-4 rounded-xl text-start relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={cardStyle}
        >
          <div 
            className="absolute inset-0 rounded-xl opacity-50"
            style={innerHighlightStyle}
          />
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">📊</span>
              <span className="text-sm text-muted-foreground">Total Sets</span>
            </div>
            <div className="text-xl font-semibold">{totalSets}</div>
            <div className="text-xs text-muted-foreground opacity-80">Sets completed</div>
          </div>
        </div>
      </div>

      {/* Most Active Day - spans full width */}
      <div 
        className="p-4 rounded-xl text-start relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        style={cardStyle}
      >
        <div 
          className="absolute inset-0 rounded-xl opacity-50"
          style={innerHighlightStyle}
        />
        <div className="relative z-10">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">🔥</span>
            <span className="text-sm text-muted-foreground">Most Active Day</span>
          </div>
          <div className="text-xl font-semibold">{mostActiveDay}</div>
          <div className="text-xs text-muted-foreground opacity-80">Peak training day</div>
        </div>
      </div>
    </div>
  );
});

WeeklySummaryStats.displayName = 'WeeklySummaryStats';
