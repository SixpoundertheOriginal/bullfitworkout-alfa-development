
import React from "react";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { formatWeightWithUnit } from "@/utils/unitConversion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WorkoutMetricsSummaryProps {
  exerciseSets: any[];
  className?: string;
}

export const WorkoutMetricsSummary: React.FC<WorkoutMetricsSummaryProps> = ({ 
  exerciseSets, 
  className 
}) => {
  const { weightUnit } = useWeightUnit();

  const calculateMetrics = () => {
    const validSets = exerciseSets.filter(set => set.completed);
    
    const totalVolume = validSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    const avgWeight = validSets.length > 0 
      ? validSets.reduce((sum, set) => sum + set.weight, 0) / validSets.length 
      : 0;
    const maxWeight = Math.max(...validSets.map(set => set.weight), 0);
    const totalReps = validSets.reduce((sum, set) => sum + set.reps, 0);
    const totalSets = validSets.length;

    return {
      totalVolume,
      avgWeight,
      maxWeight,
      totalReps,
      totalSets
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      <Card className="bg-gray-800/50 p-3">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Effort Volume</span>
          <span className="text-lg font-bold">
            {formatWeightWithUnit(metrics.totalVolume, weightUnit)}
          </span>
        </div>
      </Card>
      <Card className="bg-gray-800/50 p-3">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Avg Weight</span>
          <span className="text-lg font-bold">
            {formatWeightWithUnit(metrics.avgWeight, weightUnit, 1)}
          </span>
        </div>
      </Card>
      <Card className="bg-gray-800/50 p-3">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Total Reps</span>
          <span className="text-lg font-bold">{metrics.totalReps}</span>
        </div>
      </Card>
      <Card className="bg-gray-800/50 p-3">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Max Weight</span>
          <span className="text-lg font-bold">
            {formatWeightWithUnit(metrics.maxWeight, weightUnit)}
          </span>
        </div>
      </Card>
    </div>
  );
};
