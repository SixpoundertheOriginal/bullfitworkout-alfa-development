import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { CircularGradientButton } from '@/components/CircularGradientButton';
import { cn } from '@/lib/utils';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { toast } from '@/hooks/use-toast';

interface StartTrainingButtonProps {
  trainingType?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link' | 'gradient' | 'icon-circle' | 'nav-action';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  label?: string;
  forceReset?: boolean;
  onClick?: () => void;
  workoutType?: string;
  duration?: number;
}

export const StartTrainingButton = ({
  trainingType = 'strength',
  className = '',
  label = 'Start Training',
  forceReset = true,
  onClick
}: StartTrainingButtonProps) => {
  const navigate = useNavigate();
  const { startWorkout, updateLastActiveRoute } = useWorkoutState();
  
  const handleStartClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // If forceReset is true, we'll navigate with the reset parameter
    if (forceReset) {
      navigate(`/training-session?type=${trainingType}&reset=true`, {
        state: { trainingType }
      });
      return;
    }
    
    // Otherwise start workout normally
    startWorkout();
    updateLastActiveRoute('/training-session');
    
    navigate(`/training-session?type=${trainingType}`, {
      state: { trainingType }
    });
    
    toast({
      title: "Workout started!"
    });
  };
  
  return (
    <CircularGradientButton
      onClick={handleStartClick}
      className={cn("hover:scale-105", className)}
      icon={<Play size={48} className="text-white ml-1" />} 
      size={132}
    >
      {label}
    </CircularGradientButton>
  );
};
