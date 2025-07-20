
import React from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { TrainingStartButton } from './TrainingStartButton';

interface AdaptiveTrainingButtonProps {
  className?: string;
  variant?: 'prominent' | 'subtle' | 'inline';
  trainingType?: string;
}

export const AdaptiveTrainingButton = ({
  className = '',
  variant = 'prominent',
  trainingType = 'strength'
}: AdaptiveTrainingButtonProps) => {
  const { isActive, exercises } = useWorkoutStore();
  const navigate = useNavigate();
  
  const hasExercises = Object.keys(exercises).length > 0;
  
  const handleResumeClick = () => {
    navigate('/training-session');
  };
  
  if (isActive) {
    if (variant === 'prominent') {
      return (
        <div className={`text-center ${className}`}>
          <Button 
            onClick={handleResumeClick}
            variant="gradient"
            className="px-6 py-6 text-lg"
          >
            {hasExercises ? 'Resume Workout' : 'Start Adding Exercises'}
            <ArrowRight className="ml-2" />
          </Button>
          <p className="mt-2 text-sm text-gray-400">
            {hasExercises 
              ? `Continue your workout with ${Object.keys(exercises).length} exercises` 
              : 'Your workout session has started'}
          </p>
        </div>
      );
    }
    
    if (variant === 'subtle') {
      return (
        <Button
          onClick={handleResumeClick}
          variant="outline"
          className={className}
        >
          {hasExercises ? 'Resume Workout' : 'Add Exercises'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }
    
    // inline variant
    return (
      <Button
        onClick={handleResumeClick}
        variant="link"
        className={className}
      >
        {hasExercises ? 'Resume Workout' : 'Start Session'}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    );
  }
  
  if (variant === 'prominent') {
    return (
      <div className={`text-center ${className}`}>
        <TrainingStartButton label="Start Workout" />
      </div>
    );
  }
  
  if (variant === 'subtle') {
    return (
      <Button
        onClick={() => navigate('/training-session')}
        variant="default"
        className={className}
      >
        Start Workout
        <Play className="ml-2 h-4 w-4" />
      </Button>
    );
  }
  
  // inline variant
  return (
    <Button
      onClick={() => navigate('/training-session')}
      variant="link"
      className={className}
    >
      Start Workout
      <Play className="ml-1 h-4 w-4" />
    </Button>
  );
};
