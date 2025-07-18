
// src/components/metrics/WorkoutVolumeOverTimeChart.tsx

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { Dumbbell } from 'lucide-react';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { convertWeight } from '@/utils/unitConversion';
import { VolumeDataPoint } from '@/hooks/useProcessWorkoutMetrics';

interface WorkoutVolumeOverTimeChartProps {
  data?: VolumeDataPoint[];
  className?: string;
  height?: number;
}

const WorkoutVolumeOverTimeChartComponent: React.FC<WorkoutVolumeOverTimeChartProps> = ({
  data = [],
  className = '',
  height = 200
}) => {
  const { weightUnit } = useWeightUnit();

  // Determine if we have any volume data
  const hasData = useMemo(
    () => Array.isArray(data) && data.length > 0 && data.some(item => item.volume > 0),
    [data]
  );

  // Memoize formatted data for the chart
  const formattedData = useMemo(() => {
    if (!hasData) return [];
    return data.map(item => {
      const vol = convertWeight(item.volume, 'kg', weightUnit);
      return {
        date: format(new Date(item.date), 'MMM d'),
        volume: vol,
        originalDate: item.date,
        formattedValue: `${vol.toLocaleString()} ${weightUnit}`
      };
    });
  }, [data, weightUnit, hasData]);

  // Memoize total & average volume stats
  const volumeStats = useMemo(() => {
    if (!hasData) return { total: 0, average: 0 };
    const totalRaw = data.reduce((sum, item) => sum + item.volume, 0);
    const avgRaw = totalRaw / data.length;
    return {
      total: convertWeight(totalRaw, 'kg', weightUnit),
      average: convertWeight(avgRaw, 'kg', weightUnit)
    };
  }, [data, weightUnit, hasData]);

  return (
    <div className={`h-full w-full ${className}`} style={{ minHeight: `${height}px` }}>
      {!hasData ? (
        <div className="flex items-center justify-center h-full text-gray-400" style={{ height }}>
          No workout data available for the selected period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                  <stop offset="50%" stopColor="#EC4899" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0.7} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
                  value: `Volume (${weightUnit})`,
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
                          {format(new Date(payload[0].payload.originalDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-purple-400 font-bold text-lg">
                          {payload[0].payload.formattedValue}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                isAnimationActive={false}
              />
              <Bar 
                dataKey="volume" 
                fill="url(#volumeGradient)" 
                radius={[4, 4, 0, 0]} 
                filter="url(#glow)"
                isAnimationActive={false} 
              />
            </BarChart>
          </ResponsiveContainer>

          {hasData && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-white/50 mb-1">Total Volume</p>
                <p className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {Math.round(volumeStats.total).toLocaleString()}{' '}
                  <span className="text-sm text-white/60">{weightUnit}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Average Volume</p>
                <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {Math.round(volumeStats.average).toLocaleString()}{' '}
                  <span className="text-sm text-white/60">{weightUnit}</span>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const WorkoutVolumeOverTimeChart = React.memo(WorkoutVolumeOverTimeChartComponent);
WorkoutVolumeOverTimeChart.displayName = 'WorkoutVolumeOverTimeChart';
