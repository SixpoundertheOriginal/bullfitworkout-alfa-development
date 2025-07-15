
// src/components/metrics/WorkoutDaysChart.tsx

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

interface WorkoutDaysChartProps {
  daysFrequency?: Record<string, number>;
  height?: number;
}

// Define as a proper function component
const WorkoutDaysChartComponent: React.FC<WorkoutDaysChartProps> = ({
  daysFrequency = {},
  height = 250
}) => {
  // Define days in order
  const days = useMemo(
    () => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    []
  );

  // Build chart data and capitalize names
  const chartData = useMemo(
    () =>
      days.map(day => ({
        name: day.charAt(0).toUpperCase() + day.slice(1, 3),
        value: daysFrequency[day] || 0,
        fullName: day.charAt(0).toUpperCase() + day.slice(1)
      })),
    [days, daysFrequency]
  );

  // Determine if there's any data to show
  const hasData = useMemo(
    () => chartData.some(d => d.value > 0),
    [chartData]
  );

  // Highlight today's bar
  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
    []
  );

  // Fallback UI when no data
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No workout days data available
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
          />
          <Tooltip
            formatter={(value: any, name: string, props: any) => [
              `${value} workouts`,
              props.payload.fullName
            ]}
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#f9fafb'
            }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fullName.toLowerCase() === today ? '#8b5cf6' : '#4c1d95'}
                opacity={entry.value > 0 ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export the memoized component correctly
export const WorkoutDaysChart = React.memo(WorkoutDaysChartComponent);
