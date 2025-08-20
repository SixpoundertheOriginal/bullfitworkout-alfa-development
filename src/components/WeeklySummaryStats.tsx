
import React from 'react';
import { useBasicWorkoutStats } from "@/hooks/useBasicWorkoutStats";
import { useDateRange } from '@/context/DateRangeContext';
import { format, differenceInCalendarDays, subDays, getDay } from "date-fns";
import { Calendar, Dumbbell, Repeat, Layers, Clock } from "lucide-react";

// Smart comparison utility
function getSmartComparison(
  metric: string,
  currentValue: number,
  currentDayOfWeek: number, // 1 = Monday, 7 = Sunday
  lastWeekTotal: number,
  lastWeekByDay: number[], // Array of daily cumulative values from last week
): {
  percentage: number;
  label: string;
  color: string;
  message?: string;
} {
  // For early week (Mon-Wed), compare to same day last week
  if (currentDayOfWeek <= 3) {
    const lastWeekSameDay = lastWeekByDay[currentDayOfWeek - 1] || 0;
    const percentage = lastWeekSameDay > 0 
      ? Math.round(((currentValue - lastWeekSameDay) / lastWeekSameDay) * 100)
      : 0;
    
    return {
      percentage,
      label: percentage >= 0 ? `+${percentage}%` : `${percentage}%`,
      color: percentage >= 0 ? 'text-green-400' : 'text-zinc-500',
      message: `vs last ${getDayName(currentDayOfWeek)}`
    };
  }
  
  // For mid-week (Thu), show progress pace
  if (currentDayOfWeek === 4) {
    const projectedTotal = (currentValue / currentDayOfWeek) * 7;
    const percentage = lastWeekTotal > 0 ? Math.round(((projectedTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;
    
    return {
      percentage,
      label: `On pace: ${percentage >= 0 ? '+' : ''}${percentage}%`,
      color: percentage >= 0 ? 'text-blue-400' : 'text-zinc-500',
      message: 'projected vs last week'
    };
  }
  
  // For late week (Fri-Sun), show actual comparison
  const percentage = lastWeekTotal > 0 ? Math.round(((currentValue - lastWeekTotal) / lastWeekTotal) * 100) : 0;
  return {
    percentage,
    label: percentage >= 0 ? `+${percentage}%` : `${percentage}%`,
    color: percentage >= 0 ? 'text-green-400' : 'text-orange-400',
    message: 'vs last week total'
  };
}

function getDayName(day: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[day - 1];
}

// Enhanced stat card component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  unit?: string;
  comparison: {
    percentage: number;
    label: string;
    color: string;
    message?: string;
  };
  encouragement?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  unit, 
  comparison,
  encouragement,
  isLoading 
}) => {
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
    <div 
      className="p-4 rounded-xl text-start relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      style={cardStyle}
    >
      {/* Progress indicator for early week */}
      {comparison.message?.includes('vs last') && comparison.percentage > 0 && (
        <div className="absolute top-0 right-0 px-2 py-1 bg-green-500/10 rounded-bl-lg">
          <span className="text-xs text-green-400">On track! 🎯</span>
        </div>
      )}
      
      <div 
        className="absolute inset-0 rounded-xl opacity-50"
        style={innerHighlightStyle}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-800/50 rounded-lg mr-2">
              {icon}
            </div>
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          {!isLoading && (
            <div className={`text-sm font-medium ${comparison.color}`}>
              {comparison.label}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-2xl font-bold text-white">
            {isLoading ? "..." : value}
            {unit && <span className="text-sm text-zinc-400 ml-1">{unit}</span>}
          </p>
          
          {/* Contextual message */}
          {comparison.message && !isLoading && (
            <p className="text-xs text-zinc-500">{comparison.message}</p>
          )}
          
          {/* Encouragement for specific situations */}
          {encouragement && !isLoading && (
            <p className="text-xs text-purple-400 mt-2">{encouragement}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Week progress bar component
const WeekProgressBar: React.FC<{ currentDay: number }> = ({ currentDay }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const progressPercentage = (currentDay / 7) * 100;
  
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.12) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    filter: 'drop-shadow(0 10px 20px rgba(139, 92, 246, 0.15)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(139, 92, 246, 0.1)'
  };

  return (
    <div className="p-4 rounded-xl mb-4" style={cardStyle}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Week Progress</h3>
        <span className="text-xs text-purple-400">
          Day {currentDay} of 7
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div 
          className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Day indicators */}
      <div className="flex justify-between">
        {days.map((day, index) => (
          <div
            key={index}
            className={`text-xs font-medium ${
              index < currentDay 
                ? 'text-purple-400' 
                : index === currentDay - 1
                ? 'text-white'
                : 'text-zinc-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {currentDay <= 3 && (
        <p className="text-xs text-zinc-500 mt-3 text-center">
          Building momentum for the week 💪
        </p>
      )}
    </div>
  );
};

// Streak badge component
const StreakBadge: React.FC<{ days: number }> = ({ days }) => {
  if (days < 2) return null;
  
  return (
    <div className="bg-orange-500/20 rounded-lg px-3 py-1.5 border border-orange-500/30 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-orange-400">
          🔥 {days} day streak
        </span>
        <span className="text-xs text-orange-300">
          Keep it going!
        </span>
      </div>
    </div>
  );
};

export const WeeklySummaryStats = React.memo(() => {
  const { dateRange } = useDateRange();
  const { data: stats, isLoading } = useBasicWorkoutStats(dateRange);

  // Get current day of week (1 = Monday, 7 = Sunday)
  const currentDate = new Date();
  const currentDayOfWeek = getDay(currentDate) === 0 ? 7 : getDay(currentDate); // Convert Sunday from 0 to 7

  // Mock data for demonstration - in real implementation, this would come from your database
  const weekStats = {
    workouts: { 
      current: stats?.weeklyWorkouts || 0, 
      lastWeekTotal: 5, 
      lastWeekByDay: [1, 2, 2, 3, 4, 4, 5] 
    },
    volume: { 
      current: stats?.weeklyVolume || 0, 
      lastWeekTotal: 26400, 
      lastWeekByDay: [5500, 12100, 12100, 18700, 23100, 23100, 26400] 
    },
    reps: { 
      current: stats?.weeklyReps || 0, 
      lastWeekTotal: 543, 
      lastWeekByDay: [108, 216, 216, 324, 432, 432, 543] 
    },
    sets: { 
      current: stats?.weeklySets || 0, 
      lastWeekTotal: 42, 
      lastWeekByDay: [8, 16, 16, 24, 32, 32, 42] 
    },
    time: { 
      current: stats?.weeklyDuration || 0, 
      lastWeekTotal: 185, 
      lastWeekByDay: [30, 65, 65, 95, 130, 130, 185] 
    }
  };

  // Get encouragement messages based on performance
  const getEncouragement = (metric: string, comparison: any) => {
    if (currentDayOfWeek <= 2 && comparison.percentage > 0) {
      return "Great start! 🔥";
    }
    if (metric === 'workouts' && weekStats.workouts.current > 0) {
      const remaining = 5 - weekStats.workouts.current;
      return remaining > 0 ? `${remaining} workouts left this week` : "Weekly goal achieved! 🏆";
    }
    if (metric === 'time' && weekStats.time.current < 30 && weekStats.time.current > 0) {
      return "Quick and efficient! ⚡";
    }
    return undefined;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

  const mostActiveDay = getMostActiveDay();

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          📊 Your Week
          {currentDayOfWeek <= 3 && weekStats.workouts.current > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
              Building
            </span>
          )}
        </h2>
        {stats?.streakDays && stats.streakDays > 0 && (
          <div className="rounded-xl bg-muted/40 px-2 py-1 text-xs">
            🔥 {stats.streakDays}-Day Streak
          </div>
        )}
      </div>

      {/* Streak Badge */}
      {stats?.streakDays && <StreakBadge days={stats.streakDays} />}

      {/* Week Progress Bar */}
      <WeekProgressBar currentDay={currentDayOfWeek} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Calendar className="w-4 h-4 text-purple-400" />}
          title="Workouts"
          value={weekStats.workouts.current}
          comparison={getSmartComparison(
            'workouts',
            weekStats.workouts.current,
            currentDayOfWeek,
            weekStats.workouts.lastWeekTotal,
            weekStats.workouts.lastWeekByDay
          )}
          encouragement={getEncouragement('workouts', {})}
          isLoading={isLoading}
        />
        
        <StatCard
          icon={<Dumbbell className="w-4 h-4 text-blue-400" />}
          title="Total Volume"
          value={`${(weekStats.volume.current / 1000).toFixed(1)}`}
          unit="kg"
          comparison={getSmartComparison(
            'volume',
            weekStats.volume.current,
            currentDayOfWeek,
            weekStats.volume.lastWeekTotal,
            weekStats.volume.lastWeekByDay
          )}
          isLoading={isLoading}
        />
        
        <StatCard
          icon={<Repeat className="w-4 h-4 text-orange-400" />}
          title="Total Reps"
          value={weekStats.reps.current}
          comparison={getSmartComparison(
            'reps',
            weekStats.reps.current,
            currentDayOfWeek,
            weekStats.reps.lastWeekTotal,
            weekStats.reps.lastWeekByDay
          )}
          isLoading={isLoading}
        />
        
        <StatCard
          icon={<Layers className="w-4 h-4 text-green-400" />}
          title="Total Sets"
          value={weekStats.sets.current}
          comparison={getSmartComparison(
            'sets',
            weekStats.sets.current,
            currentDayOfWeek,
            weekStats.sets.lastWeekTotal,
            weekStats.sets.lastWeekByDay
          )}
          isLoading={isLoading}
        />
      </div>

      {/* Total Time - Full Width */}
      <StatCard
        icon={<Clock className="w-4 h-4 text-zinc-400" />}
        title="Total Time"
        value={formatDuration(weekStats.time.current)}
        comparison={getSmartComparison(
          'time',
          weekStats.time.current,
          currentDayOfWeek,
          weekStats.time.lastWeekTotal,
          weekStats.time.lastWeekByDay
        )}
        encouragement={getEncouragement('time', {})}
        isLoading={isLoading}
      />

      {/* Most Active Day */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
        <div className="flex items-center mb-2">
          <span className="text-lg mr-2">🔥</span>
          <span className="text-sm text-muted-foreground">Most Active Day</span>
        </div>
        <div className="text-xl font-semibold">{mostActiveDay}</div>
        <div className="text-xs text-muted-foreground opacity-80">Peak training day</div>
      </div>

      {/* Motivational message for Tuesday */}
      {currentDayOfWeek === 2 && weekStats.workouts.current > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
          <p className="text-xs text-purple-300 text-center">
            Tuesday momentum achieved! Keep this energy going 🚀
          </p>
        </div>
      )}

      {/* Quick Stats Section */}
      <div className="mt-4 flex justify-around py-3 bg-zinc-900/30 rounded-xl">
        <div className="text-center">
          <p className="text-xs text-zinc-500">This Week</p>
          <p className="text-sm font-bold text-white">{weekStats.workouts.current}/5</p>
          <p className="text-xs text-zinc-600">workouts</p>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="text-center">
          <p className="text-xs text-zinc-500">Weekly Goal</p>
          <p className="text-sm font-bold text-green-400">
            {weekStats.workouts.current >= 3 ? "On Track" : "Building"}
          </p>
          <p className="text-xs text-zinc-600">
            {Math.round((weekStats.workouts.current / 5) * 100)}% done
          </p>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="text-center">
          <p className="text-xs text-zinc-500">Best Day</p>
          <p className="text-sm font-bold text-purple-400">
            {mostActiveDay.split(' ')[0] || "None"}
          </p>
          <p className="text-xs text-zinc-600">historically</p>
        </div>
      </div>
    </div>
  );
});

WeeklySummaryStats.displayName = 'WeeklySummaryStats';
