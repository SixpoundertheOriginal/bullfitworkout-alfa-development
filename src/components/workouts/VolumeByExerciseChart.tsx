
import React, { useMemo } from "react";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { WeightUnit } from "@/utils/unitConversion";

interface VolumeByExerciseChartProps {
  workoutData: {
    exercises: Record<string, any[]>;
  };
  weightUnit: WeightUnit;
}

export const VolumeByExerciseChart: React.FC<VolumeByExerciseChartProps> = React.memo(({
  workoutData,
  weightUnit
}) => {
  const data = useMemo(() => {
    if (!workoutData?.exercises) return [];
    
    return Object.keys(workoutData.exercises).map(exercise => {
      const totalExerciseVolume = workoutData.exercises[exercise].reduce((total: number, set: any) => {
        if (set.completed) {
          return total + (set.weight * (set.reps || 0));
        }
        return total;
      }, 0);
      
      return {
        name: exercise,
        volume: Math.round(totalExerciseVolume * 10) / 10
      };
    });
  }, [workoutData]);

  const chartConfig = {
    volume: { theme: { dark: '#9b87f5', light: '#9b87f5' } }
  };
  
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="mt-6">
      <h3 className="text-sm text-gray-400 mb-2">
        Volume by Exercise <span className="text-xs">({weightUnit})</span>
      </h3>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-3">
          <div className="h-40">
            {!hasData ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No exercise volume data available
              </div>
            ) : (
              <ChartContainer
                className="h-full w-full [&_.recharts-cartesian-axis-tick-value]:fill-gray-400 [&_.recharts-cartesian-axis-tick-value]:text-xs [&_.recharts-cartesian-axis-tick-value]:font-mono"
                config={chartConfig}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} ${weightUnit}`, 'Volume']}
                      labelFormatter={(label: string) => `Exercise: ${label}`}
                    />
                    <Bar 
                      dataKey="volume" 
                      name="Volume" 
                      fill="var(--color-volume)" 
                      radius={[4, 4, 0, 0]} 
                      isAnimationActive={false} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

VolumeByExerciseChart.displayName = 'VolumeByExerciseChart';
