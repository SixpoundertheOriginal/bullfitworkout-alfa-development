
import React from 'react';
import { Calendar, BarChart3, Target } from 'lucide-react';
import { MetricCard } from "@/components/metrics/MetricCard";
import { useBasicWorkoutStats } from "@/hooks/useBasicWorkoutStats";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDateRange } from '@/context/DateRangeContext';

interface QuickStatsSectionProps {
  showDateRange?: boolean;
}

export const QuickStatsSection = React.memo(({ showDateRange = false }: QuickStatsSectionProps) => {
  // Get date range from context instead of managing our own
  const { dateRange } = useDateRange();
  
  // Use the basic stats hook with the date range from context
  const { data: stats, isLoading } = useBasicWorkoutStats(dateRange);

  // Calculate date range text based on dateRange from context
  const getDateRangeText = () => {
    if (!dateRange || !dateRange.from) {
      return "All time";
    }
    
    const from = dateRange.from;
    const to = dateRange.to || new Date();
    
    return `${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`;
  };

  // Get the most active day of the week
  const getMostActiveDay = () => {
    if (!stats?.dailyWorkouts) return null;
    
    let maxCount = 0;
    let mostActiveDay = '';
    
    Object.entries(stats.dailyWorkouts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });
    
    return mostActiveDay ? `${mostActiveDay.charAt(0).toUpperCase() + mostActiveDay.slice(1)} (${maxCount})` : null;
  };

  const mostActiveDay = getMostActiveDay();
  const dateRangeText = getDateRangeText();

  return (
    <div className="relative">
      {/* Background glow effects */}
      <div className="absolute -top-10 -left-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute -top-10 -right-20 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl" />
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Quick Stats</h3>
      </div>
      
      {/* Use glass/card-gradient for light/dark */}
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 p-1",
        "relative z-10",
        "card-gradient"
      )}>
        <MetricCard
          icon={Calendar}
          value={isLoading ? "..." : stats?.weeklyWorkouts?.toString() || "0"}
          label={!dateRange ? 'Total Workouts' : 'Workouts'}
          description={dateRangeText}
          tooltip={`Workouts completed in the selected time period`}
          gradientClass="from-violet-600/20 via-black/5 to-violet-900/20 hover:from-violet-600/30 hover:to-violet-900/30"
          valueClass="text-violet-300 font-semibold bg-gradient-to-br from-violet-200 to-violet-400 bg-clip-text text-transparent"
        />
        
        <MetricCard
          icon={BarChart3}
          value={isLoading ? "..." : mostActiveDay || "None"}
          label="Most Active Day"
          tooltip="Day with the most workouts in this period"
          gradientClass="from-blue-600/20 via-black/5 to-blue-900/20 hover:from-blue-600/30 hover:to-blue-900/30"
          valueClass="text-blue-300 font-semibold bg-gradient-to-br from-blue-200 to-blue-400 bg-clip-text text-transparent"
        />
        
        <MetricCard
          icon={Target}
          value={isLoading ? "..." : `${Math.round(stats?.weeklyVolume || 0).toLocaleString()}`}
          label={!dateRange ? 'Total Volume' : 'Period Volume'}
          tooltip="Total weight lifted (reps × weight) in this period"
          progressValue={stats?.weeklyVolume ? Math.min(100, stats.weeklyVolume / 1000) : 0}
          gradientClass="from-emerald-600/20 via-black/5 to-emerald-900/20 hover:from-emerald-600/30 hover:to-emerald-900/30"
          valueClass="text-emerald-300 font-semibold bg-gradient-to-br from-emerald-200 to-emerald-400 bg-clip-text text-transparent"
        />
      </div>
    </div>
  );
});

QuickStatsSection.displayName = 'QuickStatsSection';
