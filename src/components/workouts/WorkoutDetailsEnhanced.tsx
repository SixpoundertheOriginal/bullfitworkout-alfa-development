import React, { useMemo } from 'react';
import { ExerciseSet } from '@/types/exercise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  BarChart3, 
  Percent, 
  Activity,
  Clock,
  Calendar,
  Tag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkoutDensityChart } from '../metrics/WorkoutDensityChart';
import { WeightUnit } from '@/utils/unitConversion';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { cn } from '@/lib/utils';
import { WorkoutAnalysisSection } from './analysis/WorkoutAnalysisSection';
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

interface WorkoutDetailsEnhancedProps {
  workout: {
    id: string;
    name: string;
    training_type: string;
    start_time: string;
    duration: number;
    notes?: string | null;
  };
  exercises: Record<string, ExerciseSet[]>;
  onEditClick: () => void;
  onEditExercise?: (exerciseName: string, sets: Record<string, ExerciseSet[]>) => void;
  tags?: string[];
  className?: string;
}

export const WorkoutDetailsEnhanced = ({
  workout,
  exercises,
  onEditClick,
  onEditExercise,
  tags = [],
  className = ''
}: WorkoutDetailsEnhancedProps) => {
  const { weightUnit } = useWeightUnit();
  
  // Use the centralized workout metrics processor with type assertion for weightUnit
  const metrics = useMemo(() => processWorkoutMetrics(
    exercises,
    workout.duration,
    weightUnit as 'kg' | 'lb'
  ), [exercises, workout.duration, weightUnit]);
  
  const handleEditExercise = (exerciseName: string) => {
    if (onEditExercise) {
      onEditExercise(exerciseName, exercises);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Add WorkoutAnalysisSection component here */}
      <div className="mt-6">
        <WorkoutAnalysisSection
          workout={workout}
          exerciseSets={exercises}
          muscleFocus={metrics.muscleFocus}
          activeWorkoutTime={metrics.timeDistribution.activeTime}
          totalVolume={metrics.totalVolume}
          totalRestTime={metrics.timeDistribution.restTime}
          densityMetrics={metrics.densityMetrics}
          durationByTimeOfDay={metrics.durationByTimeOfDay}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900/80 border-gray-800 hover:border-purple-500/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="text-sm text-gray-400">Date</span>
                </div>
                <div className="text-lg font-semibold">{new Date(workout.start_time).toLocaleDateString()}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800 hover:border-purple-500/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center mb-1">
                  <Clock className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="text-sm text-gray-400">Duration</span>
                </div>
                <div className="text-lg font-semibold">{workout.duration} min</div>
                <div className="text-xs text-gray-500">
                  Active: {metrics.timeDistribution.activeTime.toFixed(0)} min
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800 hover:border-purple-500/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center mb-1">
                  <Dumbbell className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="text-sm text-gray-400">Exercises</span>
                </div>
                <div className="text-lg font-semibold">{metrics.exerciseCount}</div>
                <div className="text-xs text-gray-500">{metrics.setCount.total} sets total</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800 hover:border-purple-500/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center mb-1">
                  <BarChart3 className="h-4 w-4 text-purple-400 mr-2" />
                  <span className="text-sm text-gray-400">Efficiency</span>
                </div>
                <div className="text-lg font-semibold">{Math.round(metrics.efficiency)}%</div>
                <div className="text-xs text-gray-500">{metrics.setCount.completed} of {metrics.setCount.total} sets</div>
              </CardContent>
            </Card>
          </div>
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
                  <span className="text-gray-400">{metrics.composition.compound.count} ({Math.round(metrics.composition.compound.percentage)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500/30 to-amber-700/30"
                    style={{ width: `${metrics.composition.compound.percentage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Isolation</span>
                  <span className="text-gray-400">{metrics.composition.isolation.count} ({Math.round(metrics.composition.isolation.percentage)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500/30 to-blue-700/30"
                    style={{ width: `${metrics.composition.isolation.percentage}%` }}
                  />
                </div>
              </div>
              
              {metrics.composition.bodyweight.count > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Bodyweight</span>
                    <span className="text-gray-400">{metrics.composition.bodyweight.count} ({Math.round(metrics.composition.bodyweight.percentage)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-500/30 to-green-700/30"
                      style={{ width: `${metrics.composition.bodyweight.percentage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {metrics.composition.isometric.count > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Isometric</span>
                    <span className="text-gray-400">{metrics.composition.isometric.count} ({Math.round(metrics.composition.isometric.percentage)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500/30 to-purple-700/30"
                      style={{ width: `${metrics.composition.isometric.percentage}%` }}
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
                  <div className="text-xl font-semibold">{Math.round(metrics.intensity)}%</div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Percent className="h-3 w-3 text-purple-400 mr-1" />
                    <span className="text-xs text-gray-400">Efficiency</span>
                  </div>
                  <div className="text-xl font-semibold">{Math.round(metrics.efficiency)}%</div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Exercises</span>
                    <div className="text-lg font-semibold">{metrics.exerciseCount}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Sets</span>
                    <div className="text-lg font-semibold">{metrics.setCount.total}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Density</span>
                    <div className="text-base font-semibold">{metrics.densityMetrics.formattedOverallDensity}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Active Only</span>
                    <div className="text-base font-semibold">{metrics.densityMetrics.formattedActiveOnlyDensity}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {workout.notes && (
        <Card className="bg-gray-900/80 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 whitespace-pre-line">{workout.notes}</p>
          </CardContent>
        </Card>
      )}
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Exercise Details</h2>
        <div className="space-y-4">
          {Object.entries(exercises).map(([exerciseName, sets]) => (
            <Card key={exerciseName} className="bg-gray-900/80 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{exerciseName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-2 px-4 text-gray-400 font-medium">Set</th>
                        <th className="text-left py-2 px-4 text-gray-400 font-medium">Weight ({weightUnit})</th>
                        <th className="text-left py-2 px-4 text-gray-400 font-medium">Reps</th>
                        <th className="text-left py-2 px-4 text-gray-400 font-medium">Rest</th>
                        <th className="text-right py-2 px-4 text-gray-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sets.map((set) => (
                        <tr 
                          key={set.id}
                          className={cn(
                            "border-b border-gray-800/50",
                            !set.completed && "opacity-50"
                          )}
                        >
                          <td className="py-3 px-4">Set {set.set_number}</td>
                          <td className="py-3 px-4 font-mono">{set.weight}</td>
                          <td className="py-3 px-4 font-mono">{set.reps}</td>
                          <td className="py-3 px-4 font-mono">{set.restTime || 60}s</td>
                          <td className="py-3 px-4 text-right">
                            <Badge 
                              className={cn(
                                set.completed 
                                  ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                  : "bg-gray-800/50 text-gray-400"
                              )}
                            >
                              {set.completed ? "Completed" : "Skipped"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditExercise(exerciseName)}
                      className="bg-gray-800 text-white hover:bg-gray-700"
                    >
                      Edit Sets
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
