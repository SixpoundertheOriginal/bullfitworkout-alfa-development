
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Zap } from "lucide-react";
import { PRDetectionResult } from "@/services/personalRecordsService";
import { useWeightUnit } from "@/context/WeightUnitContext";

interface PRCelebrationProps {
  prs: PRDetectionResult[];
  exerciseName: string;
  isVisible: boolean;
  onClose: () => void;
}

export const PRCelebration: React.FC<PRCelebrationProps> = ({
  prs,
  exerciseName,
  isVisible,
  onClose
}) => {
  const { weightUnit } = useWeightUnit();

  if (!isVisible || prs.length === 0) return null;

  const getPRIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'reps': return <TrendingUp className="h-5 w-5 text-blue-400" />;
      case 'volume': return <Zap className="h-5 w-5 text-purple-400" />;
      default: return <Trophy className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getPRColor = (type: string) => {
    switch (type) {
      case 'weight': return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
      case 'reps': return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
      case 'volume': return 'bg-purple-900/30 text-purple-300 border-purple-500/30';
      default: return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
    }
  };

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case 'weight': return `${value} ${weightUnit}`;
      case 'reps': return `${value} reps`;
      case 'volume': return `${value} ${weightUnit}`;
      default: return value.toString();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-900/10 border-yellow-500/30 mb-4 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-300">New Personal Record!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-gray-300">
            <span className="font-medium text-white">{exerciseName}</span>
          </p>
        </div>
        
        <div className="space-y-2">
          {prs.map((pr, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getPRIcon(pr.prType)}
                <span className="text-sm font-medium capitalize">{pr.prType} PR</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getPRColor(pr.prType)}>
                  {formatValue(pr.prType, pr.currentValue)}
                </Badge>
                
                {pr.improvement && (
                  <div className="text-xs text-green-400">
                    +{formatValue(pr.prType, pr.improvement)}
                    {pr.improvementPercentage && (
                      <span className="ml-1">
                        ({pr.improvementPercentage.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            🎉 Keep up the great work! Your strength is improving!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
