// src/components/metrics/TimeOfDayChart.tsx

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface TimeOfDay {
  morning?: number;
  afternoon?: number;
  evening?: number;
  night?: number;
}

interface TimeOfDayChartProps {
  durationByTimeOfDay?: TimeOfDay;
  height?: number;
}

const TimeOfDayChartComponent: React.FC<TimeOfDayChartProps> = ({
  durationByTimeOfDay = {},
  height = 250
}) => {
  // Safe defaults for each time bucket
  const safeDuration = useMemo(() => ({
    morning: durationByTimeOfDay.morning || 0,
    afternoon: durationByTimeOfDay.afternoon || 0,
    evening: durationByTimeOfDay.evening || 0,
    night: durationByTimeOfDay.night || 0
  }), [durationByTimeOfDay]);

  // Prepare chart data
  const chartData = useMemo(() => [
    { name: 'Morning', value: safeDuration.morning, color: '#84cc16' },
    { name: 'Afternoon', value: safeDuration.afternoon, color: '#f59e0b' },
    { name: 'Evening', value: safeDuration.evening, color: '#8b5cf6' },
    { name: 'Night', value: safeDuration.night, color: '#0ea5e9' }
  ], [safeDuration]);

  // Check for any non-zero values
  const hasData = useMemo(() => chartData.some(d => d.value > 0), [chartData]);

  // Fallback when no data
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No time-of-day data available
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: '#f9fafb', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            tick={{ fill: '#f9fafb', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={(value: number) => `${Math.round(value)}m`}
          />
          <Tooltip
            formatter={(value: number) => [`${Math.round(value)} minutes`, 'Duration']}
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#f9fafb'
            }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TimeOfDayChart = React.memo(TimeOfDayChartComponent);
