import { MetricValue, MetricConfig } from '../core/MetricRegistry';
import { ExerciseSet, WorkoutExercises } from '@/store/workoutStore';

export interface WorkoutMetricsData {
  exercises: WorkoutExercises;
  elapsedTime: number;
  restTimerActive: boolean;
  currentRestTime: number;
  activeExercise: string | null;
}

export class MetricCalculator {
  private static instance: MetricCalculator;

  private constructor() {}

  static getInstance(): MetricCalculator {
    if (!MetricCalculator.instance) {
      MetricCalculator.instance = new MetricCalculator();
    }
    return MetricCalculator.instance;
  }

  calculateMetric(config: MetricConfig, data: WorkoutMetricsData): MetricValue {
    switch (config.calculationKey) {
      case 'elapsedTime':
        return this.calculateElapsedTime(data.elapsedTime);
      
      case 'exerciseCount':
        return this.calculateExerciseCount(data.exercises);
      
      case 'setsProgress':
        return this.calculateSetsProgress(data.exercises);
      
      case 'repsCount':
        return this.calculateRepsCount(data.exercises);
      
      case 'totalVolume':
        return this.calculateTotalVolume(data.exercises);
      
      case 'restTimer':
        return this.calculateRestTimer(data.restTimerActive, data.currentRestTime);
      
      default:
        return { value: 0, status: 'normal' };
    }
  }

  private calculateElapsedTime(elapsedTime: number): MetricValue {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    let displayValue: string;
    if (hours > 0) {
      displayValue = `${hours}h ${minutes}m`;
    } else {
      displayValue = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return {
      value: displayValue,
      rawValue: elapsedTime,
      status: elapsedTime > 7200 ? 'warning' : 'normal' // Warning after 2 hours
    };
  }

  private calculateExerciseCount(exercises: WorkoutExercises): MetricValue {
    const count = Object.keys(exercises).length;
    return {
      value: count,
      rawValue: count,
      status: count === 0 ? 'warning' : 'normal'
    };
  }

  private calculateSetsProgress(exercises: WorkoutExercises): MetricValue {
    const allSets = Object.values(exercises).flat();
    const completedSets = allSets.filter(set => set.completed).length;
    const totalSets = allSets.length;
    
    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    
    return {
      value: `${completedSets}/${totalSets}`,
      rawValue: completedSets,
      progress,
      status: progress === 100 ? 'normal' : 'normal'
    };
  }

  private calculateRepsCount(exercises: WorkoutExercises): MetricValue {
    const completedReps = Object.values(exercises)
      .flat()
      .filter(set => set.completed)
      .reduce((total, set) => total + set.reps, 0);

    const targetReps = Object.values(exercises)
      .flat()
      .reduce((total, set) => total + set.reps, 0);

    return {
      value: completedReps,
      rawValue: completedReps,
      description: `of ${targetReps} planned`,
      status: 'normal'
    };
  }

  private calculateTotalVolume(exercises: WorkoutExercises): MetricValue {
    const totalVolume = Object.values(exercises)
      .flat()
      .filter(set => set.completed)
      .reduce((total, set) => total + (set.weight * set.reps), 0);

    // Format volume in kg with appropriate units
    let displayValue: string;
    if (totalVolume >= 1000) {
      displayValue = `${(totalVolume / 1000).toFixed(1)}t`;
    } else {
      displayValue = `${totalVolume}kg`;
    }

    return {
      value: displayValue,
      rawValue: totalVolume,
      status: 'normal'
    };
  }

  private calculateRestTimer(isActive: boolean, currentRestTime: number): MetricValue {
    if (!isActive) {
      return {
        value: 'Ready',
        rawValue: 0,
        status: 'normal'
      };
    }

    const minutes = Math.floor(currentRestTime / 60);
    const seconds = currentRestTime % 60;
    const displayValue = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return {
      value: displayValue,
      rawValue: currentRestTime,
      status: currentRestTime > 300 ? 'warning' : 'normal' // Warning after 5 minutes
    };
  }
}