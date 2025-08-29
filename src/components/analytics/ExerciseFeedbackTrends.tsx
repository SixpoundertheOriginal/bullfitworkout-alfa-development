import React from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useDateRange } from '@/context/DateRangeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface FeedbackRow {
  perceived_difficulty: number;
  satisfaction: number;
  workout_sessions: { start_time: string };
}

export const ExerciseFeedbackTrends: React.FC = () => {
  const { user } = useAuth();
  const { dateRange } = useDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['exercise-feedback-trends', user?.id, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    enabled: !!user?.id && !!dateRange.from && !!dateRange.to,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('exercise_feedback')
        .select('perceived_difficulty, satisfaction, workout_sessions!inner(start_time, user_id)')
        .eq('workout_sessions.user_id', user!.id)
        .gte('workout_sessions.start_time', dateRange.from!.toISOString())
        .lte('workout_sessions.start_time', dateRange.to!.toISOString());
      if (error) throw error;
      const aggregate: Record<string, { d: number; s: number; c: number }> = {};
      (data as FeedbackRow[]).forEach(row => {
        const date = row.workout_sessions.start_time.split('T')[0];
        if (!aggregate[date]) aggregate[date] = { d: 0, s: 0, c: 0 };
        aggregate[date].d += row.perceived_difficulty;
        aggregate[date].s += row.satisfaction;
        aggregate[date].c += 1;
      });
      return Object.entries(aggregate)
        .map(([date, v]) => ({
          date,
          difficulty: v.d / v.c,
          satisfaction: v.s / v.c,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Exercise Feedback Trends</h3>
        <div className="text-sm text-gray-400">Loading...</div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Exercise Feedback Trends</h3>
        <p className="text-sm text-gray-400">No feedback data available.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 p-6">
      <h3 className="text-lg font-medium text-white mb-4">Exercise Feedback Trends</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis domain={[0, 10]} stroke="#6b7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="difficulty" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="satisfaction" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ExerciseFeedbackTrends;
