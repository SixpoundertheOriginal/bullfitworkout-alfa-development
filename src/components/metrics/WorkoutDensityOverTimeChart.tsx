// src/components/metrics/WorkoutDensityOverTimeChart.tsx

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { DensityDataPoint } from '@/hooks/useProcessWorkoutMetrics';

interface WorkoutDensityOverTimeChartProps {
  data?: DensityDataPoint[];
  className?: string;
  height?: number;
}

const WorkoutDensityOverTimeChartComponent: React.FC<WorkoutDensityOverTimeChartProps> = ({
  data = [],
  className = '',
  height = 200
}) => {
  const { weightUnit } = useWeightUnit();

  // Determine if there's valid density data
  const hasData = useMemo(
    () =>
      Array.isArray(data) &&
      data.length > 0 &&
      data.some(item => item.overallDensity > 0),
    [data]
  );

  // Memoize formatted data for the chart
  const formattedData = useMemo(() => {
    if (!hasData) return [];
    return data.map(item => ({
      date: format(new Date(item.date), 'MMM d'),
      overallDensity: Number(item.overallDensity.toFixed(1)),
      activeOnlyDensity:
        item.activeOnlyDensity !== undefined
          ? Number(item.activeOnlyDensity.toFixed(1))
          : undefined,
      originalDate: item.date
    }));
  }, [data, hasData]);

  // Memoize average densities
  const averages = useMemo(() => {
    if (!hasData) return { overall: 0, activeOnly: 0 };
    const sumOverall = data.reduce((acc, item) => acc + item.overallDensity, 0);
    const overall = Number((sumOverall / data.length).toFixed(1));
    const validActive = data.filter(item => item.activeOnlyDensity !== undefined);
    const activeOnly =
      validActive.length === 0
        ? 0
        : Number(
            (
              validActive.reduce(
                (acc, item) => acc + (item.activeOnlyDensity || 0),
                0
              ) / validActive.length
            ).toFixed(1)
          );
    return { overall, activeOnly };
  }, [data, hasData]);

  return (
    <div
      className={`bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all ${className}`}
      style={{ minHeight: `${height + 60}px` }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center text-sm text-gray-300">
          <Activity className="h-4 w-4 mr-2 text-purple-400" />
          Workout Density Over Time
        </div>
        {hasData && (
          <div className="text-xs text-gray-400">
            Avg: {averages.overall} {weightUnit}/min
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {!hasData ? (
          <div
            className="flex items-center justify-center h-full text-gray-400"
            style={{ height }}
          >
            No density data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333333"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: '#888888', fontSize: 12 }}
                axisLine={{ stroke: '#333333' }}
                tickLine={{ stroke: '#333333' }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: '#888888', fontSize: 12 }}
                axisLine={{ stroke: '#333333' }}
                tickLine={{ stroke: '#333333' }}
                width={50}
                label={{
                  value: `Density (${weightUnit}/min)`,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#888888',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg shadow-lg">
                        <p className="text-gray-300">
                          {format(
                            new Date(payload[0].payload.originalDate),
                            'MMM d, yyyy'
                          )}
                        </p>
                        <p className="text-purple-400 font-semibold">
                          Overall: {payload[0].value} {weightUnit}/min
                        </p>
                        {payload[1] &&
                          payload[1].value !== undefined && (
                            <p className="text-blue-400 font-semibold">
                              Active Only: {payload[1].value}{' '}
                              {weightUnit}/min
                            </p>
                          )}
                      </div>
                    );
                  }
                  return null;
                }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="overallDensity"
                stroke="#9B87F5"
                strokeWidth={2}
                dot={{ r: 4, fill: "#9B87F5" }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="activeOnlyDensity"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={{ r: 4, fill: "#0EA5E9" }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {hasData && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">Overall Density</p>
              <p className="text-lg font-semibold text-purple-400">
                {averages.overall}{' '}
                <span className="text-sm text-gray-400">{weightUnit}/min</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Active Density</p>
              <p className="text-lg font-semibold text-blue-400">
                {averages.activeOnly}{' '}
                <span className="text-sm text-gray-400">{weightUnit}/min</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const WorkoutDensityOverTimeChart = React.memo(
  WorkoutDensityOverTimeChartComponent
);
WorkoutDensityOverTimeChart.displayName = 'WorkoutDensityOverTimeChart';
