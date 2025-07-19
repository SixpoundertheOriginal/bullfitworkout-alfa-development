
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, Activity, TrendingUp } from 'lucide-react';
import { ProcessedWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

interface EfficiencyMetricsCardProps {
  metrics: ProcessedWorkoutMetrics;
  className?: string;
}

export const EfficiencyMetricsCard: React.FC<EfficiencyMetricsCardProps> = ({
  metrics,
  className = ""
}) => {
  const { efficiencyMetrics, timeDistribution } = metrics;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card className={`bg-gray-900/40 border-gray-800/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-yellow-400" />
          Efficiency Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Efficiency Score */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Efficiency Score</span>
            <Badge variant="outline" className={`${getScoreColor(efficiencyMetrics.efficiencyScore)} border-current`}>
              {getScoreLabel(efficiencyMetrics.efficiencyScore)}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress 
              value={efficiencyMetrics.efficiencyScore} 
              className="flex-1 h-2"
            />
            <span className={`text-lg font-bold ${getScoreColor(efficiencyMetrics.efficiencyScore)}`}>
              {efficiencyMetrics.efficiencyScore.toFixed(0)}/100
            </span>
          </div>
        </div>

        {/* Work to Rest Ratio */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-400">Work:Rest Ratio</span>
            </div>
            <p className="text-lg font-bold text-blue-300">
              {efficiencyMetrics.formattedWorkToRestRatio}
            </p>
          </div>

          <div className="p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-400">Movement Efficiency</span>
            </div>
            <p className="text-lg font-bold text-purple-300">
              {efficiencyMetrics.movementEfficiency.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Recovery Efficiency</span>
            <span className="text-gray-300">
              {(efficiencyMetrics.recoveryEfficiency * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={efficiencyMetrics.recoveryEfficiency * 100} className="h-1.5" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pace Consistency</span>
            <span className="text-gray-300">
              {(efficiencyMetrics.paceConsistency * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={efficiencyMetrics.paceConsistency * 100} className="h-1.5" />
        </div>

        {/* Time Distribution */}
        <div className="pt-2 border-t border-gray-700/50">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Active Time</span>
            <span>Rest Time</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 bg-green-900/20 rounded">
              <p className="text-green-300 font-mono">
                {timeDistribution.activeTime.toFixed(0)}m
              </p>
              <p className="text-xs text-gray-400">
                {timeDistribution.activeTimePercentage.toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-2 bg-orange-900/20 rounded">
              <p className="text-orange-300 font-mono">
                {timeDistribution.restTime.toFixed(0)}m
              </p>
              <p className="text-xs text-gray-400">
                {timeDistribution.restTimePercentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Volume per Active Minute */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Volume per Active Min</span>
          <span className="text-gray-300 font-mono">
            {efficiencyMetrics.volumePerActiveMinute.toFixed(1)} kg/min
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
