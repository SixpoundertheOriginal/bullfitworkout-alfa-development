
import React from 'react';
import { useBasicWorkoutStats } from "@/hooks/useBasicWorkoutStats";
import { useDateRange } from '@/context/DateRangeContext';
import { format, differenceInCalendarDays, subDays } from "date-fns";

export const WeeklySummaryStats = React.memo(() => {
  const { dateRange } = useDateRange();
  const { data: stats, isLoading } = useBasicWorkoutStats(dateRange);

  // Compute previous equal-length range for deltas
  const prevRange = React.useMemo(() => {
    if (!dateRange?.from) return undefined;
    const from = dateRange.from;
    const to = dateRange.to || new Date();
    const days = Math.max(1, differenceInCalendarDays(to, from) + 1);
    const prevTo = subDays(from, 1);
    const prevFrom = subDays(from, days);
    return { from: prevFrom, to: prevTo };
  }, [dateRange]);
  const { data: prevStats } = useBasicWorkoutStats(prevRange);

  const computeDelta = (current?: number, previous?: number): number | null => {
    if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    if (!isFinite(pct)) return null;
    return pct;
  };

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

  const DeltaBadge: React.FC<{ value: number | null }> = ({ value }) => {
    if (value === null) return null;
    const up = value > 0; const down = value < 0;
    const cls = up ? "text-green-400 bg-green-400/10" : down ? "text-red-400 bg-red-400/10" : "text-gray-400 bg-gray-400/10";
    const sign = up ? "+" : down ? "−" : "";
    const rounded = Math.round(Math.abs(value));
    return <span className={`text-xs font-medium ${cls} px-2 py-0.5 rounded-md`}>{sign}{rounded}%</span>;
  };

  const deltaWorkouts = computeDelta(stats?.weeklyWorkouts, prevStats?.weeklyWorkouts);
  const deltaVolume = computeDelta(stats?.weeklyVolume, prevStats?.weeklyVolume);
  const deltaReps = computeDelta(stats?.weeklyReps, prevStats?.weeklyReps);
  const deltaSets = computeDelta(stats?.weeklySets, prevStats?.weeklySets);

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
            <div className="flex items-center gap-2">
              <div className="text-xl font-semibold">{workoutsCount}</div>
              {!isLoading && <DeltaBadge value={deltaWorkouts} />}
            </div>
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
                {!isLoading && <DeltaBadge value={deltaVolume} />}
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
              <div className="flex items-center gap-2">
                <div className="text-xl font-semibold">{totalReps}</div>
                {!isLoading && <DeltaBadge value={deltaReps} />}
              </div>
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
              <div className="flex items-center gap-2">
                <div className="text-xl font-semibold">{totalSets}</div>
                {!isLoading && <DeltaBadge value={deltaSets} />}
              </div>
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
