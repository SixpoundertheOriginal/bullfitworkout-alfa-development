
// src/components/metrics/MuscleGroupChart.tsx

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface MuscleGroupChartProps {
  muscleFocus?: Record<string, number>;
  height?: number;
}

const MuscleGroupChartComponent: React.FC<MuscleGroupChartProps> = ({
  muscleFocus = {},
  height = 250
}) => {
  // Color mapping for muscle groups
  const COLORS: Record<string, string> = {
    chest: '#f97316',
    back: '#0ea5e9',
    legs: '#84cc16',
    shoulders: '#8b5cf6',
    arms: '#ec4899',
    core: '#f59e0b',
    other: '#6b7280'
  };

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return Object.entries(muscleFocus).map(([muscle, count]) => ({
      name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
      value: count,
      color: COLORS[muscle] || COLORS.other
    }));
  }, [muscleFocus]);

  // If there's no data, show fallback
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No muscle data available
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={0.8}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [`${value} sets`, 'Count']}
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#f9fafb'
            }}
            itemStyle={{ color: '#f9fafb' }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value: any) => (
              <span style={{ color: '#f9fafb' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export the memoized component correctly
export const MuscleGroupChart = React.memo(MuscleGroupChartComponent);
