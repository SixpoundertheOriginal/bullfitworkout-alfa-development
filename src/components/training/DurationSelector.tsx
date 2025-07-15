
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useWorkoutStats } from "@/hooks/useWorkoutStats";
import { Clock } from "lucide-react";

interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const { stats } = useWorkoutStats();
  const avgDuration = Math.round(stats.avgDuration || 30);

  const getDurationFeedbackColor = (duration: number) => {
    if (!avgDuration) return "text-gray-400";
    if (duration < avgDuration * 0.5) return "text-yellow-400";
    if (duration > avgDuration * 1.5) return "text-purple-400";
    return "text-green-400";
  };

  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="text-purple-400" size={20} />
          <span className="text-base font-medium">Duration</span>
        </div>
        <div className={`text-lg font-mono ${getDurationFeedbackColor(value)}`}>
          {/* Show integer only, no decimals */}
          {Math.round(value)} min
        </div>
      </div>

      <div className="px-1">
        <Slider
          defaultValue={[value]}
          min={5}
          max={120}
          step={5}
          onValueChange={handleSliderChange}
          className="[&>span]:bg-purple-500 [&_.slider-thumb]:focus:ring-2 [&_.slider-thumb]:focus:ring-purple-500/50"
        />
        
        {avgDuration > 0 && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Quick (5m)</span>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Avg: {avgDuration}m</span>
            </div>
            <span>Long (120m)</span>
          </div>
        )}
      </div>
    </div>
  );
}
