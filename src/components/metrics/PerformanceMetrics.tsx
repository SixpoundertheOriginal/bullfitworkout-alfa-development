
import React from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { BaseCard } from "@/components/ui/BaseCard";
import { typography } from "@/lib/typography";

interface PerformanceMetricsProps {
  className?: string;
}

export const PerformanceMetrics = ({ className }: PerformanceMetricsProps) => {
  return (
    <BaseCard className={cn("relative w-full", className)}>
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="text-purple-400" size={20} />
        <h3 className={typography.text.secondary}>Performance Metrics</h3>
      </div>
      
      <div className="space-y-3">
        <MetricBar label="Volume" value={75} color="from-blue-500 to-sky-500" />
        <MetricBar label="Intensity" value={80} color="from-purple-500 to-pink-500" />
        <MetricBar label="Density" value={65} color="from-emerald-500 to-teal-500" />
        <MetricBar label="Efficiency" value={70} color="from-orange-500 to-yellow-500" />
      </div>
    </BaseCard>
  );
};

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
}

const MetricBar = ({ label, value, color }: MetricBarProps) => (
  <div className="space-y-1.5">
    <div className="flex justify-between">
      <span className={typography.text.secondary}>{label}</span>
      <span className={typography.text.primary}>{value}%</span>
    </div>
    <div className={cn(
      "h-1.5 bg-gray-800/50 rounded-full overflow-hidden",
      "relative"
    )}>
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r rounded-full",
          color
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
