// src/components/metrics/WorkoutDensityChart.tsx

import React, { useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface WorkoutDensityChartProps {
  totalTime?: number;
  activeTime?: number;
  restTime?: number;
  totalVolume?: number;
  weightUnit?: string;
  overallDensity?: number;
  activeOnlyDensity?: number;
  height?: number;
}

const WorkoutDensityChartComponent: React.FC<WorkoutDensityChartProps> = ({
  totalTime = 0,
  activeTime = 0,
  restTime = 0,
  totalVolume = 0,
  weightUnit = 'kg',
  overallDensity: propOverallDensity,
  activeOnlyDensity: propActiveOnlyDensity,
  height = 250
}) => {
  // Compute densities, falling back if no prop provided
  const overallDensity = useMemo(
    () => propOverallDensity ?? (totalTime > 0 ? totalVolume / totalTime : 0),
    [propOverallDensity, totalTime, totalVolume]
  );
  const activeOnlyDensity = useMemo(
    () =>
      propActiveOnlyDensity ??
      (activeTime > 0 ? totalVolume / activeTime : 0),
    [propActiveOnlyDensity, activeTime, totalVolume]
  );

  // Format density for labels
  const formatDensity = useCallback((value: number) => {
    if (!value || isNaN(value)) return '0.0';
    return value < 10 ? value.toFixed(1) : Math.round(value).toString();
  }, []);

  // Prepare bar chart data
  const densityData = useMemo(
    () => [
      {
        name: 'Overall',
        density: overallDensity,
        color: '#8b5cf6',
        displayValue: `${formatDensity(overallDensity)} ${weightUnit}/min`
      },
      {
        name: 'Active Only',
        density: activeOnlyDensity,
        color: '#4ade80',
        displayValue: `${formatDensity(activeOnlyDensity)} ${weightUnit}/min`
      }
    ],
    [overallDensity, activeOnlyDensity, weightUnit, formatDensity]
  );

  // Determine if there's any non-zero density
  const hasDensity = useMemo(
    () => densityData.some(d => d.density > 0),
    [densityData]
  );

  // Prepare time distribution data
  const timeData = useMemo(() => {
    const safeTotal = totalTime || 1;
    const safeActive = activeTime || 0;
    const safeRest = restTime || 0;
    const percentage = Math.round((safeActive / safeTotal) * 100);

    return { activeTime: safeActive, restTime: safeRest, percentage };
  }, [activeTime, restTime, totalTime]);

  if (!hasDensity) {
    return (
      <div
        className="flex items-center justify-center p-6 text-gray-400"
        style={{ height }}
      >
        No density data available
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ height }}>
      <div className="h-28 min-h-[112px] overflow-hidden">
        <h3 className="text-xs text-center mb-1">Workout Density</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={densityData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            layout="vertical"
            barGap={0}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#aaa' }}
            />
            <Tooltip
              formatter={value => [`${value} ${weightUnit}/min`, 'Density']}
              contentStyle={{ backgroundColor: '#1e1e2e', border: 'none' }}
              isAnimationActive={false}
            />
            <Bar
              dataKey="density"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              {densityData.map((entry, index) => (
                <LabelList
                  key={`label-${index}`}
                  dataKey="displayValue"
                  position="right"
                  style={{
                    fill: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-xs text-center mb-1">Time Distribution</h3>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
            style={{ width: `${timeData.percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>Active: {Math.round(timeData.activeTime)}m</span>
          <span>{timeData.percentage}%</span>
          <span>Rest: {Math.round(timeData.restTime)}m</span>
        </div>
      </div>
    </div>
  );
};

export const WorkoutDensityChart = React.memo(WorkoutDensityChartComponent);
WorkoutDensityChart.displayName = 'WorkoutDensityChart';
