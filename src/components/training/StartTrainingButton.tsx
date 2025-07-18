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
    <div 
      onClick={handleStartClick}
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105",
        "w-64 h-64 mx-auto", // Large size
        className
      )}
    >
      {/* Outer progress ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2">
        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
          {/* Inner content */}
          <div className="text-center">
            <div className="text-white text-4xl font-bold mb-2">
              {label}
            </div>
            {trainingType !== "Continue" && (
              <div className="text-white/70 text-lg">
                {trainingType}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl -z-10" />
    </div>
  );
};
