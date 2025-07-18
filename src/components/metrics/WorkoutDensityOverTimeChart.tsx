
// src/components/metrics/WorkoutDensityOverTimeChart.tsx

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
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
    <div className={`h-full w-full ${className}`} style={{ minHeight: `${height}px` }}>
      {!hasData ? (
        <div
          className="flex items-center justify-center h-full text-gray-400"
          style={{ height }}
        >
          No density data available for the selected period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart
              data={formattedData}
              margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
            >
              <defs>
                <linearGradient id="overallDensityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="activeDensityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.05} />
                </linearGradient>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                width={50}
                label={{
                  value: `Density (${weightUnit}/min)`,
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'rgba(255,255,255,0.7)',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-900/95 border border-purple-500/30 p-3 rounded-lg shadow-2xl backdrop-blur-sm">
                        <p className="text-white/90 font-medium">
                          {format(
                            new Date(payload[0].payload.originalDate),
                            'MMM d, yyyy'
                          )}
                        </p>
                        <p className="text-purple-400 font-bold">
                          Overall: {payload[0].value} {weightUnit}/min
                        </p>
                        {payload[1] &&
                          payload[1].value !== undefined && (
                            <p className="text-blue-400 font-bold">
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
              <Area
                type="monotone"
                dataKey="overallDensity"
                stroke="#8B5CF6"
                strokeWidth={3}
                fill="url(#overallDensityGradient)"
                filter="url(#lineGlow)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="activeOnlyDensity"
                stroke="#0EA5E9"
                strokeWidth={3}
                fill="url(#activeDensityGradient)"
                filter="url(#lineGlow)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {hasData && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-white/50 mb-1">Overall Density</p>
                <p className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {averages.overall}{' '}
                  <span className="text-sm text-white/60">{weightUnit}/min</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Active Density</p>
                <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {averages.activeOnly}{' '}
                  <span className="text-sm text-white/60">{weightUnit}/min</span>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const WorkoutDensityOverTimeChart = React.memo(
  WorkoutDensityOverTimeChartComponent
);
WorkoutDensityOverTimeChart.displayName = 'WorkoutDensityOverTimeChart';
