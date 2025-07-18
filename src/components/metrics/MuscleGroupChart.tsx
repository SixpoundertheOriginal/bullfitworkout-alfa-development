
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
  // Premium gradient color mapping for muscle groups
  const GRADIENT_COLORS: Record<string, string> = {
    chest: 'url(#chestGradient)',
    back: 'url(#backGradient)',
    legs: 'url(#legsGradient)',
    shoulders: 'url(#shouldersGradient)',
    arms: 'url(#armsGradient)',
    core: 'url(#coreGradient)',
    other: 'url(#otherGradient)'
  };

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return Object.entries(muscleFocus).map(([muscle, count]) => ({
      name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
      value: count,
      color: GRADIENT_COLORS[muscle] || GRADIENT_COLORS.other
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
          <defs>
            <linearGradient id="chestGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="backGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="legsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84CC16" />
              <stop offset="100%" stopColor="#65A30D" />
            </linearGradient>
            <linearGradient id="shouldersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="armsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="otherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6B7280" />
              <stop offset="100%" stopColor="#4B5563" />
            </linearGradient>
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                filter="drop-shadow(0 4px 8px rgba(139, 92, 246, 0.2))"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [`${value} sets`, 'Count']}
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              color: 'white',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)'
            }}
            itemStyle={{ color: 'white' }}
            labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value: any) => (
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export the memoized component correctly
export const MuscleGroupChart = React.memo(MuscleGroupChartComponent);
