
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Activity } from 'lucide-react';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { format } from 'date-fns';

interface DensityDataPoint {
  date: string;
  formattedDate: string;
  overallDensity: number;
  activeOnlyDensity: number;
}

interface WorkoutDensityTrendChartProps {
  data: DensityDataPoint[];
  className?: string;
  height?: number;
}

export const WorkoutDensityTrendChart: React.FC<WorkoutDensityTrendChartProps> = React.memo(({
  data,
  className = '',
  height = 200
}) => {
  const { weightUnit } = useWeightUnit();
  
  // Check if we have valid data to display
  const hasData = Array.isArray(data) && data.length > 0;
  
  console.log("WorkoutDensityTrendChart rendering with data:", 
    hasData ? `${data.length} items` : "no data", 
    hasData && data[0] ? `First item: ${JSON.stringify(data[0])}` : "");
  
  // Calculate average density across all workouts - memoized
  const stats = useMemo(() => {
    if (!hasData) return { avgOverallDensity: 0, avgActiveOnlyDensity: 0, mostEfficientWorkout: null };
    
    const avgOverallDensity = data.reduce((sum, item) => sum + item.overallDensity, 0) / data.length;
    const avgActiveOnlyDensity = data.reduce((sum, item) => sum + item.activeOnlyDensity, 0) / data.length;
    
    // Find the workout with the highest density (most efficient)
    const mostEfficientWorkout = [...data].sort((a, b) => b.activeOnlyDensity - a.activeOnlyDensity)[0];

    return { avgOverallDensity, avgActiveOnlyDensity, mostEfficientWorkout };
  }, [data, hasData]);
  
  const { avgOverallDensity, avgActiveOnlyDensity, mostEfficientWorkout } = stats;

  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Activity className="h-4 w-4 mr-2 text-purple-400" />
          Workout Density Trend ({weightUnit}/min)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Average Density</span>
            <span className="text-xs font-medium">
              {avgOverallDensity.toFixed(1)} {weightUnit}/min
            </span>
          </div>
          {mostEfficientWorkout && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Most Efficient</span>
              <span className="text-xs font-medium">
                {mostEfficientWorkout.activeOnlyDensity.toFixed(1)} {weightUnit}/min ({mostEfficientWorkout.formattedDate})
              </span>
            </div>
          )}
        </div>
        
        <div style={{ height: `${height}px`, minHeight: '48px' }} className="w-full overflow-hidden">
          {!hasData ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No density data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 15, right: 10, left: 0, bottom: 20 }}
                barGap={3}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <YAxis 
                  dataKey="formattedDate" 
                  type="category"
                  tick={{ fontSize: 10, fill: '#aaa' }}
                  width={50}
                />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 10, fill: '#aaa' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)} ${weightUnit}/min`, 'Density']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: '#1e1e2e', border: 'none', borderRadius: '4px' }}
                  isAnimationActive={false}
                />
                <Bar 
                  dataKey="overallDensity" 
                  name="Overall Density"
                  fill="#8b5cf6" 
                  radius={[0, 4, 4, 0]} 
                  barSize={16}
                  isAnimationActive={false}
                />
                <Bar 
                  dataKey="activeOnlyDensity" 
                  name="Active Time Density"
                  fill="#4ade80" 
                  radius={[0, 4, 4, 0]} 
                  barSize={16} 
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="flex justify-center mt-2 space-x-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full inline-block mr-1"></span>
            <span className="text-xs text-gray-400">Overall</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block mr-1"></span>
            <span className="text-xs text-gray-400">Active Only</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

WorkoutDensityTrendChart.displayName = 'WorkoutDensityTrendChart';
