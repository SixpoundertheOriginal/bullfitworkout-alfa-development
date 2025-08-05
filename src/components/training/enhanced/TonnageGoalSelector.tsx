import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TONNAGE_PRESETS, TIME_PRESETS, TrainingGoals, calculateSmartDefaults } from '@/types/training-setup';
import { 
  Clock, 
  Target, 
  Zap, 
  RotateCcw, 
  Timer,
  Dumbbell,
  TrendingUp,
  Info
} from 'lucide-react';
import { useWorkoutStats } from '@/hooks/useWorkoutStats';

interface TonnageGoalSelectorProps {
  goals: TrainingGoals;
  onGoalsChange: (goals: Partial<TrainingGoals>) => void;
  trainingFocus?: any;
}

export function TonnageGoalSelector({ goals, onGoalsChange, trainingFocus }: TonnageGoalSelectorProps) {
  const { stats } = useWorkoutStats();
  const [customTonnage, setCustomTonnage] = useState(goals.targetTonnage);
  
  const smartDefaults = trainingFocus ? calculateSmartDefaults(trainingFocus) : null;
  const avgTonnage = Math.round(stats.totalVolume || smartDefaults?.tonnage || 4000);
  const avgDuration = Math.round(stats.avgDuration || smartDefaults?.duration || 45);

  useEffect(() => {
    if (smartDefaults && !goals.targetTonnage) {
      onGoalsChange({
        targetTonnage: smartDefaults.tonnage,
        timeBudget: smartDefaults.duration
      });
    }
  }, [smartDefaults, goals.targetTonnage]);

  const handleTonnagePresetSelect = (level: keyof typeof TONNAGE_PRESETS) => {
    const preset = TONNAGE_PRESETS[level];
    const targetTonnage = level === 'Custom' ? customTonnage : Math.round((preset.min + preset.max) / 2);
    
    onGoalsChange({
      tonnageLevel: level,
      targetTonnage: targetTonnage
    });
  };

  const handleCustomTonnageChange = (value: number[]) => {
    const newValue = value[0];
    setCustomTonnage(newValue);
    if (goals.tonnageLevel === 'Custom') {
      onGoalsChange({ targetTonnage: newValue });
    }
  };

  const handleTimeBudgetSelect = (minutes: number) => {
    onGoalsChange({ timeBudget: minutes });
  };

  const handleStructureChange = (structure: TrainingGoals['structure']) => {
    onGoalsChange({ structure });
  };

  const handleRepRangeChange = (repRange: TrainingGoals['repRange']) => {
    onGoalsChange({ repRange });
  };

  const handleRestStyleChange = (restStyle: TrainingGoals['restStyle']) => {
    onGoalsChange({ restStyle });
  };

  const getEstimatedCalories = () => {
    // Rough estimation: 0.05 calories per kg of tonnage
    return Math.round(goals.targetTonnage * 0.05);
  };

  const getEstimatedSets = () => {
    // Estimate based on tonnage and rep range
    const avgWeight = 70; // kg estimate
    const repsPerSet = goals.repRange === 'Strength (3-6)' ? 5 : 
                      goals.repRange === 'Hypertrophy (8-12)' ? 10 : 15;
    return Math.round(goals.targetTonnage / (avgWeight * repsPerSet));
  };

  const getRestTimePerSet = () => {
    const totalSets = getEstimatedSets();
    const workingTime = totalSets * 1.5; // 1.5 min average per set execution
    const availableRestTime = goals.timeBudget - workingTime;
    return Math.max(30, Math.round(availableRestTime / totalSets * 60)); // seconds
  };

  return (
    <div className="space-y-6">
      {/* Tonnage Target Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Target Tonnage</h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Avg: {avgTonnage.toLocaleString()}kg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(TONNAGE_PRESETS).map(([level, preset]) => (
            <Button
              key={level}
              variant={goals.tonnageLevel === level ? "default" : "outline"}
              className={cn(
                "h-auto py-3 flex flex-col space-y-1",
                goals.tonnageLevel === level && "ring-2 ring-primary/20"
              )}
              onClick={() => handleTonnagePresetSelect(level as keyof typeof TONNAGE_PRESETS)}
            >
              <span className="font-medium">{level}</span>
              <span className={cn("text-xs", preset.color)}>
                {level === 'Custom' ? 'Any' : `${preset.min / 1000}k-${preset.max / 1000}k`}
              </span>
            </Button>
          ))}
        </div>

        {goals.tonnageLevel === 'Custom' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Custom Tonnage</span>
              <span className="font-mono text-sm">{customTonnage.toLocaleString()}kg</span>
            </div>
            <Slider
              value={[customTonnage]}
              onValueChange={handleCustomTonnageChange}
              min={500}
              max={15000}
              step={250}
              className="[&>span]:bg-primary"
            />
          </div>
        )}

        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Target: {goals.targetTonnage.toLocaleString()}kg</span>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <span>~{getEstimatedCalories()} cal</span>
                <span>~{getEstimatedSets()} sets</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Budget Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Time Budget</h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>Avg: {avgDuration}m</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TIME_PRESETS.map((minutes) => (
            <Button
              key={minutes}
              variant={goals.timeBudget === minutes ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeBudgetSelect(minutes)}
            >
              {minutes}m
            </Button>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Est. rest per set:</span>
              <span className="font-mono">{getRestTimePerSet()}s</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Structure Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Training Structure</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Set Structure</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Straight Sets', 'Supersets', 'Circuit'] as const).map((structure) => (
                <Button
                  key={structure}
                  variant={goals.structure === structure ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStructureChange(structure)}
                >
                  {structure}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Rep Range</label>
            <div className="space-y-2">
              {(['Strength (3-6)', 'Hypertrophy (8-12)', 'Endurance (12-20)'] as const).map((range) => (
                <Button
                  key={range}
                  variant={goals.repRange === range ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleRepRangeChange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Rest Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Strict', 'Adaptive', 'Minimal'] as const).map((style) => (
                <Button
                  key={style}
                  variant={goals.restStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRestStyleChange(style)}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center space-x-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span>Additional Options</span>
        </h3>
        
        <div className="space-y-2">
          {[
            { key: 'includeIsometrics', label: 'Include Isometrics' },
            { key: 'includeUnilateral', label: 'Include Unilateral Work' },
            { key: 'includeCore', label: 'Include Core Finisher' }
          ].map((option) => (
            <Button
              key={option.key}
              variant={goals[option.key as keyof TrainingGoals] ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => 
                onGoalsChange({ 
                  [option.key]: !goals[option.key as keyof TrainingGoals] 
                })
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}