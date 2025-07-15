
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface WorkoutEfficiencyScoreProps {
  score: number;
  className?: string;
}

export const WorkoutEfficiencyScore: React.FC<WorkoutEfficiencyScoreProps> = ({
  score,
  className
}) => {
  // Get letter grade based on efficiency score
  const getEfficiencyGrade = () => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D+';
    return 'D';
  };
  
  // Get color based on efficiency score
  const getEfficiencyColor = () => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div 
          className={`absolute inset-0 rounded-full border-4 ${
            score >= 85 ? 'border-green-500/30' :
            score >= 70 ? 'border-yellow-500/30' :
            score >= 55 ? 'border-orange-500/30' : 'border-red-500/30'
          }`}
        ></div>
        
        <div className="flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getEfficiencyColor()}`}>{getEfficiencyGrade()}</span>
        </div>
      </div>
      
      <div className="text-center mt-2">
        <div className="text-lg font-bold">{Math.round(score)}%</div>
        <div className="text-xs text-gray-400">Set Completion</div>
      </div>
    </div>
  );
};
