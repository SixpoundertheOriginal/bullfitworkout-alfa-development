
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { CircularGradientButton } from '@/components/CircularGradientButton';
import { cn } from '@/lib/utils';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { toast } from '@/hooks/use-toast';

interface TrainingStartButtonProps {
  onStartClick?: () => void;
  className?: string;
  label?: string;
  size?: number;
}

export const TrainingStartButton = ({
  onStartClick,
  className = '',
  label = 'Start Training',
  size = 120,
}: TrainingStartButtonProps) => {
  const navigate = useNavigate();
  const { isActive, startWorkout, updateLastActiveRoute } = useWorkoutState();
  
  const handleStartClick = () => {
    if (onStartClick) {
      onStartClick();
      return;
    }
    
    // Start the workout with our workout state manager
    startWorkout();
    updateLastActiveRoute('/training-session');
    
    // Navigate to the training session page
    navigate('/training-session');
    
    toast({
      title: "Workout started! Add exercises to begin"
    });
  };
  
  if (isActive) {
    return null; // Don't render if workout is already active
  }
  
  return (
    <CircularGradientButton
      onClick={handleStartClick}
      className={cn("hover:scale-105 transition-transform", className)}
      icon={<Play size={40} className="text-white ml-1" />}
      size={size}
    >
      {label}
    </CircularGradientButton>
  );
};
