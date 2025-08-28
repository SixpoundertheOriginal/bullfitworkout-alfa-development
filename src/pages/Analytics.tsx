import React from 'react';
import { Navigate } from 'react-router-dom';
import { FEATURE_FLAGS } from '@/config/flags';
import { Card } from '@/components/ui/card';
import { Activity, Dumbbell, Timer, Users } from 'lucide-react';
import { DateRangeFilter } from '@/components/date-filters/DateRangeFilter';
import { useDateRange } from '@/context/DateRangeContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
// Use the service wrapper that falls back to mock Supabase data
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsData } from '@/types/analytics';
import { useAuth } from '@/context/AuthContext';

const Analytics: React.FC = () => {
  const { dateRange } = useDateRange();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['metrics-v2', user?.id, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: () =>
      metricsServiceV2.getMetricsV2({
        dateRange: {
          start: dateRange.from!.toISOString(),
          end: dateRange.to!.toISOString(),
        },
        userId: user!.id,
      }),
    enabled: !!user?.id && !!dateRange.from && !!dateRange.to,
    select: (raw): AnalyticsData => ({
      totals: {
        totalVolumeKg: raw.totals.totalVolumeKg || 0,
        totalSets: raw.totals.totalSets || 0,
        totalReps: raw.totals.totalReps || 0,
        workouts: raw.totals.workouts || 0,
        durationMin: raw.totals.durationMin || 0,
      },
      series: {
        volume: (raw.series?.volume || []).map((p: any) => ({
          date: (p.date ?? p.x) as string,
          value: (p.value ?? p.y) as number,
        })),
      },
    }),
  });

  if (!FEATURE_FLAGS.KPI_ANALYTICS_ENABLED) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout Analytics</h1>
          <p className="text-gray-400">Track and analyze your workout performance</p>
        </div>
        <DateRangeFilter />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : isError ? (
        <Card className="bg-red-900/20 border-red-900/40 p-6">
          <div className="text-red-300 font-medium mb-2">Failed to load analytics</div>
          <div className="text-red-400 text-sm mb-4">{(error as any)?.message || 'Unknown error'}</div>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded-md bg-red-500/20 text-red-200 hover:bg-red-500/30"
          >
            Retry
          </button>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Dumbbell className="w-4 h-4 mr-2 text-purple-400" />
                Total Volume
              </div>
              <div className="text-2xl font-bold text-white">
                {data.totals.totalVolumeKg.toLocaleString()} kg
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Activity className="w-4 h-4 mr-2 text-purple-400" />
                Total Sets
              </div>
              <div className="text-2xl font-bold text-white">
                {data.totals.totalSets.toLocaleString()}
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Users className="w-4 h-4 mr-2 text-purple-400" />
                Workouts
              </div>
              <div className="text-2xl font-bold text-white">
                {data.totals.workouts.toLocaleString()}
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Timer className="w-4 h-4 mr-2 text-purple-400" />
                Total Duration
              </div>
              <div className="text-2xl font-bold text-white">
                {data.totals.durationMin.toLocaleString()} min
              </div>
            </Card>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Volume Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.series.volume}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickFormatter={(value) => `${value}kg`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '0.375rem'
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default Analytics;
