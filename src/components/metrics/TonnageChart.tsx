
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Weight } from 'lucide-react';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { convertWeight } from '@/utils/unitConversion';
import { useDateRange } from '@/context/DateRangeContext';
import { WeightUnitToggle } from '@/components/WeightUnitToggle';

interface TonnageChartProps {
  data: Array<{
    date: string;
    tonnage: number;
  }>;
  className?: string;
  height?: number;
}

export const TonnageChart: React.FC<TonnageChartProps> = ({ 
  data,
  className = '',
  height = 200 
}) => {
  const { weightUnit } = useWeightUnit();
  const { dateRange } = useDateRange();
  
  // Ensure we have data to display
  const hasData = data && data.length > 0 && data.some(item => item.tonnage > 0);
  
  console.log("TonnageChart receiving data:", data);
  
  const formattedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      date: format(new Date(item.date), 'MMM d'),
      tonnage: convertWeight(item.tonnage, 'kg', weightUnit),
      originalDate: item.date,
      formattedValue: `${convertWeight(item.tonnage, 'kg', weightUnit).toLocaleString()} ${weightUnit}`
    }));
  }, [data, weightUnit]);

  return (
    <Card className={`bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            <div className="flex items-center">
              <Weight className="h-4 w-4 mr-2 text-purple-400" />
              Total Volume per Session
            </div>
          </CardTitle>
          <WeightUnitToggle variant="badge" className="text-xs" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mt-4">
          {!hasData ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No workout data available for the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
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
                          <p className="text-gray-300">{format(new Date(payload[0].payload.originalDate), 'MMM d, yyyy')}</p>
                          <p className="text-purple-400 font-semibold">{payload[0].payload.formattedValue}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="tonnage"
                  fill="url(#tonnageGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                />
                <defs>
                  <linearGradient id="tonnageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9B87F5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#D946EF" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
