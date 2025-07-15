
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { processWorkoutMetrics } from "@/utils/workoutMetricsProcessor";

const WorkoutSummaryCard = ({
  workoutData,
  completedSets,
  totalSets,
  totalVolume,
  weightUnit
}: {
  workoutData: any;
  completedSets: number;
  totalSets: number;
  totalVolume: number;
  weightUnit: string;
}) => {
  // Use the centralized workout metrics processor with type assertion
  const metrics = processWorkoutMetrics(
    workoutData?.exercises || {},
    workoutData?.duration || 0,
    weightUnit as 'kg' | 'lb'
  );
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className="bg-gray-900 border-gray-800 mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="training-type-primary">{workoutData?.name || workoutData?.trainingType}</h2>
            <div className="training-metadata">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString()}</span>
              <Clock size={14} />
              <span className="mono-text">{formatTime(workoutData?.duration * 60 || 0)}</span>
            </div>
          </div>
          <Badge className="training-type-tag">
            {workoutData?.trainingType}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-800 p-3 rounded text-center">
            <div className="text-2xl font-medium mono-text">{metrics.setCount.completed}/{metrics.setCount.total}</div>
            <div className="text-xs text-gray-400 font-medium">Sets</div>
          </div>
          <div className="bg-gray-800 p-3 rounded text-center">
            <div className="text-2xl font-medium mono-text">{metrics.exerciseCount}</div>
            <div className="text-xs text-gray-400 font-medium">Exercises</div>
          </div>
          <div className="bg-gray-800 p-3 rounded text-center">
            <div className="text-2xl font-medium mono-text">
              {Math.round(metrics.totalVolume * 10) / 10} <span className="text-sm text-gray-400">{weightUnit}</span>
            </div>
            <div className="text-xs text-gray-400 font-medium">Volume</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutSummaryCard;
