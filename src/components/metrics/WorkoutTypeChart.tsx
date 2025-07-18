
import React, { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface WorkoutTypeData {
  type: string;
  count: number;
  totalDuration?: number;
  percentage?: number;
  timeOfDay?: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  averageDuration?: number;
}

interface WorkoutTypeChartProps {
  workoutTypes?: WorkoutTypeData[];
  height?: number;
}

const WorkoutTypeChartComponent: React.FC<WorkoutTypeChartProps> = ({
  workoutTypes = [],
  height = 250
}) => {
  // Premium gradient color palette
  const GRADIENT_COLORS = [
    'url(#gradient1)', 'url(#gradient2)', 'url(#gradient3)', 
    'url(#gradient4)', 'url(#gradient5)', 'url(#gradient6)'
  ];

  // memoize mapping to avoid unnecessary recalculations
  const chartData = useMemo(
    () =>
      workoutTypes.map((item, index) => ({
        name: item.type,
        value: item.count,
        color: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
      })),
    [workoutTypes]
  );

  // if no data, render a fallback
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No workout type data available
      </div>
    );
  }

  // label renderer, memoized to avoid re-creation
  const renderCustomizedLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
      if (percent < 0.05) return null;
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    },
    []
  );

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient id="gradient6" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            dataKey="value"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                filter="drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3))"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [`${value} workouts`, name]}
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: 'white',
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

// Export the component correctly
export const WorkoutTypeChart = React.memo(WorkoutTypeChartComponent);
