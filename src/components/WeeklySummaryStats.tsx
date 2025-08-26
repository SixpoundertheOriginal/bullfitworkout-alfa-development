
import React, { useEffect, useRef, useState } from 'react';
import { useBasicWorkoutStats } from "@/hooks/useBasicWorkoutStats";
import { useDateRange } from '@/context/DateRangeContext';
import { format, differenceInCalendarDays, subDays, getDay, startOfWeek } from "date-fns";
import { Calendar, Repeat, Layers, Clock } from "lucide-react";
import MotivationCard from "./MotivationCard";
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { OpenAIService } from '@/services/openAIService';

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

// Import enhanced component
import { MetricCard } from './ui/enhanced/MetricCard';

// Import enhanced progress card
import { ProgressCard } from './ui/enhanced/ProgressCard';

// Streak badge component
const StreakBadge: React.FC<{ days: number }> = ({ days }) => {
  if (days < 2) return null;
  
  return (
    <div className="bg-orange-500/20 rounded-lg px-3 py-1.5 border border-orange-500/30">
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
  const { user } = useAuth();

  const periodType = 'week';
  const periodStart = dateRange?.from || startOfWeek(new Date(), { weekStartsOn: 1 });
  const period = format(periodStart, "yyyy-'W'II");
  const locale = (user?.user_metadata as any)?.locale || navigator.language || 'en-US';

  const motivationRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    if (motivationRef.current) {
      observer.observe(motivationRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const openAI = OpenAIService.getInstance();
  const { data: motivationText, refetch: refetchMotivation, isFetching: loadingMotivation } = useQuery({
    queryKey: ['motivation', user?.id, period, locale],
    queryFn: () => openAI.generateMotivationForPeriod({
      tonnage: stats?.weeklyVolume || 0,
      sets: stats?.weeklySets || 0,
      reps: stats?.weeklyReps || 0,
      deltaPct: stats?.volumeDeltaPct || 0,
      period,
      periodType,
      locale,
    }),
    enabled: isVisible && !!stats,
    staleTime: Infinity,
  });

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

  const motivation = (
    <div ref={motivationRef} className="mt-3 sm:mt-4">
      <MotivationCard
        tonnage={weekStats.volume.current || 0}
        deltaPct={stats?.volumeDeltaPct || 0}
        coachCopy={motivationText || 'Keep it up!'}
        loading={isLoading}
        loadingCoach={loadingMotivation}
        onRefresh={refetchMotivation}
        locale={locale}
      />
    </div>
  );

  return (
    <div className="mt-4">
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
        {stats?.streakDays && (
          <div className="mt-4">
            <StreakBadge days={stats.streakDays} />
          </div>
        )}

        {motivation}

        {/* Week Progress Bar */}
        <div className="mt-3">
          <ProgressCard 
            title="Week Progress"
            subtitle={`Day ${currentDayOfWeek} of 7`}
            currentDay={currentDayOfWeek}
            encouragementMessage="Building momentum for the week 💪"
          />
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
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

          <MetricCard
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

          <MetricCard
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
        <div className="mt-4">
          <MetricCard
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
        </div>

        {/* Most Active Day - Enhanced */}
        <div className="mt-4 relative p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">🔥</span>
            <span className="text-sm text-muted-foreground">Most Active Day</span>
          </div>
          <div className="text-xl font-semibold text-white">{mostActiveDay}</div>
          <div className="text-xs text-white/60">Peak training day</div>
        </div>

        {/* Motivational message for Tuesday */}
        {currentDayOfWeek === 2 && weekStats.workouts.current > 0 && (
          <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
            <p className="text-xs text-purple-300 text-center">
              Tuesday momentum achieved! Keep this energy going 🚀
            </p>
          </div>
        )}

        {/* Quick Stats Section - Enhanced */}
        <div className="mt-4 relative p-3 rounded-xl bg-gradient-to-br from-purple-600/12 to-pink-500/12 backdrop-blur-[12px] border border-white/15 overflow-hidden hover:scale-[1.02] transition-all duration-200">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent mix-blend-overlay pointer-events-none" />
          <div className="relative z-10 flex justify-around">
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
      </div>
  );
});

WeeklySummaryStats.displayName = 'WeeklySummaryStats';
