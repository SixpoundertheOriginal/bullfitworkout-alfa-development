import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Activity, Target, Clock, TrendingUp, Info } from 'lucide-react';
import { ProcessedWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

interface TransparentEfficiencyCardProps {
  metrics: ProcessedWorkoutMetrics;
  className?: string;
}

interface TransparentEfficiencyScore {
  volumeEfficiency: number;
  progressionRate: number; 
  consistencyScore: number;
  intensityOptimization: number;
  totalScore: number;
  breakdown: {
    component: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
}

export const TransparentEfficiencyCard: React.FC<TransparentEfficiencyCardProps> = ({
  metrics,
  className = ""
}) => {
  const transparentScore = useMemo<TransparentEfficiencyScore>(() => {
    // Component 1: Volume Efficiency (Volume per minute vs baseline)
    // Baseline: 50kg/min is good efficiency for strength training
    const baselineVolumeRate = 50; // kg/min
    const actualVolumeRate = metrics.densityMetrics.overallDensity || 0;
    const volumeEfficiency = Math.min(25, (actualVolumeRate / baselineVolumeRate) * 25);

    // Component 2: Progression Rate (estimated based on workout frequency and intensity)
    // Higher intensity and consistency suggests better progression potential
    const intensityFactor = Math.min(1, (metrics.intensity || 0) / 100);
    const densityFactor = Math.min(1, actualVolumeRate / baselineVolumeRate);
    const progressionRate = (intensityFactor + densityFactor) / 2 * 25;

    // Component 3: Consistency Score (based on set completion and rest patterns)
    const completionRate = metrics.setCount.total > 0 ? 
      (metrics.setCount.completed / metrics.setCount.total) : 0;
    const restConsistency = 1 - Math.min(1, metrics.timeDistribution.restVariability || 0);
    const consistencyScore = (completionRate * 0.6 + restConsistency * 0.4) * 25;

    // Component 4: Intensity Optimization (work vs rest ratio and active time percentage)
    const workRestRatio = metrics.efficiencyMetrics.workToRestRatio || 0;
    const optimalRatio = 2.0; // 2:1 work to rest is often optimal
    const ratioScore = Math.min(1, workRestRatio / optimalRatio);
    const activeTimeScore = metrics.timeDistribution.activeTimePercentage / 100;
    const intensityOptimization = (ratioScore * 0.5 + activeTimeScore * 0.5) * 25;

    const totalScore = volumeEfficiency + progressionRate + consistencyScore + intensityOptimization;

    const breakdown = [
      {
        component: 'Volume Efficiency',
        score: Math.round(volumeEfficiency),
        maxScore: 25,
        description: `${actualVolumeRate.toFixed(1)} kg/min vs ${baselineVolumeRate} kg/min baseline`
      },
      {
        component: 'Progression Potential',
        score: Math.round(progressionRate),
        maxScore: 25,
        description: `Based on intensity (${metrics.intensity?.toFixed(0) || 0}%) and density`
      },
      {
        component: 'Workout Consistency',
        score: Math.round(consistencyScore),
        maxScore: 25,
        description: `${Math.round(completionRate * 100)}% sets completed, stable rest patterns`
      },
      {
        component: 'Time Optimization',
        score: Math.round(intensityOptimization),
        maxScore: 25,
        description: `${Math.round(metrics.timeDistribution.activeTimePercentage)}% active time, ${workRestRatio.toFixed(1)}:1 work:rest`
      }
    ];

    return {
      volumeEfficiency,
      progressionRate,
      consistencyScore,
      intensityOptimization,
      totalScore: Math.round(totalScore),
      breakdown
    };
  }, [metrics]);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-400', label: 'Excellent' };
    if (score >= 65) return { color: 'text-blue-400', label: 'Very Good' };
    if (score >= 50) return { color: 'text-yellow-400', label: 'Good' };
    if (score >= 35) return { color: 'text-orange-400', label: 'Fair' };
    return { color: 'text-red-400', label: 'Needs Improvement' };
  };

  const overallResult = getOverallScoreColor(transparentScore.totalScore);

  return (
    <Card className={`bg-gray-900/40 border-gray-800/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-yellow-400" />
          Fitness Efficiency Score
          <Badge variant="outline" className="text-xs bg-gray-800/50">
            Transparent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Overall Efficiency</span>
            <Badge variant="outline" className={`${overallResult.color} border-current`}>
              {overallResult.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Progress 
              value={(transparentScore.totalScore / 100) * 100} 
              className="flex-1 h-3"
            />
            <span className={`text-2xl font-bold ${overallResult.color}`}>
              {transparentScore.totalScore}/100
            </span>
          </div>
          <div className="text-xs text-gray-400">
            Calculated from volume efficiency, progression potential, consistency, and time optimization
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Info className="h-4 w-4" />
            Score Breakdown
          </div>
          
          {transparentScore.breakdown.map((component, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">{component.component}</span>
                <span className={`text-sm font-medium ${getScoreColor(component.score, component.maxScore)}`}>
                  {component.score}/{component.maxScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(component.score / component.maxScore) * 100} 
                  className="flex-1 h-1.5"
                />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round((component.score / component.maxScore) * 100)}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {component.description}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-700/50">
          <div className="text-center">
            <div className="text-xs text-gray-400">Volume Rate</div>
            <div className="text-sm font-semibold text-white">
              {metrics.densityMetrics.overallDensity.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">kg/min</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">Active Time</div>
            <div className="text-sm font-semibold text-white">
              {Math.round(metrics.timeDistribution.activeTimePercentage)}%
            </div>
            <div className="text-xs text-gray-500">of workout</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">Completion</div>
            <div className="text-sm font-semibold text-white">
              {metrics.setCount.total > 0 ? Math.round((metrics.setCount.completed / metrics.setCount.total) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500">sets done</div>
          </div>
        </div>

        {/* Methodology Note */}
        <div className="pt-2 border-t border-gray-700/50">
          <div className="text-xs text-gray-400">
            Score methodology: Volume efficiency (25pts) + Progression potential (25pts) + Consistency (25pts) + Time optimization (25pts)
          </div>
        </div>
      </CardContent>
    </Card>
  );
};