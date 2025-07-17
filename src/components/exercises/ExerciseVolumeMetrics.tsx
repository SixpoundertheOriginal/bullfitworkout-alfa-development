import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeightUnit } from "@/context/WeightUnitContext";

interface VolumeMetrics {
  volumeDiff: number;
  volumePercentChange: string;
  hasValidComparison: boolean;
}

interface ExerciseVolumeMetricsProps {
  currentVolume: number;
  previousVolume: number;
  volumeMetrics: VolumeMetrics;
}

export const ExerciseVolumeMetrics: React.FC<ExerciseVolumeMetricsProps> = ({
  currentVolume,
  previousVolume,
  volumeMetrics
}) => {
  const { weightUnit } = useWeightUnit();

  const getVolumeIcon = () => {
    if (volumeMetrics.volumeDiff > 0) return <TrendingUp className="h-3 w-3" />;
    if (volumeMetrics.volumeDiff < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getVolumeColor = () => {
    if (volumeMetrics.volumeDiff > 0) return "text-success";
    if (volumeMetrics.volumeDiff < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const progressValue = currentVolume > 0 && previousVolume > 0 ? 
    Math.min((currentVolume / previousVolume) * 100, 200) : 0;

  return (
    <div className="pt-3 mt-3 border-t border-border/30">
      {/* Current Volume */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Current Volume</span>
        <span className="font-mono font-semibold text-foreground">
          {currentVolume.toFixed(1)} {weightUnit}
        </span>
      </div>
      
      {/* Volume Comparison */}
      {volumeMetrics.hasValidComparison && (
        <>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">vs Previous</span>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${getVolumeColor()}`}
            >
              {getVolumeIcon()}
              <span className="font-mono">
                {volumeMetrics.volumeDiff > 0 ? '+' : ''}{volumeMetrics.volumeDiff.toFixed(1)} {weightUnit}
              </span>
              <span>({volumeMetrics.volumePercentChange}%)</span>
            </Badge>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={progressValue}
            className={`h-2 ${
              currentVolume >= previousVolume ? 
                "[&>div]:bg-gradient-to-r [&>div]:from-success/80 [&>div]:to-success" : 
                "[&>div]:bg-gradient-to-r [&>div]:from-destructive/80 [&>div]:to-destructive"
            }`}
          />
          
          {/* Previous Volume Reference */}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Previous: {previousVolume.toFixed(1)} {weightUnit}</span>
            <span>{progressValue.toFixed(0)}%</span>
          </div>
        </>
      )}
    </div>
  );
};