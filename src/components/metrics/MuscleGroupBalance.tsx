import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface MuscleGroupBalanceProps {
  muscleFocus?: Record<string, number> | null;
}

const MuscleGroupBalanceComponent: React.FC<MuscleGroupBalanceProps> = ({ muscleFocus }) => {
  // Transform muscle focus data for radar chart
  const chartData = React.useMemo(() => {
    const mf = muscleFocus ?? {};
    const totalVolume = Object.values(mf).reduce((sum, volume) => sum + (Number(volume) || 0), 0);
    
    if (totalVolume === 0) return [];

    return Object.entries(mf)
      .map(([muscle, volume]) => ({
        muscle: muscle.charAt(0).toUpperCase() + muscle.slice(1),
        percentage: Math.round(((Number(volume) || 0) / totalVolume) * 100),
        volume: Number(volume) || 0
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6); // Show top 6 muscle groups
  }, [muscleFocus]);

  if (chartData.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <Target className="h-5 w-5 text-purple-400" />
            Muscle Group Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">
            No muscle focus data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white/90">
          <Target className="h-5 w-5 text-purple-400" />
          Muscle Group Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="muscle"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <PolarRadiusAxis
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                domain={[0, Math.max(...chartData.map(d => d.percentage))]}
              />
              <Radar
                name="Volume %"
                dataKey="percentage"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-300">Top Muscle Groups</div>
          <div className="grid grid-cols-2 gap-2">
            {chartData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{item.muscle}</span>
                <span className="text-white font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MuscleGroupBalance = React.memo(MuscleGroupBalanceComponent);
MuscleGroupBalance.displayName = 'MuscleGroupBalance';
