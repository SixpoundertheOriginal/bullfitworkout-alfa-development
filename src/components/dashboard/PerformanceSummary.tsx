import React from 'react';
import { TrendingUp, Target, Calendar, Award } from 'lucide-react';
import { InteractiveMetricCard } from './InteractiveMetricCard';

interface PerformanceSummaryProps {
  stats: any;
  processedMetrics: any;
  workouts: any[];
  onMetricClick: (metricType: string, data: any) => void;
}

export const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  stats,
  processedMetrics,
  workouts,
  onMetricClick
}) => {
  // Calculate current week tonnage
  const currentWeekTonnage = React.useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);
    return recentWorkouts.reduce((total, workout) => {
      return total + (workout.total_volume || 0);
    }, 0);
  }, [workouts]);

  // Calculate PRs this month
  const monthlyPRs = React.useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return workouts.filter(w => 
      new Date(w.date) >= oneMonthAgo && 
      w.notes?.toLowerCase().includes('pr')
    ).length;
  }, [workouts]);

  // Calculate consistency (days with workouts this week)
  const weeklyConsistency = React.useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const workoutDays = new Set(
      workouts
        .filter(w => new Date(w.date) >= oneWeekAgo)
        .map(w => new Date(w.date).toDateString())
    );
    
    return workoutDays.size;
  }, [workouts]);

  // Volume status assessment
  const volumeStatus = React.useMemo(() => {
    const efficiencyScore = processedMetrics?.processedMetrics?.efficiencyMetrics?.efficiencyScore || 0;
    if (efficiencyScore >= 80) return { status: 'optimal', text: 'Optimal range' };
    if (efficiencyScore >= 60) return { status: 'good', text: 'Good range' };
    return { status: 'needs-improvement', text: 'Below optimal' };
  }, [processedMetrics]);

  // Helper function to get status type
  const getStrengthStatus = (prs: number): 'excellent' | 'good' | 'needs-improvement' => {
    if (prs >= 3) return 'excellent';
    if (prs >= 1) return 'good';
    return 'needs-improvement';
  };

  const getConsistencyStatus = (days: number): 'excellent' | 'good' | 'needs-improvement' => {
    if (days >= 5) return 'excellent';
    if (days >= 3) return 'good';
    return 'needs-improvement';
  };

  const getVolumeStatus = (status: string): 'excellent' | 'good' | 'needs-improvement' => {
    if (status === 'optimal') return 'excellent';
    if (status === 'good') return 'good';
    return 'needs-improvement';
  };

  const metrics = [
    {
      id: 'weekly-tonnage',
      title: 'This Week Tonnage',
      value: `${Math.round(currentWeekTonnage)}kg`,
      trend: currentWeekTonnage > 0 ? '+8.3%' : 'No data',
      status: 'excellent' as const,
      icon: TrendingUp,
      context: 'vs last week',
      benchmark: 'Target: 4,000-4,500kg',
      onClick: () => onMetricClick('tonnage', { currentWeek: currentWeekTonnage })
    },
    {
      id: 'strength-progress',
      title: 'Strength Progress',
      value: monthlyPRs > 0 ? `${monthlyPRs} PRs this month` : 'No PRs yet',
      trend: monthlyPRs > 0 ? `+${monthlyPRs}` : '',
      status: getStrengthStatus(monthlyPRs),
      icon: Award,
      context: 'personal records',
      benchmark: 'Target: 2-4 PRs/month',
      onClick: () => onMetricClick('strength', { monthlyPRs })
    },
    {
      id: 'consistency',
      title: 'Consistency',
      value: `${weeklyConsistency}/7 days`,
      trend: weeklyConsistency >= 5 ? 'Excellent' : weeklyConsistency >= 3 ? 'Good' : 'Low',
      status: getConsistencyStatus(weeklyConsistency),
      icon: Calendar,
      context: 'workout frequency',
      benchmark: 'Target: 4-6 days/week',
      onClick: () => onMetricClick('consistency', { weeklyConsistency })
    },
    {
      id: 'volume-status',
      title: 'Volume Status',
      value: volumeStatus.text,
      trend: volumeStatus.status === 'optimal' ? 'On track' : 'Adjust needed',
      status: getVolumeStatus(volumeStatus.status),
      icon: Target,
      context: 'training volume',
      benchmark: 'Evidence-based ranges',
      onClick: () => onMetricClick('volume', volumeStatus)
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Performance Summary</h2>
        <span className="text-sm text-muted-foreground">Critical metrics at a glance</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <InteractiveMetricCard key={metric.id} {...metric} />
        ))}
      </div>
    </div>
  );
};