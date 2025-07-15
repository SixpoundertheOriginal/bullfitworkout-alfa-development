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
    <div
      className={`bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all ${className}`}
      style={{ minHeight: `${height + 60}px` }} // ensure card is tall enough
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center text-sm text-gray-300">
          <Dumbbell className="h-4 w-4 mr-2 text-purple-400" />
          Volume Over Time
        </div>
        {hasData && (
          <div className="text-xs text-gray-400">
            Avg: {Math.round(volumeStats.average).toLocaleString()} {weightUnit}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-gray-400" style={{ height }}>
            No workout data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
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
                  value: `Volume (${weightUnit})`,
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
                          {format(new Date(payload[0].payload.originalDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-purple-400 font-semibold">
                          {payload[0].payload.formattedValue}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                isAnimationActive={false}
              />
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9B87F5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#D946EF" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Bar dataKey="volume" fill="url(#volumeGradient)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {hasData && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Volume</p>
              <p className="text-lg font-semibold text-purple-400">
                {Math.round(volumeStats.total).toLocaleString()}{' '}
                <span className="text-sm text-gray-400">{weightUnit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Average Volume</p>
              <p className="text-lg font-semibold text-blue-400">
                {Math.round(volumeStats.average).toLocaleString()}{' '}
                <span className="text-sm text-gray-400">{weightUnit}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const WorkoutVolumeOverTimeChart = React.memo(WorkoutVolumeOverTimeChartComponent);
WorkoutVolumeOverTimeChart.displayName = 'WorkoutVolumeOverTimeChart';
