
import React, { useMemo } from 'react';
import { ExerciseSet } from '@/types/exercise';
import { 
  calculateMuscleFocus, 
  analyzeWorkoutComposition 
} from '@/utils/exerciseUtils';
import { MuscleFocusChart } from './MuscleFocusChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dumbbell, 
  BarChart3, 
  Percent, 
  Activity 
} from 'lucide-react';

interface EnhancedMetricsDisplayProps {
  exercises: Record<string, ExerciseSet[]>;
  intensity: number;
  efficiency: number;
  className?: string;
}

const EnhancedMetricsDisplayComponent = ({ 
  exercises, 
  intensity, 
  efficiency,
  className = '' 
}: EnhancedMetricsDisplayProps) => {
  // Calculate muscle focus
  const muscleFocus = useMemo(() => calculateMuscleFocus(exercises), [exercises]);
  
  // Analyze workout composition
  const composition = useMemo(() => analyzeWorkoutComposition(exercises), [exercises]);
  
  const exerciseCount = Object.keys(exercises).length;
  const totalSetCount = Object.values(exercises).reduce(
    (total, sets) => total + sets.length, 0
  );
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <Card className="bg-gray-900/90 border-gray-800 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Muscle Focus</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="h-64 overflow-hidden">
                <MuscleFocusChart muscleGroups={muscleFocus} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Dumbbell className="h-4 w-4 mr-2 text-purple-400" />
                Workout Composition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Compound</span>
                  <span className="text-gray-400">{composition.compound.count} ({Math.round(composition.compound.percentage)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500/30 to-amber-700/30"
                    style={{ width: `${composition.compound.percentage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Isolation</span>
                  <span className="text-gray-400">{composition.isolation.count} ({Math.round(composition.isolation.percentage)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500/30 to-blue-700/30"
                    style={{ width: `${composition.isolation.percentage}%` }}
                  />
                </div>
              </div>
              
              {composition.bodyweight.count > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Bodyweight</span>
                    <span className="text-gray-400">{composition.bodyweight.count} ({Math.round(composition.bodyweight.percentage)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-500/30 to-green-700/30"
                      style={{ width: `${composition.bodyweight.percentage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {composition.isometric.count > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Isometric</span>
                    <span className="text-gray-400">{composition.isometric.count} ({Math.round(composition.isometric.percentage)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500/30 to-purple-700/30"
                      style={{ width: `${composition.isometric.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
                Workout Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Activity className="h-3 w-3 text-purple-400 mr-1" />
                    <span className="text-xs text-gray-400">Intensity</span>
                  </div>
                  <div className="text-xl font-semibold">{Math.round(intensity)}%</div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Percent className="h-3 w-3 text-purple-400 mr-1" />
                    <span className="text-xs text-gray-400">Efficiency</span>
                  </div>
                  <div className="text-xl font-semibold">{Math.round(efficiency)}%</div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Exercises</span>
                    <div className="text-lg font-semibold">{exerciseCount}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Sets</span>
                    <div className="text-lg font-semibold">{totalSetCount}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const EnhancedMetricsDisplay = React.memo(EnhancedMetricsDisplayComponent);
EnhancedMetricsDisplay.displayName = 'EnhancedMetricsDisplay';
