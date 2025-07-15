
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface MuscleFocusChartProps {
  muscleGroups: Record<string, number>;
  className?: string;
}

const MuscleFocusChartComponent: React.FC<MuscleFocusChartProps> = ({
  muscleGroups,
  className
}) => {
  const COLORS = {
    chest: '#f97316',
    back: '#0ea5e9',
    legs: '#84cc16',
    shoulders: '#8b5cf6',
    arms: '#ec4899',
    core: '#f59e0b'
  };

  // Format data for the chart
  const data = Object.entries(muscleGroups).map(([group, value]) => ({
    name: group.charAt(0).toUpperCase() + group.slice(1),
    value: value,
    color: COLORS[group as keyof typeof COLORS] || '#6b7280'
  })).filter(item => item.value > 0);
  
  // Create chart config for muscle groups
  const chartConfig = {
    chest: {
      label: 'Chest',
      color: COLORS.chest
    },
    back: {
      label: 'Back',
      color: COLORS.back
    },
    legs: {
      label: 'Legs',
      color: COLORS.legs
    },
    shoulders: {
      label: 'Shoulders',
      color: COLORS.shoulders
    },
    arms: {
      label: 'Arms',
      color: COLORS.arms
    },
    core: {
      label: 'Core',
      color: COLORS.core
    }
  };
  
  // If no data, return a placeholder
  if (data.length === 0) {
    return (
      <div className={cn("w-full bg-gray-800/50 rounded-lg p-4 h-64 flex items-center justify-center", className)}>
        <p className="text-gray-400">No muscle focus data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full bg-gray-800/50 rounded-lg p-4", className)}>
      <h3 className="text-sm font-medium mb-2 text-gray-400">Muscle Group Focus</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} sets`, 'Count']}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              formatter={(value) => (
                <span style={{ color: '#f9fafb' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MuscleFocusChart = React.memo(MuscleFocusChartComponent);
